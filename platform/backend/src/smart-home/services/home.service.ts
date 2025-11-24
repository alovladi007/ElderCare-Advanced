import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHomeDto, CreateHomeZoneDto } from '../dto/create-home.dto';

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  async createHome(dto: CreateHomeDto) {
    // Check if elder already has a home
    const existing = await this.prisma.home.findUnique({
      where: { elderId: dto.elderId },
    });

    if (existing) {
      throw new ConflictException('Elder already has a home configured');
    }

    const home = await this.prisma.home.create({
      data: {
        elderId: dto.elderId,
        name: dto.name,
        address: dto.address,
        timezone: dto.timezone || 'America/New_York',
        notes: dto.notes,
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
      },
    });

    return home;
  }

  async getHomeByElderId(elderId: string) {
    const home = await this.prisma.home.findUnique({
      where: { elderId },
      include: {
        zones: {
          include: {
            smartDevices: {
              include: {
                sensors: true,
                actuators: true,
              },
            },
          },
        },
        smartDevices: {
          include: {
            zone: true,
            sensors: true,
            actuators: true,
            deviceType: true,
          },
        },
      },
    });

    if (!home) {
      throw new NotFoundException('Home not found for this elder');
    }

    return home;
  }

  async getHomeById(homeId: string) {
    const home = await this.prisma.home.findUnique({
      where: { id: homeId },
      include: {
        zones: {
          include: {
            smartDevices: true,
          },
        },
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
      },
    });

    if (!home) {
      throw new NotFoundException('Home not found');
    }

    return home;
  }

  async updateHome(homeId: string, data: Partial<CreateHomeDto>) {
    return this.prisma.home.update({
      where: { id: homeId },
      data: {
        name: data.name,
        address: data.address,
        timezone: data.timezone,
        notes: data.notes,
      },
    });
  }

  // Zones
  async createZone(homeId: string, dto: CreateHomeZoneDto) {
    const home = await this.prisma.home.findUnique({
      where: { id: homeId },
    });

    if (!home) {
      throw new NotFoundException('Home not found');
    }

    return this.prisma.homeZone.create({
      data: {
        homeId,
        name: dto.name,
        description: dto.description,
        floor: dto.floor,
        isCriticalArea: dto.isCriticalArea || false,
      },
    });
  }

  async getZones(homeId: string) {
    return this.prisma.homeZone.findMany({
      where: { homeId },
      include: {
        smartDevices: {
          include: {
            sensors: true,
            actuators: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getZoneById(zoneId: string) {
    const zone = await this.prisma.homeZone.findUnique({
      where: { id: zoneId },
      include: {
        home: true,
        smartDevices: {
          include: {
            sensors: true,
            actuators: true,
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException('Zone not found');
    }

    return zone;
  }

  async updateZone(zoneId: string, dto: Partial<CreateHomeZoneDto>) {
    return this.prisma.homeZone.update({
      where: { id: zoneId },
      data: {
        name: dto.name,
        description: dto.description,
        floor: dto.floor,
        isCriticalArea: dto.isCriticalArea,
      },
    });
  }

  async deleteZone(zoneId: string) {
    return this.prisma.homeZone.delete({
      where: { id: zoneId },
    });
  }

  // Get home status summary
  async getHomeStatus(homeId: string) {
    const home = await this.getHomeById(homeId);

    const devices = await this.prisma.smartDevice.findMany({
      where: { homeId },
      include: { sensors: true, actuators: true },
    });

    const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
    const offlineDevices = devices.filter(d => d.status === 'OFFLINE').length;

    const criticalEvents = await this.prisma.sensorEvent.count({
      where: {
        homeId,
        severity: 'CRITICAL',
        occurredAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
        },
      },
    });

    return {
      home: {
        id: home.id,
        name: home.name,
        elder: home.elder,
      },
      deviceSummary: {
        total: devices.length,
        online: onlineDevices,
        offline: offlineDevices,
        unknown: devices.length - onlineDevices - offlineDevices,
      },
      criticalEventsLast24h: criticalEvents,
      zones: home.zones,
    };
  }
}
