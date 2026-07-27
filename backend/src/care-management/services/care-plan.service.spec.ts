import { Test, TestingModule } from '@nestjs/testing';
import { CarePlanService } from './care-plan.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { CareTaskPriority, CareTaskStatus } from '@prisma/client';

describe('CarePlanService', () => {
  let service: CarePlanService;

  const mockPrismaService = {
    carePlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    careTask: {
      create: jest.fn(),
      findMany: jest.fn(),
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

  const task = (overrides: Partial<Record<string, any>> = {}) => ({
    status: CareTaskStatus.PENDING,
    priority: CareTaskPriority.MEDIUM,
    dueDate: new Date('2099-01-01T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarePlanService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<CarePlanService>(CarePlanService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('createCarePlan', () => {
    it('activates the new plan and logs the event', async () => {
      const data = {
        elderId: 'elder-1',
        title: 'Post-surgery recovery',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
      };
      mockPrismaService.carePlan.create.mockResolvedValue({ id: 'plan-1', ...data });

      const result = await service.createCarePlan(data);

      expect(result.id).toBe('plan-1');
      expect(mockPrismaService.carePlan.create).toHaveBeenCalledWith({
        data: { ...data, isActive: true },
      });
      expect(mockLoggerService.logEvent).toHaveBeenCalledWith(
        'Care plan created',
        'CarePlan',
        'plan-1',
        { elderId: 'elder-1', title: 'Post-surgery recovery' },
      );
    });
  });

  describe('getCarePlanByElder', () => {
    it('looks the plan up by elder and returns its tasks in due-date order', async () => {
      mockPrismaService.carePlan.findUnique.mockResolvedValue({ id: 'plan-1', tasks: [] });

      const result = await service.getCarePlanByElder('elder-1');

      expect(result).toEqual({ id: 'plan-1', tasks: [] });
      expect(mockPrismaService.carePlan.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { elderId: 'elder-1' },
          include: expect.objectContaining({
            tasks: { orderBy: { dueDate: 'asc' } },
          }),
        }),
      );
    });

    it('returns null when the elder has no plan', async () => {
      mockPrismaService.carePlan.findUnique.mockResolvedValue(null);

      await expect(service.getCarePlanByElder('elder-1')).resolves.toBeNull();
    });
  });

  describe('createTask', () => {
    it('starts tasks as PENDING with MEDIUM priority by default', async () => {
      mockPrismaService.careTask.create.mockResolvedValue({ id: 'task-1' });

      await service.createTask({
        carePlanId: 'plan-1',
        title: 'Morning walk',
        dueDate: new Date('2026-01-02T00:00:00.000Z'),
      });

      expect(mockPrismaService.careTask.create.mock.calls[0][0].data).toMatchObject({
        carePlanId: 'plan-1',
        status: 'PENDING',
        priority: 'MEDIUM',
      });
    });

    it('keeps an explicitly supplied priority', async () => {
      mockPrismaService.careTask.create.mockResolvedValue({ id: 'task-2' });

      await service.createTask({
        carePlanId: 'plan-1',
        title: 'Wound check',
        priority: CareTaskPriority.URGENT,
        dueDate: new Date('2026-01-02T00:00:00.000Z'),
      });

      expect(mockPrismaService.careTask.create.mock.calls[0][0].data.priority).toBe(
        CareTaskPriority.URGENT,
      );
    });
  });

  describe('getTasksByCarePlan', () => {
    beforeEach(() => {
      mockPrismaService.careTask.findMany.mockResolvedValue([]);
    });

    it('filters out completed tasks by default', async () => {
      await service.getTasksByCarePlan('plan-1');

      expect(mockPrismaService.careTask.findMany.mock.calls[0][0].where).toEqual({
        carePlanId: 'plan-1',
        status: { not: 'COMPLETED' },
      });
    });

    it('returns the full history when completed tasks are requested', async () => {
      await service.getTasksByCarePlan('plan-1', true);

      expect(mockPrismaService.careTask.findMany.mock.calls[0][0].where).toEqual({
        carePlanId: 'plan-1',
      });
      expect(mockPrismaService.careTask.findMany.mock.calls[0][0].orderBy).toEqual([
        { priority: 'desc' },
        { dueDate: 'asc' },
      ]);
    });
  });

  describe('getOverdueTasks', () => {
    it('returns an empty list without querying tasks when the elder has no plan', async () => {
      mockPrismaService.carePlan.findUnique.mockResolvedValue(null);

      await expect(service.getOverdueTasks('elder-1')).resolves.toEqual([]);
      expect(mockPrismaService.careTask.findMany).not.toHaveBeenCalled();
    });

    it('selects unfinished tasks whose due date has already passed', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
      mockPrismaService.carePlan.findUnique.mockResolvedValue({ id: 'plan-1' });
      mockPrismaService.careTask.findMany.mockResolvedValue([{ id: 'task-1' }]);

      const result = await service.getOverdueTasks('elder-1');

      expect(result).toEqual([{ id: 'task-1' }]);
      expect(mockPrismaService.careTask.findMany).toHaveBeenCalledWith({
        where: {
          carePlanId: 'plan-1',
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: new Date('2026-06-01T00:00:00.000Z') },
        },
        orderBy: { dueDate: 'asc' },
      });
    });
  });

  describe('completeTask', () => {
    it('stamps the completion time alongside the COMPLETED status', async () => {
      mockPrismaService.careTask.update.mockResolvedValue({ id: 'task-1' });

      await service.completeTask('task-1', 'walked 20 minutes');

      expect(mockPrismaService.careTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
          notes: 'walked 20 minutes',
        },
      });
      expect(mockLoggerService.logEvent).toHaveBeenCalledWith(
        'Care task completed',
        'CareTask',
        'task-1',
        {},
      );
    });
  });

  describe('updateTask', () => {
    it('passes the patch straight through and logs which fields changed', async () => {
      mockPrismaService.careTask.update.mockResolvedValue({ id: 'task-1' });

      await service.updateTask('task-1', {
        status: CareTaskStatus.IN_PROGRESS,
        priority: CareTaskPriority.HIGH,
      });

      expect(mockPrismaService.careTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { status: CareTaskStatus.IN_PROGRESS, priority: CareTaskPriority.HIGH },
      });
      expect(mockLoggerService.logEvent).toHaveBeenCalledWith(
        'Care task updated',
        'CareTask',
        'task-1',
        { changes: ['status', 'priority'] },
      );
    });
  });

  describe('getCarePlanStats', () => {
    it('breaks tasks down by status and computes the completion rate', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
      mockPrismaService.carePlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        title: 'Recovery',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: null,
        isActive: true,
        tasks: [
          task({ status: CareTaskStatus.COMPLETED }),
          task({ status: CareTaskStatus.COMPLETED }),
          task({ status: CareTaskStatus.IN_PROGRESS }),
          task({ status: CareTaskStatus.PENDING }),
          // Overdue and urgent: still open with a due date in the past.
          task({
            status: CareTaskStatus.PENDING,
            priority: CareTaskPriority.URGENT,
            dueDate: new Date('2026-05-01T00:00:00.000Z'),
          }),
        ],
      });

      const result = await service.getCarePlanStats('elder-1');

      expect(result.totalTasks).toBe(5);
      expect(result.completedTasks).toBe(2);
      expect(result.pendingTasks).toBe(2);
      expect(result.inProgressTasks).toBe(1);
      expect(result.overdueTasks).toBe(1);
      expect(result.urgentTasks).toBe(1);
      expect(result.completionRate).toBe(40);
      expect(result.carePlan).toEqual({
        id: 'plan-1',
        title: 'Recovery',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: null,
        isActive: true,
      });
    });

    it('does not count completed tasks as overdue even when past due', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
      mockPrismaService.carePlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        tasks: [
          task({
            status: CareTaskStatus.COMPLETED,
            dueDate: new Date('2026-05-01T00:00:00.000Z'),
          }),
        ],
      });

      const result = await service.getCarePlanStats('elder-1');

      expect(result.overdueTasks).toBe(0);
      expect(result.completionRate).toBe(100);
    });

    it('reports a 0% completion rate for an empty plan', async () => {
      mockPrismaService.carePlan.findUnique.mockResolvedValue({ id: 'plan-1', tasks: [] });

      const result = await service.getCarePlanStats('elder-1');

      expect(result.totalTasks).toBe(0);
      expect(result.completionRate).toBe(0);
    });

    it('returns null when the elder has no care plan', async () => {
      mockPrismaService.carePlan.findUnique.mockResolvedValue(null);

      await expect(service.getCarePlanStats('elder-1')).resolves.toBeNull();
    });
  });

  describe('updateCarePlan', () => {
    it('applies the patch and logs the changed field names', async () => {
      mockPrismaService.carePlan.update.mockResolvedValue({ id: 'plan-1' });

      await service.updateCarePlan('plan-1', { title: 'Revised plan', isActive: false });

      expect(mockPrismaService.carePlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { title: 'Revised plan', isActive: false },
      });
      expect(mockLoggerService.logEvent).toHaveBeenCalledWith(
        'Care plan updated',
        'CarePlan',
        'plan-1',
        { changes: ['title', 'isActive'] },
      );
    });
  });

  describe('deleteCarePlan', () => {
    it('hard-deletes the plan row', async () => {
      mockPrismaService.carePlan.delete.mockResolvedValue({ id: 'plan-1' });

      await service.deleteCarePlan('plan-1');

      expect(mockPrismaService.carePlan.delete).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
      });
    });
  });
});
