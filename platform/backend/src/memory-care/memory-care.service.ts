import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrientationCardDto } from './dto/create-orientation-card.dto';
import { CreateBehaviorLogDto } from './dto/create-behavior-log.dto';
import { format } from 'date-fns';

@Injectable()
export class MemoryCareService {
  constructor(private prisma: PrismaService) {}

  // Memory Care Profile
  async getMemoryCareProfile(elderId: string) {
    const profile = await this.prisma.memoryCareProfile.findUnique({
      where: { elderId },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Memory care profile not found');
    }

    return profile;
  }

  // Orientation Dashboard
  async getOrientationDashboard(elderId: string) {
    const profile = await this.prisma.memoryCareProfile.findUnique({
      where: { elderId },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
        orientationCards: {
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Memory care profile not found');
    }

    // Get today's tasks for daily plan
    const today = new Date();
    const tasks = await this.prisma.careTaskInstance.findMany({
      where: {
        elderId,
        scheduledAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        template: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });

    // Current date/time info
    const now = new Date();
    const dateInfo = {
      date: format(now, 'EEEE, MMMM d, yyyy'),
      time: format(now, 'h:mm a'),
      dayOfWeek: format(now, 'EEEE'),
    };

    return {
      profile,
      dateInfo,
      todaysTasks: tasks,
      orientationCards: profile.orientationCards,
      preferredName: profile.preferredName,
    };
  }

  // Orientation Cards
  async createOrientationCard(dto: CreateOrientationCardDto) {
    return this.prisma.orientationCard.create({
      data: {
        elderId: dto.elderId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl,
        displayOrder: dto.displayOrder,
        active: dto.active !== false,
      },
    });
  }

  async getOrientationCards(elderId: string, activeOnly: boolean = true) {
    return this.prisma.orientationCard.findMany({
      where: {
        elderId,
        ...(activeOnly && { active: true }),
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateOrientationCard(id: string, data: Partial<CreateOrientationCardDto>) {
    return this.prisma.orientationCard.update({
      where: { id },
      data,
    });
  }

  async deleteOrientationCard(id: string) {
    return this.prisma.orientationCard.delete({
      where: { id },
    });
  }

  // Behavior Logs
  async createBehaviorLog(dto: CreateBehaviorLogDto, userId: string) {
    return this.prisma.behaviorLog.create({
      data: {
        elderId: dto.elderId,
        loggedAt: new Date(dto.loggedAt),
        mood: dto.mood,
        behavior: dto.behavior,
        trigger: dto.trigger,
        resolution: dto.resolution,
        loggedByUserId: userId,
      },
    });
  }

  async getBehaviorLogs(elderId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.behaviorLog.findMany({
      where: {
        elderId,
        loggedAt: {
          gte: startDate,
        },
      },
      orderBy: { loggedAt: 'desc' },
    });
  }

  // Wandering Events
  async getWanderingEvents(elderId: string) {
    return this.prisma.wanderingEvent.findMany({
      where: { elderId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  async createWanderingEvent(elderId: string, locationInfo?: string) {
    const event = await this.prisma.wanderingEvent.create({
      data: {
        elderId,
        startedAt: new Date(),
        locationInfo,
      },
    });

    // Create critical alert
    await this.prisma.alert.create({
      data: {
        elderId,
        type: 'WANDERING_EVENT',
        severity: 'CRITICAL',
        title: 'Wandering Event Detected',
        message: `Patient has wandered from designated area. ${locationInfo || 'Location unknown'}`,
        sourceEntityType: 'WanderingEvent',
        sourceEntityId: event.id,
      },
    });

    return event;
  }

  async resolveWanderingEvent(eventId: string, userId: string) {
    return this.prisma.wanderingEvent.update({
      where: { id: eventId },
      data: {
        endedAt: new Date(),
        resolvedByUserId: userId,
      },
    });
  }
}
