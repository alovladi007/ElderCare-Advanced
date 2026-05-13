import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryService } from './sentry.service';
import { LoggerModule } from '../logging/logger.module';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [SentryService],
  exports: [SentryService],
})
export class SentryModule {}
