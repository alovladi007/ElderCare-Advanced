import { Module } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { VitalsController } from './vitals.controller';
import { AlertEvaluationService } from './services/alert-evaluation.service';

@Module({
  controllers: [VitalsController],
  providers: [VitalsService, AlertEvaluationService],
  exports: [VitalsService, AlertEvaluationService],
})
export class VitalsModule {}
