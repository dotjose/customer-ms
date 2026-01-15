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
import { ScheduleModule } from "@nestjs/schedule";

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
import { NewsletterController } from "./presentation/controllers/newsletter.controller";
import { ViewTrackingController } from "./presentation/controllers/view-tracking.controller";
import { AdminUserController } from "./presentation/controllers/admin-user.controller";
import { AdminFeedbackController } from "./presentation/controllers/admin-feedback.controller";

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
import { ContactUsHandler } from "application/commands/user/handlers/contact-us.handler";
import { SubscribeNewsletterHandler, UnsubscribeNewsletterHandler, UpdateNewsletterPreferencesHandler } from "./application/commands/newsletter/handlers/newsletter.handlers";
import { IncrementViewHandler } from "./application/commands/view-tracking/handlers/increment-view.handler";
import { CreateAdminHandler } from "./application/commands/admin/handlers/create-admin.handler";
import { UpdateAdminHandler } from "./application/commands/admin/handlers/update-admin.handler";
import { DeleteAdminHandler } from "./application/commands/admin/handlers/delete-admin.handler";
import { BlockUserHandler } from "./application/commands/admin/handlers/block-user.handler";
import { SuspendUserHandler } from "./application/commands/admin/handlers/suspend-user.handler";
import { BanUserHandler } from "./application/commands/admin/handlers/ban-user.handler";
import { ActivateUserHandler } from "./application/commands/admin/handlers/activate-user.handler";

// Query Handlers
import { GetNearbyConsultantsHandler } from "./application/queries/consultant/handlers/get-nearby-consultants.handler";
import { GetPaginatedReviewsHandler } from "./application/queries/reviews/handlers/get-paginated-reviews.handler";
import { SearchConsultantsHandler } from "application/queries/consultant/handlers/search-consultants.handler";
import { GetConsultantDetailHandler } from "application/queries/consultant/handlers/get-consultant-detail.handler";
import { GetProfessionsHandler } from "application/queries/consultant/handlers/get-professions.handler";
import { GetSubscriberByTokenHandler, GetSubscriberPreferencesHandler } from "./application/queries/newsletter/handlers/newsletter.handlers";
import { GetViewCountHandler, GetBulkViewCountsHandler } from "./application/queries/view-tracking/handlers/get-view-count.handler";
import { GetTrendingHandler } from "./application/queries/view-tracking/handlers/get-trending.handler";
import { GetUsersHandler } from "./application/queries/admin/handlers/get-users.handler";
import { GetUserByIdHandler } from "./application/queries/admin/handlers/get-user-by-id.handler";
import { GetAdminsHandler } from "./application/queries/admin/handlers/get-admins.handler";
import { GetAdminByIdHandler } from "./application/queries/admin/handlers/get-admin-by-id.handler";
import { SearchUserFeedbackHandler } from "./application/queries/admin/handlers/search-user-feedback.handler";
import { GetPlatformStatsHandler } from "./application/queries/admin/handlers/get-platform-stats.handler";

// Event Handlers
import { UserRegisteredHandler } from "./application/events/user/handlers/user-registered.handler";
import { VerificationCodeGeneratedHandler } from "./application/events/user/handlers/verification-code-generated.handler";
import { ConsultantProfileUpdatedHandler } from "./application/events/consultant/handlers/consultant-profile-updated.handler";
import { ConsultantReviewedHandler } from "./application/events/consultant/handlers/consultant-reviewed.handler";
import { PasswordResetRequestedHandler } from "application/events/user/handlers/password-reset-requested.handler";
import { PasswordResetCompletedHandler } from "application/events/user/handlers/password-reset-complete.handler";
import { NewsletterSubscribedHandler } from "application/events/user/handlers/newsletter-subscribed.handler";

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
import { NewsletterTokenService } from "infrastructure/services/newsletter-token.service";
import { NewsletterCronService } from "infrastructure/services/newsletter-cron.service";
import { PrometheusController } from "infrastructure/monitoring/prometheus.controller";
import { DatabaseService } from "infrastructure/services/database.service";
import { RedisHealthIndicator } from "infrastructure/health/redis.health";
import { ElasticsearchHealthIndicator } from "infrastructure/health/elasticsearch.health";
import { OpenAIHealthIndicator } from "infrastructure/health/openai.health";
import { SeederService } from "infrastructure/seeder/seeder.service";
import { ViewTrackingCacheService } from "./infrastructure/services/view-tracking-cache.service";
import { BotDetectionService } from "./infrastructure/services/bot-detection.service";
import { SuperAdminSeeder } from "./infrastructure/seeder/super-admin.seeder";
import { JwtAuthGuard } from "./infrastructure/guards/jwt-auth.guard";
import { RolesGuard } from "./infrastructure/guards/roles.guard";
import { UserSecurityService } from "domain/user/services/user-security.service";

