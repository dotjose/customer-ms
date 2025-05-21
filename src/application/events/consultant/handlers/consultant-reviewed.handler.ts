import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";

import { ConsultantReviewedEvent } from "domain/events/consultant/consultant-reviewed.event";
import { OpenAIService } from "infrastructure/services/openai.service";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { ElasticsearchService } from "infrastructure/services/elasticsearch.service";
import { RedisService } from "infrastructure/services/redis.service";

@EventsHandler(ConsultantReviewedEvent)
export class ConsultantReviewedHandler
  implements IEventHandler<ConsultantReviewedEvent>
{
  private readonly logger = new Logger(ConsultantReviewedHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository,
    private readonly openAIService: OpenAIService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly redisService: RedisService
  ) {}

  async handle(event: ConsultantReviewedEvent) {
    const { consultantId } = event;

    try {
      const consultant = await this.consultantRepository.findById(
        consultantId.toString()
      );
      if (!consultant) return;

      // Generate AI review if enough reviews exist
      if (consultant.reviews.length >= 30) {
        const aiReview = await this.openAIService.generateConsultantReview(
          consultant.reviews
        );
        consultant.updateAIReview(aiReview);
        await this.consultantRepository.save(consultant);
      }

      // Update Elasticsearch document
      await this.elasticsearchService.search("consultants", {
        id: consultant.id.toString(),
        body: {
          doc: {
            averageRating: consultant.averageRating,
            totalReviews: consultant.reviews.length,
          },
        },
      });

      // Invalidate cache
      await this.redisService.del(`consultant:${consultant.id}`);

      this.logger.log(
        `Consultant profile reviewed successfully made: ${consultantId}`
      );
    } catch (error) {
      this.logger.error(
        `Error processing consultant profile: ${error.message}`
      );
      throw error; //Rethrow to propagate the error and let NestJS handle it
    }
  }
}
