import { Injectable, Logger } from "@nestjs/common";
import { Counter, Histogram, register } from "prom-client";

@Injectable()
export class PrometheusService {
  private readonly logger = new Logger(PrometheusService.name);

  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;

  constructor() {
    // Clear existing metrics (useful in development environments)
    register.clear();

    this.logger.log("Initializing Prometheus metrics...");

    // Initialize the counter metric
    this.httpRequestsTotal = new Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "path", "status"],
    });

    // Initialize the histogram metric
    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "path", "status"],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.logger.log("Prometheus metrics initialized successfully.");
  }

  /**
   * Records an HTTP request in the Prometheus metrics.
   * @param {string} method - HTTP method (e.g., GET, POST).
   * @param {string} path - Request path.
   * @param {number} status - HTTP status code.
   * @param {number} duration - Request duration in seconds.
   */
  recordHttpRequest(
    method: string,
    path: string,
    status: number,
    duration: number
  ): void {
    try {
      this.logger.debug(
        `Recording HTTP request - Method: ${method}, Path: ${path}, Status: ${status}, Duration: ${duration.toFixed(
          2
        )} seconds`
      );

      this.httpRequestsTotal.inc({ method, path, status });
      this.httpRequestDuration.observe({ method, path, status }, duration);

      this.logger.debug("HTTP request recorded successfully.");
    } catch (error) {
      this.logger.error("Error recording HTTP request metrics:", error);
    }
  }

  /**
   * Retrieves all registered Prometheus metrics.
   * @returns {Promise<string>} - All metrics in Prometheus format.
   */
  async getMetrics(): Promise<string> {
    try {
      this.logger.log("Retrieving Prometheus metrics...");
      return register.metrics();
    } catch (error) {
      this.logger.error("Error retrieving Prometheus metrics:", error);
      throw new Error("Failed to retrieve Prometheus metrics");
    }
  }
}
