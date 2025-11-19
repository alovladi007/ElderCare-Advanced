import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IoTGatewayService } from './iot-gateway.service';

@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);

  constructor(
    private prisma: PrismaService,
    private iotGateway: IoTGatewayService,
  ) {}

  // Simulate Fall Event
  async simulateFall(homeId: string) {
    this.logger.warn(`🔴 Simulating fall event for home ${homeId}`);

    const fallSensor = await this.findOrCreateSensor(homeId, 'FALL_DETECTOR');

    await this.iotGateway.ingestEvent(homeId, {
      deviceIdentifier: fallSensor.device.identifier,
      eventType: 'ALERT',
      valueText: 'DETECTED',
      severity: 'CRITICAL',
      occurredAt: new Date().toISOString(),
      rawPayloadJson: {
        accelerationG: 4.5,
        impactDetected: true,
        simulated: true,
      },
    });

    return {
      success: true,
      message: 'Fall event simulated',
      sensorId: fallSensor.id,
      homeId,
    };
  }

  // Simulate Smoke Detection
  async simulateSmoke(homeId: string) {
    this.logger.warn(`🔥 Simulating smoke detection for home ${homeId}`);

    const smokeSensor = await this.findOrCreateSensor(homeId, 'SMOKE');

    await this.iotGateway.ingestEvent(homeId, {
      deviceIdentifier: smokeSensor.device.identifier,
      eventType: 'ALERT',
      valueText: 'DETECTED',
      severity: 'CRITICAL',
      occurredAt: new Date().toISOString(),
      rawPayloadJson: {
        smokeLevel: 850,
        threshold: 500,
        simulated: true,
      },
    });

    return {
      success: true,
      message: 'Smoke detection simulated',
      sensorId: smokeSensor.id,
      homeId,
    };
  }

  // Simulate Gas Leak
  async simulateGasLeak(homeId: string) {
    this.logger.warn(`☠️ Simulating gas leak for home ${homeId}`);

    const gasSensor = await this.findOrCreateSensor(homeId, 'GAS_LEAK');

    await this.iotGateway.ingestEvent(homeId, {
      deviceIdentifier: gasSensor.device.identifier,
      eventType: 'ALERT',
      valueText: 'DETECTED',
      severity: 'CRITICAL',
      occurredAt: new Date().toISOString(),
      rawPayloadJson: {
        gasConcentration: 1200,
        gasType: 'natural-gas',
        simulated: true,
      },
    });

    return {
      success: true,
      message: 'Gas leak simulated',
      sensorId: gasSensor.id,
      homeId,
    };
  }

  // Simulate Motion Pattern (normal daily activity)
  async simulateMotionPattern(homeId: string, hours: number = 1) {
    this.logger.log(`📍 Simulating ${hours} hours of motion for home ${homeId}`);

    const motionSensor = await this.findOrCreateSensor(homeId, 'MOTION');
    const events = [];

    // Simulate motion every 5-15 minutes
    const eventsCount = Math.floor((hours * 60) / 10);

    for (let i = 0; i < eventsCount; i++) {
      const minutesAgo = hours * 60 - (i * 10);
      const occurredAt = new Date(Date.now() - minutesAgo * 60 * 1000);

      await this.iotGateway.ingestEvent(homeId, {
        deviceIdentifier: motionSensor.device.identifier,
        eventType: 'STATE_CHANGE',
        valueText: 'DETECTED',
        severity: 'INFO',
        occurredAt: occurredAt.toISOString(),
        rawPayloadJson: {
          duration: 3,
          simulated: true,
        },
      });

      events.push({
        time: occurredAt,
        type: 'motion',
      });
    }

    return {
      success: true,
      message: `Simulated ${eventsCount} motion events over ${hours} hours`,
      eventsGenerated: eventsCount,
      homeId,
    };
  }

  // Simulate Door Opening (e.g., for night wandering)
  async simulateDoorOpen(homeId: string, isNight: boolean = false) {
    this.logger.log(`🚪 Simulating door open for home ${homeId} (night: ${isNight})`);

    const doorSensor = await this.findOrCreateSensor(homeId, 'CONTACT_DOOR');

    const occurredAt = isNight
      ? new Date(new Date().setHours(2, 30, 0, 0)) // 2:30 AM
      : new Date();

    await this.iotGateway.ingestEvent(homeId, {
      deviceIdentifier: doorSensor.device.identifier,
      eventType: 'STATE_CHANGE',
      valueText: 'OPEN',
      severity: isNight ? 'WARNING' : 'INFO',
      occurredAt: occurredAt.toISOString(),
      rawPayloadJson: {
        previousState: 'CLOSED',
        simulated: true,
      },
    });

    return {
      success: true,
      message: `Door open simulated (${isNight ? 'night' : 'day'})`,
      homeId,
    };
  }

  // Simulate Temperature Event
  async simulateTemperature(homeId: string, celsius: number) {
    this.logger.log(`🌡️ Simulating temperature ${celsius}°C for home ${homeId}`);

    const tempSensor = await this.findOrCreateSensor(homeId, 'TEMPERATURE');

    const severity = celsius < 10 || celsius > 35 ? 'WARNING' : 'INFO';

    await this.iotGateway.ingestEvent(homeId, {
      deviceIdentifier: tempSensor.device.identifier,
      eventType: 'VALUE_READING',
      valueNumeric: celsius,
      severity,
      occurredAt: new Date().toISOString(),
      rawPayloadJson: {
        unit: 'celsius',
        simulated: true,
      },
    });

    return {
      success: true,
      message: `Temperature ${celsius}°C simulated`,
      homeId,
      severity,
    };
  }

  // Simulate Panic Button Press
  async simulatePanicButton(homeId: string) {
    this.logger.warn(`🆘 Simulating panic button press for home ${homeId}`);

    const panicButton = await this.findOrCreateSensor(homeId, 'BUTTON_PANIC');

    await this.iotGateway.ingestEvent(homeId, {
      deviceIdentifier: panicButton.device.identifier,
      eventType: 'STATE_CHANGE',
      valueText: 'PRESSED',
      severity: 'CRITICAL',
      occurredAt: new Date().toISOString(),
      rawPayloadJson: {
        pressDuration: 1500,
        simulated: true,
      },
    });

    return {
      success: true,
      message: 'Panic button press simulated',
      homeId,
    };
  }

  // Helper: Find or create a sensor for simulation
  private async findOrCreateSensor(homeId: string, sensorType: string) {
    // Try to find existing sensor of this type
    const existingSensor = await this.prisma.sensor.findFirst({
      where: {
        device: {
          homeId,
        },
        sensorType: sensorType as any,
      },
      include: {
        device: true,
      },
    });

    if (existingSensor) {
      return existingSensor;
    }

    // Create simulation device and sensor
    const home = await this.prisma.home.findUnique({
      where: { id: homeId },
    });

    if (!home) {
      throw new Error('Home not found');
    }

    // Get or create device type
    let deviceType = await this.prisma.smartDeviceType.findFirst({
      where: {
        name: {
          contains: 'Simulator',
        },
      },
    });

    if (!deviceType) {
      deviceType = await this.prisma.smartDeviceType.create({
        data: {
          name: 'Generic Simulator Device',
          category: 'HYBRID',
          capabilitiesJson: {
            sensors: ['all'],
            features: ['simulated'],
          },
        },
      });
    }

    // Create device
    const device = await this.prisma.smartDevice.create({
      data: {
        homeId,
        deviceTypeId: deviceType.id,
        name: `${sensorType} Simulator`,
        identifier: `SIM-${sensorType}-${Date.now()}`,
        installedAt: new Date(),
        status: 'ONLINE',
      },
    });

    // Create sensor
    const sensor = await this.prisma.sensor.create({
      data: {
        deviceId: device.id,
        sensorType: sensorType as any,
        name: `${sensorType} Sensor (Simulated)`,
        isCritical: ['FALL_DETECTOR', 'SMOKE', 'GAS_LEAK', 'BUTTON_PANIC'].includes(sensorType),
      },
      include: {
        device: true,
      },
    });

    this.logger.log(`Created simulation sensor: ${sensor.name}`);

    return sensor;
  }
}
