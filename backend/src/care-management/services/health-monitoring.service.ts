import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { VitalType } from '@prisma/client';

interface VitalRange {
  min: number;
  max: number;
  critical_low?: number;
  critical_high?: number;
}

@Injectable()
export class HealthMonitoringService {
  private readonly normalRanges: Record<VitalType, VitalRange> = {
    BLOOD_PRESSURE: { min: 90, max: 140, critical_low: 80, critical_high: 180 }, // Systolic
    HEART_RATE: { min: 60, max: 100, critical_low: 50, critical_high: 120 },
    TEMPERATURE: { min: 97.0, max: 99.0, critical_low: 95.0, critical_high: 103.0 }, // Fahrenheit
    GLUCOSE: { min: 70, max: 140, critical_low: 60, critical_high: 200 }, // mg/dL fasting
    SPO2: { min: 95, max: 100, critical_low: 90, critical_high: 100 },
    WEIGHT: { min: 0, max: 500 }, // lbs - no standard range
    RESPIRATORY_RATE: { min: 12, max: 20, critical_low: 10, critical_high: 30 },
  };

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * Record vital reading
   */
  async recordVital(data: {
    elderId: string;
    vitalType: VitalType;
    value: number;
    unit: string;
    systolic?: number;
    diastolic?: number;
    deviceId?: string;
    notes?: string;
  }) {
    const vital = await this.prisma.vitalReading.create({
      data: {
        ...data,
        recordedAt: new Date(),
      },
    });

    // Check if vital is abnormal and create alert if needed
    await this.checkVitalThresholds(vital);

    this.logger.logEvent('Vital recorded', 'VitalReading', vital.id, {
      elderId: data.elderId,
      vitalType: data.vitalType,
      value: data.value,
    });

    return vital;
  }

