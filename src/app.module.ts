import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { CqrsModule } from "@nestjs/cqrs";
import { JwtModule } from "@nestjs/jwt";
import {
  ThrottlerModule,
  ThrottlerModuleOptions,
  ThrottlerGuard,
} from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { TerminusModule } from "@nestjs/terminus";

// Interceptors
import { LoggingInterceptor } from "./infrastructure/monitoring/logging.interceptor";
import { MetricsInterceptor } from "./infrastructure/interceptors/metrics.interceptor";

// Filters
import { SentryExceptionFilter } from "infrastructure/filters/http-exception.filter";

// Controllers
import { AuthController } from "./presentation/controllers/auth.controller";
import { ConsultantController } from "./presentation/controllers/consultant.controller";
import { ReviewController } from "./presentation/controllers/review.controller";
import { HealthController } from "infrastructure/health/health.controller";

// Command Handlers
import { LoginHandler } from "./application/commands/auth/handlers/login.handler";
import { RegisterUserHandler } from "./application/commands/user/handlers/register-user.handler";
import { VerifyCodeHandler } from "./application/commands/auth/handlers/verify-code.handler";
import { ResendVerificationHandler } from "./application/commands/auth/handlers/resend-verification.handler";
import { CreateOrUpdateConsultantHandler } from "./application/commands/consultant/handlers/update-profile.handler";
import { ForgotPasswordHandler } from "application/commands/auth/handlers/forgot.handler";
import { ResetPasswordHandler } from "application/commands/auth/handlers/reset.handler";
import { AddConsultantReviewHandler } from "application/commands/review/handlers/create-review.handler";
import { UpdatePasswordHandler } from "application/commands/auth/handlers/update-password.handler";
import { UpdateUserHandler } from "application/commands/user/handlers/update-user.handler";

// Query Handlers
import { GetNearbyConsultantsHandler } from "./application/queries/consultant/handlers/get-nearby-consultants.handler";
import { GetPaginatedReviewsHandler } from "./application/queries/reviews/handlers/get-paginated-reviews.handler";
import { SearchConsultantsHandler } from "application/queries/consultant/handlers/search-consultants.handler";
import { GetConsultantDetailHandler } from "application/queries/consultant/handlers/get-consultant-detail.handler";
import { GetProfessionsHandler } from "application/queries/consultant/handlers/get-professions.handler";

// Event Handlers
import { UserRegisteredHandler } from "./application/events/user/handlers/user-registered.handler";
import { VerificationCodeGeneratedHandler } from "./application/events/user/handlers/verification-code-generated.handler";
import { ConsultantProfileUpdatedHandler } from "./application/events/consultant/handlers/consultant-profile-updated.handler";
import { ConsultantReviewedHandler } from "./application/events/consultant/handlers/consultant-reviewed.handler";
import { PasswordResetRequestedHandler } from "application/events/user/handlers/password-reset-requested.handler";
import { PasswordResetCompletedHandler } from "application/events/user/handlers/password-reset-complete.handler";

// Services
import { HashService } from "./infrastructure/services/hash.service";
import { JwtService } from "./infrastructure/services/jwt.service";
import { RedisService } from "./infrastructure/services/redis.service";
import { ElasticsearchService } from "./infrastructure/services/elasticsearch.service";
import { OpenAIService } from "./infrastructure/services/openai.service";
import { CloudWatchService } from "./infrastructure/services/cloudwatch.service";
import { MetricsService } from "./infrastructure/monitoring/metrics.service";
import { PrometheusService } from "./infrastructure/monitoring/prometheus.service";
import { ConsultantSearchService } from "application/services/consultant-search.service";
import { GetUserHandler } from "application/queries/user/handlers/get-user.handler";
import { VerificationTokenService } from "infrastructure/services/verification-token.service";
import { AWSConfigService } from "infrastructure/config/aws.config";
import { NotificationTemplateService } from "infrastructure/services/notification-template.service";
import { PrometheusController } from "infrastructure/monitoring/prometheus.controller";
import { DatabaseService } from "infrastructure/services/database.service";
import { RedisHealthIndicator } from "infrastructure/health/redis.health";
import { ElasticsearchHealthIndicator } from "infrastructure/health/elasticsearch.health";
import { OpenAIHealthIndicator } from "infrastructure/health/openai.health";
import { SeederService } from "infrastructure/seeder/seeder.service";

// Repositories
import { MongoUserRepository } from "./infrastructure/repositories/mongodb/user.repository";
import { MongoConsultantRepository } from "./infrastructure/repositories/mongodb/consultant.repository";
import { MongoProfessionRepository } from "infrastructure/repositories/mongodb/profession.repository";

// Schemas
import {
  UserDocument,
  UserSchema,
} from "./infrastructure/persistence/mongodb/schemas/user.schema";
import {
  ConsultantDocument,
  ConsultantSchema,
} from "./infrastructure/persistence/mongodb/schemas/consultant.schema";
import {
  ProfessionDocument,
  ProfessionSchema,
} from "./infrastructure/persistence/mongodb/schemas/profession.schema";

const commandHandlers = [
  LoginHandler,
  RegisterUserHandler,
  VerifyCodeHandler,
  ResendVerificationHandler,
  CreateOrUpdateConsultantHandler,
  ForgotPasswordHandler,
  ResetPasswordHandler,
  AddConsultantReviewHandler,
  UpdatePasswordHandler,
  UpdateUserHandler,
];

const queryHandlers = [
  GetNearbyConsultantsHandler,
  GetPaginatedReviewsHandler,
  SearchConsultantsHandler,
  GetUserHandler,
  GetConsultantDetailHandler,
  GetProfessionsHandler,
];

const eventHandlers = [
  UserRegisteredHandler,
  VerificationCodeGeneratedHandler,
  ConsultantProfileUpdatedHandler,
  ConsultantReviewedHandler,
  PasswordResetRequestedHandler,
  PasswordResetCompletedHandler,
];

const services = [
  HashService,
  JwtService,
  RedisService,
  ElasticsearchService,
  OpenAIService,
  CloudWatchService,
  MetricsService,
  PrometheusService,
  ConsultantSearchService,
  VerificationTokenService,
  AWSConfigService,
  NotificationTemplateService,
  DatabaseService,
  OpenAIHealthIndicator,
  RedisHealthIndicator,
  ElasticsearchHealthIndicator,
  SeederService,
];

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),

    // Schemas
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
      { name: ConsultantDocument.name, schema: ConsultantSchema },
      { name: ProfessionDocument.name, schema: ProfessionSchema },
    ]),

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1d" },
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () =>
        ({
          ttl: 60,
          limit: 100,
          throttlers: [{ type: "RateLimiter", limit: 100, ttl: 60 }],
        }) as unknown as ThrottlerModuleOptions,
      inject: [ConfigService],
    }),

    //Cache Manager
    CacheModule.register({ ttl: 5, max: 100 }),

    CqrsModule,
    TerminusModule,
  ],
  controllers: [
    AuthController,
    ConsultantController,
    ReviewController,
    PrometheusController,
    HealthController,
  ],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },

    // Repositories
    {
      provide: "UserRepository",
      useClass: MongoUserRepository,
    },
    {
      provide: "ConsultantRepository",
      useClass: MongoConsultantRepository,
    },
    {
      provide: "ProfessionRepository",
      useClass: MongoProfessionRepository,
    },

    // Handlers and Services
    ...services,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit() {
    // Sync indexes when the app starts
    await this.databaseService.syncIndexes();
  }
}
