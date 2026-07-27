import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmergencyAlertService } from '../services/emergency-alert.service';
import { ContinuousMonitoringService } from '../services/continuous-monitoring.service';
import { OptionalIntPipe } from '../../common/pipes/optional-int.pipe';

@ApiTags('emergency-monitoring')
@Controller('care-management/emergency')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmergencyMonitoringController {
  constructor(
    private emergencyAlert: EmergencyAlertService,
    private continuousMonitoring: ContinuousMonitoringService,
    private prisma: PrismaService,
  ) {}

  // ============================================================================
  // EMERGENCY ALERTS
  // ============================================================================

  @Post('alert')
  @ApiOperation({ summary: 'Trigger emergency alert' })
  async triggerAlert(
    @Body()
    body: {
      elderId: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      type: 'MEDICAL' | 'FALL' | 'VITAL_ABNORMAL' | 'DEVICE_ALERT' | 'PANIC_BUTTON' | 'ENVIRONMENTAL';
      title: string;
      message: string;
      vitalData?: any;
      locationData?: any;
      metadata?: any;
    },
  ) {
    return this.emergencyAlert.triggerEmergencyAlert(body);
  }

  @Get('alert/history/:elderId')
  @ApiOperation({ summary: 'Get alert history for elder' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getAlertHistory(
    @Param('elderId') elderId: string,
    @Query('days', OptionalIntPipe) days?: number,
  ) {
    return this.emergencyAlert.getAlertHistory(elderId, days);
  }

  @Post('alert/:alertId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge alert' })
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body() body: { userId: string; notes?: string },
  ) {
    return this.emergencyAlert.acknowledgeAlert(alertId, body.userId, body.notes);
  }

  // ============================================================================
  // EMERGENCY REPORTS
  // ============================================================================

  @Get('report/:elderId')
  @ApiOperation({ summary: 'Get emergency reports for elder' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEmergencyReports(
    @Param('elderId') elderId: string,
    @Query('limit', OptionalIntPipe) limit?: number,
  ) {
    return this.emergencyAlert.getEmergencyReports(elderId, limit);
  }

  // ============================================================================
  // 24/7 MONITORING
  // ============================================================================

  @Get('monitoring/status/:elderId')
  @ApiOperation({ summary: 'Get monitoring status for elder' })
  async getMonitoringStatus(@Param('elderId') elderId: string) {
    return this.continuousMonitoring.getMonitoringStatus(elderId);
  }

  @Post('monitoring/start/:elderId')
  @ApiOperation({ summary: 'Start continuous monitoring for elder' })
  async startMonitoring(@Param('elderId') elderId: string) {
    await this.continuousMonitoring.startMonitoring(elderId);
    return { success: true, message: 'Monitoring started' };
  }

  @Post('monitoring/stop/:elderId')
  @ApiOperation({ summary: 'Stop continuous monitoring for elder' })
  async stopMonitoring(@Param('elderId') elderId: string) {
    await this.continuousMonitoring.stopMonitoring(elderId);
    return { success: true, message: 'Monitoring stopped' };
  }

  @Put('monitoring/config/:elderId')
  @ApiOperation({ summary: 'Update monitoring configuration' })
  async updateMonitoringConfig(
    @Param('elderId') elderId: string,
    @Body()
    config: {
      enabled?: boolean;
      vitalThresholds?: any;
      notifyFamily?: boolean;
      notifyHealthcare?: boolean;
      notifyEmergency?: boolean;
      quietHoursStart?: string;
      quietHoursEnd?: string;
      vitalCheckInterval?: number;
      inactivityTimeout?: number;
      autoEscalateCritical?: boolean;
      escalationDelay?: number;
    },
  ) {
    return this.continuousMonitoring.updateMonitoringConfig(elderId, config);
  }

  // ============================================================================
  // HEALTHCARE PROVIDERS
  // ============================================================================

  @Post('healthcare-provider')
  @ApiOperation({ summary: 'Add healthcare provider' })
  async addHealthcareProvider(
    @Body()
    body: {
      elderId: string;
      type: 'HOSPITAL' | 'CLINIC' | 'PRIMARY_CARE' | 'SPECIALIST' | 'URGENT_CARE' | 'EMERGENCY_ROOM';
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      priority?: number;
      notes?: string;
    },
  ) {
    return this.prisma.healthcareProvider.create({ data: body });
  }

  @Get('healthcare-provider/:elderId')
  @ApiOperation({ summary: 'Get healthcare providers for elder' })
  async getHealthcareProviders(@Param('elderId') elderId: string) {
    return this.prisma.healthcareProvider.findMany({
      where: { elderId, active: true },
      orderBy: { priority: 'asc' },
    });
  }

  @Put('healthcare-provider/:providerId')
  @ApiOperation({ summary: 'Update healthcare provider' })
  async updateHealthcareProvider(
    @Param('providerId') providerId: string,
    @Body() body: any,
  ) {
    return this.prisma.healthcareProvider.update({
      where: { id: providerId },
      data: body,
    });
  }

  // ============================================================================
  // EMERGENCY SERVICES
  // ============================================================================

  @Post('emergency-service')
  @ApiOperation({ summary: 'Add emergency service' })
  async addEmergencyService(
    @Body()
    body: {
      elderId: string;
      type: 'POLICE' | 'FIRE' | 'AMBULANCE' | 'EMERGENCY_DISPATCH';
      name: string;
      email?: string;
      phone: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      notes?: string;
    },
  ) {
    return this.prisma.emergencyService.create({ data: body });
  }

  @Get('emergency-service/:elderId')
  @ApiOperation({ summary: 'Get emergency services for elder' })
  async getEmergencyServices(@Param('elderId') elderId: string) {
    return this.prisma.emergencyService.findMany({
      where: { elderId, active: true },
    });
  }

  // ============================================================================
  // EMERGENCY CONTACTS
  // ============================================================================

  @Post('emergency-contact')
  @ApiOperation({ summary: 'Add emergency contact' })
  async addEmergencyContact(
    @Body()
    body: {
      elderId: string;
      name: string;
      relationship: string;
      phone: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      isPrimary?: boolean;
      notes?: string;
    },
  ) {
    // If setting as primary, unset other primary contacts
    if (body.isPrimary) {
      await this.prisma.emergencyContact.updateMany({
        where: { elderId: body.elderId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.emergencyContact.create({ data: body });
  }

  @Get('emergency-contact/:elderId')
  @ApiOperation({ summary: 'Get emergency contacts for elder' })
  async getEmergencyContacts(@Param('elderId') elderId: string) {
    return this.prisma.emergencyContact.findMany({
      where: { elderId, active: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  @Put('emergency-contact/:contactId')
  @ApiOperation({ summary: 'Update emergency contact' })
  async updateEmergencyContact(
    @Param('contactId') contactId: string,
    @Body() body: any,
  ) {
    // If setting as primary, unset other primary contacts
    if (body.isPrimary) {
      const contact = await this.prisma.emergencyContact.findUnique({
        where: { id: contactId },
      });
      if (contact) {
        await this.prisma.emergencyContact.updateMany({
          where: { elderId: contact.elderId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
    }

    return this.prisma.emergencyContact.update({
      where: { id: contactId },
      data: body,
    });
  }

  // ============================================================================
  // MEDICAL HISTORY
  // ============================================================================

  @Post('medical-history')
  @ApiOperation({ summary: 'Create or update medical history' })
  async upsertMedicalHistory(
    @Body()
    body: {
      elderId: string;
      conditions?: string[];
      allergies?: string[];
      surgeries?: string[];
      chronicDiseases?: string[];
      familyHistory?: any;
      notes?: string;
    },
  ) {
    return this.prisma.medicalHistory.upsert({
      where: { elderId: body.elderId },
      create: {
        elderId: body.elderId,
        conditions: body.conditions || [],
        allergies: body.allergies || [],
        surgeries: body.surgeries || [],
        chronicDiseases: body.chronicDiseases || [],
        familyHistory: body.familyHistory,
        notes: body.notes,
      },
      update: {
        conditions: body.conditions,
        allergies: body.allergies,
        surgeries: body.surgeries,
        chronicDiseases: body.chronicDiseases,
        familyHistory: body.familyHistory,
        notes: body.notes,
      },
    });
  }

  @Get('medical-history/:elderId')
  @ApiOperation({ summary: 'Get medical history for elder' })
  async getMedicalHistory(@Param('elderId') elderId: string) {
    return this.prisma.medicalHistory.findUnique({
      where: { elderId },
    });
  }

  // ============================================================================
  // EMERGENCY DISPATCH
  // ============================================================================

  @Get('dispatch/:elderId')
  @ApiOperation({ summary: 'Get emergency dispatches for elder' })
  async getEmergencyDispatches(@Param('elderId') elderId: string) {
    return this.prisma.emergencyDispatch.findMany({
      where: { elderId },
      include: {
        report: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }

  @Put('dispatch/:dispatchId/status')
  @ApiOperation({ summary: 'Update dispatch status' })
  async updateDispatchStatus(
    @Param('dispatchId') dispatchId: string,
    @Body()
    body: {
      status: 'PENDING' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'COMPLETED' | 'CANCELLED';
      notes?: string;
    },
  ) {
    const updateData: any = { status: body.status };

    if (body.status === 'DISPATCHED') updateData.dispatchedAt = new Date();
    if (body.status === 'ON_SCENE') updateData.arrivedAt = new Date();
    if (body.status === 'COMPLETED' || body.status === 'CANCELLED') updateData.completedAt = new Date();
    if (body.notes) updateData.notes = body.notes;

    return this.prisma.emergencyDispatch.update({
      where: { id: dispatchId },
      data: updateData,
    });
  }
}
