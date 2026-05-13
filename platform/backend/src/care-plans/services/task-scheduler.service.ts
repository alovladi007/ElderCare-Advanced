import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CarePlanStatus, TaskStatus } from '@prisma/client';
import { addDays, startOfDay, endOfDay, parseISO, format } from 'date-fns';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(private prisma: PrismaService) {}

  // Run every day at 1 AM to generate tasks for the next day
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateDailyTasks() {
    this.logger.log('Starting daily task generation...');

    const tomorrow = addDays(new Date(), 1);
    await this.generateTasksForDate(tomorrow);

    this.logger.log('Daily task generation completed');
  }

  async generateTasksForDate(date: Date) {
    const targetDate = startOfDay(date);
    const dayOfWeek = format(targetDate, 'EEE').toUpperCase(); // MON, TUE, etc.

    // Get all active care plans
    const activePlans = await this.prisma.carePlan.findMany({
      where: { status: CarePlanStatus.ACTIVE },
      include: {
        taskTemplates: true,
        elder: true,
      },
    });

    this.logger.log(`Found ${activePlans.length} active care plans`);

    for (const plan of activePlans) {
      // Filter templates that should run on this day
      const applicableTemplates = plan.taskTemplates.filter((template) =>
        template.daysOfWeek.includes(dayOfWeek),
      );

      this.logger.log(
        `Generating ${applicableTemplates.length} tasks for elder ${plan.elder.user.firstName}`,
      );

      for (const template of applicableTemplates) {
        // Check if task instance already exists for this date
        const existingTask = await this.prisma.careTaskInstance.findFirst({
          where: {
            templateId: template.id,
            scheduledAt: {
              gte: startOfDay(targetDate),
              lte: endOfDay(targetDate),
            },
          },
        });

        if (existingTask) {
          this.logger.debug(`Task already exists for template ${template.id}`);
          continue;
        }

        // Create scheduled time by combining date with time window start
        const [hours, minutes] = template.timeWindowStart.split(':');
        const scheduledAt = new Date(targetDate);
        scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Create due by time using time window end
        const [endHours, endMinutes] = template.timeWindowEnd.split(':');
        const dueBy = new Date(targetDate);
        dueBy.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

        // Create task instance
        await this.prisma.careTaskInstance.create({
          data: {
            elderId: plan.elderId,
            carePlanId: plan.id,
            templateId: template.id,
            scheduledAt,
            dueBy,
            status: TaskStatus.PENDING,
          },
        });

        this.logger.debug(`Created task instance for template ${template.id}`);
      }
    }

    this.logger.log(`Task generation completed for ${format(targetDate, 'yyyy-MM-dd')}`);
  }

  // Manual trigger for generating tasks for a specific elder
  async generateTasksForElder(elderId: string, date: Date) {
    const targetDate = startOfDay(date);
    const dayOfWeek = format(targetDate, 'EEE').toUpperCase();

    const activePlans = await this.prisma.carePlan.findMany({
      where: {
        elderId,
        status: CarePlanStatus.ACTIVE,
      },
      include: {
        taskTemplates: true,
      },
    });

    for (const plan of activePlans) {
      const applicableTemplates = plan.taskTemplates.filter((template) =>
        template.daysOfWeek.includes(dayOfWeek),
      );

      for (const template of applicableTemplates) {
        const [hours, minutes] = template.timeWindowStart.split(':');
        const scheduledAt = new Date(targetDate);
        scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const [endHours, endMinutes] = template.timeWindowEnd.split(':');
        const dueBy = new Date(targetDate);
        dueBy.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

        await this.prisma.careTaskInstance.create({
          data: {
            elderId: plan.elderId,
            carePlanId: plan.id,
            templateId: template.id,
            scheduledAt,
            dueBy,
            status: TaskStatus.PENDING,
          },
        });
      }
    }
  }
}
