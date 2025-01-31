import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { PrometheusService } from "./prometheus.service";

@Controller("metrics")
export class PrometheusController {
  constructor(private readonly prometheusService: PrometheusService) {}

  /**
   * Handles GET requests to /metrics to return Prometheus metrics.
   * @returns {Promise<string>} - The collected Prometheus metrics in plain text format.
   */
  @Get("/")
  async getMetrics(): Promise<string> {
    try {
      const metrics = await this.prometheusService.getMetrics();
      return metrics;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
