import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        elderProfile: true,
        familyProfile: {
          include: {
            associatedElder: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        caregiverProfile: true,
        clinicianProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateUser(id: string, data: any) {
    const { passwordHash, ...sanitized } = await this.prisma.user.update({
      where: { id },
      data,
    });

    return sanitized;
  }

  async getAssignedElders(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        familyProfile: {
          include: {
            associatedElder: {
              include: {
                user: true,
              },
            },
          },
        },
        careTeamMemberships: {
          include: {
            elder: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const elders = [];

    // Family members get their associated elder
    if (user.role === UserRole.FAMILY && user.familyProfile) {
      elders.push(user.familyProfile.associatedElder);
    }

    // Caregivers and clinicians get elders from care team memberships
    if ([UserRole.CAREGIVER, UserRole.CLINICIAN].includes(user.role)) {
      elders.push(...user.careTeamMemberships.map((m) => m.elder));
    }

    return elders;
  }
}
