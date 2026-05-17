import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';
import { EdgeComputingService } from './services/edge-computing.service';

@Module({
  imports: [ConfigModule, PrismaModule, LoggerModule],
  providers: [EdgeComputingService],
  exports: [EdgeComputingService],
})
export class EdgeComputingModule {}
