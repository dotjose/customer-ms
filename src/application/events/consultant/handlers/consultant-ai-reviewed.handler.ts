import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";

import { ConsultantAIReviewUpdatedEvent } from "domain/events/consultant/consultant-ai-reviewed.event";
import { ElasticsearchService } from "infrastructure/services/elasticsearch.service";

@EventsHandler(ConsultantAIReviewUpdatedEvent)
export class ConsultantAIReviewUpdatedHandler
  implements IEventHandler<ConsultantAIReviewUpdatedEvent>
{
  private readonly logger = new Logger(ConsultantAIReviewUpdatedHandler.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async handle(event: ConsultantAIReviewUpdatedEvent): Promise<void> {
    const { consultantId, aiReview } = event;

    try {
      this.logger.log(
        `Processing ConsultantAIReviewUpdatedEvent for ID: ${consultantId}`
      );

      // Update the Elasticsearch index with the new AI review
      await this.elasticsearchService.update("consultants", consultantId, {
        aiReview: {
          rating: aiReview.rating,
          summary: aiReview.summary,
          strengths: aiReview.strengths,
          weaknesses: aiReview.weaknesses,
          recommendations: aiReview.recommendations,
          lastUpdated: aiReview.lastUpdated,
        },
      });

      this.logger.log(
        `Successfully updated Elasticsearch for Consultant ID: ${consultantId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Elasticsearch for Consultant ID: ${consultantId}. Error: ${error.message}`,
        error.stack
      );
      throw error; // Rethrow to let NestJS handle it
    }
  }
}
