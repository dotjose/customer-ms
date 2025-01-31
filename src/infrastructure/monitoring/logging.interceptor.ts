import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { PrometheusService } from "./prometheus.service";
import * as Sentry from "@sentry/node";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000;
          const status = context.switchToHttp().getResponse().statusCode;

          // Record Prometheus metrics
          this.prometheusService.recordHttpRequest(
            method,
            path,
            status,
            duration
          );
          this.logger.log(`${method} ${path} ${status} ${duration}s`);
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          const status = error.status || 500;

          // Record Prometheus metrics for error
          this.prometheusService.recordHttpRequest(
            method,
            path,
            status,
            duration
          );

          // Log error
          this.logger.error(
            `${method} ${path} ${status} ${duration}s - ${error.message}`
          );

          // Capture error in Sentry with additional context
          Sentry.captureException(error, {
            tags: {
              method: request.method,
              path: request.url,
            },
            extra: {
              errorMessage: error.message,
              requestHeaders: request.headers,
            },
          });
        },
      })
    );
  }
}
