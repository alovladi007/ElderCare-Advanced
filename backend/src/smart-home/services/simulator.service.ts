import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { EventProcessorService } from './event-processor.service';

@Injectable()
export class SimulatorService {
  constructor(
    private prisma: PrismaService,
    private eventProcessor: EventProcessorService,
    private logger: LoggerService,
  ) {}

  /**
   * Simulate a fall detection event
   */
  async simulateFall(homeId: string) {
    this.logger.debug('🎭 Simulating fall detection...', 'SimulatorService');

    // Find a fall detector sensor
    const fallSensor = await this.findOrCreateSensor(homeId, 'FALL_DETECTOR');

    if (!fallSensor) {
      throw new Error('No fall detector found in this home');
    }

    return this.eventProcessor.processSensorEvent({
      homeId,
      deviceId: fallSensor.deviceId,
      sensorId: fallSensor.id,
      eventType: 'ALERT',
      valueText: 'FALL_DETECTED',
      severity: 'CRITICAL',
      rawPayloadJson: {
        acceleration: 15.2,
        impact: 'HIGH',
        simulation: true,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Simulate smoke detection event
   */
  async simulateSmoke(homeId: string) {
    this.logger.debug('🎭 Simulating smoke detection...', 'SimulatorService');

    const smokeSensor = await this.findOrCreateSensor(homeId, 'SMOKE');

    if (!smokeSensor) {
      throw new Error('No smoke detector found in this home');
    }

    return this.eventProcessor.processSensorEvent({
      homeId,
      deviceId: smokeSensor.deviceId,
      sensorId: smokeSensor.id,
      eventType: 'ALERT',
      valueText: 'SMOKE_DETECTED',
      severity: 'CRITICAL',
      rawPayloadJson: {
        ppm: 450,
        simulation: true,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Simulate gas leak detection event
   */
  async simulateGasLeak(homeId: string) {
    this.logger.debug('🎭 Simulating gas leak detection...', 'SimulatorService');

    const gasSensor = await this.findOrCreateSensor(homeId, 'GAS_LEAK');

    if (!gasSensor) {
      throw new Error('No gas detector found in this home');
    }

    return this.eventProcessor.processSensorEvent({
      homeId,
      deviceId: gasSensor.deviceId,
      sensorId: gasSensor.id,
      eventType: 'ALERT',
      valueText: 'GAS_DETECTED',
      severity: 'CRITICAL',
      rawPayloadJson: {
        concentration: 850,
        simulation: true,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Simulate motion pattern (normal day)
   */
  async simulateMotionPattern(homeId: string, durationMinutes = 60) {
    this.logger.debug('Simulating motion pattern', 'SimulatorService', { durationMinutes });

    const motionSensor = await this.findOrCreateSensor(homeId, 'MOTION');

    if (!motionSensor) {
      throw new Error('No motion sensor found in this home');
    }

    const events = [];
    const startTime = new Date();
    const eventCount = Math.floor(durationMinutes / 5); // Event every 5 minutes

    for (let i = 0; i < eventCount; i++) {
      const eventTime = new Date(startTime.getTime() + i * 5 * 60 * 1000);

      const event = await this.eventProcessor.processSensorEvent({
        homeId,
        deviceId: motionSensor.deviceId,
        sensorId: motionSensor.id,
        eventType: 'STATE_CHANGE',
        valueText: 'MOTION_DETECTED',
        severity: 'INFO',
        rawPayloadJson: {
          simulation: true,
          sequence: i + 1,
        },
        occurredAt: eventTime,
      });

      events.push(event);
    }

    return events;
  }

  /**
   * Simulate door opening (night wandering)
   */
  async simulateNightDoorOpen(homeId: string) {
    this.logger.debug('🎭 Simulating nighttime door opening...', 'SimulatorService');

    const doorSensor = await this.findOrCreateSensor(homeId, 'CONTACT_DOOR');

    if (!doorSensor) {
      throw new Error('No door sensor found in this home');
    }

    // Create event at night time (simulated)
    const nightTime = new Date();
    nightTime.setHours(2, 30, 0); // 2:30 AM

    return this.eventProcessor.processSensorEvent({
      homeId,
      deviceId: doorSensor.deviceId,
      sensorId: doorSensor.id,
      eventType: 'STATE_CHANGE',
      valueText: 'OPEN',
      severity: 'WARNING',
      rawPayloadJson: {
        simulation: true,
        nightTime: true,
      },
      occurredAt: nightTime,
    });
  }

  /**
   * Simulate water leak
   */
  async simulateWaterLeak(homeId: string) {
    this.logger.debug('🎭 Simulating water leak...', 'SimulatorService');

    const waterSensor = await this.findOrCreateSensor(homeId, 'WATER_LEAK');

    if (!waterSensor) {
      throw new Error('No water leak detector found in this home');
    }

    return this.eventProcessor.processSensorEvent({
      homeId,
      deviceId: waterSensor.deviceId,
      sensorId: waterSensor.id,
      eventType: 'ALERT',
      valueText: 'WATER_DETECTED',
      severity: 'WARNING',
      rawPayloadJson: {
        simulation: true,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Simulate extreme temperature
   */
  async simulateExtremeTemp(homeId: string, tempF: number = 95) {
    this.logger.debug('Simulating extreme temperature', 'SimulatorService', { tempF });

    const tempSensor = await this.findOrCreateSensor(homeId, 'TEMPERATURE');

    if (!tempSensor) {
      throw new Error('No temperature sensor found in this home');
    }

    return this.eventProcessor.processSensorEvent({
      homeId,
      deviceId: tempSensor.deviceId,
      sensorId: tempSensor.id,
      eventType: 'VALUE_READING',
      valueNumeric: tempF,
      severity: tempF > 90 || tempF < 50 ? 'WARNING' : 'INFO',
      rawPayloadJson: {
        unit: '°F',
        simulation: true,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Simulate inactivity (no motion for extended period)
   */
  async simulateInactivity(homeId: string, hours = 2) {
    this.logger.debug('Simulating inactivity', 'SimulatorService', { hours });

    // This doesn't create events, it just ensures no recent motion events exist
    // The inactivity checker job will detect this

    const motionSensor = await this.findOrCreateSensor(homeId, 'MOTION');

    // Create a motion event from X hours ago
    const oldEventTime = new Date();
    oldEventTime.setHours(oldEventTime.getHours() - hours);

    return this.eventProcessor.processSensorEvent({
      homeId,
      deviceId: motionSensor.deviceId,
      sensorId: motionSensor.id,
      eventType: 'STATE_CHANGE',
      valueText: 'NO_MOTION',
      severity: 'INFO',
      rawPayloadJson: {
        simulation: true,
        inactivitySimulation: true,
      },
      occurredAt: oldEventTime,
    });
  }

  /**
   * Simulate panic button press
   */
  async simulatePanicButton(homeId: string) {
    this.logger.debug('🎭 Simulating panic button press...', 'SimulatorService');

    const panicSensor = await this.findOrCreateSensor(homeId, 'BUTTON_PANIC');

    if (!panicSensor) {
      throw new Error('No panic button found in this home');
    }

    return this.eventProcessor.processSensorEvent({
      homeId,
      deviceId: panicSensor.deviceId,
      sensorId: panicSensor.id,
      eventType: 'ALERT',
      valueText: 'BUTTON_PRESSED',
      severity: 'CRITICAL',
      rawPayloadJson: {
        simulation: true,
        pressCount: 3,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Find or create a sensor of a specific type for testing
   */
  private async findOrCreateSensor(homeId: string, sensorType: string) {
    // First try to find existing sensor
    const existingSensor = await this.prisma.sensor.findFirst({
      where: {
        sensorType: sensorType as any,
        device: {
          homeId,
        },
      },
      include: {
        device: true,
      },
    });

    if (existingSensor) {
      return existingSensor;
    }

    console.log(`Creating simulated ${sensorType} sensor...`);

    // Find or create a device type
    let deviceType = await this.prisma.deviceType.findFirst({
      where: {
        name: `Simulated ${sensorType} Device`,
      },
    });

    if (!deviceType) {
      deviceType = await this.prisma.deviceType.create({
        data: {
          name: `Simulated ${sensorType} Device`,
          category: 'SENSOR',
          capabilitiesJson: {
            sensors: [sensorType],
          },
          vendor: 'Simulator',
          model: 'SIM-1000',
        },
      });
    }

    // Get a zone (preferably kitchen for smoke/gas, bathroom for water, bedroom for fall)
    const zonePreference: Record<string, string> = {
      SMOKE: 'Kitchen',
      GAS_LEAK: 'Kitchen',
      WATER_LEAK: 'Bathroom',
      FALL_DETECTOR: 'Bedroom',
      TEMPERATURE: 'Living Room',
    };

    const preferredZoneName = zonePreference[sensorType] || 'Living Room';

    let zone = await this.prisma.homeZone.findFirst({
      where: {
        homeId,
        name: preferredZoneName,
      },
    });

    // If zone doesn't exist, get any zone
    if (!zone) {
      zone = await this.prisma.homeZone.findFirst({
        where: { homeId },
      });
    }

    // Create device
    const device = await this.prisma.device.create({
      data: {
        homeId,
        deviceTypeId: deviceType.id,
        zoneId: zone?.id,
        name: `Simulated ${sensorType}`,
        identifier: `SIM-${sensorType}-${Date.now()}`,
        status: 'ONLINE',
        batteryLevel: 100,
        lastSeenAt: new Date(),
        firmwareVersion: '1.0.0-sim',
        settingsJson: {
          simulated: true,
        },
      },
    });

    // Create sensor
    const sensor = await this.prisma.sensor.create({
      data: {
        deviceId: device.id,
        sensorType: sensorType as any,
        name: `Simulated ${sensorType} Sensor`,
        unit: sensorType === 'TEMPERATURE' ? '°F' : undefined,
        isCritical: ['FALL_DETECTOR', 'SMOKE', 'GAS_LEAK'].includes(sensorType),
      },
      include: {
        device: true,
      },
    });

    return sensor;
  }

  /**
   * Reset simulation devices (remove all simulated devices)
   */
  async resetSimulation(homeId: string) {
    this.logger.debug('🎭 Resetting simulation...', 'SimulatorService');

    const result = await this.prisma.device.deleteMany({
      where: {
        homeId,
        identifier: {
          startsWith: 'SIM-',
        },
      },
    });

    console.log(`Removed ${result.count} simulated devices`);

    return result;
  }
}
