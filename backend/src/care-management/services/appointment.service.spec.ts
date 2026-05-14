import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { EmailService } from '../../common/email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let notificationsService: NotificationsService;
  let loggerService: LoggerService;

  const mockPrismaService = {
    appointment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    elderProfile: {
      findUnique: jest.fn(),
    },
  };

  const mockEmailService = {
    sendAppointmentReminderEmail: jest.fn(),
  };

  const mockNotificationsService = {
    notifyAppointmentReminder: jest.fn(),
  };

  const mockLoggerService = {
    debug: jest.fn(),
    logEvent: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAppointment', () => {
    it('should create an appointment and send email notification', async () => {
      const appointmentData = {
        elderId: 'elder-1',
        title: 'Annual Checkup',
        type: AppointmentType.DOCTOR_VISIT,
        startTime: new Date('2024-02-15T10:00:00Z'),
        endTime: new Date('2024-02-15T11:00:00Z'),
        location: 'General Hospital',
        notes: 'Bring medication list',
      };

      const elder = {
        id: 'elder-1',
        user: {
          email: 'elder@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const createdAppointment = {
        id: 'appt-1',
        ...appointmentData,
        status: AppointmentStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.elderProfile.findUnique.mockResolvedValue(elder);
      mockPrismaService.appointment.create.mockResolvedValue(createdAppointment);

      const result = await service.createAppointment(appointmentData);

      expect(result).toEqual(createdAppointment);
      expect(prismaService.appointment.create).toHaveBeenCalledWith({
        data: {
          ...appointmentData,
          status: AppointmentStatus.SCHEDULED,
        },
      });
      expect(emailService.sendAppointmentReminderEmail).toHaveBeenCalled();
    });

    it('should handle appointment creation without elder profile', async () => {
      const appointmentData = {
        elderId: 'elder-1',
        title: 'Therapy Session',
        type: AppointmentType.THERAPY,
        startTime: new Date('2024-02-15T14:00:00Z'),
        endTime: new Date('2024-02-15T15:00:00Z'),
        location: 'Therapy Center',
      };

      const createdAppointment = {
        id: 'appt-2',
        ...appointmentData,
        status: AppointmentStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.elderProfile.findUnique.mockResolvedValue(null);
      mockPrismaService.appointment.create.mockResolvedValue(createdAppointment);

      const result = await service.createAppointment(appointmentData);

      expect(result).toEqual(createdAppointment);
      expect(emailService.sendAppointmentReminderEmail).not.toHaveBeenCalled();
    });
  });

  describe('getAppointment', () => {
    it('should retrieve appointment by id', async () => {
      const appointment = {
        id: 'appt-1',
        title: 'Dental Checkup',
        status: AppointmentStatus.SCHEDULED,
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);

      const result = await service.getAppointment('appt-1');

      expect(result).toEqual(appointment);
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
      });
    });
  });

  describe('getElderAppointments', () => {
    it('should retrieve all appointments for an elder', async () => {
      const appointments = [
        {
          id: 'appt-1',
          title: 'Doctor Visit',
          startTime: new Date('2024-02-15'),
        },
        {
          id: 'appt-2',
          title: 'Lab Work',
          startTime: new Date('2024-02-20'),
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.getElderAppointments('elder-1');

      expect(result).toEqual(appointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { elderId: 'elder-1' },
        orderBy: { startTime: 'asc' },
      });
    });

    it('should filter appointments by status', async () => {
      const scheduledAppointments = [
        {
          id: 'appt-1',
          title: 'Upcoming Visit',
          status: AppointmentStatus.SCHEDULED,
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(scheduledAppointments);

      const result = await service.getElderAppointments(
        'elder-1',
        AppointmentStatus.SCHEDULED,
      );

      expect(result).toEqual(scheduledAppointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          elderId: 'elder-1',
          status: AppointmentStatus.SCHEDULED,
        },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('getUpcomingAppointments', () => {
    it('should retrieve upcoming appointments within time range', async () => {
      const upcomingAppointments = [
        {
          id: 'appt-1',
          title: 'Next Week Visit',
          startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(upcomingAppointments);

      const result = await service.getUpcomingAppointments('elder-1', 7);

      expect(result).toBeDefined();
      expect(prismaService.appointment.findMany).toHaveBeenCalled();
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update appointment status to COMPLETED', async () => {
      const updatedAppointment = {
        id: 'appt-1',
        status: AppointmentStatus.COMPLETED,
      };

      mockPrismaService.appointment.update.mockResolvedValue(updatedAppointment);

      const result = await service.updateAppointmentStatus(
        'appt-1',
        AppointmentStatus.COMPLETED,
        'Appointment went well',
      );

      expect(result).toEqual(updatedAppointment);
      expect(prismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
        data: {
          status: AppointmentStatus.COMPLETED,
          notes: 'Appointment went well',
        },
      });
    });

    it('should update appointment status to CANCELLED', async () => {
      const updatedAppointment = {
        id: 'appt-1',
        status: AppointmentStatus.CANCELLED,
      };

      mockPrismaService.appointment.update.mockResolvedValue(updatedAppointment);

      const result = await service.updateAppointmentStatus(
        'appt-1',
        AppointmentStatus.CANCELLED,
        'Patient unavailable',
      );

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment details', async () => {
      const updateData = {
        title: 'Updated Title',
        location: 'New Location',
        startTime: new Date('2024-03-01T10:00:00Z'),
      };

      const updatedAppointment = {
        id: 'appt-1',
        ...updateData,
      };

      mockPrismaService.appointment.update.mockResolvedValue(updatedAppointment);

      const result = await service.updateAppointment('appt-1', updateData);

      expect(result).toEqual(updatedAppointment);
      expect(prismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
        data: updateData,
      });
    });
  });

  describe('deleteAppointment', () => {
    it('should delete appointment', async () => {
      const deletedAppointment = {
        id: 'appt-1',
        title: 'Deleted Appointment',
      };

      mockPrismaService.appointment.update.mockResolvedValue(deletedAppointment);

      const result = await service.deleteAppointment('appt-1');

      expect(result).toEqual(deletedAppointment);
      expect(prismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
        data: {
          status: AppointmentStatus.CANCELLED,
        },
      });
    });
  });

  describe('sendAppointmentReminders', () => {
    it('should send reminders for upcoming appointments', async () => {
      const upcomingAppointments = [
        {
          id: 'appt-1',
          elderId: 'elder-1',
          title: 'Tomorrow Appointment',
          startTime: new Date(Date.now() + 20 * 60 * 60 * 1000),
          type: AppointmentType.DOCTOR_VISIT,
          location: 'Hospital',
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(upcomingAppointments);

      await service.sendAppointmentReminders();

      expect(prismaService.appointment.findMany).toHaveBeenCalled();
      expect(notificationsService.notifyAppointmentReminder).toHaveBeenCalledWith(
        upcomingAppointments[0],
      );
    });

    it('should handle empty appointments list', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      await service.sendAppointmentReminders();

      expect(notificationsService.notifyAppointmentReminder).not.toHaveBeenCalled();
    });
  });

  describe('getAppointmentStats', () => {
    it('should calculate appointment statistics', async () => {
      mockPrismaService.appointment.count
        .mockResolvedValueOnce(25) // total
        .mockResolvedValueOnce(15) // completed
        .mockResolvedValueOnce(8) // scheduled
        .mockResolvedValueOnce(2); // cancelled

      const result = await service.getAppointmentStats('elder-1', 30);

      expect(result.total).toBe(25);
      expect(result.completed).toBe(15);
      expect(result.scheduled).toBe(8);
      expect(result.cancelled).toBe(2);
      expect(result.completionRate).toBe(60);
    });

    it('should handle zero appointments', async () => {
      mockPrismaService.appointment.count.mockResolvedValue(0);

      const result = await service.getAppointmentStats('elder-1', 30);

      expect(result.total).toBe(0);
      expect(result.completionRate).toBe(0);
    });
  });
});
