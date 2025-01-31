import { ConfigService } from "@nestjs/config";
import * as Sentry from "@sentry/node";

const configService = new ConfigService();

Sentry.init({
  dsn: configService.get<string>("SENTRY_DSN"),
  environment: configService.get<string>("NODE_ENV"),
  tracesSampleRate: 1.0,
});
