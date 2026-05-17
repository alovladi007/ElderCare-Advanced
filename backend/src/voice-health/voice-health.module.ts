import { Module } from '@nestjs/common';
import { VoiceHealthService } from './services/voice-health.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
  ],
  providers: [VoiceHealthService],
  exports: [VoiceHealthService],
})
export class VoiceHealthModule {}
