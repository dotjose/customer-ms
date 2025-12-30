import { IQuery } from '@nestjs/cqrs';
import { EntityType } from 'domain/view-tracking/entity-type.enum';

/**
 * Query to get view count for a single listing
 */
export class GetViewCountQuery implements IQuery {
  constructor(
    public readonly entityType: EntityType,
    public readonly listingId: string,
  ) {}
}

/**
 * Query to get view counts for multiple listings (bulk operation)
 */
export class GetBulkViewCountsQuery implements IQuery {
  constructor(
    public readonly entityType: EntityType,
    public readonly listingIds: string[],
  ) {}
}
