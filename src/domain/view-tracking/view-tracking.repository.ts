import { ObjectId } from 'mongodb';
import { ViewTracking } from './view-tracking.entity';
import { EntityType } from './entity-type.enum';

/**
 * Repository interface for ViewTracking aggregate
 * Defines contract for persistence operations
 */
export interface ViewTrackingRepository {
  /**
   * Atomically increment view count for a listing
   * Creates new record if doesn't exist
   * @returns Updated view count
   */
  incrementViewCount(
    entityType: EntityType,
    listingId: ObjectId,
  ): Promise<number>;

  /**
   * Get current view count for a listing
   * @returns View count or 0 if not found
   */
  getViewCount(entityType: EntityType, listingId: ObjectId): Promise<number>;

  /**
   * Get view tracking entity by composite key
   */
  findByEntityAndListing(
    entityType: EntityType,
    listingId: ObjectId,
  ): Promise<ViewTracking | null>;

  /**
   * Get top N trending listings
   * @param entityType Optional filter by entity type
   * @param limit Number of results to return
   * @returns Array of ViewTracking entities sorted by trending score
   */
  getTopTrending(
    entityType: EntityType | null,
    limit: number,
  ): Promise<ViewTracking[]>;

  /**
   * Get view counts for multiple listings (bulk operation)
   * Optimized for performance with newsletters/dashboards
   * @returns Map of listingId -> viewCount
   */
  getBulkViewCounts(
    entityType: EntityType,
    listingIds: ObjectId[],
  ): Promise<Map<string, number>>;

  /**
   * Save or update view tracking entity
   */
  save(viewTracking: ViewTracking): Promise<void>;

  /**
   * Find by ID
   */
  findById(id: ObjectId): Promise<ViewTracking | null>;
}
