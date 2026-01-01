import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * MongoDB schema for ViewTracking
 * Optimized with indexes for performance
 */
@Schema({ collection: 'view_tracking', timestamps: true })
export class ViewTrackingDocument extends Document {
  @Prop({ required: true, enum: ['product', 'realestate', 'job', 'professional', 'event'], type: String })
  entityType: string;

  @Prop({ required: true, type: 'ObjectId' })
  listingId: ObjectId;

  @Prop({ required: true, default: 0 })
  viewCount: number;

  @Prop({ required: true, default: Date.now })
  lastViewedAt: Date;

  @Prop({ type: Object })
  metadata?: {
    hourlyBreakdown?: Record<string, number>;
    dailyBreakdown?: Record<string, number>;
    uniqueViewers?: string[];
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ViewTrackingSchema = SchemaFactory.createForClass(
  ViewTrackingDocument,
);

// Compound unique index on entityType + listingId
ViewTrackingSchema.index({ entityType: 1, listingId: 1 }, { unique: true });

// Index for trending queries (descending viewCount)
ViewTrackingSchema.index({ viewCount: -1, lastViewedAt: -1 });

// Index for entity-specific trending queries
ViewTrackingSchema.index({ entityType: 1, viewCount: -1, lastViewedAt: -1 });

// Index for time-based analytics (future use)
ViewTrackingSchema.index({ lastViewedAt: -1 });
