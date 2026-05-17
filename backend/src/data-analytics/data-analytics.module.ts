import { Module } from '@nestjs/common';
import { DataAnalyticsService } from './services/data-analytics.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
  ],
  providers: [DataAnalyticsService],
  exports: [DataAnalyticsService],
})
export class DataAnalyticsModule {}
