import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logging/logger.module';
import { EmailModule } from './common/email/email.module';
import { StorageModule } from './common/storage/storage.module';
import { SentryModule } from './common/sentry/sentry.module';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
import { SentryInterceptor } from './common/sentry/sentry.interceptor';
import { AuthModule } from './auth/auth.module';
import { SmartHomeModule } from './smart-home/smart-home.module';
import { BookingsModule } from './bookings/bookings.module';
import { ElderProfileModule } from './elder-profile/elder-profile.module';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting - 100 requests per 15 minutes globally
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per minute
    }, {
      name: 'auth',
      ttl: 900000, // 15 minutes
      limit: 10, // 10 attempts per 15 minutes (for auth endpoints)
    }]),
    LoggerModule, // Global logging module
    EmailModule, // Global email module
    StorageModule, // Global storage module
    SentryModule, // Global error tracking module
    PrismaModule,
    AuthModule,
    BookingsModule,
    ElderProfileModule,
    SmartHomeModule,
    ApiGatewayModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global role-based access control
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global HTTP request logging
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global error tracking with Sentry
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule {}
