import { Test, TestingModule } from '@nestjs/testing';
import { CarePlanService } from './care-plan.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { TaskStatus, TaskPriority } from '@prisma/client';

describe('CarePlanService', () => {
  let service: CarePlanService;
  let prismaService: PrismaService;
  let loggerService: LoggerService;

  const mockPrismaService = {
    carePlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    careTask: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    elderProfile: {
      findUnique: jest.fn(),
    },
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
        CarePlanService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<CarePlanService>(CarePlanService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCarePlan', () => {
    it('should create a care plan', async () => {
      const carePlanData = {
        elderId: 'elder-1',
        name: 'Daily Care Plan',
        description: 'Routine daily care activities',
        createdByUserId: 'user-1',
      };

      const createdPlan = {
        id: 'plan-1',
        ...carePlanData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.carePlan.create.mockResolvedValue(createdPlan);

      const result = await service.createCarePlan(carePlanData);

      expect(result).toEqual(createdPlan);
      expect(prismaService.carePlan.create).toHaveBeenCalledWith({
        data: {
          ...carePlanData,
          isActive: true,
        },
      });
    });
  });

  describe('getCarePlan', () => {
    it('should retrieve care plan with tasks', async () => {
      const carePlan = {
        id: 'plan-1',
        name: 'Daily Care Plan',
        tasks: [
          { id: 'task-1', title: 'Morning medication' },
          { id: 'task-2', title: 'Breakfast' },
        ],
      };

      mockPrismaService.carePlan.findUnique.mockResolvedValue(carePlan);

      const result = await service.getCarePlan('plan-1');

      expect(result).toEqual(carePlan);
      expect(prismaService.carePlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        include: {
          tasks: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });
  });

  describe('getElderCarePlans', () => {
    it('should retrieve all active care plans for an elder', async () => {
      const carePlans = [
        { id: 'plan-1', name: 'Morning Routine', isActive: true },
        { id: 'plan-2', name: 'Evening Routine', isActive: true },
      ];

      mockPrismaService.carePlan.findMany.mockResolvedValue(carePlans);

      const result = await service.getElderCarePlans('elder-1');

      expect(result).toEqual(carePlans);
      expect(prismaService.carePlan.findMany).toHaveBeenCalledWith({
        where: { elderId: 'elder-1', isActive: true },
        include: {
          tasks: {
            where: {
              status: {
                in: ['PENDING', 'IN_PROGRESS'],
              },
            },
            orderBy: { dueDate: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createCareTask', () => {
    it('should create a care task', async () => {
      const taskData = {
        carePlanId: 'plan-1',
        title: 'Morning medication',
        description: 'Administer morning pills',
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-01-15'),
        assignedToUserId: 'caregiver-1',
      };

      const createdTask = {
        id: 'task-1',
        ...taskData,
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.careTask.create.mockResolvedValue(createdTask);

      const result = await service.createCareTask(taskData);

      expect(result).toEqual(createdTask);
      expect(prismaService.careTask.create).toHaveBeenCalledWith({
        data: {
          ...taskData,
          status: TaskStatus.PENDING,
        },
      });
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status to IN_PROGRESS', async () => {
      const task = {
        id: 'task-1',
        status: TaskStatus.PENDING,
      };

      const updatedTask = {
        ...task,
        status: TaskStatus.IN_PROGRESS,
      };

      mockPrismaService.careTask.update.mockResolvedValue(updatedTask);

      const result = await service.updateTaskStatus(
        'task-1',
        TaskStatus.IN_PROGRESS,
        'user-1',
      );

      expect(result).toEqual(updatedTask);
      expect(prismaService.careTask.update).toHaveBeenCalled();
    });

    it('should update task status to COMPLETED with completion time', async () => {
      const task = {
        id: 'task-1',
        status: TaskStatus.IN_PROGRESS,
      };

      const updatedTask = {
        ...task,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      };

      mockPrismaService.careTask.update.mockResolvedValue(updatedTask);

      const result = await service.updateTaskStatus(
        'task-1',
        TaskStatus.COMPLETED,
        'user-1',
        'Task completed successfully',
      );

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(prismaService.careTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: expect.any(Date),
          completedByUserId: 'user-1',
          notes: 'Task completed successfully',
        },
      });
    });
  });

  describe('getTasks', () => {
    it('should retrieve tasks for a care plan', async () => {
      const tasks = [
        { id: 'task-1', title: 'Task 1', status: TaskStatus.PENDING },
        { id: 'task-2', title: 'Task 2', status: TaskStatus.IN_PROGRESS },
      ];

      mockPrismaService.careTask.findMany.mockResolvedValue(tasks);

      const result = await service.getTasks('plan-1');

      expect(result).toEqual(tasks);
      expect(prismaService.careTask.findMany).toHaveBeenCalledWith({
        where: { carePlanId: 'plan-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter tasks by status', async () => {
      const pendingTasks = [
        { id: 'task-1', title: 'Task 1', status: TaskStatus.PENDING },
      ];

      mockPrismaService.careTask.findMany.mockResolvedValue(pendingTasks);

      const result = await service.getTasks('plan-1', TaskStatus.PENDING);

      expect(result).toEqual(pendingTasks);
      expect(prismaService.careTask.findMany).toHaveBeenCalledWith({
        where: {
          carePlanId: 'plan-1',
          status: TaskStatus.PENDING,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getOverdueTasks', () => {
    it('should retrieve overdue tasks', async () => {
      const overdueTasks = [
        {
          id: 'task-1',
          title: 'Overdue task',
          dueDate: new Date('2024-01-01'),
          status: TaskStatus.PENDING,
        },
      ];

      mockPrismaService.careTask.findMany.mockResolvedValue(overdueTasks);

      const result = await service.getOverdueTasks('elder-1');

      expect(result).toBeDefined();
      expect(prismaService.careTask.findMany).toHaveBeenCalled();
    });
  });

  describe('getCarePlanStats', () => {
    it('should calculate care plan statistics', async () => {
      mockPrismaService.careTask.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(12) // completed
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(3) // overdue
        .mockResolvedValueOnce(4); // urgent

      const result = await service.getCarePlanStats('elder-1');

      expect(result.totalTasks).toBe(20);
      expect(result.completedTasks).toBe(12);
      expect(result.pendingTasks).toBe(5);
      expect(result.overdueTasks).toBe(3);
      expect(result.urgentTasks).toBe(4);
      expect(result.completionRate).toBe(60);
    });

    it('should handle zero tasks gracefully', async () => {
      mockPrismaService.careTask.count.mockResolvedValue(0);

      const result = await service.getCarePlanStats('elder-1');

      expect(result.totalTasks).toBe(0);
      expect(result.completionRate).toBe(0);
    });
  });

  describe('updateCarePlan', () => {
    it('should update care plan details', async () => {
      const updatedPlan = {
        id: 'plan-1',
        name: 'Updated Plan Name',
        description: 'Updated description',
      };

      mockPrismaService.carePlan.update.mockResolvedValue(updatedPlan);

      const result = await service.updateCarePlan('plan-1', {
        name: 'Updated Plan Name',
        description: 'Updated description',
      });

      expect(result).toEqual(updatedPlan);
      expect(prismaService.carePlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: {
          name: 'Updated Plan Name',
          description: 'Updated description',
        },
      });
    });
  });

  describe('deactivateCarePlan', () => {
    it('should deactivate care plan', async () => {
      const deactivatedPlan = {
        id: 'plan-1',
        isActive: false,
      };

      mockPrismaService.carePlan.update.mockResolvedValue(deactivatedPlan);

      const result = await service.deactivateCarePlan('plan-1');

      expect(result).toEqual(deactivatedPlan);
      expect(prismaService.carePlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { isActive: false },
      });
    });
  });
});
