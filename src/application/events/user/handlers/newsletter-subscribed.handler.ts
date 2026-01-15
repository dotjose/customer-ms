import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { NewsletterTokenService, NewsletterTokenType } from "infrastructure/services/newsletter-token.service";
import { AWSConfigService } from "infrastructure/config/aws.config";
import { NotificationTemplateService } from "infrastructure/services/notification-template.service";
import { NewsletterSubscribedEvent } from "../newsletter.event";


@EventsHandler(NewsletterSubscribedEvent)
export class NewsletterSubscribedHandler
    implements IEventHandler<NewsletterSubscribedEvent> {
    private readonly logger = new Logger(NewsletterSubscribedHandler.name);

    constructor(
        private readonly awsConfig: AWSConfigService,
        private readonly notificationTemplateService: NotificationTemplateService,
        private readonly tokenService: NewsletterTokenService,
        private readonly configService: ConfigService
    ) { }

    async handle(event: NewsletterSubscribedEvent) {
        try {
            const unsubscribeToken = await this.tokenService.generateToken(
                event.email,
                NewsletterTokenType.UNSUBSCRIBE
            );
            const preferencesToken = await this.tokenService.generateToken(
                event.email,
                NewsletterTokenType.PREFERENCES
            );

            const baseUrl =
                this.configService.get<string>("APP_BASE_URL") ||
                "https://habeshanetwork.com";
            // Check if user preferences endpoint matches implementation plan
            const preferences_url = `${baseUrl}/newsletter/preferences?token=${preferencesToken}`;
            const unsubscribe_url = `${baseUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`;

            const emailTemplate = this.notificationTemplateService.getNewsLetterTemplate(preferences_url, unsubscribe_url, new Date().getFullYear().toString());

            await this.awsConfig.sendEmail({
                Destination: { ToAddresses: [event.email] },
                Message: {
                    Body: { Html: { Data: emailTemplate, Charset: "UTF-8" } },
                    Subject: {
                        Data: "Habesha Network Newsletter",
                        Charset: "UTF-8",
                    },
                },
                Source: this.configService.get<string>("SUPPORT_EMAIL"),
            });
            this.logger.log(`Email sent to ${event.email}`);
        } catch (error) {
            this.logger.error(
                `Error handling NewsletterSubscribedEvent: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }
}