// Repositories
import { MongoUserRepository } from "./infrastructure/repositories/mongodb/user.repository";
import { MongoConsultantRepository } from "./infrastructure/repositories/mongodb/consultant.repository";
import { MongoProfessionRepository } from "infrastructure/repositories/mongodb/profession.repository";
import { MongoNewsletterRepository } from "./infrastructure/repositories/mongodb/newsletter.repository";
import { MongoViewTrackingRepository } from "./infrastructure/repositories/mongodb/view-tracking.repository";
import { MongoAdminRepository } from "./infrastructure/repositories/mongodb/admin.repository";

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
import {
  NewsletterSubscriberDocument,
  NewsletterSubscriberSchema,
} from "./infrastructure/persistence/mongodb/schemas/newsletter.schema";
import {
  ViewTrackingDocument,
  ViewTrackingSchema,
} from "./infrastructure/persistence/mongodb/schemas/view-tracking.schema";

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
  ContactUsHandler,
  SubscribeNewsletterHandler,
  UnsubscribeNewsletterHandler,
  UpdateNewsletterPreferencesHandler,
  IncrementViewHandler,
  CreateAdminHandler,
  UpdateAdminHandler,
  DeleteAdminHandler,
  BlockUserHandler,
  SuspendUserHandler,
  BanUserHandler,
  ActivateUserHandler,
];

const queryHandlers = [
  GetNearbyConsultantsHandler,
  GetPaginatedReviewsHandler,
  SearchConsultantsHandler,
  GetUserHandler,
  GetConsultantDetailHandler,
  GetProfessionsHandler,
  GetSubscriberByTokenHandler,
  GetSubscriberPreferencesHandler,
  GetViewCountHandler,
  GetBulkViewCountsHandler,
  GetTrendingHandler,
  GetUsersHandler,
  GetUserByIdHandler,
  GetAdminsHandler,
  GetAdminByIdHandler,
  SearchUserFeedbackHandler,
  GetPlatformStatsHandler,
];

const eventHandlers = [
  UserRegisteredHandler,
  VerificationCodeGeneratedHandler,
  ConsultantProfileUpdatedHandler,
  ConsultantReviewedHandler,
  PasswordResetRequestedHandler,
  PasswordResetCompletedHandler,
  NewsletterSubscribedHandler,
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
  NewsletterTokenService,
  NewsletterCronService,
  ViewTrackingCacheService,
  BotDetectionService,
  SuperAdminSeeder,
  UserSecurityService,
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
      { name: NewsletterSubscriberDocument.name, schema: NewsletterSubscriberSchema },
      { name: ViewTrackingDocument.name, schema: ViewTrackingSchema },
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
    CacheModule.register({
      isGlobal: true,
      store: "memory",
      ttl: 300, // default
      max: 100,
    }),

    CqrsModule,
    TerminusModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AuthController,
    ConsultantController,
    ReviewController,
    PrometheusController,
    HealthController,
    NewsletterController,
    ViewTrackingController,
    AdminUserController,
    AdminFeedbackController,
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
    {
      provide: "NewsletterRepository",
      useClass: MongoNewsletterRepository,
    },
    {
      provide: "ViewTrackingRepository",
      useClass: MongoViewTrackingRepository,
    },
    {
      provide: "AdminRepository",
      useClass: MongoAdminRepository,
    },
    {
      provide: "IPasswordHasher",
      useClass: HashService,
    },

    // Handlers and Services
    SuperAdminSeeder,
    JwtAuthGuard,
    RolesGuard,
    ...services,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly superAdminSeeder: SuperAdminSeeder
  ) {}

  async onModuleInit() {
    // Sync indexes when the app starts
    await this.databaseService.syncIndexes();
    // Seed Super Admin if needed
    await this.superAdminSeeder.seed();
  }
}
