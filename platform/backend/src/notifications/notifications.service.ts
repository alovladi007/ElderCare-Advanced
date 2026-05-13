import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import {
  CreateNotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification-preference.dto';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  // Send Notification
  async sendNotification(dto: SendNotificationDto) {
    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        channel: dto.channel,
        subject: dto.subject,
        message: dto.message,
        metadata: dto.metadata,
        status: NotificationStatus.PENDING,
      },
    });

    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Send via appropriate channel
      if (dto.channel === NotificationChannel.EMAIL) {
        if (!user.email) {
          throw new Error('User has no email address');
        }
        await this.emailService.sendEmail(
          user.email,
          dto.subject || 'ElderCare Notification',
          dto.message,
        );
      } else if (dto.channel === NotificationChannel.SMS) {
        if (!user.phone) {
          throw new Error('User has no phone number');
        }
        await this.smsService.sendSms(user.phone, dto.message);
      }

      // Update notification status
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      this.logger.log(
        `Notification sent successfully: ${notification.id} via ${dto.channel}`,
      );

      return { success: true, notificationId: notification.id };
    } catch (error) {
      // Update notification status on failure
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          errorMessage: error.message,
        },
      });

      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Send to multiple users (e.g., care team)
  async sendBulkNotification(
    userIds: string[],
    type: any,
    channel: NotificationChannel,
    subject: string,
    message: string,
    metadata?: any,
  ) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendNotification({
          userId,
          type,
          channel,
          subject,
          message,
          metadata,
        });
        results.push({ userId, success: true, result });
      } catch (error) {
        this.logger.error(`Failed to send notification to user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  // Notification Preferences
  async createPreference(userId: string, dto: CreateNotificationPreferenceDto) {
    return this.prisma.notificationPreference.create({
      data: {
        userId,
        channel: dto.channel,
        enabled: dto.enabled,
        forAlertSeverity: dto.forAlertSeverity,
      },
    });
  }

  async getUserPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
    });
  }

  async updatePreference(id: string, dto: UpdateNotificationPreferenceDto) {
    return this.prisma.notificationPreference.update({
      where: { id },
      data: { enabled: dto.enabled },
    });
  }

  async deletePreference(id: string) {
    return this.prisma.notificationPreference.delete({
      where: { id },
    });
  }

  // Check if user should receive notification based on preferences
  async shouldNotifyUser(
    userId: string,
    channel: NotificationChannel,
    severity: any,
  ): Promise<boolean> {
    const preference = await this.prisma.notificationPreference.findFirst({
      where: {
        userId,
        channel,
        forAlertSeverity: severity,
      },
    });

    // If no preference set, default to enabled
    return preference ? preference.enabled : true;
  }

  // Notification History
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    status?: NotificationStatus,
  ) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getNotification(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  // Retry failed notification
  async retryNotification(id: string) {
    const notification = await this.getNotification(id);

    if (notification.status !== NotificationStatus.FAILED) {
      throw new Error('Only failed notifications can be retried');
    }

    return this.sendNotification({
      userId: notification.userId,
      type: notification.type,
      channel: notification.channel,
      subject: notification.subject,
      message: notification.message,
      metadata: notification.metadata,
    });
  }

  // Service Status
  async getServiceStatus() {
    const emailConnected = await this.emailService.verifyConnection();
    const smsConfigured = this.smsService.isConfigured();

    return {
      email: {
        configured: true,
        connected: emailConnected,
      },
      sms: {
        configured: smsConfigured,
        connected: smsConfigured,
      },
    };
  }
}
