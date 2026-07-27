import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { EmailService } from '../../common/email/email.service';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

describe('AppointmentService', () => {
  let service: AppointmentService;

  const mockPrismaService = {
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockLoggerService = {
    log: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logEvent: jest.fn(),
    logSecurity: jest.fn(),
  };

  const mockEmailService = {
    sendAppointmentReminderEmail: jest.fn(),
  };

  const elder = {
    user: { email: 'elder@example.com', firstName: 'Ada' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);

    mockEmailService.sendAppointmentReminderEmail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('createAppointment', () => {
    const data = {
      elderId: 'elder-1',
      title: 'Cardiology follow-up',
      type: AppointmentType.MEDICAL_CHECKUP,
      startTime: new Date('2026-03-01T15:00:00.000Z'),
      endTime: new Date('2026-03-01T16:00:00.000Z'),
    };

    it('creates the appointment as SCHEDULED and emails the elder', async () => {
      mockPrismaService.appointment.create.mockResolvedValue({
        id: 'appt-1',
        ...data,
        elder,
      });

      const result = await service.createAppointment({
        ...data,
        attendees: { clinician: 'Dr. Reed' },
      });

      expect(result.id).toBe('appt-1');
      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SCHEDULED', elderId: 'elder-1' }),
        }),
      );
      expect(mockEmailService.sendAppointmentReminderEmail).toHaveBeenCalledWith({
        to: 'elder@example.com',
        firstName: 'Ada',
        appointmentDetails: {
          serviceType: 'Cardiology follow-up',
          date: data.startTime,
          clinicianName: 'Dr. Reed',
        },
      });
      expect(mockLoggerService.logEvent).toHaveBeenCalledWith(
        'Appointment created',
        'Appointment',
        'appt-1',
        expect.objectContaining({ elderId: 'elder-1' }),
      );
    });

    it('falls back to a generic clinician name when no attendee is supplied', async () => {
      mockPrismaService.appointment.create.mockResolvedValue({
        id: 'appt-2',
        ...data,
        elder,
      });

      await service.createAppointment(data);

      expect(
        mockEmailService.sendAppointmentReminderEmail.mock.calls[0][0].appointmentDetails
          .clinicianName,
      ).toBe('Healthcare Provider');
    });

    it('still returns the appointment when the confirmation email fails', async () => {
      mockPrismaService.appointment.create.mockResolvedValue({
        id: 'appt-3',
        ...data,
        elder,
      });
      mockEmailService.sendAppointmentReminderEmail.mockRejectedValue(
        new Error('smtp unavailable'),
      );

      const result = await service.createAppointment(data);

      expect(result.id).toBe('appt-3');
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to send appointment email',
        '',
        'AppointmentService',
        expect.objectContaining({
          appointmentId: 'appt-3',
          error: 'smtp unavailable',
        }),
      );
    });
  });

  describe('getAppointmentsByElder', () => {
    beforeEach(() => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
    });

    it('hides completed appointments unless they are explicitly requested', async () => {
      await service.getAppointmentsByElder('elder-1');

      expect(mockPrismaService.appointment.findMany.mock.calls[0][0].where).toEqual({
        elderId: 'elder-1',
        status: { not: 'COMPLETED' },
      });
    });

    it('honours an explicit status filter when completed items are included', async () => {
      await service.getAppointmentsByElder('elder-1', {
        status: AppointmentStatus.CONFIRMED,
        includeCompleted: true,
      });

      expect(mockPrismaService.appointment.findMany.mock.calls[0][0].where).toEqual({
        elderId: 'elder-1',
        status: AppointmentStatus.CONFIRMED,
      });
    });

    it('builds a bounded startTime range from the supplied dates', async () => {
      const startDate = new Date('2026-03-01T00:00:00.000Z');
      const endDate = new Date('2026-03-31T00:00:00.000Z');

      await service.getAppointmentsByElder('elder-1', {
        type: AppointmentType.THERAPY,
        startDate,
        endDate,
        includeCompleted: true,
      });

      expect(mockPrismaService.appointment.findMany.mock.calls[0][0].where).toEqual({
        elderId: 'elder-1',
        type: AppointmentType.THERAPY,
        startTime: { gte: startDate, lte: endDate },
      });
    });
  });

  describe('getAppointmentById', () => {
    it('returns the appointment when it exists', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({ id: 'appt-1' });

      await expect(service.getAppointmentById('appt-1')).resolves.toEqual({
        id: 'appt-1',
      });
    });

    it('throws NotFoundException when the appointment is missing', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(service.getAppointmentById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUpcomingAppointments', () => {
    it('looks ahead the requested number of days for open appointments only', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-01T00:00:00.000Z'));
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      await service.getUpcomingAppointments('elder-1', 7);

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          elderId: 'elder-1',
          startTime: {
            gte: new Date('2026-03-01T00:00:00.000Z'),
            lte: new Date('2026-03-08T00:00:00.000Z'),
          },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('cancelAppointment', () => {
    it('records the cancellation reason in the notes', async () => {
      mockPrismaService.appointment.update.mockResolvedValue({ id: 'appt-1', elder });

      await service.cancelAppointment('appt-1', 'elder unwell');

      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'appt-1' },
          data: { status: 'CANCELLED', notes: 'Cancelled: elder unwell' },
        }),
      );
    });

    it('uses a plain marker when no reason is given', async () => {
      mockPrismaService.appointment.update.mockResolvedValue({ id: 'appt-1', elder });

      await service.cancelAppointment('appt-1');

      expect(mockPrismaService.appointment.update.mock.calls[0][0].data).toEqual({
        status: 'CANCELLED',
        notes: 'Cancelled',
      });
    });
  });

  describe('completeAppointment', () => {
    it('sets the COMPLETED status and stores the visit notes', async () => {
      mockPrismaService.appointment.update.mockResolvedValue({ id: 'appt-1' });

      await service.completeAppointment('appt-1', 'BP stable');

      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
        data: { status: 'COMPLETED', notes: 'BP stable' },
      });
      expect(mockLoggerService.logEvent).toHaveBeenCalledWith(
        'Appointment completed',
        'Appointment',
        'appt-1',
        {},
      );
    });
  });

  describe('sendAppointmentReminders', () => {
    it('targets the 24-48 hour window and emails every open appointment', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-01T00:00:00.000Z'));
      mockPrismaService.appointment.findMany.mockResolvedValue([
        {
          id: 'appt-1',
          title: 'Therapy',
          startTime: new Date('2026-03-02T10:00:00.000Z'),
          attendees: { clinician: 'Dr. Reed' },
          elder,
        },
        {
          id: 'appt-2',
          title: 'Checkup',
          startTime: new Date('2026-03-02T14:00:00.000Z'),
          attendees: null,
          elder,
        },
      ]);

      const result = await service.sendAppointmentReminders();

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            startTime: {
              gte: new Date('2026-03-02T00:00:00.000Z'),
              lte: new Date('2026-03-03T00:00:00.000Z'),
            },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
        }),
      );
      expect(mockEmailService.sendAppointmentReminderEmail).toHaveBeenCalledTimes(2);
      expect(
        mockEmailService.sendAppointmentReminderEmail.mock.calls[1][0].appointmentDetails
          .clinicianName,
      ).toBe('Healthcare Provider');
      expect(result).toEqual({ remindersSent: 2 });
    });

    it('keeps going and still reports the count when an email fails', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([
        { id: 'appt-1', title: 'Therapy', startTime: new Date(), attendees: null, elder },
      ]);
      mockEmailService.sendAppointmentReminderEmail.mockRejectedValue(
        new Error('smtp unavailable'),
      );

      const result = await service.sendAppointmentReminders();

      expect(result).toEqual({ remindersSent: 1 });
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to send appointment reminder',
        '',
        'AppointmentService',
        expect.objectContaining({ appointmentId: 'appt-1' }),
      );
    });

    it('sends nothing when no appointments fall in the window', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      const result = await service.sendAppointmentReminders();

      expect(mockEmailService.sendAppointmentReminderEmail).not.toHaveBeenCalled();
      expect(result).toEqual({ remindersSent: 0 });
    });
  });

  describe('getAppointmentStats', () => {
    it('excludes cancellations from the attendance denominator', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([
        ...Array(6).fill({ status: AppointmentStatus.COMPLETED }),
        ...Array(2).fill({ status: AppointmentStatus.CANCELLED }),
        { status: AppointmentStatus.NO_SHOW },
        { status: AppointmentStatus.SCHEDULED },
      ]);

      const result = await service.getAppointmentStats('elder-1', 30);

      expect(result.totalAppointments).toBe(10);
      expect(result.completed).toBe(6);
      expect(result.cancelled).toBe(2);
      expect(result.noShow).toBe(1);
      expect(result.upcoming).toBe(1);
      // 6 completed out of the 8 that were not cancelled
      expect(result.attendanceRate).toBe(75);
      expect(result.period.days).toBe(30);
    });

    it('counts CONFIRMED alongside SCHEDULED as upcoming', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([
        { status: AppointmentStatus.SCHEDULED },
        { status: AppointmentStatus.CONFIRMED },
      ]);

      const result = await service.getAppointmentStats('elder-1', 30);

      expect(result.upcoming).toBe(2);
      expect(result.attendanceRate).toBe(0);
    });

    it('reports a perfect rate when there is no history yet', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAppointmentStats('elder-1', 30);

      expect(result.totalAppointments).toBe(0);
      expect(result.attendanceRate).toBe(100);
    });
  });

  describe('deleteAppointment', () => {
    it('hard-deletes the appointment row', async () => {
      mockPrismaService.appointment.delete.mockResolvedValue({ id: 'appt-1' });

      await service.deleteAppointment('appt-1');

      expect(mockPrismaService.appointment.delete).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
      });
    });
  });
});
