import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ViewTrackingRepository } from 'domain/view-tracking/view-tracking.repository';
import { MetricsService } from 'infrastructure/monitoring/metrics.service';
import { ViewTrackingCacheService } from 'infrastructure/services/view-tracking-cache.service';
import {
  GetViewCountQuery,
  GetBulkViewCountsQuery,
} from '../get-view-count.query';

/**
 * Handler for GetViewCountQuery
 * Implements Redis caching with short TTL
 */
@QueryHandler(GetViewCountQuery)
export class GetViewCountHandler
  implements IQueryHandler<GetViewCountQuery, number>
{
  private readonly logger = new Logger(GetViewCountHandler.name);

  constructor(
    @Inject('ViewTrackingRepository')
    private readonly repository: ViewTrackingRepository,
    private readonly cacheService: ViewTrackingCacheService,
    private readonly metricsService: MetricsService,
  ) {}

  async execute(query: GetViewCountQuery): Promise<number> {
    const { entityType, listingId } = query;

    try {
      // Try cache first
      const cached = await this.cacheService.getViewCount(
        entityType,
        listingId,
      );

      if (cached !== null) {
        this.metricsService.incrementCounter('view_tracking.cache_hit');
        return cached;
      }

      // Cache miss - fetch from database
      this.metricsService.incrementCounter('view_tracking.cache_miss');
      const count = await this.repository.getViewCount(
        entityType,
        new ObjectId(listingId),
      );

      // Cache the result
      await this.cacheService.setViewCount(entityType, listingId, count);

      return count;
    } catch (error) {
      this.logger.error(
        `Failed to get view count: ${error.message}`,
        error.stack,
      );
      return 0; // Graceful degradation
    }
  }
}

/**
 * Handler for GetBulkViewCountsQuery
 * Optimized for batch operations (newsletters, dashboards)
 */
@QueryHandler(GetBulkViewCountsQuery)
export class GetBulkViewCountsHandler
  implements IQueryHandler<GetBulkViewCountsQuery, Map<string, number>>
{
  private readonly logger = new Logger(GetBulkViewCountsHandler.name);

  constructor(
    @Inject('ViewTrackingRepository')
    private readonly repository: ViewTrackingRepository,
    private readonly cacheService: ViewTrackingCacheService,
    private readonly metricsService: MetricsService,
  ) {}

  async execute(
    query: GetBulkViewCountsQuery,
  ): Promise<Map<string, number>> {
    const { entityType, listingIds } = query;

    try {
      // Try to get all from cache first
      const cachedResults = await this.cacheService.getBulkViewCounts(
        entityType,
        listingIds,
      );

      const missingIds = listingIds.filter(
        (id) => !cachedResults.has(id),
      );

      if (missingIds.length === 0) {
        this.metricsService.incrementCounter('view_tracking.bulk_cache_hit');
        return cachedResults;
      }

      // Fetch missing from database
      this.metricsService.incrementCounter('view_tracking.bulk_cache_partial');
      const dbResults = await this.repository.getBulkViewCounts(
        entityType,
        missingIds.map((id) => new ObjectId(id)),
      );

      // Cache the missing results
      await this.cacheService.setBulkViewCounts(entityType, dbResults);

      // Merge cached and DB results
      const combined = new Map([...cachedResults, ...dbResults]);

      return combined;
    } catch (error) {
      this.logger.error(
        `Failed to get bulk view counts: ${error.message}`,
        error.stack,
      );
      // Return empty map on error
      return new Map();
    }
  }
}
