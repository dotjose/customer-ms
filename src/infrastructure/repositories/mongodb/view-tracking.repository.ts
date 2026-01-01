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
    listingId: string,
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

    const result = await this.findOneAndUpdateByListingIdPreferString(
      entityType,
      listingId,
      update,
    );

    return result?.viewCount || 0;
  }

  /**
   * Get view count for a single listing
   */
  async getViewCount(
    entityType: EntityType,
    listingId: string,
  ): Promise<number> {
    const doc = await this.findOneByListingIdPreferString(entityType, listingId);
    return doc?.viewCount || 0;
  }

  /**
   * Find by composite key
   */
  async findByEntityAndListing(
    entityType: EntityType,
    listingId: string,
  ): Promise<ViewTracking | null> {
    const doc = await this.findOneByListingIdPreferString(entityType, listingId);

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
    listingIds: string[],
  ): Promise<Map<string, number>> {
    const requestedIds = listingIds.map((id) => (id == null ? '' : String(id)));
    const safeRequestedIds = requestedIds.filter((id) => id.length > 0);

    const objectIds = safeRequestedIds
      .map((id) => this.tryParseObjectId(id))
      .filter((id): id is ObjectId => id != null);

    const inClause: any[] = [...new Set(safeRequestedIds)];
    objectIds.forEach((oid) => inClause.push(oid));

    const docs = await this.model
      .find({
        entityType,
        listingId: { $in: inClause },
      })
      .select('listingId viewCount')
      .lean();

    const result = new Map<string, number>();

    // Add found documents. If both a string and an ObjectId version exist for the
    // same hex string, prefer the string version deterministically.
    docs.forEach((doc: any) => {
      const key = doc.listingId == null ? '' : String(doc.listingId);
      if (key.length === 0) {
        return;
      }

      const isStringStored = typeof doc.listingId === 'string';
      if (!result.has(key) || isStringStored) {
        result.set(key, doc.viewCount);
      }
    });

    // Add missing IDs with count 0 (partial success)
    safeRequestedIds.forEach((id) => {
      if (!result.has(id)) {
        result.set(id, 0);
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
        listingId: doc.listingId == null ? '' : String(doc.listingId),
        viewCount: doc.viewCount,
        lastViewedAt: doc.lastViewedAt,
        metadata,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      new ObjectId(doc._id),
    );
  }

  private tryParseObjectId(value: string): ObjectId | null {
    if (!ObjectId.isValid(value)) {
      return null;
    }
    try {
      return new ObjectId(value);
    } catch {
      return null;
    }
  }

  private async findOneByListingIdPreferString(entityType: EntityType, listingId: string) {
    const stringDoc = await this.model
      .findOne({ entityType, listingId })
      .lean();

    if (stringDoc) {
      return stringDoc;
    }

    const objectId = this.tryParseObjectId(listingId);
    if (!objectId) {
      return null;
    }

    return this.model
      .findOne({ entityType, listingId: objectId })
      .lean();
  }

  private async findOneAndUpdateByListingIdPreferString(
    entityType: EntityType,
    listingId: string,
    update: any,
  ) {
    const stringUpdated = await this.model.findOneAndUpdate(
      { entityType, listingId },
      update,
      {
        upsert: false,
        new: true,
        runValidators: true,
      },
    );

    if (stringUpdated) {
      return stringUpdated;
    }

    const objectId = this.tryParseObjectId(listingId);
    if (objectId) {
      const objectUpdated = await this.model.findOneAndUpdate(
        { entityType, listingId: objectId },
        update,
        {
          upsert: false,
          new: true,
          runValidators: true,
        },
      );

      if (objectUpdated) {
        return objectUpdated;
      }
    }

    return this.model.findOneAndUpdate(
      { entityType, listingId },
      update,
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );
  }
}
