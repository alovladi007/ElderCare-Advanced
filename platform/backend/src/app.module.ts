import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EldersModule } from './elders/elders.module';
import { CarePlansModule } from './care-plans/care-plans.module';
import { MedicationsModule } from './medications/medications.module';
import { VitalsModule } from './vitals/vitals.module';
import { AlertsModule } from './alerts/alerts.module';
import { MemoryCareModule } from './memory-care/memory-care.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SmartHomeModule } from './smart-home/smart-home.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduling for task generation
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60,
      limit: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    }]),

    // Core modules
    PrismaModule,
    AuthModule,
    UsersModule,
    EldersModule,
    CarePlansModule,
    MedicationsModule,
    VitalsModule,
    AlertsModule,
    MemoryCareModule,
    AssessmentsModule,
    NutritionModule,
    NotificationsModule,
    SmartHomeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
