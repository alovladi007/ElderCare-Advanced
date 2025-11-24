import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  async createHome(data: {
    elderId: string;
    name: string;
    address: string;
    timezone?: string;
    notes?: string;
  }) {
    return this.prisma.home.create({
      data: {
        elderId: data.elderId,
        name: data.name,
        address: data.address,
        timezone: data.timezone || 'America/New_York',
        notes: data.notes,
      },
      include: {
        elder: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        zones: true,
      },
    });
  }

  async getHomeByElderId(elderId: string) {
    const home = await this.prisma.home.findUnique({
      where: { elderId },
      include: {
        elder: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        zones: {
          include: {
            devices: {
              include: {
                deviceType: true,
                sensors: true,
                actuators: true,
              },
            },
          },
        },
        devices: {
          include: {
            deviceType: true,
            sensors: true,
            actuators: true,
            zone: true,
          },
        },
      },
    });

    if (!home) {
      throw new NotFoundException(`Home not found for elder ${elderId}`);
    }

    return home;
  }

  async getHomeById(homeId: string) {
    const home = await this.prisma.home.findUnique({
      where: { id: homeId },
      include: {
        elder: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        zones: {
          include: {
            devices: {
              include: {
                deviceType: true,
                sensors: true,
                actuators: true,
              },
            },
          },
        },
      },
    });

    if (!home) {
      throw new NotFoundException(`Home ${homeId} not found`);
    }

    return home;
  }

  async updateHome(homeId: string, data: {
    name?: string;
    address?: string;
    timezone?: string;
    notes?: string;
  }) {
    return this.prisma.home.update({
      where: { id: homeId },
      data,
      include: {
        zones: true,
      },
    });
  }

  async createZone(homeId: string, data: {
    name: string;
    description?: string;
    floor?: string;
    isCriticalArea?: boolean;
  }) {
    return this.prisma.homeZone.create({
      data: {
        homeId,
        name: data.name,
        description: data.description,
        floor: data.floor,
        isCriticalArea: data.isCriticalArea || false,
      },
    });
  }

  async getZonesByHomeId(homeId: string) {
    return this.prisma.homeZone.findMany({
      where: { homeId },
      include: {
        devices: {
          include: {
            deviceType: true,
            sensors: true,
            actuators: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async updateZone(zoneId: string, data: {
    name?: string;
    description?: string;
    floor?: string;
    isCriticalArea?: boolean;
  }) {
    return this.prisma.homeZone.update({
      where: { id: zoneId },
      data,
    });
  }

  async deleteZone(zoneId: string) {
    return this.prisma.homeZone.delete({
      where: { id: zoneId },
    });
  }

  /**
   * Get home status summary including device counts and recent critical events
   */
  async getHomeStatus(homeId: string) {
    const home = await this.getHomeById(homeId);

    const devices = await this.prisma.device.findMany({
      where: { homeId },
      include: {
        deviceType: true,
        sensors: true,
        actuators: true,
      },
    });

    const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
    const offlineDevices = devices.filter(d => d.status === 'OFFLINE').length;
    const lowBatteryDevices = devices.filter(d => d.batteryLevel && d.batteryLevel < 20).length;

    // Get recent critical sensor events (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentCriticalEvents = await this.prisma.sensorEvent.findMany({
      where: {
        homeId,
        severity: 'CRITICAL',
        occurredAt: {
          gte: yesterday,
        },
      },
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
      take: 10,
    });

    // Get recent alerts
    const recentAlerts = await this.prisma.alert.findMany({
      where: {
        elder: {
          home: {
            id: homeId,
          },
        },
        type: {
          in: [
            'SMART_HOME_SMOKE',
            'SMART_HOME_GAS',
            'SMART_HOME_WATER_LEAK',
            'SMART_HOME_FALL_UNRESPONSIVE',
            'SMART_HOME_DOOR_OPEN_NIGHT',
            'SMART_HOME_INACTIVITY',
            'SMART_HOME_TEMPERATURE_EXTREME',
            'SMART_HOME_CUSTOM',
          ],
        },
        createdAt: {
          gte: yesterday,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return {
      home: {
        id: home.id,
        name: home.name,
        address: home.address,
        timezone: home.timezone,
      },
      deviceSummary: {
        total: devices.length,
        online: onlineDevices,
        offline: offlineDevices,
        lowBattery: lowBatteryDevices,
      },
      recentCriticalEvents,
      recentAlerts,
    };
  }
}
