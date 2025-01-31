import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { VerificationCodeGeneratedEvent } from "../verification-code-generated.event";
import { AWSConfigService } from "infrastructure/config/aws.config";
import { VerificationTokenService } from "infrastructure/services/verification-token.service";
import { NotificationTemplateService } from "infrastructure/services/notification-template.service";
import { Logger } from "@nestjs/common";

@EventsHandler(VerificationCodeGeneratedEvent)
export class VerificationCodeGeneratedHandler
  implements IEventHandler<VerificationCodeGeneratedEvent>
{
  private readonly logger = new Logger(VerificationCodeGeneratedHandler.name);

  constructor(
    private readonly awsConfigService: AWSConfigService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly notificationTemplateService: NotificationTemplateService
  ) {}

  async handle(event: VerificationCodeGeneratedEvent) {
    try {
      // Generate a 6-digit token
      const token = await this.verificationTokenService.generateToken(
        event.phone
      );

      // Get email and SMS templates
      const emailTemplate = this.notificationTemplateService.getEmailTemplate(
        event.name,
        token
      );
      const smsTemplate =
        this.notificationTemplateService.getSMSTemplate(token);

      // Send email
      await this.awsConfigService.sendEmail({
        Destination: { ToAddresses: [event.email] },
        Message: {
          Body: { Html: { Data: emailTemplate } },
          Subject: { Data: "Verify Your Email and Get Started!" },
        },
        Source: process.env.AWS_SES_FROM_EMAIL,
      });
      this.logger.log(`Email sent to ${event.email}`);

      // Send SMS
      await this.awsConfigService.sendSMS({
        PhoneNumber: event.phone,
        Message: smsTemplate,
      });
      this.logger.log(`SMS sent to ${event.phone}`);
    } catch (error) {
      this.logger.error(
        `Error handling VerificationCodeGeneratedEvent: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
