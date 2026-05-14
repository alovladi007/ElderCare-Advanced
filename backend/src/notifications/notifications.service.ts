import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logging/logger.service';
import { NotificationsGateway } from './notifications.gateway';
import { AlertType, AlertSeverity } from '@prisma/client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  data?: any;
  createdAt: Date;
  read: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Send real-time notification for new alert
   */
  async notifyNewAlert(alert: any) {
    const notification = {
      id: alert.id,
      type: 'alert',
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      alertType: alert.type,
      elderId: alert.elderId,
      createdAt: alert.triggeredAt,
      data: alert.metadata,
    };

    // Send to elder monitors
    this.notificationsGateway.sendToElderMonitors(
      alert.elderId,
      'notification:alert',
      notification,
    );

    // Get family members and caregivers for this elder
    const elder = await this.prisma.elderProfile.findUnique({
      where: { id: alert.elderId },
      include: {
        user: true,
      },
    });

    if (elder?.user) {
      this.notificationsGateway.sendToUser(
        elder.user.id,
        'notification:alert',
        notification,
      );
    }

    this.logger.logEvent('Real-time alert notification sent', 'Notification', alert.id, {
      elderId: alert.elderId,
      severity: alert.severity,
    });
  }

  /**
   * Send medication reminder notification
   */
  async notifyMedicationReminder(dose: any) {
    const medication = await this.prisma.medication.findUnique({
      where: { id: dose.medicationId },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!medication) return;

    const notification = {
      id: dose.id,
      type: 'medication_reminder',
      title: 'Medication Reminder',
      message: `Time to take ${medication.name} (${medication.dosage})`,
      severity: 'INFO',
      elderId: medication.elderId,
      scheduledAt: dose.scheduledAt,
      data: {
        medicationId: medication.id,
        medicationName: medication.name,
        dosage: medication.dosage,
        doseId: dose.id,
      },
    };

    this.notificationsGateway.sendToElderMonitors(
      medication.elderId,
      'notification:medication',
      notification,
    );

    this.notificationsGateway.sendToUser(
      medication.elder.user.id,
      'notification:medication',
      notification,
    );

    this.logger.debug('Medication reminder notification sent', 'NotificationsService', {
      elderId: medication.elderId,
      medicationId: medication.id,
    });
  }

  /**
   * Send appointment reminder notification
   */
  async notifyAppointmentReminder(appointment: any) {
    const elder = await this.prisma.elderProfile.findUnique({
      where: { id: appointment.elderId },
      include: {
        user: true,
      },
    });

    if (!elder) return;

    const notification = {
      id: appointment.id,
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `Upcoming appointment: ${appointment.title}`,
      severity: 'INFO',
      elderId: appointment.elderId,
      startTime: appointment.startTime,
      data: {
        appointmentId: appointment.id,
        title: appointment.title,
        location: appointment.location,
        type: appointment.type,
      },
    };

    this.notificationsGateway.sendToElderMonitors(
      appointment.elderId,
      'notification:appointment',
      notification,
    );

    this.notificationsGateway.sendToUser(
      elder.user.id,
      'notification:appointment',
      notification,
    );

    this.logger.debug('Appointment reminder notification sent', 'NotificationsService', {
      elderId: appointment.elderId,
      appointmentId: appointment.id,
    });
  }

  /**
   * Send task reminder notification
   */
  async notifyTaskReminder(task: any) {
    const carePlan = await this.prisma.carePlan.findUnique({
      where: { id: task.carePlanId },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!carePlan) return;

    const notification = {
      id: task.id,
      type: 'task_reminder',
      title: 'Care Task Reminder',
      message: `Task due: ${task.title}`,
      severity: task.priority === 'URGENT' ? 'WARNING' : 'INFO',
      elderId: carePlan.elderId,
      dueDate: task.dueDate,
      data: {
        taskId: task.id,
        title: task.title,
        priority: task.priority,
        assignedTo: task.assignedTo,
      },
    };

    this.notificationsGateway.sendToElderMonitors(
      carePlan.elderId,
      'notification:task',
      notification,
    );

    this.logger.debug('Task reminder notification sent', 'NotificationsService', {
      elderId: carePlan.elderId,
      taskId: task.id,
    });
  }

  /**
   * Send vital reading notification (abnormal vital)
   */
  async notifyAbnormalVital(vital: any, alert: any) {
    const notification = {
      id: vital.id,
      type: 'vital_abnormal',
      title: `Abnormal ${vital.vitalType.replace('_', ' ')}`,
      message: alert.message,
      severity: alert.severity,
      elderId: vital.elderId,
      data: {
        vitalId: vital.id,
        vitalType: vital.vitalType,
        value: vital.value,
        unit: vital.unit,
        alertId: alert.id,
      },
    };

    this.notificationsGateway.sendToElderMonitors(
      vital.elderId,
      'notification:vital',
      notification,
    );

    this.logger.logSecurity(
      'Abnormal vital notification sent',
      alert.severity === 'CRITICAL' ? 'critical' : 'medium',
      {
        elderId: vital.elderId,
        vitalType: vital.vitalType,
        value: vital.value,
      },
    );
  }

  /**
   * Send emergency notification
   */
  async notifyEmergency(scenarioInstance: any) {
    const scenario = await this.prisma.emergencyScenario.findUnique({
      where: { id: scenarioInstance.scenarioId },
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

    if (!scenario) return;

    const notification = {
      id: scenarioInstance.id,
      type: 'emergency',
      title: `🚨 EMERGENCY: ${scenario.name}`,
      message: `Emergency scenario activated. Cancel code: ${scenarioInstance.cancelToken}`,
      severity: 'CRITICAL',
      elderId: scenario.home.elderId,
      data: {
        scenarioId: scenario.id,
        instanceId: scenarioInstance.id,
        scenarioName: scenario.name,
        cancelToken: scenarioInstance.cancelToken,
      },
    };

    // Broadcast emergency to all monitors
    this.notificationsGateway.sendToElderMonitors(
      scenario.home.elderId,
      'notification:emergency',
      notification,
    );

    // Also send to elder user
    this.notificationsGateway.sendToUser(
      scenario.home.elder.user.id,
      'notification:emergency',
      notification,
    );

    this.logger.logSecurity('Emergency notification sent', 'critical', {
      elderId: scenario.home.elderId,
      scenarioId: scenario.id,
      instanceId: scenarioInstance.id,
    });
  }

  /**
   * Send payment notification
   */
  async notifyPaymentStatus(data: {
    userId: string;
    status: 'succeeded' | 'failed' | 'canceled';
    amount: number;
    currency: string;
    bookingId?: string;
  }) {
    const notification = {
      id: `payment-${Date.now()}`,
      type: 'payment',
      title: `Payment ${data.status}`,
      message:
        data.status === 'succeeded'
          ? `Payment of $${(data.amount / 100).toFixed(2)} was successful`
          : `Payment of $${(data.amount / 100).toFixed(2)} ${data.status}`,
      severity: data.status === 'succeeded' ? 'INFO' : 'WARNING',
      data: {
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        bookingId: data.bookingId,
      },
    };

    this.notificationsGateway.sendToUser(data.userId, 'notification:payment', notification);

    this.logger.debug('Payment notification sent', 'NotificationsService', {
      userId: data.userId,
      status: data.status,
    });
  }

  /**
   * Get unread notification count (using alerts as notifications)
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Get elder profile for this user
    const elderProfile = await this.prisma.elderProfile.findUnique({
      where: { userId },
    });

    if (!elderProfile) return 0;

    return this.prisma.alert.count({
      where: {
        elderId: elderProfile.id,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get notifications for user (using alerts)
   */
  async getNotifications(userId: string, limit = 20): Promise<Notification[]> {
    const elderProfile = await this.prisma.elderProfile.findUnique({
      where: { userId },
    });

    if (!elderProfile) return [];

    const alerts = await this.prisma.alert.findMany({
      where: {
        elderId: elderProfile.id,
      },
      orderBy: {
        triggeredAt: 'desc',
      },
      take: limit,
    });

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      data: alert.metadata,
      createdAt: alert.triggeredAt,
      read: alert.status !== 'ACTIVE',
    }));
  }

  /**
   * Mark notification as read (using alert acknowledgment)
   */
  async markAsRead(notificationId: string, userId: string) {
    await this.prisma.alert.update({
      where: { id: notificationId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
    });

    this.logger.debug('Notification marked as read', 'NotificationsService', {
      notificationId,
      userId,
    });
  }

  /**
   * Get WebSocket gateway stats
   */
  getStats() {
    return {
      connectedClients: this.notificationsGateway.getConnectedClientsCount(),
    };
  }
}
