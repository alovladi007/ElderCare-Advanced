import { Test, TestingModule } from '@nestjs/testing';
import { AutomationEngineService } from './automation-engine.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DeviceService } from './device.service';
import { LoggerService } from '../../common/logging/logger.service';

describe('AutomationEngineService', () => {
  let service: AutomationEngineService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationEngineService,
        {
          provide: PrismaService,
          useValue: {
            automationRule: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            alert: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: DeviceService,
          useValue: {
            issueActuatorCommand: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
            logEvent: jest.fn(),
            logError: jest.fn(),
            logSecurity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AutomationEngineService>(AutomationEngineService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateSensorEventTrigger', () => {
    it('should match sensor event with correct sensorType', () => {
      const triggerConfig = {
        sensorType: 'MOTION',
        eventType: 'STATE_CHANGE',
        valueEquals: 'MOTION_DETECTED',
      };

      const event = {
        sensorId: 'sensor-1',
        sensor: {
          sensorType: 'MOTION',
        },
        eventType: 'STATE_CHANGE',
        valueText: 'MOTION_DETECTED',
      };

      // Use private method through any to test
      const result = (service as any).evaluateSensorEventTrigger(triggerConfig, event);
      expect(result).toBe(true);
    });

    it('should not match sensor event with wrong sensorType', () => {
      const triggerConfig = {
        sensorType: 'SMOKE',
        eventType: 'ALERT',
      };

      const event = {
        sensor: {
          sensorType: 'MOTION',
        },
        eventType: 'ALERT',
      };

      const result = (service as any).evaluateSensorEventTrigger(triggerConfig, event);
      expect(result).toBe(false);
    });

    it('should match numeric value ranges', () => {
      const triggerConfig = {
        sensorType: 'TEMPERATURE',
        valueMin: 50,
        valueMax: 90,
      };

      const event = {
        sensor: {
          sensorType: 'TEMPERATURE',
        },
        valueNumeric: 75,
      };

      const result = (service as any).evaluateSensorEventTrigger(triggerConfig, event);
      expect(result).toBe(true);
    });

    it('should not match values outside range', () => {
      const triggerConfig = {
        sensorType: 'TEMPERATURE',
        valueMin: 50,
        valueMax: 90,
      };

      const event = {
        sensor: {
          sensorType: 'TEMPERATURE',
        },
        valueNumeric: 95,
      };

      const result = (service as any).evaluateSensorEventTrigger(triggerConfig, event);
      expect(result).toBe(false);
    });
  });

  describe('evaluateConditions', () => {
    it('should validate time range conditions', () => {
      const conditionConfig = {
        timeRange: {
          start: '09:00',
          end: '17:00',
        },
      };

      // Mock current time to be within range
      const mockDate = new Date('2024-01-01T12:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = (service as any).evaluateConditions(conditionConfig, {});
      expect(result).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('createAutomationRule', () => {
    it('should create automation rule successfully', async () => {
      const ruleData = {
        homeId: 'home-1',
        name: 'Test Rule',
        triggerType: 'SENSOR_EVENT' as any,
        triggerConfigJson: { sensorType: 'MOTION' },
        actionsConfigJson: [{ type: 'TURN_ON_LIGHTS' }],
        createdByUserId: 'user-1',
      };

      const mockRule = { id: 'rule-1', ...ruleData };
      jest.spyOn(prismaService.automationRule, 'create').mockResolvedValue(mockRule as any);

      const result = await service.createAutomationRule(ruleData);

      expect(result).toEqual(mockRule);
      expect(prismaService.automationRule.create).toHaveBeenCalledWith({
        data: ruleData,
      });
    });
  });
});
