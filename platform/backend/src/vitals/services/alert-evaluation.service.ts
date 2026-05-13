import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VitalReading, VitalAlertRule } from '@prisma/client';
import { subMinutes } from 'date-fns';

@Injectable()
export class AlertEvaluationService {
  private readonly logger = new Logger(AlertEvaluationService.name);

  constructor(private prisma: PrismaService) {}

  async evaluateVitalReading(reading: VitalReading) {
    this.logger.debug(`Evaluating vital reading ${reading.id} for elder ${reading.elderId}`);

    // Get all alert rules for this elder and vital type
    const rules = await this.prisma.vitalAlertRule.findMany({
      where: {
        elderId: reading.elderId,
        vitalTypeId: reading.vitalTypeId,
      },
      include: {
        vitalType: true,
      },
    });

    if (rules.length === 0) {
      this.logger.debug('No alert rules found for this vital type');
      return;
    }

    for (const rule of rules) {
      await this.evaluateRule(reading, rule);
    }
  }

  private async evaluateRule(reading: VitalReading, rule: VitalAlertRule) {
    // Check if value is out of range
    const isOutOfRange = this.checkValueInRange(reading, rule);

    if (!isOutOfRange) {
      this.logger.debug(`Reading is within normal range for rule ${rule.id}`);
      return;
    }

    // Check consecutive readings if required
    if (rule.consecutiveReadings > 1) {
      const isConsecutive = await this.checkConsecutiveReadings(reading, rule);
      if (!isConsecutive) {
        this.logger.debug(`Not enough consecutive out-of-range readings for rule ${rule.id}`);
        return;
      }
    }

    // Create alert
    await this.createAlert(reading, rule);
  }

  private checkValueInRange(reading: VitalReading, rule: VitalAlertRule): boolean {
    // Check primary value
    if (rule.minValue !== null && reading.value < rule.minValue) {
      this.logger.debug(`Value ${reading.value} below minimum ${rule.minValue}`);
      return true;
    }

    if (rule.maxValue !== null && reading.value > rule.maxValue) {
      this.logger.debug(`Value ${reading.value} above maximum ${rule.maxValue}`);
      return true;
    }

    // Check secondary value (e.g., diastolic BP)
    if (reading.valueSecondary !== null) {
      // For BP, we might need separate rules, but for now, just check the primary
      // In a more complex system, you'd have separate rules for systolic/diastolic
    }

    return false;
  }

  private async checkConsecutiveReadings(
    currentReading: VitalReading,
    rule: VitalAlertRule,
  ): Promise<boolean> {
    const timeWindow = rule.timeWindowMinutes || 60; // default 60 minutes
    const startTime = subMinutes(new Date(currentReading.recordedAt), timeWindow);

    const recentReadings = await this.prisma.vitalReading.findMany({
      where: {
        elderId: rule.elderId,
        vitalTypeId: rule.vitalTypeId,
        recordedAt: {
          gte: startTime,
          lte: new Date(currentReading.recordedAt),
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
      take: rule.consecutiveReadings,
    });

    if (recentReadings.length < rule.consecutiveReadings) {
      return false;
    }

    // Check if all readings are out of range
    const allOutOfRange = recentReadings.every((reading) => {
      if (rule.minValue !== null && reading.value < rule.minValue) return true;
      if (rule.maxValue !== null && reading.value > rule.maxValue) return true;
      return false;
    });

    return allOutOfRange;
  }

  private async createAlert(reading: VitalReading, rule: VitalAlertRule) {
    // Get vital type info
    const vitalType = await this.prisma.vitalType.findUnique({
      where: { id: reading.vitalTypeId },
    });

    // Check if similar alert already exists recently (prevent spam)
    const recentAlert = await this.prisma.alert.findFirst({
      where: {
        elderId: reading.elderId,
        type: 'VITAL_OUT_OF_RANGE',
        resolvedAt: null,
        createdAt: {
          gte: subMinutes(new Date(), 30), // within last 30 minutes
        },
        sourceEntityType: 'VitalReading',
        // Could check for same vital type in message
      },
    });

    if (recentAlert) {
      this.logger.debug('Similar unresolved alert exists, skipping creation');
      return;
    }

    // Build alert message
    let message = `${vitalType.name} reading of ${reading.value}`;
    if (reading.valueSecondary) {
      message += `/${reading.valueSecondary}`;
    }
    message += ` ${vitalType.unit}`;

    if (rule.minValue !== null && reading.value < rule.minValue) {
      message += ` is below the minimum threshold of ${rule.minValue} ${vitalType.unit}`;
    } else if (rule.maxValue !== null && reading.value > rule.maxValue) {
      message += ` is above the maximum threshold of ${rule.maxValue} ${vitalType.unit}`;
    }

    const alert = await this.prisma.alert.create({
      data: {
        elderId: reading.elderId,
        type: 'VITAL_OUT_OF_RANGE',
        severity: rule.severity,
        title: `${vitalType.name} Out of Range`,
        message,
        sourceEntityType: 'VitalReading',
        sourceEntityId: reading.id,
        notifiedFamily: rule.notifyFamily,
        notifiedClinician: rule.notifyClinician,
        notifiedEmergency: rule.autoEscalateEmergency,
      },
    });

    this.logger.log(
      `Created ${rule.severity} alert ${alert.id} for elder ${reading.elderId}: ${message}`,
    );

    // TODO: Trigger notifications based on preferences
    // This would integrate with the Notifications module
    if (rule.notifyFamily || rule.notifyClinician) {
      this.logger.log('Alert notifications would be sent here');
      // await this.notificationsService.sendAlertNotifications(alert);
    }

    if (rule.autoEscalateEmergency && rule.severity === 'CRITICAL') {
      this.logger.warn('CRITICAL alert - emergency escalation required');
      // await this.notificationsService.sendEmergencyNotification(alert);
    }
  }
}
