import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ViewTrackingRepository } from 'domain/view-tracking/view-tracking.repository';
import { MetricsService } from 'infrastructure/monitoring/metrics.service';
import { ViewTrackingCacheService } from 'infrastructure/services/view-tracking-cache.service';
import { GetTrendingQuery } from '../get-trending.query';

export interface TrendingListingDto {
  entityType: string;
  listingId: string;
  viewCount: number;
  trendingScore: number;
  lastViewedAt: Date;
}

/**
 * Handler for GetTrendingQuery
 * Implements Redis caching with medium TTL (5 minutes)
 */
@QueryHandler(GetTrendingQuery)
export class GetTrendingHandler
  implements IQueryHandler<GetTrendingQuery, TrendingListingDto[]>
{
  private readonly logger = new Logger(GetTrendingHandler.name);

  constructor(
    @Inject('ViewTrackingRepository')
    private readonly repository: ViewTrackingRepository,
    private readonly cacheService: ViewTrackingCacheService,
    private readonly metricsService: MetricsService,
  ) {}

  async execute(query: GetTrendingQuery): Promise<TrendingListingDto[]> {
    const { limit, entityType } = query;

    try {
      // Try cache first
      const cached = await this.cacheService.getTrending(
        entityType || null,
        limit,
      );

      if (cached && cached.length > 0) {
        this.metricsService.incrementCounter('view_tracking.trending_cache_hit');
        return cached;
      }

      // Cache miss - fetch from database
      this.metricsService.incrementCounter('view_tracking.trending_cache_miss');
      const viewTrackings = await this.repository.getTopTrending(
        entityType || null,
        limit,
      );

      // Map to DTOs with trending scores
      const results: TrendingListingDto[] = viewTrackings.map((vt) => ({
        entityType: vt.entityType,
        listingId: vt.listingId.toString(),
        viewCount: vt.viewCount,
        trendingScore: vt.getTrendingScore(),
        lastViewedAt: vt.lastViewedAt,
      }));

      // Sort by trending score (highest first)
      results.sort((a, b) => b.trendingScore - a.trendingScore);

      // Cache the results
      await this.cacheService.setTrending(
        entityType || null,
        limit,
        results,
      );

      this.logger.log(
        `Trending query executed: entityType=${entityType || 'all'}, limit=${limit}, results=${results.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to get trending listings: ${error.message}`,
        error.stack,
      );
      return []; // Graceful degradation
    }
  }
}
