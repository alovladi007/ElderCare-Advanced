import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CreateVitalReadingDto } from './dto/create-vital-reading.dto';
import { CreateVitalAlertRuleDto } from './dto/create-vital-alert-rule.dto';
import { AlertEvaluationService } from './services/alert-evaluation.service';
import { subDays } from 'date-fns';

@Injectable()
export class VitalsService {
  constructor(
    private prisma: PrismaService,
    private alertEvaluation: AlertEvaluationService,
  ) {}

  // Devices
  async createDevice(dto: CreateDeviceDto) {
    return this.prisma.device.create({
      data: {
        elderId: dto.elderId,
        type: dto.type,
        manufacturer: dto.manufacturer,
        model: dto.model,
        identifier: dto.identifier,
        integrationProvider: dto.integrationProvider,
        active: dto.active !== false,
      },
      include: {
        elder: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async getDevicesByElder(elderId: string) {
    return this.prisma.device.findMany({
      where: { elderId },
      include: {
        _count: {
          select: {
            vitalReadings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDeviceSync(deviceId: string) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: { lastSyncAt: new Date() },
    });
  }

  // Vital Readings
  async createVitalReading(dto: CreateVitalReadingDto, userId: string) {
    const reading = await this.prisma.vitalReading.create({
      data: {
        elderId: dto.elderId,
        deviceId: dto.deviceId,
        vitalTypeId: dto.vitalTypeId,
        value: dto.value,
        valueSecondary: dto.valueSecondary,
        recordedAt: new Date(dto.recordedAt),
        source: dto.source,
        recordedByUserId: userId,
        notes: dto.notes,
      },
      include: {
        vitalType: true,
        elder: {
          include: {
            user: true,
          },
        },
        recordedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Update device sync time if from device
    if (dto.deviceId && dto.source === 'DEVICE_SYNC') {
      await this.updateDeviceSync(dto.deviceId);
    }

    // Evaluate alert rules
    await this.alertEvaluation.evaluateVitalReading(reading);

    return reading;
  }

  async getVitalReadings(
    elderId: string,
    vitalTypeCode?: string,
    days: number = 7,
  ) {
    const startDate = subDays(new Date(), days);

    const where: any = {
      elderId,
      recordedAt: {
        gte: startDate,
      },
    };

    if (vitalTypeCode) {
      const vitalType = await this.prisma.vitalType.findUnique({
        where: { code: vitalTypeCode },
      });

      if (vitalType) {
        where.vitalTypeId = vitalType.id;
      }
    }

    return this.prisma.vitalReading.findMany({
      where,
      include: {
        vitalType: true,
        device: true,
        recordedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async getLatestVitals(elderId: string) {
    // Get all vital types
    const vitalTypes = await this.prisma.vitalType.findMany();

    const latestReadings = [];

    for (const vitalType of vitalTypes) {
      const reading = await this.prisma.vitalReading.findFirst({
        where: {
          elderId,
          vitalTypeId: vitalType.id,
        },
        orderBy: {
          recordedAt: 'desc',
        },
        include: {
          vitalType: true,
          device: true,
        },
      });

      if (reading) {
        latestReadings.push(reading);
      }
    }

    return latestReadings;
  }

  // Vital Alert Rules
  async createAlertRule(dto: CreateVitalAlertRuleDto) {
    return this.prisma.vitalAlertRule.create({
      data: {
        elderId: dto.elderId,
        vitalTypeId: dto.vitalTypeId,
        minValue: dto.minValue,
        maxValue: dto.maxValue,
        consecutiveReadings: dto.consecutiveReadings || 1,
        timeWindowMinutes: dto.timeWindowMinutes,
        severity: dto.severity,
        notifyFamily: dto.notifyFamily !== false,
        notifyClinician: dto.notifyClinician || false,
        autoEscalateEmergency: dto.autoEscalateEmergency || false,
      },
      include: {
        vitalType: true,
      },
    });
  }

  async getAlertRulesByElder(elderId: string) {
    return this.prisma.vitalAlertRule.findMany({
      where: { elderId },
      include: {
        vitalType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAlertRule(id: string, data: Partial<CreateVitalAlertRuleDto>) {
    return this.prisma.vitalAlertRule.update({
      where: { id },
      data,
      include: {
        vitalType: true,
      },
    });
  }

  async deleteAlertRule(id: string) {
    return this.prisma.vitalAlertRule.delete({
      where: { id },
    });
  }

  // Vital Types
  async getVitalTypes() {
    return this.prisma.vitalType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Analytics
  async getVitalStats(elderId: string, vitalTypeCode: string, days: number = 30) {
    const vitalType = await this.prisma.vitalType.findUnique({
      where: { code: vitalTypeCode },
    });

    if (!vitalType) {
      throw new NotFoundException('Vital type not found');
    }

    const startDate = subDays(new Date(), days);

    const readings = await this.prisma.vitalReading.findMany({
      where: {
        elderId,
        vitalTypeId: vitalType.id,
        recordedAt: {
          gte: startDate,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    if (readings.length === 0) {
      return {
        vitalType,
        count: 0,
        average: null,
        min: null,
        max: null,
        trend: [],
      };
    }

    const values = readings.map((r) => r.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      vitalType,
      count: readings.length,
      average: Math.round(average * 10) / 10,
      min,
      max,
      trend: readings.map((r) => ({
        date: r.recordedAt,
        value: r.value,
        valueSecondary: r.valueSecondary,
      })),
    };
  }
}
