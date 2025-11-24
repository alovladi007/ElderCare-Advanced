import { Module } from '@nestjs/common';
import { ElderProfileService } from './elder-profile.service';
import { ElderProfileController } from './elder-profile.controller';

@Module({
  controllers: [ElderProfileController],
  providers: [ElderProfileService],
  exports: [ElderProfileService],
})
export class ElderProfileModule {}
