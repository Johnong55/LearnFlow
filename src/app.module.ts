import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { configurations } from './config';
import { environmentSchema } from './config/env.validation';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RedisModule } from './infrastructure/cache/redis.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { GoalsModule } from './modules/goals/goals.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { RoutinesModule } from './modules/routines/routines.module';
import { SkillsModule } from './modules/skills/skills.module';
import { RoadmapsModule } from './modules/roadmaps/roadmaps.module';
import { HealthModule } from './health/health.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ProgressModule } from './modules/progress/progress.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configurations,
      validationSchema: environmentSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL_MS', 60000),
          limit: config.get<number>('RATE_LIMIT_MAX', 100),
        },
      ],
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    LoggingModule,
    AuthModule,
    UsersModule,
    SkillsModule,
    OnboardingModule,
    RoutinesModule,
    AvailabilityModule,
    GoalsModule,
    RoadmapsModule,
    CalendarModule,
    SchedulingModule,
    SessionsModule,
    ProgressModule,
    NotificationsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
