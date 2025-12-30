import { Injectable, Logger } from '@nestjs/common';
import { EntityType } from 'domain/view-tracking/entity-type.enum';
import { RedisService } from './redis.service';

/**
 * Bot detection service
 * Implements IP-based rate limiting, User-Agent validation, and deduplication
 */
@Injectable()
export class BotDetectionService {
  private readonly logger = new Logger(BotDetectionService.name);

  // Configuration
  private readonly RATE_LIMIT_WINDOW = 60; // 1 minute
  private readonly RATE_LIMIT_MAX = 10; // Max 10 views per minute per IP
  private readonly DEDUP_WINDOW = 300; // 5 minutes

  // Known bot User-Agent patterns
  private readonly BOT_PATTERNS = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /java/i,
    /okhttp/i,
    /axios/i,
  ];

  constructor(private readonly redisService: RedisService) {}

  /**
   * Check if request is from a bot
   * Combines User-Agent validation and IP rate limiting
   */
  async isBot(clientIp: string, userAgent: string): Promise<boolean> {
    // Check User-Agent
    if (this.isBotUserAgent(userAgent)) {
      this.logger.debug(`Bot User-Agent detected: ${userAgent}`);
      return true;
    }

    // Check IP rate limiting
    const isRateLimited = await this.isRateLimited(clientIp);
    if (isRateLimited) {
      this.logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return true;
    }

    return false;
  }

  /**
   * Check if User-Agent matches known bot patterns
   */
  private isBotUserAgent(userAgent: string): boolean {
    if (!userAgent || userAgent.trim() === '') {
      return true; // Empty User-Agent is suspicious
    }

    return this.BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
  }

  /**
   * Check if IP has exceeded rate limit
   */
  private async isRateLimited(clientIp: string): Promise<boolean> {
    try {
      const key = this.getRateLimitKey(clientIp);
      const count = await this.redisService.incr(key);

      // Set expiry on first increment
      if (count === 1) {
        await this.redisService.expire(key, this.RATE_LIMIT_WINDOW);
      }

      return count > this.RATE_LIMIT_MAX;
    } catch (error) {
      this.logger.error(
        `Failed to check rate limit: ${error.message}`,
        error.stack,
      );
      return false; // Fail open
    }
  }

  /**
   * Check if this is a duplicate view (same IP, entity, listing within window)
   */
  async isDuplicateView(
    clientIp: string,
    entityType: EntityType,
    listingId: string,
  ): Promise<boolean> {
    try {
      const key = this.getDedupKey(clientIp, entityType, listingId);
      const exists = await this.redisService.exists(key);

      return exists === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check duplicate view: ${error.message}`,
        error.stack,
      );
      return false; // Fail open
    }
  }

  /**
   * Record a view for deduplication
   */
  async recordView(
    clientIp: string,
    entityType: EntityType,
    listingId: string,
  ): Promise<void> {
    try {
      const key = this.getDedupKey(clientIp, entityType, listingId);
      await this.redisService.setex(key, this.DEDUP_WINDOW, '1');
    } catch (error) {
      this.logger.error(
        `Failed to record view: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cache key generators
   */
  private getRateLimitKey(clientIp: string): string {
    return `view_tracking:ratelimit:${clientIp}`;
  }

  private getDedupKey(
    clientIp: string,
    entityType: EntityType,
    listingId: string,
  ): string {
    return `view_tracking:dedup:${clientIp}:${entityType}:${listingId}`;
  }
}
