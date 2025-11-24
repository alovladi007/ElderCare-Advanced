import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AutomationEngineService } from './automation-engine.service';
import { EmergencyScenarioService } from './emergency-scenario.service';
import { DeviceService } from './device.service';
import { SensorEventType, AlertSeverity } from '@prisma/client';

@Injectable()
export class EventProcessorService {
  constructor(
    private prisma: PrismaService,
    private deviceService: DeviceService,
    private automationEngine: AutomationEngineService,
    private emergencyScenario: EmergencyScenarioService,
  ) {}

  /**
   * Main entry point for processing incoming sensor events
   */
  async processSensorEvent(data: {
    homeId: string;
    deviceId: string;
    sensorId: string;
    eventType: SensorEventType;
    valueNumeric?: number;
    valueText?: string;
    severity?: AlertSeverity;
    rawPayloadJson?: any;
    occurredAt: Date;
  }) {
    // Create the sensor event
    const event = await this.prisma.sensorEvent.create({
      data: {
        homeId: data.homeId,
        deviceId: data.deviceId,
        sensorId: data.sensorId,
        eventType: data.eventType,
        valueNumeric: data.valueNumeric,
        valueText: data.valueText,
        severity: data.severity || 'INFO',
        rawPayloadJson: data.rawPayloadJson || {},
        occurredAt: data.occurredAt,
        ingestedAt: new Date(),
        processed: false,
      },
      include: {
        sensor: {
          include: {
            device: {
              include: {
                zone: true,
                home: {
                  include: {
                    elder: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`📊 Sensor event received: ${event.sensor.sensorType} - ${data.eventType}`);

    // Update device heartbeat
    await this.deviceService.updateDeviceHeartbeat(data.deviceId);

    // Process the event asynchronously (in a real system, this would be queued)
    this.processEventAsync(event.id).catch(err => {
      console.error(`Error processing event ${event.id}:`, err);
    });

    return event;
  }

  /**
   * Asynchronous processing of sensor events
   */
  private async processEventAsync(eventId: string) {
    const event = await this.prisma.sensorEvent.findUnique({
      where: { id: eventId },
      include: {
        sensor: {
          include: {
            device: {
              include: {
                zone: true,
                home: {
                  include: {
                    elder: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      console.error(`Event ${eventId} not found`);
      return;
    }

    try {
      // 1. Check for critical events that require immediate emergency response
      await this.checkEmergencyConditions(event);

      // 2. Evaluate automation rules
      await this.automationEngine.evaluateRulesForEvent(event);

      // 3. Mark event as processed
      await this.prisma.sensorEvent.update({
        where: { id: eventId },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      console.log(`✅ Event ${eventId} processed successfully`);
    } catch (error) {
      console.error(`❌ Error processing event ${eventId}:`, error);
    }
  }

  /**
   * Check if the event triggers any emergency scenarios
   */
  private async checkEmergencyConditions(event: any) {
    const { sensor, homeId, severity } = event;

    // Handle critical sensor types that may trigger emergency scenarios
    switch (sensor.sensorType) {
      case 'FALL_DETECTOR':
        if (event.eventType === 'ALERT' || event.valueText === 'FALL_DETECTED') {
          console.log('⚠️ FALL DETECTED - Initiating emergency protocol');
          await this.emergencyScenario.triggerScenario(homeId, 'FALL_UNRESPONSIVE', event.id);
        }
        break;

      case 'SMOKE':
        if (event.eventType === 'ALERT' || event.valueText === 'SMOKE_DETECTED') {
          console.log('🔥 SMOKE DETECTED - Initiating emergency protocol');
          await this.emergencyScenario.triggerScenario(homeId, 'SMOKE_FIRE', event.id);
        }
        break;

      case 'GAS_LEAK':
        if (event.eventType === 'ALERT' || event.valueText === 'GAS_DETECTED') {
          console.log('⚠️ GAS LEAK DETECTED - Initiating emergency protocol');
          await this.emergencyScenario.triggerScenario(homeId, 'GAS_LEAK', event.id);
        }
        break;

      case 'WATER_LEAK':
        if (event.eventType === 'ALERT' || event.valueText === 'WATER_DETECTED') {
          console.log('💧 WATER LEAK DETECTED - Creating alert');
          await this.createSmartHomeAlert(
            event.sensor.device.home.elderId,
            'SMART_HOME_WATER_LEAK',
            'WARNING',
            'Water Leak Detected',
            `Water leak detected in ${event.sensor.device.zone?.name || 'unknown location'}`,
            event.id,
          );
        }
        break;

      case 'CONTACT_DOOR':
      case 'CONTACT_WINDOW':
        // Check if door/window opened during night hours
        await this.checkNightWandering(event);
        break;

      case 'TEMPERATURE':
        // Check for extreme temperatures
        await this.checkExtremeTemperature(event);
        break;
    }
  }

  /**
   * Check for nighttime door/window opening (wandering detection)
   */
  private async checkNightWandering(event: any) {
    const currentHour = new Date().getHours();
    const isNightTime = currentHour >= 22 || currentHour < 6; // 10 PM to 6 AM

    if (isNightTime && event.valueText === 'OPEN') {
      const zoneName = event.sensor.device.zone?.name || 'unknown location';
      console.log(`🚪 Night wandering detected: ${zoneName} opened at night`);

      await this.createSmartHomeAlert(
        event.sensor.device.home.elderId,
        'SMART_HOME_DOOR_OPEN_NIGHT',
        'WARNING',
        'Night Movement Detected',
        `${event.sensor.sensorType === 'CONTACT_DOOR' ? 'Door' : 'Window'} opened in ${zoneName} during nighttime`,
        event.id,
      );
    }
  }

  /**
   * Check for extreme temperatures
   */
  private async checkExtremeTemperature(event: any) {
    if (event.valueNumeric !== null && event.valueNumeric !== undefined) {
      const tempF = event.unit === '°C' ? (event.valueNumeric * 9/5) + 32 : event.valueNumeric;

      if (tempF < 50 || tempF > 90) {
        console.log(`🌡️ Extreme temperature detected: ${tempF}°F`);

        await this.createSmartHomeAlert(
          event.sensor.device.home.elderId,
          'SMART_HOME_TEMPERATURE_EXTREME',
          'WARNING',
          'Extreme Temperature',
          `Temperature in ${event.sensor.device.zone?.name || 'home'} is ${tempF.toFixed(1)}°F`,
          event.id,
        );
      }
    }
  }

  /**
   * Create a smart home alert
   */
  async createSmartHomeAlert(
    elderId: string,
    type: string,
    severity: AlertSeverity,
    title: string,
    message: string,
    sensorEventId?: string,
    emergencyScenarioId?: string,
  ) {
    return this.prisma.alert.create({
      data: {
        elderId,
        type: type as any,
        severity,
        status: 'ACTIVE',
        title,
        message,
        sourceSensorEventId: sensorEventId,
        sourceEmergencyScenarioId: emergencyScenarioId,
        triggeredAt: new Date(),
      },
    });
  }

  /**
   * Get recent sensor events for a home
   */
  async getRecentEvents(homeId: string, options?: {
    sensorType?: string;
    severity?: AlertSeverity;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { homeId };

    if (options?.sensorType) {
      where.sensor = {
        sensorType: options.sensorType,
      };
    }

    if (options?.severity) {
      where.severity = options.severity;
    }

    if (options?.startDate || options?.endDate) {
      where.occurredAt = {};
      if (options.startDate) {
        where.occurredAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.occurredAt.lte = options.endDate;
      }
    }

    return this.prisma.sensorEvent.findMany({
      where,
      include: {
        sensor: true,
        device: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: options?.limit || 100,
    });
  }

  /**
   * Get event statistics for a home
   */
  async getEventStats(homeId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.sensorEvent.findMany({
      where: {
        homeId,
        occurredAt: {
          gte: startDate,
        },
      },
      include: {
        sensor: true,
      },
    });

    const stats = {
      total: events.length,
      bySeverity: {
        INFO: 0,
        WARNING: 0,
        CRITICAL: 0,
      },
      bySensorType: {} as Record<string, number>,
      byEventType: {} as Record<string, number>,
    };

    events.forEach(event => {
      stats.bySeverity[event.severity]++;

      const sensorType = event.sensor.sensorType;
      stats.bySensorType[sensorType] = (stats.bySensorType[sensorType] || 0) + 1;

      stats.byEventType[event.eventType] = (stats.byEventType[event.eventType] || 0) + 1;
    });

    return stats;
  }
}
