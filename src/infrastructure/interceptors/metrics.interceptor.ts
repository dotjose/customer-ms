import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { MetricsService } from "../monitoring/metrics.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;
    const startTime = Date.now();

    this.logger.debug(`Incoming request - Method: ${method}, Path: ${path}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000; // Convert ms to seconds
          const status = context.switchToHttp().getResponse().statusCode;

          this.logger.log(
            `Request completed - Method: ${method}, Path: ${path}, Status: ${status}, Duration: ${duration.toFixed(
              2
            )} seconds`
          );

          // Record the metrics
          this.metricsService.recordApiMetrics(method, path, status, duration);
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000; // Convert ms to seconds
          const status = error.status || 500;

          this.logger.error(
            `Request failed - Method: ${method}, Path: ${path}, Status: ${status}, Duration: ${duration.toFixed(
              2
            )} seconds`
          );

          // Record the metrics for failed requests
          this.metricsService.recordApiMetrics(method, path, status, duration);
        },
      })
    );
  }
}
