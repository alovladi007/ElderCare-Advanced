import { Module } from '@nestjs/common';
import { MobileApiController } from './controllers/mobile-api.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
  ],
  controllers: [MobileApiController],
})
export class MobileApiModule {}
