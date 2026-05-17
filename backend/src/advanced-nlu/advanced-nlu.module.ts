import { Module } from '@nestjs/common';
import { AdvancedNLUService } from './services/advanced-nlu.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
  ],
  providers: [AdvancedNLUService],
  exports: [AdvancedNLUService],
})
export class AdvancedNLUModule {}
