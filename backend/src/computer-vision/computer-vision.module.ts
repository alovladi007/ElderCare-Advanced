import { Module } from '@nestjs/common';
import { ComputerVisionService } from './services/computer-vision.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
  ],
  providers: [ComputerVisionService],
  exports: [ComputerVisionService],
})
export class ComputerVisionModule {}
