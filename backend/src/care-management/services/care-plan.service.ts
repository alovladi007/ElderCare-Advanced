import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { CareTaskStatus, CareTaskPriority } from '@prisma/client';

@Injectable()
export class CarePlanService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * Create care plan for elder
   */
  async createCarePlan(data: {
    elderId: string;
    title: string;
    description?: string;
    goals?: any;
    services?: any;
    startDate: Date;
    endDate?: Date;
    notes?: string;
  }) {
    const carePlan = await this.prisma.carePlan.create({
      data: {
        ...data,
        isActive: true,
      },
    });

    this.logger.logEvent('Care plan created', 'CarePlan', carePlan.id, {
      elderId: data.elderId,
      title: data.title,
    });

    return carePlan;
  }

  /**
   * Get care plan by elder ID
   */
  async getCarePlanByElder(elderId: string) {
    const carePlan = await this.prisma.carePlan.findUnique({
      where: { elderId },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
        tasks: {
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });

    return carePlan;
  }

  /**
   * Update care plan
   */
  async updateCarePlan(
    carePlanId: string,
    data: {
      title?: string;
      description?: string;
      goals?: any;
      services?: any;
      endDate?: Date;
      isActive?: boolean;
      notes?: string;
    },
  ) {
    const carePlan = await this.prisma.carePlan.update({
      where: { id: carePlanId },
      data,
    });

    this.logger.logEvent('Care plan updated', 'CarePlan', carePlanId, {
      changes: Object.keys(data),
    });

    return carePlan;
  }

  /**
   * Delete care plan
   */
  async deleteCarePlan(carePlanId: string) {
    return this.prisma.carePlan.delete({
      where: { id: carePlanId },
    });
  }

  // ============================================================================
  // CARE TASKS
  // ============================================================================

  /**
   * Create care task
   */
  async createTask(data: {
    carePlanId: string;
    title: string;
    description?: string;
    assignedTo?: string;
    priority?: CareTaskPriority;
    dueDate: Date;
    notes?: string;
  }) {
    const task = await this.prisma.careTask.create({
      data: {
        ...data,
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
      },
    });

    this.logger.logEvent('Care task created', 'CareTask', task.id, {
      carePlanId: data.carePlanId,
      title: data.title,
      priority: data.priority,
    });

    return task;
  }

  /**
   * Get tasks by care plan
   */
  async getTasksByCarePlan(carePlanId: string, includeCompleted = false) {
    return this.prisma.careTask.findMany({
      where: {
        carePlanId,
        ...(includeCompleted ? {} : { status: { not: 'COMPLETED' } }),
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(elderId: string) {
    const carePlan = await this.prisma.carePlan.findUnique({
      where: { elderId },
    });

    if (!carePlan) {
      return [];
    }

    return this.prisma.careTask.findMany({
      where: {
        carePlanId: carePlan.id,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        dueDate: {
          lt: new Date(),
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  /**
   * Update task
   */
  async updateTask(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      assignedTo?: string;
      priority?: CareTaskPriority;
      status?: CareTaskStatus;
      dueDate?: Date;
      notes?: string;
    },
  ) {
    const task = await this.prisma.careTask.update({
      where: { id: taskId },
      data,
    });

    this.logger.logEvent('Care task updated', 'CareTask', taskId, {
      changes: Object.keys(data),
    });

    return task;
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string, notes?: string) {
    const task = await this.prisma.careTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes,
      },
    });

    this.logger.logEvent('Care task completed', 'CareTask', taskId, {});

    return task;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string) {
    return this.prisma.careTask.delete({
      where: { id: taskId },
    });
  }

  /**
   * Get care plan statistics
   */
  async getCarePlanStats(elderId: string) {
    const carePlan = await this.prisma.carePlan.findUnique({
      where: { elderId },
      include: {
        tasks: true,
      },
    });

    if (!carePlan) {
      return null;
    }

    const totalTasks = carePlan.tasks.length;
    const completedTasks = carePlan.tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = carePlan.tasks.filter(t => t.status === 'PENDING').length;
    const inProgressTasks = carePlan.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const overdueTasks = carePlan.tasks.filter(
      t => t.status !== 'COMPLETED' && t.dueDate < new Date(),
    ).length;
    const urgentTasks = carePlan.tasks.filter(
      t => t.status !== 'COMPLETED' && t.priority === 'URGENT',
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      urgentTasks,
      completionRate: Math.round(completionRate * 10) / 10,
      carePlan: {
        id: carePlan.id,
        title: carePlan.title,
        startDate: carePlan.startDate,
        endDate: carePlan.endDate,
        isActive: carePlan.isActive,
      },
    };
  }
}
