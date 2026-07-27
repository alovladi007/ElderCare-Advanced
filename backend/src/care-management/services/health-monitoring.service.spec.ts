import { Test, TestingModule } from '@nestjs/testing';
import { HealthMonitoringService } from './health-monitoring.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { VitalType } from '@prisma/client';

describe('HealthMonitoringService', () => {
  let service: HealthMonitoringService;

  const mockPrismaService = {
    vitalReading: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    alert: {
      create: jest.fn(),
      findMany: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthMonitoringService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<HealthMonitoringService>(HealthMonitoringService);

    mockPrismaService.alert.create.mockResolvedValue({ id: 'alert-1' });
    mockPrismaService.alert.findMany.mockResolvedValue([]);
    mockPrismaService.vitalReading.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('recordVital', () => {
    const record = async (vital: any) => {
      mockPrismaService.vitalReading.create.mockResolvedValue({
        id: 'vital-1',
        recordedAt: new Date(),
        ...vital,
      });
      return service.recordVital(vital);
    };

    it('persists the reading with a recordedAt timestamp and logs the event', async () => {
      const data = {
        elderId: 'elder-1',
        vitalType: VitalType.HEART_RATE,
        value: 72,
        unit: 'bpm',
      };

      const result = await record(data);

      expect(result).toMatchObject(data);
      expect(mockPrismaService.vitalReading.create).toHaveBeenCalledWith({
        data: { ...data, recordedAt: expect.any(Date) },
      });
      expect(mockLoggerService.logEvent).toHaveBeenCalledWith(
        'Vital recorded',
        'VitalReading',
        'vital-1',
        expect.objectContaining({ elderId: 'elder-1', value: 72 }),
      );
    });

    it('does not raise an alert for an in-range reading', async () => {
      await record({
        elderId: 'elder-1',
        vitalType: VitalType.SPO2,
        value: 97,
        unit: '%',
      });

      expect(mockPrismaService.alert.create).not.toHaveBeenCalled();
      expect(mockLoggerService.logSecurity).not.toHaveBeenCalled();
    });

    it('raises a CRITICAL alert when a value crosses the critical-low threshold', async () => {
      // HEART_RATE critical_low is 50
      await record({
        elderId: 'elder-1',
        vitalType: VitalType.HEART_RATE,
        value: 45,
        unit: 'bpm',
      });

      expect(mockPrismaService.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          elderId: 'elder-1',
          type: 'VITAL_ABNORMAL',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          message: 'Critical low heart rate: 45 bpm',
        }),
      });
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith(
        'Abnormal vital detected',
        'critical',
        expect.objectContaining({ severity: 'CRITICAL' }),
      );
    });

    it('raises only a WARNING when a value is outside normal range but not critical', async () => {
      // TEMPERATURE normal 97-99, critical_high 103
      await record({
        elderId: 'elder-1',
        vitalType: VitalType.TEMPERATURE,
        value: 100.4,
        unit: 'F',
      });

      expect(mockPrismaService.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'WARNING',
          message: 'Abnormal temperature: 100.4 F',
        }),
      });
      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith(
        'Abnormal vital detected',
        'medium',
        expect.objectContaining({ severity: 'WARNING' }),
      );
    });

    it('evaluates blood pressure against the systolic value', async () => {
      await record({
        elderId: 'elder-1',
        vitalType: VitalType.BLOOD_PRESSURE,
        value: 185,
        systolic: 185,
        diastolic: 110,
        unit: 'mmHg',
      });

      expect(mockPrismaService.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'CRITICAL',
          message: 'Critical blood pressure: 185/110 mmHg',
        }),
      });
    });

    it('flags a systolic reading above normal but below critical as a WARNING', async () => {
      await record({
        elderId: 'elder-1',
        vitalType: VitalType.BLOOD_PRESSURE,
        value: 150,
        systolic: 150,
        diastolic: 95,
        unit: 'mmHg',
      });

      expect(mockPrismaService.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'WARNING',
          message: 'Abnormal blood pressure: 150/95 mmHg',
        }),
      });
    });
  });

  describe('getVitalsByElder', () => {
    it('queries a rolling window and optionally narrows by vital type', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-31T00:00:00.000Z'));
      mockPrismaService.vitalReading.findMany.mockResolvedValue([]);

      await service.getVitalsByElder('elder-1', VitalType.GLUCOSE, 7);

      expect(mockPrismaService.vitalReading.findMany).toHaveBeenCalledWith({
        where: {
          elderId: 'elder-1',
          vitalType: VitalType.GLUCOSE,
          recordedAt: { gte: new Date('2026-01-24T00:00:00.000Z') },
        },
        orderBy: { recordedAt: 'desc' },
      });
    });

    it('omits the vitalType filter when none is supplied', async () => {
      mockPrismaService.vitalReading.findMany.mockResolvedValue([]);

      await service.getVitalsByElder('elder-1');

      const where = mockPrismaService.vitalReading.findMany.mock.calls[0][0].where;
      expect(where).not.toHaveProperty('vitalType');
    });
  });

  describe('getLatestVitals', () => {
    it('returns a map keyed by vital type, skipping types with no readings', async () => {
      mockPrismaService.vitalReading.findFirst.mockImplementation(
        async ({ where }: any) =>
          where.vitalType === VitalType.WEIGHT
            ? { id: 'v-w', vitalType: VitalType.WEIGHT, value: 160 }
            : null,
      );

      const result = await service.getLatestVitals('elder-1');

      // One lookup per known vital type
      expect(mockPrismaService.vitalReading.findFirst).toHaveBeenCalledTimes(7);
      expect(Object.keys(result)).toEqual([VitalType.WEIGHT]);
      expect(result[VitalType.WEIGHT].value).toBe(160);
    });
  });

  describe('getVitalStats', () => {
    it('computes average, min, max and standard deviation over the readings', async () => {
      mockPrismaService.vitalReading.findMany.mockResolvedValue(
        [120, 115, 125, 118, 122].map((value, i) => ({ id: `v-${i}`, value })),
      );

      const result = await service.getVitalStats('elder-1', VitalType.BLOOD_PRESSURE, 30);

      expect(result.period).toEqual({ days: 30, totalReadings: 5 });
      expect(result.statistics).toEqual({
        average: 120,
        min: 115,
        max: 125,
        stdDev: 3.41,
        trend: 'stable',
      });
      expect(result.normalRange).toEqual({ min: 90, max: 140 });
      expect(result.adherence).toEqual({ inRange: 5, abnormal: 0, percentage: 100 });
      expect(result.latestReading).toEqual({ id: 'v-0', value: 120 });
    });

    it('detects an increasing trend and counts out-of-range readings', async () => {
      // Readings are newest-first; the two most recent are far above the rest.
      const values = [140, 140, ...Array(10).fill(80)];
      mockPrismaService.vitalReading.findMany.mockResolvedValue(
        values.map((value, i) => ({ id: `v-${i}`, value })),
      );

      const result = await service.getVitalStats('elder-1', VitalType.HEART_RATE, 30);

      expect(result.statistics.trend).toBe('increasing');
      expect(result.statistics.max).toBe(140);
      // HEART_RATE normal range is 60-100, so the two 140s are abnormal.
      expect(result.adherence).toEqual({ inRange: 10, abnormal: 2, percentage: 83 });
    });

    it('returns null when the elder has no readings in the period', async () => {
      mockPrismaService.vitalReading.findMany.mockResolvedValue([]);

      const result = await service.getVitalStats('elder-1', VitalType.GLUCOSE, 30);

      expect(result).toBeNull();
    });
  });

  describe('getHealthSummary', () => {
    it('reports "critical" as soon as one reading breaches a critical threshold', async () => {
      mockPrismaService.vitalReading.findMany.mockResolvedValue([
        { id: 'v-1', vitalType: VitalType.HEART_RATE, value: 45 },
        { id: 'v-2', vitalType: VitalType.HEART_RATE, value: 72 },
      ]);

      const result = await service.getHealthSummary('elder-1', 30);

      expect(result.healthStatus).toBe('critical');
      expect(result.statistics).toEqual({
        abnormalReadings: 0,
        criticalReadings: 1,
        normalReadings: 1,
      });
      expect(result.period).toEqual({ days: 30, totalReadings: 2 });
    });

    it('reports "warning" when more than 20% of readings are abnormal', async () => {
      const readings = [
        ...Array(3).fill({ vitalType: VitalType.HEART_RATE, value: 110 }),
        ...Array(7).fill({ vitalType: VitalType.HEART_RATE, value: 72 }),
      ];
      mockPrismaService.vitalReading.findMany.mockResolvedValue(readings);

      const result = await service.getHealthSummary('elder-1', 30);

      expect(result.statistics.criticalReadings).toBe(0);
      expect(result.statistics.abnormalReadings).toBe(3);
      expect(result.healthStatus).toBe('warning');
    });

    it('reports "normal" when abnormal readings stay at or below the 20% threshold', async () => {
      const readings = [
        ...Array(2).fill({ vitalType: VitalType.HEART_RATE, value: 110 }),
        ...Array(8).fill({ vitalType: VitalType.HEART_RATE, value: 72 }),
      ];
      mockPrismaService.vitalReading.findMany.mockResolvedValue(readings);

      const result = await service.getHealthSummary('elder-1', 30);

      expect(result.statistics.abnormalReadings).toBe(2);
      expect(result.healthStatus).toBe('normal');
    });

    it('includes the ten most recent abnormal-vital alerts', async () => {
      mockPrismaService.vitalReading.findMany.mockResolvedValue([]);
      mockPrismaService.alert.findMany.mockResolvedValue([{ id: 'alert-9' }]);

      const result = await service.getHealthSummary('elder-1', 14);

      expect(result.recentAlerts).toEqual([{ id: 'alert-9' }]);
      expect(mockPrismaService.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            elderId: 'elder-1',
            type: 'VITAL_ABNORMAL',
          }),
          take: 10,
        }),
      );
    });
  });

  describe('deleteVital', () => {
    it('deletes the reading by id', async () => {
      mockPrismaService.vitalReading.delete.mockResolvedValue({ id: 'vital-1' });

      await expect(service.deleteVital('vital-1')).resolves.toEqual({ id: 'vital-1' });
      expect(mockPrismaService.vitalReading.delete).toHaveBeenCalledWith({
        where: { id: 'vital-1' },
      });
    });
  });
});
