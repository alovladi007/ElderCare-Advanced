import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logging/logger.service';
import { NotificationsGateway } from './notifications.gateway';
import { AlertType, AlertSeverity } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let loggerService: LoggerService;
  let notificationsGateway: NotificationsGateway;

  const mockPrismaService = {
    alert: {
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    elderProfile: {
      findUnique: jest.fn(),
    },
    medication: {
      findUnique: jest.fn(),
    },
    carePlan: {
      findUnique: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
    },
    emergencyScenario: {
      findUnique: jest.fn(),
    },
  };

  const mockLoggerService = {
    debug: jest.fn(),
    logEvent: jest.fn(),
    warn: jest.fn(),
    logSecurity: jest.fn(),
  };

  const mockNotificationsGateway = {
    sendToUser: jest.fn(),
    sendToElderMonitors: jest.fn(),
    getConnectedClientsCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    loggerService = module.get<LoggerService>(LoggerService);
    notificationsGateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyNewAlert', () => {
    it('should send real-time alert notification', async () => {
      const alert = {
        id: 'alert-1',
        title: 'High Blood Pressure',
        message: 'Blood pressure reading is critically high',
        severity: AlertSeverity.CRITICAL,
        type: AlertType.VITAL_ABNORMAL,
        elderId: 'elder-1',
        triggeredAt: new Date(),
        metadata: { value: 185, unit: 'mmHg' },
      };

      const elder = {
        id: 'elder-1',
        user: {
          id: 'user-1',
          email: 'elder@example.com',
        },
      };

      mockPrismaService.elderProfile.findUnique.mockResolvedValue(elder);

      await service.notifyNewAlert(alert);

      expect(notificationsGateway.sendToElderMonitors).toHaveBeenCalledWith(
        'elder-1',
        'notification:alert',
        expect.objectContaining({
          id: 'alert-1',
          type: 'alert',
          title: 'High Blood Pressure',
          severity: AlertSeverity.CRITICAL,
        }),
      );

      expect(notificationsGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:alert',
        expect.any(Object),
      );

      expect(loggerService.logEvent).toHaveBeenCalled();
    });

    it('should handle alert without elder profile', async () => {
      const alert = {
        id: 'alert-2',
        title: 'Test Alert',
        message: 'Test message',
        severity: AlertSeverity.INFO,
        type: AlertType.SMART_HOME_INACTIVITY,
        elderId: 'elder-2',
        triggeredAt: new Date(),
        metadata: {},
      };

      mockPrismaService.elderProfile.findUnique.mockResolvedValue(null);

      await service.notifyNewAlert(alert);

      expect(notificationsGateway.sendToElderMonitors).toHaveBeenCalled();
      expect(notificationsGateway.sendToUser).not.toHaveBeenCalled();
    });
  });

  describe('notifyMedicationReminder', () => {
    it('should send medication reminder notification', async () => {
      const dose = {
        id: 'dose-1',
        medicationId: 'med-1',
        scheduledAt: new Date(),
      };

      const medication = {
        id: 'med-1',
        elderId: 'elder-1',
        name: 'Aspirin',
        dosage: '100mg',
        elder: {
          user: {
            id: 'user-1',
          },
        },
      };

      mockPrismaService.medication.findUnique.mockResolvedValue(medication);

      await service.notifyMedicationReminder(dose);

      expect(notificationsGateway.sendToElderMonitors).toHaveBeenCalledWith(
        'elder-1',
        'notification:medication',
        expect.objectContaining({
          type: 'medication_reminder',
          title: 'Medication Reminder',
          message: 'Time to take Aspirin (100mg)',
        }),
      );

      expect(notificationsGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:medication',
        expect.any(Object),
      );
    });

    it('should handle missing medication gracefully', async () => {
      const dose = {
        id: 'dose-1',
        medicationId: 'med-1',
        scheduledAt: new Date(),
      };

      mockPrismaService.medication.findUnique.mockResolvedValue(null);

      await service.notifyMedicationReminder(dose);

      expect(notificationsGateway.sendToElderMonitors).not.toHaveBeenCalled();
    });
  });

  describe('notifyAppointmentReminder', () => {
    it('should send appointment reminder notification', async () => {
      const appointment = {
        id: 'appt-1',
        elderId: 'elder-1',
        title: 'Doctor Visit',
        location: 'General Hospital',
        type: 'DOCTOR_VISIT',
        startTime: new Date('2024-02-15T10:00:00Z'),
      };

      const elder = {
        id: 'elder-1',
        user: {
          id: 'user-1',
        },
      };

      mockPrismaService.elderProfile.findUnique.mockResolvedValue(elder);

      await service.notifyAppointmentReminder(appointment);

      expect(notificationsGateway.sendToElderMonitors).toHaveBeenCalledWith(
        'elder-1',
        'notification:appointment',
        expect.objectContaining({
          type: 'appointment_reminder',
          title: 'Appointment Reminder',
          message: 'Upcoming appointment: Doctor Visit',
        }),
      );

      expect(notificationsGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:appointment',
        expect.any(Object),
      );
    });
  });

  describe('notifyTaskReminder', () => {
    it('should send task reminder notification', async () => {
      const task = {
        id: 'task-1',
        carePlanId: 'plan-1',
        title: 'Morning medication',
        priority: 'URGENT',
        dueDate: new Date(),
        assignedTo: 'caregiver-1',
      };

      const carePlan = {
        id: 'plan-1',
        elderId: 'elder-1',
        elder: {
          user: {
            id: 'user-1',
          },
        },
      };

      mockPrismaService.carePlan.findUnique.mockResolvedValue(carePlan);

      await service.notifyTaskReminder(task);

      expect(notificationsGateway.sendToElderMonitors).toHaveBeenCalledWith(
        'elder-1',
        'notification:task',
        expect.objectContaining({
          type: 'task_reminder',
          title: 'Care Task Reminder',
          message: 'Task due: Morning medication',
          severity: 'WARNING',
        }),
      );
    });

    it('should send INFO severity for non-urgent tasks', async () => {
      const task = {
        id: 'task-2',
        carePlanId: 'plan-1',
        title: 'Regular checkup',
        priority: 'LOW',
        dueDate: new Date(),
      };

      const carePlan = {
        id: 'plan-1',
        elderId: 'elder-1',
        elder: {
          user: {
            id: 'user-1',
          },
        },
      };

      mockPrismaService.carePlan.findUnique.mockResolvedValue(carePlan);

      await service.notifyTaskReminder(task);

      expect(notificationsGateway.sendToElderMonitors).toHaveBeenCalledWith(
        'elder-1',
        'notification:task',
        expect.objectContaining({
          severity: 'INFO',
        }),
      );
    });
  });

  describe('notifyAbnormalVital', () => {
    it('should send abnormal vital notification', async () => {
      const vital = {
        id: 'vital-1',
        elderId: 'elder-1',
        vitalType: 'BLOOD_PRESSURE',
        value: 185,
        unit: 'mmHg',
      };

      const alert = {
        id: 'alert-1',
        message: 'Blood pressure critically high',
        severity: AlertSeverity.CRITICAL,
      };

      await service.notifyAbnormalVital(vital, alert);

      expect(notificationsGateway.sendToElderMonitors).toHaveBeenCalledWith(
        'elder-1',
        'notification:vital',
        expect.objectContaining({
          type: 'vital_abnormal',
          title: 'Abnormal BLOOD PRESSURE',
          message: 'Blood pressure critically high',
        }),
      );

      expect(loggerService.logSecurity).toHaveBeenCalledWith(
        'Abnormal vital notification sent',
        'critical',
        expect.any(Object),
      );
    });

    it('should log medium security for non-critical vitals', async () => {
      const vital = {
        id: 'vital-2',
        elderId: 'elder-1',
        vitalType: 'TEMPERATURE',
        value: 99.5,
        unit: '°F',
      };

      const alert = {
        id: 'alert-2',
        message: 'Temperature slightly elevated',
        severity: AlertSeverity.WARNING,
      };

      await service.notifyAbnormalVital(vital, alert);

      expect(loggerService.logSecurity).toHaveBeenCalledWith(
        'Abnormal vital notification sent',
        'medium',
        expect.any(Object),
      );
    });
  });

  describe('notifyEmergency', () => {
    it('should send emergency notification with cancel token', async () => {
      const scenarioInstance = {
        id: 'instance-1',
        scenarioId: 'scenario-1',
        cancelToken: '1234',
      };

      const scenario = {
        id: 'scenario-1',
        name: 'Fall Detection',
        home: {
          elderId: 'elder-1',
          elder: {
            user: {
              id: 'user-1',
            },
          },
        },
      };

      mockPrismaService.emergencyScenario.findUnique.mockResolvedValue(scenario);

      await service.notifyEmergency(scenarioInstance);

      expect(notificationsGateway.sendToElderMonitors).toHaveBeenCalledWith(
        'elder-1',
        'notification:emergency',
        expect.objectContaining({
          type: 'emergency',
          title: '🚨 EMERGENCY: Fall Detection',
          message: 'Emergency scenario activated. Cancel code: 1234',
          severity: 'CRITICAL',
        }),
      );

      expect(notificationsGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:emergency',
        expect.any(Object),
      );

      expect(loggerService.logSecurity).toHaveBeenCalledWith(
        'Emergency notification sent',
        'critical',
        expect.any(Object),
      );
    });
  });

  describe('notifyPaymentStatus', () => {
    it('should send payment success notification', async () => {
      const paymentData = {
        userId: 'user-1',
        status: 'succeeded' as const,
        amount: 5000,
        currency: 'usd',
        bookingId: 'booking-1',
      };

      await service.notifyPaymentStatus(paymentData);

      expect(notificationsGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:payment',
        expect.objectContaining({
          type: 'payment',
          title: 'Payment succeeded',
          message: 'Payment of $50.00 was successful',
          severity: 'INFO',
        }),
      );
    });

    it('should send payment failed notification', async () => {
      const paymentData = {
        userId: 'user-2',
        status: 'failed' as const,
        amount: 3000,
        currency: 'usd',
      };

      await service.notifyPaymentStatus(paymentData);

      expect(notificationsGateway.sendToUser).toHaveBeenCalledWith(
        'user-2',
        'notification:payment',
        expect.objectContaining({
          type: 'payment',
          title: 'Payment failed',
          message: 'Payment of $30.00 failed',
          severity: 'WARNING',
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const elderProfile = {
        id: 'elder-1',
        userId: 'user-1',
      };

      mockPrismaService.elderProfile.findUnique.mockResolvedValue(elderProfile);
      mockPrismaService.alert.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrismaService.alert.count).toHaveBeenCalledWith({
        where: {
          elderId: 'elder-1',
          status: 'ACTIVE',
        },
      });
    });

    it('should return 0 when no elder profile exists', async () => {
      mockPrismaService.elderProfile.findUnique.mockResolvedValue(null);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(0);
    });
  });

  describe('getNotifications', () => {
    it('should retrieve notifications for user', async () => {
      const elderProfile = {
        id: 'elder-1',
        userId: 'user-1',
      };

      const alerts = [
        {
          id: 'alert-1',
          type: AlertType.VITAL_ABNORMAL,
          title: 'High Blood Pressure',
          message: 'Blood pressure is high',
          severity: AlertSeverity.WARNING,
          metadata: { value: 145 },
          triggeredAt: new Date(),
          status: 'ACTIVE',
        },
        {
          id: 'alert-2',
          type: AlertType.MEDICATION_MISSED,
          title: 'Missed Medication',
          message: 'Morning medication was missed',
          severity: AlertSeverity.INFO,
          metadata: {},
          triggeredAt: new Date(),
          status: 'ACKNOWLEDGED',
        },
      ];

      mockPrismaService.elderProfile.findUnique.mockResolvedValue(elderProfile);
      mockPrismaService.alert.findMany.mockResolvedValue(alerts);

      const result = await service.getNotifications('user-1', 20);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'alert-1',
        type: AlertType.VITAL_ABNORMAL,
        title: 'High Blood Pressure',
        message: 'Blood pressure is high',
        severity: AlertSeverity.WARNING,
        data: { value: 145 },
        createdAt: expect.any(Date),
        read: false,
      });
      expect(result[1].read).toBe(true);
    });

    it('should return empty array when no elder profile', async () => {
      mockPrismaService.elderProfile.findUnique.mockResolvedValue(null);

      const result = await service.getNotifications('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const updatedAlert = {
        id: 'alert-1',
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      };

      mockPrismaService.alert.update.mockResolvedValue(updatedAlert);

      await service.markAsRead('alert-1', 'user-1');

      expect(mockPrismaService.alert.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: expect.any(Date),
          acknowledgedBy: 'user-1',
        },
      });
    });
  });

  describe('getStats', () => {
    it('should return WebSocket statistics', () => {
      mockNotificationsGateway.getConnectedClientsCount.mockReturnValue(15);

      const result = service.getStats();

      expect(result).toEqual({
        connectedClients: 15,
      });
    });
  });
});
