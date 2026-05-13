import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../common/logging/logger.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DeviceCategory, SensorType, ActuatorType } from '@prisma/client';

@Injectable()
export class DeviceService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  // ============================================================================
  // DEVICE TYPE MANAGEMENT
  // ============================================================================

  async createDeviceType(data: {
    name: string;
    category: DeviceCategory;
    capabilitiesJson: any;
    vendor?: string;
    model?: string;
    notes?: string;
  }) {
    return this.prisma.deviceType.create({
      data,
    });
  }

  async getAllDeviceTypes() {
    return this.prisma.deviceType.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  // ============================================================================
  // DEVICE MANAGEMENT
  // ============================================================================

  async createDevice(data: {
    homeId: string;
    deviceTypeId: string;
    name: string;
    identifier: string;
    zoneId?: string;
    settingsJson?: any;
    notes?: string;
  }) {
    return this.prisma.device.create({
      data: {
        homeId: data.homeId,
        deviceTypeId: data.deviceTypeId,
        name: data.name,
        identifier: data.identifier,
        zoneId: data.zoneId,
        settingsJson: data.settingsJson || {},
        notes: data.notes,
        status: 'UNKNOWN',
      },
      include: {
        deviceType: true,
        zone: true,
        sensors: true,
        actuators: true,
      },
    });
  }

  async getDevicesByHomeId(homeId: string) {
    return this.prisma.device.findMany({
      where: { homeId },
      include: {
        deviceType: true,
        zone: true,
        sensors: true,
        actuators: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getDeviceById(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        deviceType: true,
        zone: true,
        sensors: true,
        actuators: true,
        home: true,
      },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    return device;
  }

  async getDeviceByIdentifier(homeId: string, identifier: string) {
    return this.prisma.device.findUnique({
      where: {
        homeId_identifier: {
          homeId,
          identifier,
        },
      },
      include: {
        deviceType: true,
        zone: true,
        sensors: true,
        actuators: true,
      },
    });
  }

  async updateDevice(deviceId: string, data: {
    name?: string;
    zoneId?: string;
    status?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
    batteryLevel?: number;
    lastSeenAt?: Date;
    firmwareVersion?: string;
    settingsJson?: any;
    notes?: string;
  }) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data,
      include: {
        deviceType: true,
        zone: true,
        sensors: true,
        actuators: true,
      },
    });
  }

  async deleteDevice(deviceId: string) {
    return this.prisma.device.delete({
      where: { id: deviceId },
    });
  }

  /**
   * Update device heartbeat - called when device sends any event
   */
  async updateDeviceHeartbeat(deviceId: string) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        status: 'ONLINE',
        lastSeenAt: new Date(),
      },
    });
  }

  // ============================================================================
  // SENSOR MANAGEMENT
  // ============================================================================

  async createSensor(data: {
    deviceId: string;
    sensorType: SensorType;
    name: string;
    unit?: string;
    isCritical?: boolean;
    calibrationJson?: any;
  }) {
    return this.prisma.sensor.create({
      data: {
        deviceId: data.deviceId,
        sensorType: data.sensorType,
        name: data.name,
        unit: data.unit,
        isCritical: data.isCritical || false,
        calibrationJson: data.calibrationJson || {},
      },
      include: {
        device: {
          include: {
            deviceType: true,
            zone: true,
          },
        },
      },
    });
  }

  async getSensorsByDeviceId(deviceId: string) {
    return this.prisma.sensor.findMany({
      where: { deviceId },
      include: {
        device: {
          include: {
            deviceType: true,
            zone: true,
          },
        },
      },
    });
  }

  async getSensorById(sensorId: string) {
    const sensor = await this.prisma.sensor.findUnique({
      where: { id: sensorId },
      include: {
        device: {
          include: {
            deviceType: true,
            zone: true,
            home: true,
          },
        },
      },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    return sensor;
  }

  async updateSensor(sensorId: string, data: {
    name?: string;
    unit?: string;
    isCritical?: boolean;
    calibrationJson?: any;
  }) {
    return this.prisma.sensor.update({
      where: { id: sensorId },
      data,
    });
  }

  // ============================================================================
  // ACTUATOR MANAGEMENT
  // ============================================================================

  async createActuator(data: {
    deviceId: string;
    actuatorType: ActuatorType;
    name: string;
    stateSchemaJson: any;
    isCritical?: boolean;
  }) {
    return this.prisma.actuator.create({
      data: {
        deviceId: data.deviceId,
        actuatorType: data.actuatorType,
        name: data.name,
        stateSchemaJson: data.stateSchemaJson,
        isCritical: data.isCritical || false,
      },
      include: {
        device: {
          include: {
            deviceType: true,
            zone: true,
          },
        },
      },
    });
  }

  async getActuatorsByDeviceId(deviceId: string) {
    return this.prisma.actuator.findMany({
      where: { deviceId },
      include: {
        device: {
          include: {
            deviceType: true,
            zone: true,
          },
        },
      },
    });
  }

  async getActuatorById(actuatorId: string) {
    const actuator = await this.prisma.actuator.findUnique({
      where: { id: actuatorId },
      include: {
        device: {
          include: {
            deviceType: true,
            zone: true,
            home: true,
          },
        },
      },
    });

    if (!actuator) {
      throw new NotFoundException(`Actuator ${actuatorId} not found`);
    }

    return actuator;
  }

  async updateActuator(actuatorId: string, data: {
    name?: string;
    stateSchemaJson?: any;
    isCritical?: boolean;
  }) {
    return this.prisma.actuator.update({
      where: { id: actuatorId },
      data,
    });
  }

  // ============================================================================
  // ACTUATOR COMMANDS
  // ============================================================================

  async issueActuatorCommand(data: {
    homeId: string;
    deviceId: string;
    actuatorId: string;
    commandName: string;
    commandParamsJson: any;
    issuedByUserId?: string;
    issuedByRuleId?: string;
  }) {
    const command = await this.prisma.actuatorCommand.create({
      data: {
        homeId: data.homeId,
        deviceId: data.deviceId,
        actuatorId: data.actuatorId,
        commandName: data.commandName,
        commandParamsJson: data.commandParamsJson,
        issuedByUserId: data.issuedByUserId,
        issuedByRuleId: data.issuedByRuleId,
        status: 'PENDING',
      },
      include: {
        actuator: true,
        device: true,
      },
    });

    // In a real system, this would send the command to the IoT gateway/hub
    console.log(`📤 Actuator command issued: ${data.commandName}`, data.commandParamsJson);

    // Simulate sending the command
    await this.prisma.actuatorCommand.update({
      where: { id: command.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return command;
  }

  async acknowledgeActuatorCommand(commandId: string, success: boolean, errorMessage?: string) {
    return this.prisma.actuatorCommand.update({
      where: { id: commandId },
      data: {
        status: success ? 'ACKED' : 'FAILED',
        ackedAt: new Date(),
        errorMessage,
      },
    });
  }

  async getActuatorCommandsByHomeId(homeId: string, limit = 50) {
    return this.prisma.actuatorCommand.findMany({
      where: { homeId },
      include: {
        actuator: true,
        device: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
