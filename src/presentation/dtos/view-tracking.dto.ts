import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityType, ENTITY_TYPES } from 'domain/view-tracking/entity-type.enum';

/**
 * DTO for incrementing view count
 */
export class IncrementViewDto {
  @ApiProperty({
    enum: ENTITY_TYPES,
    description: 'Type of entity (product, realestate, job, professional, event)',
    example: 'product',
  })
  @IsEnum(EntityType)
  @Transform(({ value }) => value?.toLowerCase())
  @IsNotEmpty()
  entityType: EntityType;

  @ApiProperty({
    description: 'MongoDB ObjectId of the listing',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  listingId: string;
}

/**
 * DTO for getting view count
 */
export class GetViewCountDto {
  @ApiProperty({
    enum: ENTITY_TYPES,
    description: 'Type of entity',
    example: 'product',
  })
  @IsEnum(EntityType)
  @Transform(({ value }) => value?.toLowerCase())
  @IsNotEmpty()
  entityType: EntityType;

  @ApiProperty({
    description: 'MongoDB ObjectId of the listing',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  listingId: string;
}

/**
 * DTO for bulk view count query
 */
export class GetBulkViewCountsDto {
  @ApiProperty({
    enum: ENTITY_TYPES,
    description: 'Type of entity',
    example: 'product',
  })
  @IsEnum(EntityType)
  @Transform(({ value }) => value?.toLowerCase())
  @IsNotEmpty()
  entityType: EntityType;

  @ApiProperty({
    description: 'Array of MongoDB ObjectIds',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  listingIds: string[];
}

/**
 * DTO for trending query
 */
export class GetTrendingDto {
  @ApiPropertyOptional({
    description: 'Number of results to return',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ENTITY_TYPES,
    description: 'Filter by entity type (optional)',
    example: 'product',
  })
  @IsOptional()
  @IsEnum(EntityType)
  @Transform(({ value }) => value?.toLowerCase())
  entityType?: EntityType;
}

/**
 * Response DTOs
 */
export class ViewCountResponseDto {
  @ApiProperty({ example: 'product' })
  entityType: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  listingId: string;

  @ApiProperty({ example: 42 })
  viewCount: number;
}

export class BulkViewCountResponseDto {
  @ApiProperty({ example: 'product' })
  entityType: string;

  @ApiProperty({
    example: {
      '507f1f77bcf86cd799439011': 42,
      '507f1f77bcf86cd799439012': 15,
    },
  })
  counts: Record<string, number>;
}

export class TrendingResponseDto {
  @ApiProperty({ example: 'product' })
  entityType: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  listingId: string;

  @ApiProperty({ example: 42 })
  viewCount: number;

  @ApiProperty({ example: 38.5 })
  trendingScore: number;

  @ApiProperty({ example: '2025-12-29T13:00:00.000Z' })
  lastViewedAt: Date;
}
