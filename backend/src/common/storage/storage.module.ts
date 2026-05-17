import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { ImageProcessorService } from './image-processor.service';
import { StorageController } from './storage.controller';
import { LoggerModule } from '../logging/logger.module';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [StorageService, ImageProcessorService],
  controllers: [StorageController],
  exports: [StorageService, ImageProcessorService],
})
export class StorageModule {}
