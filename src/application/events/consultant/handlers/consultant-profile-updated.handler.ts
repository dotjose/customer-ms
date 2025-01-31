import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { ConsultantProfileUpdatedEvent } from "../consultant-profile-updated.event";
import { ElasticsearchService } from "infrastructure/services/elasticsearch.service";
import { RedisService } from "infrastructure/services/redis.service";
import { Logger } from "@nestjs/common";

@EventsHandler(ConsultantProfileUpdatedEvent)
export class ConsultantProfileUpdatedHandler
  implements IEventHandler<ConsultantProfileUpdatedEvent>
{
  private readonly logger = new Logger(ConsultantProfileUpdatedHandler.name);

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly redisService: RedisService
  ) {}

  async handle(event: ConsultantProfileUpdatedEvent): Promise<void> {
    const { consultantId, profile } = event;

    try {
      this.logger.log(
        `Processing ConsultantProfileUpdatedEvent for ID: ${consultantId}`
      );

      // Update Elasticsearch document
      await this.elasticsearchService.update(
        "consultants",
        consultantId.toString(),
        {
          doc: {
            ...profile,
            updatedAt: new Date(),
          },
        }
      );
      this.logger.log(
        `Elasticsearch document updated for Consultant ID: ${consultantId}`
      );

      // Invalidate cache
      await Promise.all([
        this.redisService.del(`consultant:${consultantId}`),
        this.redisService.del("consultants:nearby:*"),
      ]);
      this.logger.log(
        `Redis cache invalidated for Consultant ID: ${consultantId}`
      );

      this.logger.log(
        `Successfully processed ConsultantProfileUpdatedEvent for ID: ${consultantId}`
      );
    } catch (error) {
      this.logger.error(
        `Error processing ConsultantProfileUpdatedEvent for Consultant ID: ${consultantId}. Details: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
