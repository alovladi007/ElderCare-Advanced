import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';
import { EmailModule } from '../common/email/email.module';

// Services
import { MedicationService } from './services/medication.service';
import { CarePlanService } from './services/care-plan.service';
import { HealthMonitoringService } from './services/health-monitoring.service';
import { AppointmentService } from './services/appointment.service';

// Controllers
import { MedicationController } from './controllers/medication.controller';
import { CarePlanController } from './controllers/care-plan.controller';
import { HealthMonitoringController } from './controllers/health-monitoring.controller';
import { AppointmentController } from './controllers/appointment.controller';

@Module({
  imports: [PrismaModule, LoggerModule, EmailModule],
  providers: [
    MedicationService,
    CarePlanService,
    HealthMonitoringService,
    AppointmentService,
  ],
  controllers: [
    MedicationController,
    CarePlanController,
    HealthMonitoringController,
    AppointmentController,
  ],
  exports: [
    MedicationService,
    CarePlanService,
    HealthMonitoringService,
    AppointmentService,
  ],
})
export class CareManagementModule {}
