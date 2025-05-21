import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { PasswordResetRequestedEvent } from "../password-reset-requested.event";
import { AWSConfigService } from "infrastructure/config/aws.config";
import { NotificationTemplateService } from "infrastructure/services/notification-template.service";

@EventsHandler(PasswordResetRequestedEvent)
export class PasswordResetRequestedHandler
  implements IEventHandler<PasswordResetRequestedEvent>
{
  private readonly logger = new Logger(PasswordResetRequestedHandler.name);

  constructor(
    private readonly awsConfigService: AWSConfigService,
    private readonly notificationTemplateService: NotificationTemplateService
  ) {}

  async handle(event: PasswordResetRequestedEvent) {
    try {
      // // Get email and SMS templates
      // const emailTemplate = this.notificationTemplateService.getEmailTemplate(
      //   event.name,
      //   event.resetToken
      // );
      // const smsTemplate = this.notificationTemplateService.getSMSTemplate(
      //   event.resetToken
      // );
      // // Send email
      // await this.awsConfigService.sendEmail({
      //   Destination: { ToAddresses: [event.email] },
      //   Message: {
      //     Body: { Html: { Data: emailTemplate } },
      //     Subject: { Data: "Password reset have been requested." },
      //   },
      //   Source: process.env.AWS_SES_FROM_EMAIL,
      // });
      // this.logger.log(`Email sent to ${event.email}`);
      // // Send SMS
      // await this.awsConfigService.sendSMS({
      //   PhoneNumber: event.phone,
      //   Message: smsTemplate,
      // });
      // this.logger.log(`SMS sent to ${event.phone}`);
    } catch (error) {
      this.logger.error(
        `Error handling UserRegisteredEvent: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
