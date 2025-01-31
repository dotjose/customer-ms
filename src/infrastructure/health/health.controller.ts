import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from "@nestjs/terminus";
import { ApiTags } from "@nestjs/swagger";

import { RedisHealthIndicator } from "./redis.health"; // Custom Redis Health Check
import { ElasticsearchHealthIndicator } from "./elasticsearch.health"; // Custom Elasticsearch Health Check
import { OpenAIHealthIndicator } from "./openai.health"; // Custom OpenAI Health Check

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly elasticsearch: ElasticsearchHealthIndicator,
    private readonly openai: OpenAIHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.mongoose.pingCheck("database"),
      () => this.redis.pingCheck("redis"),
      () => this.elasticsearch.pingCheck("elasticsearch"),
      () => this.openai.pingCheck("openai"),
    ]);
  }
}
