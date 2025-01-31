import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    super();
    this.client = new Redis({
      host: this.configService.get<string>("REDIS_HOST"),
      port: this.configService.get<number>("REDIS_PORT"),
    });
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.client.ping();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        "Redis health check failed",
        this.getStatus(key, false)
      );
    }
  }
}
