import { Test, TestingModule } from '@nestjs/testing';
import { MedicationService } from './medication.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { EmailService } from '../../common/email/email.service';
import { MedicationFrequency } from '@prisma/client';

describe('MedicationService', () => {
  let service: MedicationService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let loggerService: LoggerService;

  const mockPrismaService = {
    medication: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    medicationDose: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    elderProfile: {
      findUnique: jest.fn(),
    },
  };

  const mockEmailService = {
    sendMedicationReminderEmail: jest.fn(),
  };

  const mockLoggerService = {
    debug: jest.fn(),
    logEvent: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<MedicationService>(MedicationService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMedication', () => {
    it('should create medication and schedule doses', async () => {
      const medicationData = {
        elderId: 'elder-1',
        name: 'Aspirin',
        dosage: '100mg',
        frequency: MedicationFrequency.ONCE_DAILY,
        startDate: new Date('2024-01-01'),
        instructions: 'Take with food',
      };

      const createdMedication = {
        id: 'med-1',
        ...medicationData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        endDate: null,
        sideEffects: null,
        prescribedBy: null,
      };

      mockPrismaService.medication.create.mockResolvedValue(createdMedication);
      mockPrismaService.medicationDose.createMany.mockResolvedValue({ count: 90 });

      const result = await service.createMedication(medicationData);

      expect(result).toEqual(createdMedication);
      expect(prismaService.medication.create).toHaveBeenCalledWith({
        data: {
          ...medicationData,
          isActive: true,
        },
      });
      expect(prismaService.medicationDose.createMany).toHaveBeenCalled();
    });

    it('should handle medication creation with end date', async () => {
      const medicationData = {
        elderId: 'elder-1',
        name: 'Antibiotic',
        dosage: '500mg',
        frequency: MedicationFrequency.TWICE_DAILY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        instructions: 'Complete full course',
      };

      const createdMedication = {
        id: 'med-2',
        ...medicationData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sideEffects: null,
        prescribedBy: null,
      };

      mockPrismaService.medication.create.mockResolvedValue(createdMedication);
      mockPrismaService.medicationDose.createMany.mockResolvedValue({ count: 28 });

      const result = await service.createMedication(medicationData);

      expect(result).toEqual(createdMedication);
      expect(prismaService.medicationDose.createMany).toHaveBeenCalled();
    });
  });

  describe('generateDoseSchedule', () => {
    it('should generate daily doses for ONCE_DAILY frequency', () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-07T23:59:59Z');

      const schedule = (service as any).generateDoseSchedule(
        MedicationFrequency.ONCE_DAILY,
        startDate,
        endDate,
      );

      expect(schedule.length).toBe(7); // 7 days
      expect(schedule[0].getHours()).toBe(9); // 9 AM
    });

    it('should generate multiple doses per day for TWICE_DAILY', () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-03T23:59:59Z');

      const schedule = (service as any).generateDoseSchedule(
        MedicationFrequency.TWICE_DAILY,
        startDate,
        endDate,
      );

      expect(schedule.length).toBe(6); // 3 days * 2 doses
    });

    it('should generate doses for THREE_TIMES_DAILY', () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-02T23:59:59Z');

      const schedule = (service as any).generateDoseSchedule(
        MedicationFrequency.THREE_TIMES_DAILY,
        startDate,
        endDate,
      );

      expect(schedule.length).toBe(6); // 2 days * 3 doses
    });

    it('should limit schedule to 90 days when no end date', () => {
      const startDate = new Date('2024-01-01T00:00:00Z');

      const schedule = (service as any).generateDoseSchedule(
        MedicationFrequency.ONCE_DAILY,
        startDate,
      );

      expect(schedule.length).toBeLessThanOrEqual(90);
    });
  });

  describe('getMedication', () => {
    it('should retrieve medication by id', async () => {
      const medication = {
        id: 'med-1',
        elderId: 'elder-1',
        name: 'Aspirin',
        dosage: '100mg',
        frequency: MedicationFrequency.ONCE_DAILY,
        isActive: true,
      };

      mockPrismaService.medication.findUnique.mockResolvedValue(medication);

      const result = await service.getMedication('med-1');

      expect(result).toEqual(medication);
      expect(prismaService.medication.findUnique).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        include: {
          doses: {
            where: { status: 'PENDING' },
            orderBy: { scheduledAt: 'asc' },
            take: 10,
          },
        },
      });
    });
  });

  describe('getElderMedications', () => {
    it('should retrieve all active medications for an elder', async () => {
      const medications = [
        { id: 'med-1', name: 'Aspirin', isActive: true },
        { id: 'med-2', name: 'Vitamin D', isActive: true },
      ];

      mockPrismaService.medication.findMany.mockResolvedValue(medications);

      const result = await service.getElderMedications('elder-1');

      expect(result).toEqual(medications);
      expect(prismaService.medication.findMany).toHaveBeenCalledWith({
        where: { elderId: 'elder-1', isActive: true },
        include: {
          doses: {
            where: { status: 'PENDING' },
            orderBy: { scheduledAt: 'asc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('recordDoseTaken', () => {
    it('should record dose as taken', async () => {
      const dose = {
        id: 'dose-1',
        medicationId: 'med-1',
        status: 'PENDING',
      };

      const updatedDose = {
        ...dose,
        status: 'TAKEN',
        takenAt: new Date(),
      };

      mockPrismaService.medicationDose.findUnique = jest.fn().mockResolvedValue(dose);
      mockPrismaService.medicationDose.update.mockResolvedValue(updatedDose);

      const result = await service.recordDoseTaken('dose-1', 'user-1');

      expect(result).toEqual(updatedDose);
      expect(prismaService.medicationDose.update).toHaveBeenCalledWith({
        where: { id: 'dose-1' },
        data: {
          status: 'TAKEN',
          takenAt: expect.any(Date),
          takenByUserId: 'user-1',
        },
      });
    });
  });

  describe('recordDoseMissed', () => {
    it('should record dose as missed', async () => {
      const dose = {
        id: 'dose-1',
        medicationId: 'med-1',
        status: 'PENDING',
      };

      const updatedDose = {
        ...dose,
        status: 'MISSED',
      };

      mockPrismaService.medicationDose.findUnique = jest.fn().mockResolvedValue(dose);
      mockPrismaService.medicationDose.update.mockResolvedValue(updatedDose);

      const result = await service.recordDoseMissed('dose-1', 'forgot to take');

      expect(result).toEqual(updatedDose);
      expect(prismaService.medicationDose.update).toHaveBeenCalledWith({
        where: { id: 'dose-1' },
        data: {
          status: 'MISSED',
          notes: 'forgot to take',
        },
      });
    });
  });

  describe('getUpcomingDoses', () => {
    it('should retrieve upcoming doses for an elder', async () => {
      const medications = [
        {
          id: 'med-1',
          elderId: 'elder-1',
          doses: [
            { id: 'dose-1', scheduledAt: new Date() },
            { id: 'dose-2', scheduledAt: new Date() },
          ],
        },
      ];

      mockPrismaService.medication.findMany.mockResolvedValue(medications);

      const result = await service.getUpcomingDoses('elder-1', 24);

      expect(result).toBeDefined();
      expect(prismaService.medication.findMany).toHaveBeenCalled();
    });
  });

  describe('getAdherenceStats', () => {
    it('should calculate medication adherence statistics', async () => {
      mockPrismaService.medicationDose.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(85) // taken
        .mockResolvedValueOnce(10) // missed
        .mockResolvedValueOnce(5); // skipped

      const result = await service.getAdherenceStats('med-1', 30);

      expect(result.total).toBe(100);
      expect(result.taken).toBe(85);
      expect(result.missed).toBe(10);
      expect(result.skipped).toBe(5);
      expect(result.adherenceRate).toBe(85);
    });

    it('should handle zero doses gracefully', async () => {
      mockPrismaService.medicationDose.count.mockResolvedValue(0);

      const result = await service.getAdherenceStats('med-1', 30);

      expect(result.total).toBe(0);
      expect(result.adherenceRate).toBe(0);
    });
  });

  describe('deactivateMedication', () => {
    it('should deactivate medication', async () => {
      const medication = {
        id: 'med-1',
        isActive: false,
      };

      mockPrismaService.medication.update.mockResolvedValue(medication);

      const result = await service.deactivateMedication('med-1');

      expect(result).toEqual(medication);
      expect(prismaService.medication.update).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        data: { isActive: false },
      });
    });
  });
});
