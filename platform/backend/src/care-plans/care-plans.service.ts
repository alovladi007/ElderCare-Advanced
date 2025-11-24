import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class CarePlansService {
  constructor(private prisma: PrismaService) {}

  // Care Plans
  async createCarePlan(dto: CreateCarePlanDto, userId: string) {
    return this.prisma.carePlan.create({
      data: {
        elderId: dto.elderId,
        name: dto.name,
        description: dto.description,
        status: dto.status || 'ACTIVE',
        createdByUserId: userId,
      },
      include: {
        elder: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async getCarePlansByElder(elderId: string) {
    return this.prisma.carePlan.findMany({
      where: { elderId },
      include: {
        taskTemplates: true,
        _count: {
          select: {
            taskInstances: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCarePlan(id: string) {
    const plan = await this.prisma.carePlan.findUnique({
      where: { id },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
        taskTemplates: {
          orderBy: { timeWindowStart: 'asc' },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Care plan not found');
    }

    return plan;
  }

  // Task Templates
  async createTaskTemplate(dto: CreateTaskTemplateDto) {
    return this.prisma.careTaskTemplate.create({
      data: {
        carePlanId: dto.carePlanId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        frequencyType: dto.frequencyType,
        timeWindowStart: dto.timeWindowStart,
        timeWindowEnd: dto.timeWindowEnd,
        daysOfWeek: dto.daysOfWeek,
        priority: dto.priority || 'MEDIUM',
        instructions: dto.instructions,
      },
    });
  }

  // Task Instances
  async getTasksForElderByDate(elderId: string, date: Date) {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    return this.prisma.careTaskInstance.findMany({
      where: {
        elderId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        template: true,
        assignedCaregiver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        completedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getTasksByCaregiverAndDate(caregiverId: string, date: Date) {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    return this.prisma.careTaskInstance.findMany({
      where: {
        assignedCaregiverId: caregiverId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        elder: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        template: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async updateTaskStatus(taskId: string, dto: UpdateTaskStatusDto, userId: string) {
    const task = await this.prisma.careTaskInstance.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.careTaskInstance.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        notes: dto.notes,
        incidentReported: dto.incidentReported || false,
        completedAt: dto.status === 'COMPLETED' ? new Date() : null,
        completedByUserId: dto.status === 'COMPLETED' ? userId : null,
      },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
        template: true,
      },
    });
  }

  async assignTaskToCaregiver(taskId: string, caregiverId: string) {
    return this.prisma.careTaskInstance.update({
      where: { id: taskId },
      data: { assignedCaregiverId: caregiverId },
    });
  }

  // Incidents
  async createIncident(dto: CreateIncidentDto, userId: string) {
    const incident = await this.prisma.incident.create({
      data: {
        elderId: dto.elderId,
        careTaskInstanceId: dto.careTaskInstanceId,
        type: dto.type,
        severity: dto.severity,
        description: dto.description,
        occurredAt: new Date(dto.occurredAt),
        reportedByUserId: userId,
        followUpActions: dto.followUpActions,
      },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
        reportedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // If incident is linked to a task, mark it
    if (dto.careTaskInstanceId) {
      await this.prisma.careTaskInstance.update({
        where: { id: dto.careTaskInstanceId },
        data: { incidentReported: true },
      });
    }

    // TODO: Create alert for critical incidents
    if (dto.severity === 'CRITICAL' || dto.severity === 'HIGH') {
      await this.prisma.alert.create({
        data: {
          elderId: dto.elderId,
          type: 'OTHER',
          severity: dto.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          title: `${dto.type} Incident Reported`,
          message: dto.description,
          sourceEntityType: 'Incident',
          sourceEntityId: incident.id,
        },
      });
    }

    return incident;
  }

  async getIncidentsByElder(elderId: string) {
    return this.prisma.incident.findMany({
      where: { elderId },
      include: {
        reportedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        careTaskInstance: {
          include: {
            template: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  // Analytics
  async getTaskCompletionStats(elderId: string, startDate: Date, endDate: Date) {
    const tasks = await this.prisma.careTaskInstance.findMany({
      where: {
        elderId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        status: true,
      },
    });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const skipped = tasks.filter((t) => t.status === 'SKIPPED').length;

    return {
      total,
      completed,
      pending,
      inProgress,
      skipped,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}
