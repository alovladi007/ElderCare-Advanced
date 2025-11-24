import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EldersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.elderProfile.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.elderProfile.findUnique({
      where: { id },
      include: {
        user: true,
        careTeamMembers: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        memoryCareProfile: true,
        nutritionProfile: true,
      },
    });
  }

  async getOverview(elderId: string) {
    const elder = await this.findOne(elderId);

    // Get latest vitals
    const latestVitals = await this.prisma.vitalReading.findMany({
      where: { elderId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
      include: {
        vitalType: true,
      },
    });

    // Get active medications
    const medications = await this.prisma.medication.findMany({
      where: { elderId, active: true },
      include: {
        schedules: true,
      },
    });

    // Get recent alerts
    const recentAlerts = await this.prisma.alert.findMany({
      where: { elderId, resolvedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      elder,
      latestVitals,
      medications,
      recentAlerts,
    };
  }
}
