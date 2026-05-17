import { Test, TestingModule } from '@nestjs/testing';
import { HealthMonitoringService } from './health-monitoring.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { VitalType, AlertSeverity } from '@prisma/client';

describe('HealthMonitoringService', () => {
  let service: HealthMonitoringService;
  let prismaService: PrismaService;
  let loggerService: LoggerService;
  let notificationsService: NotificationsService;

  const mockPrismaService = {
    vitalReading: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    alert: {
      create: jest.fn(),
    },
  };

  const mockLoggerService = {
    debug: jest.fn(),
    logEvent: jest.fn(),
    warn: jest.fn(),
    logSecurity: jest.fn(),
  };

  const mockNotificationsService = {
    notifyAbnormalVital: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthMonitoringService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<HealthMonitoringService>(HealthMonitoringService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerService>(LoggerService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordVital', () => {
    it('should record normal vital reading', async () => {
      const vitalData = {
        elderId: 'elder-1',
        vitalType: VitalType.BLOOD_PRESSURE,
        value: 120,
        unit: 'mmHg',
        notes: 'Normal reading',
      };

      const createdVital = {
        id: 'vital-1',
        ...vitalData,
        recordedAt: new Date(),
      };

      mockPrismaService.vitalReading.create.mockResolvedValue(createdVital);

      const result = await service.recordVital(vitalData);

      expect(result).toEqual(createdVital);
      expect(prismaService.vitalReading.create).toHaveBeenCalledWith({
        data: vitalData,
      });
    });

    it('should create alert for critical high blood pressure', async () => {
      const vitalData = {
        elderId: 'elder-1',
        vitalType: VitalType.BLOOD_PRESSURE,
        value: 185,
        unit: 'mmHg',
      };

      const createdVital = {
        id: 'vital-1',
        ...vitalData,
        recordedAt: new Date(),
      };

      mockPrismaService.vitalReading.create.mockResolvedValue(createdVital);
      mockPrismaService.alert.create.mockResolvedValue({
        id: 'alert-1',
        severity: AlertSeverity.CRITICAL,
      });

      const result = await service.recordVital(vitalData);

      expect(result).toEqual(createdVital);
      expect(prismaService.alert.create).toHaveBeenCalled();
      expect(notificationsService.notifyAbnormalVital).toHaveBeenCalled();
    });

    it('should create alert for critical low heart rate', async () => {
      const vitalData = {
        elderId: 'elder-1',
        vitalType: VitalType.HEART_RATE,
        value: 45,
        unit: 'bpm',
      };

      const createdVital = {
        id: 'vital-2',
        ...vitalData,
        recordedAt: new Date(),
      };

      mockPrismaService.vitalReading.create.mockResolvedValue(createdVital);
      mockPrismaService.alert.create.mockResolvedValue({
        id: 'alert-2',
        severity: AlertSeverity.CRITICAL,
      });

      const result = await service.recordVital(vitalData);

      expect(prismaService.alert.create).toHaveBeenCalled();
      expect(loggerService.logSecurity).toHaveBeenCalled();
    });

    it('should create warning for abnormal but non-critical temperature', async () => {
      const vitalData = {
        elderId: 'elder-1',
        vitalType: VitalType.TEMPERATURE,
        value: 99.5,
        unit: '°F',
      };

      const createdVital = {
        id: 'vital-3',
        ...vitalData,
        recordedAt: new Date(),
      };

      mockPrismaService.vitalReading.create.mockResolvedValue(createdVital);
      mockPrismaService.alert.create.mockResolvedValue({
        id: 'alert-3',
        severity: AlertSeverity.WARNING,
      });

      const result = await service.recordVital(vitalData);

      expect(prismaService.alert.create).toHaveBeenCalled();
    });
  });

  describe('checkVitalThresholds', () => {
    it('should detect critical high blood pressure', () => {
      const vital = {
        id: 'vital-1',
        elderId: 'elder-1',
        vitalType: VitalType.BLOOD_PRESSURE,
        value: 190,
        unit: 'mmHg',
        recordedAt: new Date(),
      };

      const result = (service as any).isAbnormal(vital);

      expect(result).toBe(true);
    });

    it('should detect critical low blood pressure', () => {
      const vital = {
        id: 'vital-1',
        elderId: 'elder-1',
        vitalType: VitalType.BLOOD_PRESSURE,
        value: 75,
        unit: 'mmHg',
        recordedAt: new Date(),
      };

      const result = (service as any).isAbnormal(vital);

      expect(result).toBe(true);
    });

    it('should detect normal blood pressure', () => {
      const vital = {
        id: 'vital-1',
        elderId: 'elder-1',
        vitalType: VitalType.BLOOD_PRESSURE,
        value: 120,
        unit: 'mmHg',
        recordedAt: new Date(),
      };

      const result = (service as any).isAbnormal(vital);

      expect(result).toBe(false);
    });

    it('should detect abnormal oxygen saturation', () => {
      const vital = {
        id: 'vital-1',
        elderId: 'elder-1',
        vitalType: VitalType.OXYGEN_SATURATION,
        value: 88,
        unit: '%',
        recordedAt: new Date(),
      };

      const result = (service as any).isAbnormal(vital);

      expect(result).toBe(true);
    });

    it('should detect normal oxygen saturation', () => {
      const vital = {
        id: 'vital-1',
        elderId: 'elder-1',
        vitalType: VitalType.OXYGEN_SATURATION,
        value: 98,
        unit: '%',
        recordedAt: new Date(),
      };

      const result = (service as any).isAbnormal(vital);

      expect(result).toBe(false);
    });
  });

  describe('getElderVitals', () => {
    it('should retrieve vitals for an elder', async () => {
      const vitals = [
        {
          id: 'vital-1',
          vitalType: VitalType.BLOOD_PRESSURE,
          value: 120,
          recordedAt: new Date(),
        },
        {
          id: 'vital-2',
          vitalType: VitalType.HEART_RATE,
          value: 75,
          recordedAt: new Date(),
        },
      ];

      mockPrismaService.vitalReading.findMany.mockResolvedValue(vitals);

      const result = await service.getElderVitals('elder-1');

      expect(result).toEqual(vitals);
      expect(prismaService.vitalReading.findMany).toHaveBeenCalledWith({
        where: { elderId: 'elder-1' },
        orderBy: { recordedAt: 'desc' },
        take: 100,
      });
    });

    it('should filter vitals by type', async () => {
      const vitals = [
        {
          id: 'vital-1',
          vitalType: VitalType.BLOOD_PRESSURE,
          value: 120,
        },
      ];

      mockPrismaService.vitalReading.findMany.mockResolvedValue(vitals);

      const result = await service.getElderVitals(
        'elder-1',
        VitalType.BLOOD_PRESSURE,
      );

      expect(result).toEqual(vitals);
      expect(prismaService.vitalReading.findMany).toHaveBeenCalledWith({
        where: {
          elderId: 'elder-1',
          vitalType: VitalType.BLOOD_PRESSURE,
        },
        orderBy: { recordedAt: 'desc' },
        take: 100,
      });
    });
  });

  describe('getLatestVital', () => {
    it('should retrieve latest vital of specific type', async () => {
      const latestVital = {
        id: 'vital-1',
        vitalType: VitalType.HEART_RATE,
        value: 72,
        recordedAt: new Date(),
      };

      mockPrismaService.vitalReading.findFirst.mockResolvedValue(latestVital);

      const result = await service.getLatestVital('elder-1', VitalType.HEART_RATE);

      expect(result).toEqual(latestVital);
      expect(prismaService.vitalReading.findFirst).toHaveBeenCalledWith({
        where: {
          elderId: 'elder-1',
          vitalType: VitalType.HEART_RATE,
        },
        orderBy: { recordedAt: 'desc' },
      });
    });
  });

  describe('getVitalStats', () => {
    it('should calculate vital statistics', async () => {
      const vitals = [
        { value: 120 },
        { value: 115 },
        { value: 125 },
        { value: 118 },
        { value: 122 },
      ];

      mockPrismaService.vitalReading.findMany.mockResolvedValue(vitals);

      const result = await service.getVitalStats(
        'elder-1',
        VitalType.BLOOD_PRESSURE,
        30,
      );

      expect(result.count).toBe(5);
      expect(result.average).toBe(120);
      expect(result.min).toBe(115);
      expect(result.max).toBe(125);
    });

    it('should handle empty vitals list', async () => {
      mockPrismaService.vitalReading.findMany.mockResolvedValue([]);

      const result = await service.getVitalStats(
        'elder-1',
        VitalType.BLOOD_PRESSURE,
        30,
      );

      expect(result.count).toBe(0);
      expect(result.average).toBe(0);
      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
    });
  });
});
