import { Injectable, Logger } from '@nestjs/common';
import { EntityType } from 'domain/view-tracking/entity-type.enum';
import { RedisService } from './redis.service';
import { TrendingListingDto } from 'application/queries/view-tracking/handlers/get-trending.handler';

/**
 * Dedicated caching service for view tracking
 * Manages cache keys, TTLs, and invalidation
 */
@Injectable()
export class ViewTrackingCacheService {
  private readonly logger = new Logger(ViewTrackingCacheService.name);

  // Cache TTLs in seconds
  private readonly VIEW_COUNT_TTL = 60; // 1 minute
  private readonly TRENDING_TTL = 300; // 5 minutes
  private readonly DEDUP_TTL = 300; // 5 minutes

  constructor(private readonly redisService: RedisService) {}

  /**
   * Get cached view count
   */
  async getViewCount(
    entityType: EntityType,
    listingId: string,
  ): Promise<number | null> {
    try {
      const key = this.getViewCountKey(entityType, listingId);
      const value = await this.redisService.get(key);

      if (value === null) {
        return null;
      }

      return parseInt(value, 10);
    } catch (error) {
      this.logger.error(
        `Failed to get cached view count: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Set view count in cache
   */
  async setViewCount(
    entityType: EntityType,
    listingId: string,
    count: number,
  ): Promise<void> {
    try {
      const key = this.getViewCountKey(entityType, listingId);
      await this.redisService.setex(
        key,
        this.VIEW_COUNT_TTL,
        count.toString(),
      );
    } catch (error) {
      this.logger.error(
        `Failed to cache view count: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get bulk view counts from cache
   */
  async getBulkViewCounts(
    entityType: EntityType,
    listingIds: string[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    try {
      const keys = listingIds.map((id) =>
        this.getViewCountKey(entityType, id),
      );
      const values = await this.redisService.mget(keys);

      listingIds.forEach((id, index) => {
        const value = values[index];
        if (value !== null) {
          result.set(id, parseInt(value, 10));
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to get bulk cached view counts: ${error.message}`,
        error.stack,
      );
    }

    return result;
  }

  /**
   * Set bulk view counts in cache
   */
  async setBulkViewCounts(
    entityType: EntityType,
    counts: Map<string, number>,
  ): Promise<void> {
    try {
      const pipeline = this.redisService.pipeline();

      counts.forEach((count, listingId) => {
        const key = this.getViewCountKey(entityType, listingId);
        pipeline.setEx(key, this.VIEW_COUNT_TTL, count.toString());
      });

      await pipeline.exec();
    } catch (error) {
      this.logger.error(
        `Failed to cache bulk view counts: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get cached trending listings
   */
  async getTrending(
    entityType: EntityType | null,
    limit: number,
  ): Promise<TrendingListingDto[] | null> {
    try {
      const key = this.getTrendingKey(entityType, limit);
      const value = await this.redisService.get(key);

      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      this.logger.error(
        `Failed to get cached trending: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Set trending listings in cache
   */
  async setTrending(
    entityType: EntityType | null,
    limit: number,
    data: TrendingListingDto[],
  ): Promise<void> {
    try {
      const key = this.getTrendingKey(entityType, limit);
      await this.redisService.setex(
        key,
        this.TRENDING_TTL,
        JSON.stringify(data),
      );
    } catch (error) {
      this.logger.error(
        `Failed to cache trending: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Invalidate view count cache for a listing
   */
  async invalidateViewCount(
    entityType: EntityType,
    listingId: string,
  ): Promise<void> {
    try {
      const key = this.getViewCountKey(entityType, listingId);
      await this.redisService.del(key);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate view count cache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Invalidate all trending caches
   */
  async invalidateAllTrending(): Promise<void> {
    try {
      const pattern = 'view_tracking:trending:*';
      await this.redisService.deleteByPattern(pattern);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate trending cache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cache key generators
   */
  private getViewCountKey(entityType: EntityType, listingId: string): string {
    return `view_tracking:count:${entityType}:${listingId}`;
  }

  private getTrendingKey(
    entityType: EntityType | null,
    limit: number,
  ): string {
    const type = entityType || 'all';
    return `view_tracking:trending:${type}:${limit}`;
  }
}
