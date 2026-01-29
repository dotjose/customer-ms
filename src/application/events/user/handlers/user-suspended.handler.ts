import { EventBus, EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import pLimit from "p-limit";
import pRetry from "p-retry";

import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { AWSConfigService } from "infrastructure/config/aws.config";
import { NotificationTemplateService } from "infrastructure/services/notification-template.service";
import { ConsultantReviewedEvent } from "domain/events/consultant/consultant-reviewed.event";
import { UserSuspendedEvent } from "../user-suspended.event";

@EventsHandler(UserSuspendedEvent)
export class UserSuspendedHandler implements IEventHandler<UserSuspendedEvent> {
    private readonly logger = new Logger(UserSuspendedHandler.name);

    constructor(
        @Inject("ConsultantRepository")
        private readonly consultantRepository: ConsultantRepository,
        private readonly eventBus: EventBus,
        private readonly awsConfig: AWSConfigService,
        private readonly notificationTemplateService: NotificationTemplateService,
        private readonly configService: ConfigService
    ) { }

    async handle(event: UserSuspendedEvent) {
        const { userId, name, email } = event;
        const BASE_API_URL =
            this.configService.get<string>("BASE_API_URL") ||
            "https://c3igf19tk2.execute-api.us-east-1.amazonaws.com";

        const deletionEndpoints = [
            `${BASE_API_URL}/product-api/products/delete/all/${userId}`,
            `${BASE_API_URL}/realstate-api/properties/delete/all/${userId}`,
            `${BASE_API_URL}/job-api/jobs/delete/all/${userId}`,
            `${BASE_API_URL}/post-api/posts/delete/all/${userId}`,
        ];

        try {
            // 1️⃣ Trigger external deletions concurrently in background
            const limit = pLimit(3);
            deletionEndpoints.forEach(url => {
                limit(() => pRetry(
                    async () => {
                        const res = await fetch(url, { method: "DELETE" });
                        if (!res.ok) throw new Error(`Failed to delete at ${url}`);
                        this.logger.log(`Deletion succeeded for ${url}`);
                    },
                    { retries: 3, factor: 2, minTimeout: 500 }
                )).catch(err => this.logger.warn(`Deletion failed for ${url}: ${err.message}`));
            });

            // 2️⃣ Remove user feedback / consultant profile
            const affectedConsultants = await this.consultantRepository.removeUserFeedback(userId);

            // 3️⃣ Notify the user asynchronously (fire-and-forget)
            (async () => {
                try {
                    const emailTemplate = this.notificationTemplateService.getAccountRestrictionTemplate(
                        name,
                        new Date().getFullYear().toString(),
                    );

                    await pRetry(
                        async () => {
                            await this.awsConfig.sendEmail({
                                Destination: { ToAddresses: [email] },
                                Message: {
                                    Body: { Html: { Data: emailTemplate, Charset: "UTF-8" } },
                                    Subject: { Data: "Account Suspended", Charset: "UTF-8" },
                                },
                                Source: this.configService.get<string>("SUPPORT_EMAIL"),
                            });
                            this.logger.log(`Suspension email sent to ${email}`);
                        },
                        { retries: 3, factor: 2, minTimeout: 500 }
                    );
                } catch (err) {
                    this.logger.error(`Failed to send suspension email to ${email}: ${err.message}`);
                }
            })();

            // 4️⃣ Publish ConsultantReviewedEvent asynchronously for each review
            affectedConsultants.forEach(async (consultantId) => {
                try {
                    const consultant = await this.consultantRepository.findById(consultantId as unknown as string);
                    if (!consultant) return;

                    consultant.reviews.forEach(review => {
                        if (review.userId.toString() === userId) {
                            this.eventBus.publish(
                                new ConsultantReviewedEvent(consultantId.toString(), {
                                    userId: review.userId,
                                    userName: review.userName,
                                    rating: review.rating,
                                    review: review.review,
                                    createdAt: review.createdAt,
                                })
                            );
                        }
                    });
                } catch (err) {
                    this.logger.warn(`Failed to publish review events for consultant ${consultantId}: ${err.message}`);
                }
            });

            this.logger.log(`UserSuspendedHandler triggered for userId=${userId}, all tasks running in background`);
        } catch (err) {
            this.logger.error(`Critical failure in UserSuspendedHandler: ${err.message}`, err.stack);
            throw err;
        }
    }
}