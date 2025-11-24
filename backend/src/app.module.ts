import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
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
  ],
})
export class AppModule {}
