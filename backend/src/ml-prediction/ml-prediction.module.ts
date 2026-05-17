import { Module } from '@nestjs/common';
import { MLPredictionService } from './services/ml-prediction.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
  ],
  providers: [MLPredictionService],
  exports: [MLPredictionService],
})
export class MLPredictionModule {}
