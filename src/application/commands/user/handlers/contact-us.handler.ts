import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";

import { AWSConfigService } from "infrastructure/config/aws.config";
import { NotificationTemplateService } from "infrastructure/services/notification-template.service";
import { ContactUsCommand } from "../contact-us.command";

@CommandHandler(ContactUsCommand)
export class ContactUsHandler implements ICommandHandler<ContactUsCommand> {
  private readonly logger = new Logger(ContactUsHandler.name);

  constructor(
    private readonly awsConfigService: AWSConfigService,
    private readonly notificationTemplateService: NotificationTemplateService
  ) {}

  async execute(command: ContactUsCommand): Promise<void> {
    const { name, email, subject, message } = command;

    const emailHtml = this.notificationTemplateService.contactUsEmailTemplate({
      name,
      email,
      subject,
      message,
    });

    await this.awsConfigService.sendEmail({
      Destination: { ToAddresses: [process.env.SUPPORT_EMAIL] },
      Message: {
        Body: { Html: { Data: emailHtml } },
        Subject: { Data: `📩 New Contact Us Message from ${name}` },
      },
      Source: process.env.AWS_SES_FROM_EMAIL,
      ReplyToAddresses: [email],
    });

    this.logger.log(`Contact message from ${email} sent to support.`);
  }
}
