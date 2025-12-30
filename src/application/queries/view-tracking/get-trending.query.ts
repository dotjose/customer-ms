import { IQuery } from '@nestjs/cqrs';
import { EntityType } from 'domain/view-tracking/entity-type.enum';

/**
 * Query to get top N trending listings
 * Optional filter by entity type
 */
export class GetTrendingQuery implements IQuery {
  constructor(
    public readonly limit: number = 10,
    public readonly entityType?: EntityType,
  ) {}
}
