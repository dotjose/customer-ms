import { AggregateRoot } from '@nestjs/cqrs';
import { ObjectId } from 'mongodb';
import { EntityType } from './entity-type.enum';
import { ViewMetadata } from './view-metadata.value-object';
import { ViewIncrementedEvent } from 'domain/events/view-incremented.event';

export interface ViewTrackingProps {
  entityType: EntityType;
  listingId: string;
  viewCount: number;
  lastViewedAt: Date;
  metadata?: ViewMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ViewTracking Aggregate Root
 * Manages view counts for listings across multiple entity types
 */
export class ViewTracking extends AggregateRoot {
  private readonly _id: ObjectId;
  private readonly props: ViewTrackingProps;

  constructor(props: ViewTrackingProps, id?: ObjectId) {
    super();
    this._id = id || new ObjectId();
    this.props = props;
  }

  get id(): ObjectId {
    return this._id;
  }

  get entityType(): EntityType {
    return this.props.entityType;
  }

  get listingId(): string {
    return this.props.listingId;
  }

  get viewCount(): number {
    return this.props.viewCount;
  }

  get lastViewedAt(): Date {
    return this.props.lastViewedAt;
  }

  get metadata(): ViewMetadata | undefined {
    return this.props.metadata;
  }

  /**
   * Increment view count atomically
   * Publishes ViewIncrementedEvent for analytics
   */
  public incrementView(): void {
    this.props.viewCount += 1;
    this.props.lastViewedAt = new Date();
    this.props.updatedAt = new Date();

    // Publish domain event for analytics
    this.apply(
      new ViewIncrementedEvent(
        this._id.toString(),
        this.props.entityType,
        this.props.listingId,
        this.props.viewCount,
        this.props.lastViewedAt,
      ),
    );
  }

  /**
   * Get current view count
   */
  public getCount(): number {
    return this.props.viewCount;
  }

  /**
   * Calculate trending score based on views and recency
   * Formula: viewCount * recencyMultiplier
   * Recency multiplier decays over time (1.0 for today, 0.5 for 7 days ago, etc.)
   */
  public getTrendingScore(): number {
    const now = new Date();
    const daysSinceLastView = Math.floor(
      (now.getTime() - this.props.lastViewedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Exponential decay: 0.9^days
    const recencyMultiplier = Math.pow(0.9, daysSinceLastView);
    
    return this.props.viewCount * recencyMultiplier;
  }

  /**
   * Update metadata for analytics
   */
  public updateMetadata(metadata: ViewMetadata): void {
    this.props.metadata = metadata;
    this.props.updatedAt = new Date();
  }

  public toObject() {
    return {
      _id: this._id,
      entityType: this.props.entityType,
      listingId: this.props.listingId,
      viewCount: this.props.viewCount,
      lastViewedAt: this.props.lastViewedAt,
      metadata: this.props.metadata?.toObject(),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  /**
   * Factory method to create new ViewTracking instance
   */
  static create(entityType: EntityType, listingId: string): ViewTracking {
    const now = new Date();
    return new ViewTracking({
      entityType,
      listingId,
      viewCount: 0,
      lastViewedAt: now,
      metadata: ViewMetadata.create(),
      createdAt: now,
      updatedAt: now,
    });
  }
}
