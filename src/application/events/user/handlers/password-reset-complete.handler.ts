import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { PasswordResetCompletedEvent } from "../password-reset-completed.event";
import { AWSConfigService } from "infrastructure/config/aws.config";
import { NotificationTemplateService } from "infrastructure/services/notification-template.service";

@EventsHandler(PasswordResetCompletedEvent)
export class PasswordResetCompletedHandler
  implements IEventHandler<PasswordResetCompletedEvent>
{
  private readonly logger = new Logger(PasswordResetCompletedHandler.name);

  constructor(
    private readonly awsConfigService: AWSConfigService,
    private readonly notificationTemplateService: NotificationTemplateService
  ) {}

  async handle(event: PasswordResetCompletedEvent) {
    try {
      // Get email templates
      const emailTemplate = this.notificationTemplateService.getEmailTemplate(
        event.name,
        event.email
      );
      // Send email
      await this.awsConfigService.sendEmail({
        Destination: { ToAddresses: [event.email] },
        Message: {
          Body: { Html: { Data: emailTemplate } },
          Subject: { Data: "Your password have been changed. Is that you?" },
        },
        Source: process.env.AWS_SES_FROM_EMAIL,
      });
      this.logger.log(`Email sent to ${event.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset confirmation email to ${event.email}`,
        error.stack
      );
      throw error;
    }
  }
}
