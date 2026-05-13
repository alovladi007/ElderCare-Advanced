import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InactivityMonitorService {
  private readonly logger = new Logger(InactivityMonitorService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkInactivity() {
    this.logger.log('Running inactivity check...');

    const profiles = await this.prisma.inactivityProfile.findMany({
      include: {
        home: {
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

    for (const profile of profiles) {
      try {
        await this.checkProfileInactivity(profile);
      } catch (error) {
        this.logger.error(`Error checking inactivity for profile ${profile.id}:`, error);
      }
    }
  }

  private async checkProfileInactivity(profile: any) {
    const config = profile.configJson;
    const now = new Date();
    const hours = now.getHours();

    // Check if we're in wake hours
    if (config.wakeHours) {
      const [startHour] = config.wakeHours.start.split(':').map(Number);
      const [endHour] = config.wakeHours.end.split(':').map(Number);

      if (hours < startHour || hours >= endHour) {
        // Not in wake hours, skip
        return;
      }
    }

    const maxNoMotionMinutes = config.maxNoMotionMinutes || 90;
    const thresholdTime = new Date(Date.now() - maxNoMotionMinutes * 60 * 1000);

    // Get recent motion events
    const recentMotion = await this.prisma.sensorEvent.findFirst({
      where: {
        homeId: profile.homeId,
        sensor: {
          sensorType: {
            in: ['MOTION', 'PRESENCE_BED', 'PRESENCE_CHAIR', 'CONTACT_DOOR'],
          },
        },
        occurredAt: {
          gte: thresholdTime,
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
    });

    if (!recentMotion) {
      this.logger.warn(
        `No motion detected for ${profile.home.elder.user.firstName} in ${maxNoMotionMinutes} minutes`
      );

      // Create inactivity alert
      await this.createInactivityAlert(profile, maxNoMotionMinutes);
    }
  }

  private async createInactivityAlert(profile: any, minutes: number) {
    // Check if we already created an alert recently
    const recentAlert = await this.prisma.alert.findFirst({
      where: {
        elderId: profile.elderId,
        type: 'SMART_HOME_INACTIVITY',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // within last 30 minutes
        },
      },
    });

    if (recentAlert) {
      return; // Don't spam alerts
    }

    await this.prisma.alert.create({
      data: {
        elderId: profile.elderId,
        type: 'SMART_HOME_INACTIVITY',
        severity: 'WARNING',
        title: 'No Activity Detected',
        message: `No movement detected for ${profile.home.elder.user.firstName} in the past ${minutes} minutes during expected wake hours.`,
        sourceEntityType: 'InactivityProfile',
        sourceEntityId: profile.id,
      },
    });

    this.logger.warn(`Created inactivity alert for elder ${profile.elderId}`);
  }
}
