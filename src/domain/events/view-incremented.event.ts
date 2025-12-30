import { IEvent } from '@nestjs/cqrs';
import { EntityType } from '../view-tracking/entity-type.enum';

/**
 * Domain event published when a view is incremented
 * Can be consumed by analytics services for time-based tracking
 */
export class ViewIncrementedEvent implements IEvent {
  constructor(
    public readonly viewTrackingId: string,
    public readonly entityType: EntityType,
    public readonly listingId: string,
    public readonly newCount: number,
    public readonly timestamp: Date,
  ) {}
}
