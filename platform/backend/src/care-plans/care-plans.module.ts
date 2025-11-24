import { Module } from '@nestjs/common';
import { CarePlansService } from './care-plans.service';
import { CarePlansController } from './care-plans.controller';
import { TaskSchedulerService } from './services/task-scheduler.service';

@Module({
  controllers: [CarePlansController],
  providers: [CarePlansService, TaskSchedulerService],
  exports: [CarePlansService, TaskSchedulerService],
})
export class CarePlansModule {}
