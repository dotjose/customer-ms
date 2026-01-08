import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ViewTrackingRepository } from 'domain/view-tracking/view-tracking.repository';
import { MetricsService } from 'infrastructure/monitoring/metrics.service';
import { BotDetectionService } from 'infrastructure/services/bot-detection.service';
import { IncrementViewCommand } from '../increment-view.command';

/**
 * Handler for IncrementViewCommand
 * Implements bot detection, deduplication, and atomic increment
 */
@CommandHandler(IncrementViewCommand)
export class IncrementViewHandler
  implements ICommandHandler<IncrementViewCommand>
{
  private readonly logger = new Logger(IncrementViewHandler.name);

  constructor(
    @Inject('ViewTrackingRepository')
    private readonly repository: ViewTrackingRepository,
    private readonly botDetectionService: BotDetectionService,
    private readonly metricsService: MetricsService,
  ) {}

  async execute(command: IncrementViewCommand): Promise<number> {
    const { entityType, listingId, clientIp, userAgent } = command;

    try {
      // Bot detection - check if request is from a bot
      const isBot = await this.botDetectionService.isBot(
        clientIp,
        userAgent,
      );

      if (isBot) {
        this.logger.warn(
          `Bot detected: IP=${clientIp}, UA=${userAgent}`,
        );
        this.metricsService.incrementCounter('view_tracking.bot_blocked');
        throw new Error('Bot traffic detected');
      }

      // Deduplication - check if same IP viewed this listing recently
      const isDuplicate = await this.botDetectionService.isDuplicateView(
        clientIp,
        entityType,
        listingId,
      );

      if (isDuplicate) {
        this.logger.debug(
          `Duplicate view detected: IP=${clientIp}, entity=${entityType}, listing=${listingId}`,
        );
        this.metricsService.incrementCounter('view_tracking.duplicate_blocked');
        
        // Return current count without incrementing
        return await this.repository.getViewCount(
          entityType,
          listingId,
        );
      }

      // Atomic increment
      const newCount = await this.repository.incrementViewCount(
        entityType,
        listingId,
        clientIp,
      );

      // Record successful increment
      await this.botDetectionService.recordView(
        clientIp,
        entityType,
        listingId,
      );

      // Metrics
      this.metricsService.incrementCounter('view_tracking.increment_success', {
        entityType,
      });

      this.logger.log(
        `View incremented: entity=${entityType}, listing=${listingId}, newCount=${newCount}`,
      );

      return newCount;
    } catch (error) {
      this.logger.error(
        `Failed to increment view: ${error.message}`,
        error.stack,
      );
      this.metricsService.incrementCounter('view_tracking.increment_error', {
        entityType,
      });

      // Fallback: return current count or 0
      try {
        return await this.repository.getViewCount(
          entityType,
          listingId,
        );
      } catch (fallbackError) {
        this.logger.error(
          `Fallback failed: ${fallbackError.message}`,
          fallbackError.stack,
        );
        return 0;
      }
    }
  }
}
