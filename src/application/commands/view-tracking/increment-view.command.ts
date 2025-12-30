import { ICommand } from '@nestjs/cqrs';
import { EntityType } from 'domain/view-tracking/entity-type.enum';

/**
 * Command to increment view count for a listing
 * Includes client metadata for bot detection
 */
export class IncrementViewCommand implements ICommand {
  constructor(
    public readonly entityType: EntityType,
    public readonly listingId: string,
    public readonly clientIp: string,
    public readonly userAgent: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
