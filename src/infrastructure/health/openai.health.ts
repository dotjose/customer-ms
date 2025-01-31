import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { OpenAIService } from "../services/openai.service";

@Injectable()
export class OpenAIHealthIndicator extends HealthIndicator {
  constructor(
    private readonly configService: ConfigService,
    private readonly openAIService: OpenAIService
  ) {
    super();
    this.openAIService.setApiKey(
      this.configService.get<string>("OPENAI_API_KEY")
    );
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.openAIService.testConnection(); // Implement this method
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        "OpenAI health check failed",
        this.getStatus(key, false)
      );
    }
  }
}
