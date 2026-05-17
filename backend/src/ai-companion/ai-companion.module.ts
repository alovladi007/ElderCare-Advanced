import { Module, forwardRef } from '@nestjs/common';
import { AICompanionService } from './services/ai-companion.service';
import { AICompanionController } from './controllers/ai-companion.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';
import { CareManagementModule } from '../care-management/care-management.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    forwardRef(() => CareManagementModule),
  ],
  controllers: [AICompanionController],
  providers: [AICompanionService],
  exports: [AICompanionService],
})
export class AICompanionModule {}