  /**
   * Get vitals by elder
   */
  async getVitalsByElder(elderId: string, vitalType?: VitalType, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.prisma.vitalReading.findMany({
      where: {
        elderId,
        ...(vitalType ? { vitalType } : {}),
        recordedAt: {
          gte: startDate,
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });
  }

  /**
   * Get latest vitals for elder (one of each type)
   */
  async getLatestVitals(elderId: string) {
    const vitalTypes = Object.keys(this.normalRanges) as VitalType[];
    const latestVitals: Record<string, any> = {};

    for (const type of vitalTypes) {
      const vital = await this.prisma.vitalReading.findFirst({
        where: {
          elderId,
          vitalType: type,
        },
        orderBy: {
          recordedAt: 'desc',
        },
      });

      if (vital) {
        latestVitals[type] = vital;
      }
    }

    return latestVitals;
  }

  /**
   * Get vital statistics
   */
  async getVitalStats(elderId: string, vitalType: VitalType, days = 30) {
    const vitals = await this.getVitalsByElder(elderId, vitalType, days);

    if (vitals.length === 0) {
      return null;
    }

    const values = vitals.map(v => v.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate standard deviation
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Check for trend (increasing/decreasing)
    const recent = vitals.slice(0, Math.min(10, vitals.length));
    const older = vitals.slice(-Math.min(10, vitals.length));
    const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v.value, 0) / older.length;
    const trend = recentAvg > olderAvg ? 'increasing' : recentAvg < olderAvg ? 'decreasing' : 'stable';

    const normalRange = this.normalRanges[vitalType];
    const inRange = vitals.filter(v => v.value >= normalRange.min && v.value <= normalRange.max).length;
    const abnormalCount = vitals.length - inRange;

    return {
      vitalType,
      period: { days, totalReadings: vitals.length },
      statistics: {
        average: Math.round(avg * 100) / 100,
        min,
        max,
        stdDev: Math.round(stdDev * 100) / 100,
        trend,
      },
      normalRange: {
        min: normalRange.min,
        max: normalRange.max,
      },
      adherence: {
        inRange,
        abnormal: abnormalCount,
        percentage: Math.round((inRange / vitals.length) * 100),
      },
      latestReading: vitals[0],
    };
  }

  /**
   * Check vital thresholds and create alerts if abnormal
   */
  private async checkVitalThresholds(vital: any) {
    const range = this.normalRanges[vital.vitalType as VitalType];
    let isAbnormal = false;
    let severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
    let message = '';

    // Check for blood pressure (uses systolic value)
    if (vital.vitalType === 'BLOOD_PRESSURE' && vital.systolic) {
      if (vital.systolic <= range.critical_low! || vital.systolic >= range.critical_high!) {
        isAbnormal = true;
        severity = 'CRITICAL';
        message = `Critical blood pressure: ${vital.systolic}/${vital.diastolic} mmHg`;
      } else if (vital.systolic < range.min || vital.systolic > range.max) {
        isAbnormal = true;
        severity = 'WARNING';
        message = `Abnormal blood pressure: ${vital.systolic}/${vital.diastolic} mmHg`;
      }
    } else {
      // Check other vital types
      if (range.critical_low && vital.value <= range.critical_low) {
        isAbnormal = true;
        severity = 'CRITICAL';
        message = `Critical low ${vital.vitalType.toLowerCase().replace('_', ' ')}: ${vital.value} ${vital.unit}`;
      } else if (range.critical_high && vital.value >= range.critical_high) {
        isAbnormal = true;
        severity = 'CRITICAL';
        message = `Critical high ${vital.vitalType.toLowerCase().replace('_', ' ')}: ${vital.value} ${vital.unit}`;
      } else if (vital.value < range.min || vital.value > range.max) {
        isAbnormal = true;
        severity = 'WARNING';
        message = `Abnormal ${vital.vitalType.toLowerCase().replace('_', ' ')}: ${vital.value} ${vital.unit}`;
      }
    }

    if (isAbnormal) {
      await this.prisma.alert.create({
        data: {
          elderId: vital.elderId,
          type: 'VITAL_ABNORMAL',
          severity,
          status: 'ACTIVE',
          title: `Abnormal ${vital.vitalType.replace('_', ' ')}`,
          message,
          metadata: {
            vitalId: vital.id,
            vitalType: vital.vitalType,
            value: vital.value,
            unit: vital.unit,
            normalRange: range,
          },
          triggeredAt: new Date(),
        },
      });

      this.logger.logSecurity('Abnormal vital detected', severity === 'CRITICAL' ? 'critical' : 'medium', {
        elderId: vital.elderId,
        vitalType: vital.vitalType,
        value: vital.value,
        severity,
      });
    }
  }

  /**
   * Get health summary for elder
   */
  async getHealthSummary(elderId: string, days = 30) {
    const vitals = await this.getVitalsByElder(elderId, undefined, days);
    const latestVitals = await this.getLatestVitals(elderId);

    // Count abnormal vitals
    let abnormalCount = 0;
    let criticalCount = 0;

    for (const vital of vitals) {
      const range = this.normalRanges[vital.vitalType as VitalType];
      const value = vital.vitalType === 'BLOOD_PRESSURE' ? vital.systolic || vital.value : vital.value;

      if (range.critical_low && value <= range.critical_low) criticalCount++;
      else if (range.critical_high && value >= range.critical_high) criticalCount++;
      else if (value < range.min || value > range.max) abnormalCount++;
    }

    // Get recent alerts
    const recentAlerts = await this.prisma.alert.findMany({
      where: {
        elderId,
        type: 'VITAL_ABNORMAL',
        triggeredAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        triggeredAt: 'desc',
      },
      take: 10,
    });

    return {
      period: { days, totalReadings: vitals.length },
      latestVitals,
      statistics: {
        abnormalReadings: abnormalCount,
        criticalReadings: criticalCount,
        normalReadings: vitals.length - abnormalCount - criticalCount,
      },
      recentAlerts,
      healthStatus: criticalCount > 0 ? 'critical' : abnormalCount > vitals.length * 0.2 ? 'warning' : 'normal',
    };
  }

  /**
   * Delete vital reading
   */
  async deleteVital(vitalId: string) {
    return this.prisma.vitalReading.delete({
      where: { id: vitalId },
    });
  }
}
