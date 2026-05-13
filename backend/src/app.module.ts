import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logging/logger.module';
import { EmailModule } from './common/email/email.module';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
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
    LoggerModule, // Global logging module
    EmailModule, // Global email module
    PrismaModule,
    AuthModule,
    BookingsModule,
    ElderProfileModule,
    SmartHomeModule,
    ApiGatewayModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
