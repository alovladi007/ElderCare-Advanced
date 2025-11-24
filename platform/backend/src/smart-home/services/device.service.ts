import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSmartDeviceTypeDto,
  CreateSmartDeviceDto,
  CreateSensorDto,
  CreateActuatorDto,
} from '../dto/device.dto';

@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService) {}

  // Device Types
  async createDeviceType(dto: CreateSmartDeviceTypeDto) {
    return this.prisma.smartDeviceType.create({
      data: {
        name: dto.name,
        category: dto.category,
        capabilitiesJson: dto.capabilitiesJson,
        vendor: dto.vendor,
        model: dto.model,
        notes: dto.notes,
      },
    });
  }

  async getDeviceTypes() {
    return this.prisma.smartDeviceType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Smart Devices
  async createDevice(homeId: string, dto: CreateSmartDeviceDto) {
    return this.prisma.smartDevice.create({
      data: {
        homeId,
        zoneId: dto.zoneId,
        deviceTypeId: dto.deviceTypeId,
        name: dto.name,
        identifier: dto.identifier,
        batteryLevel: dto.batteryLevel,
        firmwareVersion: dto.firmwareVersion,
        installedAt: new Date(),
        settingsJson: dto.settingsJson,
        notes: dto.notes,
      },
      include: {
        deviceType: true,
        zone: true,
        sensors: true,
        actuators: true,
      },
    });
  }

  async getDevices(homeId: string) {
    return this.prisma.smartDevice.findMany({
      where: { homeId },
      include: {
        deviceType: true,
        zone: true,
        sensors: true,
        actuators: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getDeviceById(deviceId: string) {
    const device = await this.prisma.smartDevice.findUnique({
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
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  async getDeviceByIdentifier(identifier: string) {
    const device = await this.prisma.smartDevice.findUnique({
      where: { identifier },
      include: {
        home: true,
        sensors: true,
        actuators: true,
      },
    });

    if (!device) {
      throw new NotFoundException(`Device with identifier ${identifier} not found`);
    }

    return device;
  }

  async updateDevice(deviceId: string, data: Partial<CreateSmartDeviceDto>) {
    return this.prisma.smartDevice.update({
      where: { id: deviceId },
      data: {
        name: data.name,
        zoneId: data.zoneId,
        batteryLevel: data.batteryLevel,
        firmwareVersion: data.firmwareVersion,
        settingsJson: data.settingsJson,
        notes: data.notes,
      },
      include: {
        deviceType: true,
        zone: true,
        sensors: true,
        actuators: true,
      },
    });
  }

  async updateDeviceStatus(deviceId: string, status: string, lastSeenAt?: Date) {
    return this.prisma.smartDevice.update({
      where: { id: deviceId },
      data: {
        status: status as any,
        lastSeenAt: lastSeenAt || new Date(),
      },
    });
  }

  // Sensors
  async createSensor(deviceId: string, dto: CreateSensorDto) {
    const device = await this.getDeviceById(deviceId);

    return this.prisma.sensor.create({
      data: {
        deviceId,
        sensorType: dto.sensorType,
        name: dto.name,
        unit: dto.unit,
        isCritical: dto.isCritical || false,
        calibrationJson: dto.calibrationJson,
      },
    });
  }

  async getSensors(deviceId: string) {
    return this.prisma.sensor.findMany({
      where: { deviceId },
      include: {
        device: true,
      },
    });
  }

  async getSensorById(sensorId: string) {
    const sensor = await this.prisma.sensor.findUnique({
      where: { id: sensorId },
      include: {
        device: {
          include: {
            home: true,
            zone: true,
          },
        },
      },
    });

    if (!sensor) {
      throw new NotFoundException('Sensor not found');
    }

    return sensor;
  }

  // Actuators
  async createActuator(deviceId: string, dto: CreateActuatorDto) {
    const device = await this.getDeviceById(deviceId);

    return this.prisma.actuator.create({
      data: {
        deviceId,
        actuatorType: dto.actuatorType,
        name: dto.name,
        stateSchemaJson: dto.stateSchemaJson,
        isCritical: dto.isCritical || false,
      },
    });
  }

  async getActuators(deviceId: string) {
    return this.prisma.actuator.findMany({
      where: { deviceId },
      include: {
        device: true,
      },
    });
  }

  async getActuatorById(actuatorId: string) {
    const actuator = await this.prisma.actuator.findUnique({
      where: { id: actuatorId },
      include: {
        device: {
          include: {
            home: true,
            zone: true,
          },
        },
      },
    });

    if (!actuator) {
      throw new NotFoundException('Actuator not found');
    }

    return actuator;
  }
}
