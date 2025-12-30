import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import {
  IncrementViewDto,
  GetViewCountDto,
  GetBulkViewCountsDto,
  GetTrendingDto,
  ViewCountResponseDto,
  BulkViewCountResponseDto,
  TrendingResponseDto,
} from '../dtos/view-tracking.dto';
import { IncrementViewCommand } from 'application/commands/view-tracking/increment-view.command';
import {
  GetViewCountQuery,
  GetBulkViewCountsQuery,
} from 'application/queries/view-tracking/get-view-count.query';
import { GetTrendingQuery } from 'application/queries/view-tracking/get-trending.query';

/**
 * View Tracking Controller
 * Provides REST API for view count management
 */
@ApiTags('View Tracking')
@Controller('views')
@UseGuards(ThrottlerGuard)
export class ViewTrackingController {
  private readonly logger = new Logger(ViewTrackingController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Increment view count for a listing
   * Fire-and-forget pattern for SSR compatibility
   */
  @Post('increment')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Increment view count',
    description:
      'Atomically increment view count for a listing. Returns 202 Accepted immediately for SSR compatibility.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'View increment queued successfully',
    type: ViewCountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded',
  })
  async incrementView(
    @Body() dto: IncrementViewDto,
    @Req() req: Request,
  ): Promise<ViewCountResponseDto> {
    const clientIp = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    this.logger.log(
      `Increment view: entity=${dto.entityType}, listing=${dto.listingId}, ip=${clientIp}`,
    );

    // Execute command (with bot detection and deduplication)
    const newCount = await this.commandBus.execute(
      new IncrementViewCommand(
        dto.entityType,
        dto.listingId,
        clientIp,
        userAgent,
      ),
    );

    return {
      entityType: dto.entityType,
      listingId: dto.listingId,
      viewCount: newCount,
    };
  }

  /**
   * Get view count for a single listing
   */
  @Get(':entityType/:listingId')
  @ApiOperation({
    summary: 'Get view count',
    description: 'Get current view count for a listing',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'View count retrieved successfully',
    type: ViewCountResponseDto,
  })
  async getViewCount(
    @Param('entityType') entityType: string,
    @Param('listingId') listingId: string,
  ): Promise<ViewCountResponseDto> {
    const count = await this.queryBus.execute(
      new GetViewCountQuery(entityType as any, listingId),
    );

    return {
      entityType,
      listingId,
      viewCount: count,
    };
  }

  /**
   * Get view counts for multiple listings (bulk)
   */
  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get bulk view counts',
    description:
      'Get view counts for multiple listings in a single request. Optimized for newsletters and dashboards.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk view counts retrieved successfully',
    type: BulkViewCountResponseDto,
  })
  async getBulkViewCounts(
    @Body() dto: GetBulkViewCountsDto,
  ): Promise<BulkViewCountResponseDto> {
    const countsMap = await this.queryBus.execute(
      new GetBulkViewCountsQuery(dto.entityType, dto.listingIds),
    );

    // Convert Map to plain object
    const counts: Record<string, number> = {};
    countsMap.forEach((count, listingId) => {
      counts[listingId] = count;
    });

    return {
      entityType: dto.entityType,
      counts,
    };
  }

  /**
   * Get top N trending listings
   */
  @Get('trending')
  @ApiOperation({
    summary: 'Get trending listings',
    description:
      'Get top N trending listings based on view count and recency. Optionally filter by entity type.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trending listings retrieved successfully',
    type: [TrendingResponseDto],
  })
  async getTrending(
    @Query() dto: GetTrendingDto,
  ): Promise<TrendingResponseDto[]> {
    const results = await this.queryBus.execute(
      new GetTrendingQuery(dto.limit, dto.entityType),
    );

    return results;
  }

  /**
   * Extract client IP from request
   * Handles proxies and load balancers
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return realIp as string;
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
