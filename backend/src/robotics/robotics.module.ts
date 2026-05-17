import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';
import { RoboticsService } from './services/robotics.service';

@Module({
  imports: [ConfigModule, PrismaModule, LoggerModule],
  providers: [RoboticsService],
  exports: [RoboticsService],
})
export class RoboticsModule {}
