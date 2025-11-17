import { Module } from '@nestjs/common';
import { MemoryCareService } from './memory-care.service';
import { MemoryCareController } from './memory-care.controller';

@Module({
  controllers: [MemoryCareController],
  providers: [MemoryCareService],
  exports: [MemoryCareService],
})
export class MemoryCareModule {}
