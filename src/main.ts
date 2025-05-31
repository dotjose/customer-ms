import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as helmet from "helmet";
import compression from "compression";
import { ConfigService } from "@nestjs/config";
import { PrometheusService } from "infrastructure/monitoring/prometheus.service";
import { LoggingInterceptor } from "./infrastructure/monitoring/logging.interceptor";
import { PrometheusController } from "./infrastructure/monitoring/prometheus.controller";
import { TransformInterceptor } from "infrastructure/interceptors/transform.interceptor";
import { SeederService } from "infrastructure/seeder/seeder.service";
import { AppModule } from "./app.module";

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const logger = new Logger("Bootstrap");

    // Global Middleware
    setupMiddleware(app, configService);

    // Validation Pipe
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true })
    );

    // Global API interceptors
    app.useGlobalInterceptors(new TransformInterceptor());

    // Swagger API Documentation
    setupSwagger(app);

    // Prometheus Metrics
    setupPrometheus(app);

    // Seed data
    const seeder = app.get(SeederService);
    await seeder.seed();

    // Start the application
    const port = configService.get<number>("PORT") || 3000;
    const host = configService.get<string>("HOST") || "0.0.0.0";
    await app.listen(port, host);
    logger.log(`Application is running on: http://${host}:${port}`);
  } catch (error) {
    console.error("Error during app initialization", error);
    process.exit(1); // Exit process with failure code
  }
}

function setupMiddleware(app, configService: ConfigService) {
  // app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: configService.get<string>("ALLOWED_ORIGINS")?.split(",") || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  });

  const prometheusService = new PrometheusService();
  app.useGlobalInterceptors(new LoggingInterceptor(prometheusService));
}

function setupSwagger(app) {
  const config = new DocumentBuilder()
    .setTitle("User Management Service")
    .setDescription("API documentation for User Management Microservice")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);
}

function setupPrometheus(app) {
  const prometheusController = app.get(PrometheusController);
  app.use(
    "/metrics",
    prometheusController.getMetrics.bind(prometheusController)
  );
}

bootstrap();
