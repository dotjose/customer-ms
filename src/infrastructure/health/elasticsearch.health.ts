import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { Client } from "@elastic/elasticsearch";

@Injectable()
export class ElasticsearchHealthIndicator extends HealthIndicator {
  private client: Client;

  constructor(private readonly configService: ConfigService) {
    super();
    this.client = new Client({
      node: this.configService.get<string>("ELASTICSEARCH_URL"),
    });
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      const health = await this.client.cluster.health();
      return this.getStatus(key, health.status !== "red");
    } catch (error) {
      throw new HealthCheckError(
        "Elasticsearch health check failed",
        this.getStatus(key, false)
      );
    }
  }
}
