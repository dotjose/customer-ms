import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ViewTrackingRepository } from 'domain/view-tracking/view-tracking.repository';
import { ViewTracking } from 'domain/view-tracking/view-tracking.entity';
import { EntityType } from 'domain/view-tracking/entity-type.enum';
import { ViewTrackingDocument } from 'infrastructure/persistence/mongodb/schemas/view-tracking.schema';
import { ViewMetadata } from 'domain/view-tracking/view-metadata.value-object';

/**
 * MongoDB implementation of ViewTrackingRepository
 * Provides atomic operations and optimized queries
 */
@Injectable()
export class MongoViewTrackingRepository implements ViewTrackingRepository {
  private readonly logger = new Logger(MongoViewTrackingRepository.name);

  constructor(
    @InjectModel(ViewTrackingDocument.name)
    private readonly model: Model<ViewTrackingDocument>,
  ) {}

  /**
   * Atomically increment view count using $inc operator
   * Creates document if it doesn't exist (upsert)
   */
  async incrementViewCount(
    entityType: EntityType,
    listingId: ObjectId,
    clientIp?: string,
  ): Promise<number> {
    const now = new Date();
    const hourKey = `metadata.hourlyBreakdown.${now.getHours()}`;
    const dayKey = `metadata.dailyBreakdown.${now.toISOString().split('T')[0]}`;

    const update: any = {
      $inc: {
        viewCount: 1,
        [hourKey]: 1,
        [dayKey]: 1,
      },
      $set: { lastViewedAt: now },
      $setOnInsert: {
        entityType,
        listingId,
        createdAt: now,
      },
    };

    if (clientIp) {
      update.$addToSet = { 'metadata.uniqueViewers': clientIp };
    }

    const result = await this.model.findOneAndUpdate(
      { entityType, listingId },
      update,
      {
        upsert: true,
        new: true, // Return updated document
        runValidators: true,
      },
    );

    return result.viewCount;
  }

  /**
   * Get view count for a single listing
   */
  async getViewCount(
    entityType: EntityType,
    listingId: ObjectId,
  ): Promise<number> {
    const doc = await this.model
      .findOne({ entityType, listingId })
      .select('viewCount')
      .lean();

    return doc?.viewCount || 0;
  }

  /**
   * Find by composite key
   */
  async findByEntityAndListing(
    entityType: EntityType,
    listingId: ObjectId,
  ): Promise<ViewTracking | null> {
    const doc = await this.model.findOne({ entityType, listingId }).lean();

    if (!doc) {
      return null;
    }

    return this.toDomain(doc);
  }

  /**
   * Get top N trending listings
   * Sorted by viewCount descending, then lastViewedAt descending
   */
  async getTopTrending(
    entityType: EntityType | null,
    limit: number,
  ): Promise<ViewTracking[]> {
    const filter = entityType ? { entityType } : {};

    const docs = await this.model
      .find(filter)
      .sort({ viewCount: -1, lastViewedAt: -1 })
      .limit(limit)
      .lean();

    return docs.map((doc) => this.toDomain(doc));
  }

  /**
   * Bulk get view counts for multiple listings
   * Optimized with single query
   */
  async getBulkViewCounts(
    entityType: EntityType,
    listingIds: ObjectId[],
  ): Promise<Map<string, number>> {
    const docs = await this.model
      .find({
        entityType,
        listingId: { $in: listingIds },
      })
      .select('listingId viewCount')
      .lean();

    const result = new Map<string, number>();

    // Add found documents
    docs.forEach((doc) => {
      result.set(doc.listingId.toString(), doc.viewCount);
    });

    // Add missing IDs with count 0
    listingIds.forEach((id) => {
      const key = id.toString();
      if (!result.has(key)) {
        result.set(key, 0);
      }
    });

    return result;
  }

  /**
   * Save or update view tracking entity
   */
  async save(viewTracking: ViewTracking): Promise<void> {
    const obj = viewTracking.toObject();

    await this.model.updateOne(
      { _id: obj._id },
      {
        $set: {
          entityType: obj.entityType,
          listingId: obj.listingId,
          viewCount: obj.viewCount,
          lastViewedAt: obj.lastViewedAt,
          metadata: obj.metadata,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: obj.createdAt,
        },
      },
      { upsert: true },
    );
  }

  /**
   * Find by ID
   */
  async findById(id: ObjectId): Promise<ViewTracking | null> {
    const doc = await this.model.findById(id).lean();

    if (!doc) {
      return null;
    }

    return this.toDomain(doc);
  }

  /**
   * Map MongoDB document to domain entity
   */
  private toDomain(doc: any): ViewTracking {
    const metadata = doc.metadata
      ? new ViewMetadata(
          new Map(Object.entries(doc.metadata.hourlyBreakdown || {})),
          new Map(Object.entries(doc.metadata.dailyBreakdown || {})),
          new Set(doc.metadata.uniqueViewers || []),
        )
      : undefined;

    return new ViewTracking(
      {
        entityType: doc.entityType as EntityType,
        listingId: new ObjectId(doc.listingId),
        viewCount: doc.viewCount,
        lastViewedAt: doc.lastViewedAt,
        metadata,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      new ObjectId(doc._id),
    );
  }
}
