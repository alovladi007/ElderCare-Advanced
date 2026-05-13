import { Module } from '@nestjs/common';
import { EldersService } from './elders.service';
import { EldersController } from './elders.controller';

@Module({
  controllers: [EldersController],
  providers: [EldersService],
  exports: [EldersService],
})
export class EldersModule {}
