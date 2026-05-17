import { Module } from '@nestjs/common';
import { TelemedicineService } from './services/telemedicine.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
  ],
  providers: [TelemedicineService],
  exports: [TelemedicineService],
})
export class TelemedicineModule {}
