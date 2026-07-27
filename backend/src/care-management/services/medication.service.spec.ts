import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { EmailService } from '../../common/email/email.service';
import { MedicationFrequency } from '@prisma/client';

describe('MedicationService', () => {
  let service: MedicationService;

  const mockPrismaService = {
    medication: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    medicationDose: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    alert: {
      create: jest.fn(),
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
    sendMedicationReminderEmail: jest.fn(),
    sendAlertNotificationEmail: jest.fn(),
  };

  /** Scheduled dose timestamps handed to prisma by the most recent createMany call. */
  const scheduledDoses = (): Date[] =>
    mockPrismaService.medicationDose.createMany.mock.calls
      .slice(-1)[0][0]
      .data.map((d: any) => d.scheduledAt);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<MedicationService>(MedicationService);

    mockPrismaService.medicationDose.createMany.mockResolvedValue({ count: 0 });
    mockPrismaService.medicationDose.deleteMany.mockResolvedValue({ count: 0 });
    mockPrismaService.alert.create.mockResolvedValue({ id: 'alert-1' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('createMedication', () => {
    const baseData = {
      elderId: 'elder-1',
      name: 'Lisinopril',
      dosage: '10mg',
      startDate: new Date(2026, 1, 1, 0, 0, 0),
      endDate: new Date(2026, 1, 3, 23, 59, 59),
    };

    const create = async (frequency: MedicationFrequency) => {
      const data = { ...baseData, frequency };
      mockPrismaService.medication.create.mockResolvedValue({ id: 'med-1', ...data });
      return service.createMedication(data);
    };

    it('marks the medication active and logs creation', async () => {
      const result = await create(MedicationFrequency.ONCE_DAILY);

      expect(result.id).toBe('med-1');
      expect(mockPrismaService.medication.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'Lisinopril', isActive: true }),
      });
      expect(mockLoggerService.logEvent).toHaveBeenCalledWith(
        'Medication created',
        'Medication',
        'med-1',
        expect.objectContaining({ elderId: 'elder-1', name: 'Lisinopril' }),
      );
    });

    it('schedules one PENDING dose per day for ONCE_DAILY', async () => {
      await create(MedicationFrequency.ONCE_DAILY);

      const doses = scheduledDoses();
      expect(doses).toHaveLength(3); // Feb 1, 2 and 3
      expect(doses.every(d => d.getHours() === 9)).toBe(true);
      expect(mockPrismaService.medicationDose.createMany.mock.calls[0][0].data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ medicationId: 'med-1', status: 'PENDING' }),
        ]),
      );
    });

    it('schedules morning and evening doses for TWICE_DAILY', async () => {
      await create(MedicationFrequency.TWICE_DAILY);

      const doses = scheduledDoses();
      expect(doses).toHaveLength(6);
      expect(doses.map(d => d.getHours())).toEqual([9, 21, 9, 21, 9, 21]);
    });

    it('schedules three daily doses for THREE_TIMES_DAILY', async () => {
      await create(MedicationFrequency.THREE_TIMES_DAILY);

      const doses = scheduledDoses();
      expect(doses).toHaveLength(9);
      expect(doses.slice(0, 3).map(d => d.getHours())).toEqual([9, 14, 21]);
    });

    it('schedules nothing for frequencies without fixed time slots', async () => {
      await create(MedicationFrequency.AS_NEEDED);

      expect(scheduledDoses()).toEqual([]);
    });
  });

  describe('getMedicationsByElder', () => {
    it('returns only active medications by default', async () => {
      mockPrismaService.medication.findMany.mockResolvedValue([]);

      await service.getMedicationsByElder('elder-1');

      expect(mockPrismaService.medication.findMany.mock.calls[0][0].where).toEqual({
        elderId: 'elder-1',
        isActive: true,
      });
    });

    it('drops the isActive filter when inactive medications are requested', async () => {
      mockPrismaService.medication.findMany.mockResolvedValue([]);

      await service.getMedicationsByElder('elder-1', true);

      expect(mockPrismaService.medication.findMany.mock.calls[0][0].where).toEqual({
        elderId: 'elder-1',
      });
    });
  });

  describe('getMedicationById', () => {
    it('returns the medication when it exists', async () => {
      mockPrismaService.medication.findUnique.mockResolvedValue({ id: 'med-1' });

      await expect(service.getMedicationById('med-1')).resolves.toEqual({ id: 'med-1' });
    });

    it('throws NotFoundException when the medication is missing', async () => {
      mockPrismaService.medication.findUnique.mockResolvedValue(null);

      await expect(service.getMedicationById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMedication', () => {
    it('reschedules future pending doses when the frequency changes', async () => {
      mockPrismaService.medication.update.mockResolvedValue({ id: 'med-1' });
      mockPrismaService.medication.findUnique.mockResolvedValue({
        id: 'med-1',
        endDate: null,
      });

      await service.updateMedication('med-1', {
        frequency: MedicationFrequency.TWICE_DAILY,
      });

      expect(mockPrismaService.medicationDose.deleteMany).toHaveBeenCalledWith({
        where: {
          medicationId: 'med-1',
          status: 'PENDING',
          scheduledAt: { gte: expect.any(Date) },
        },
      });
      expect(mockPrismaService.medicationDose.createMany).toHaveBeenCalled();
    });

    it('leaves the existing schedule alone for non-frequency updates', async () => {
      mockPrismaService.medication.update.mockResolvedValue({ id: 'med-1' });

      await service.updateMedication('med-1', { dosage: '20mg' });

      expect(mockPrismaService.medicationDose.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaService.medicationDose.createMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteMedication', () => {
    it('soft-deletes by clearing isActive rather than removing the row', async () => {
      mockPrismaService.medication.update.mockResolvedValue({
        id: 'med-1',
        isActive: false,
      });

      await service.deleteMedication('med-1');

      expect(mockPrismaService.medication.update).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        data: { isActive: false },
      });
    });
  });

  describe('markDoseTaken', () => {
    it('records the supplied time and marks the dose TAKEN without alerting', async () => {
      const takenAt = new Date(2026, 1, 1, 9, 5);
      mockPrismaService.medicationDose.update.mockResolvedValue({
        id: 'dose-1',
        medicationId: 'med-1',
        medication: { elderId: 'elder-1' },
      });

      await service.markDoseTaken('dose-1', takenAt);

      expect(mockPrismaService.medicationDose.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dose-1' },
          data: { status: 'TAKEN', takenAt },
        }),
      );
      expect(mockPrismaService.alert.create).not.toHaveBeenCalled();
    });

    it('defaults to the current time when none is given', async () => {
      mockPrismaService.medicationDose.update.mockResolvedValue({
        id: 'dose-1',
        medicationId: 'med-1',
        medication: { elderId: 'elder-1' },
      });

      await service.markDoseTaken('dose-1');

      expect(
        mockPrismaService.medicationDose.update.mock.calls[0][0].data.takenAt,
      ).toBeInstanceOf(Date);
    });
  });

  describe('markDoseMissed', () => {
    it('marks the dose MISSED and raises a WARNING alert for the elder', async () => {
      mockPrismaService.medicationDose.update.mockResolvedValue({
        id: 'dose-1',
        medicationId: 'med-1',
        scheduledAt: new Date(2026, 1, 1, 9, 0),
        medication: { elderId: 'elder-1', name: 'Lisinopril' },
      });

      await service.markDoseMissed('dose-1');

      expect(mockPrismaService.medicationDose.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'MISSED' } }),
      );
      expect(mockPrismaService.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          elderId: 'elder-1',
          type: 'MEDICATION_MISSED',
          severity: 'WARNING',
          status: 'ACTIVE',
          title: 'Medication Missed',
          metadata: { medicationId: 'med-1', doseId: 'dose-1' },
        }),
      });
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith(
        'Medication dose missed',
        'medium',
        expect.objectContaining({ doseId: 'dose-1', medicationName: 'Lisinopril' }),
      );
    });
  });

  describe('checkMissedDoses', () => {
    it('only considers pending doses past the 30 minute grace period', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-02-01T12:00:00.000Z'));
      mockPrismaService.medicationDose.findMany.mockResolvedValue([]);

      await service.checkMissedDoses();

      expect(mockPrismaService.medicationDose.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
            scheduledAt: { lte: new Date('2026-02-01T11:30:00.000Z') },
            medication: { isActive: true },
          }),
        }),
      );
    });

    it('marks every overdue dose as missed and reports how many it handled', async () => {
      mockPrismaService.medicationDose.findMany.mockResolvedValue([
        { id: 'dose-1' },
        { id: 'dose-2' },
      ]);
      const markMissed = jest
        .spyOn(service, 'markDoseMissed')
        .mockResolvedValue({} as any);

      const result = await service.checkMissedDoses();

      expect(markMissed).toHaveBeenCalledTimes(2);
      expect(markMissed).toHaveBeenCalledWith('dose-1');
      expect(markMissed).toHaveBeenCalledWith('dose-2');
      expect(result).toEqual({ checkedDoses: 2 });
    });
  });

  describe('getAdherenceStats', () => {
    it('excludes still-pending doses from the adherence denominator', async () => {
      mockPrismaService.medicationDose.findMany.mockResolvedValue([
        ...Array(7).fill({ status: 'TAKEN' }),
        ...Array(2).fill({ status: 'MISSED' }),
        { status: 'PENDING' },
      ]);

      const result = await service.getAdherenceStats('elder-1', 30);

      expect(result.totalDoses).toBe(10);
      expect(result.takenDoses).toBe(7);
      expect(result.missedDoses).toBe(2);
      expect(result.pendingDoses).toBe(1);
      // 7 taken out of the 9 doses that were actually due
      expect(result.adherenceRate).toBe(77.8);
      expect(result.period.days).toBe(30);
    });

    it('reports full adherence when there are no doses in the period', async () => {
      mockPrismaService.medicationDose.findMany.mockResolvedValue([]);

      const result = await service.getAdherenceStats('elder-1', 30);

      expect(result.totalDoses).toBe(0);
      expect(result.adherenceRate).toBe(100);
    });
  });

  describe('getUpcomingDoses', () => {
    it('restricts the query to pending doses of active medications in the window', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
      mockPrismaService.medicationDose.findMany.mockResolvedValue([]);

      await service.getUpcomingDoses('elder-1', 7);

      expect(mockPrismaService.medicationDose.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            medication: { elderId: 'elder-1', isActive: true },
            scheduledAt: {
              gte: new Date('2026-02-01T00:00:00.000Z'),
              lte: new Date('2026-02-08T00:00:00.000Z'),
            },
            status: 'PENDING',
          },
        }),
      );
    });
  });
});
