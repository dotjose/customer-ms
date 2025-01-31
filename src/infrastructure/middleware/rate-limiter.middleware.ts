import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../services/redis.service';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const key = `ratelimit:${ip}`;
    const limit = 100; // requests
    const window = 60; // seconds

    const current = await this.redisService.get(key);
    
    if (!current) {
      await this.redisService.set(key, '1', window);
      return next();
    }

    const count = parseInt(current);
    if (count >= limit) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.redisService.set(key, (count + 1).toString(), window);
    next();
  }
}