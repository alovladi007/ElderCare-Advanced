import { Module, Global } from '@nestjs/common';
import { ZeroTrustService } from './services/zero-trust.service';
import { E2EEncryptionService } from './services/e2e-encryption.service';
import { ZeroTrustGuard } from './guards/zero-trust.guard';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';

@Global() // Make security services available globally
@Module({
  imports: [
    PrismaModule,
    LoggerModule,
  ],
  providers: [
    ZeroTrustService,
    E2EEncryptionService,
    ZeroTrustGuard,
  ],
  exports: [
    ZeroTrustService,
    E2EEncryptionService,
    ZeroTrustGuard,
  ],
})
export class ZeroTrustSecurityModule {}
