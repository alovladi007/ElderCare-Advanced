import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNutritionProfileDto } from './dto/create-nutrition-profile.dto';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { CreateMealItemDto } from './dto/create-meal-item.dto';
import { LogMealIntakeDto } from './dto/log-meal-intake.dto';
import { startOfWeek, endOfWeek, startOfDay, endOfDay, subDays } from 'date-fns';

@Injectable()
export class NutritionService {
  constructor(private prisma: PrismaService) {}

  // Nutrition Profile
  async createOrUpdateProfile(dto: CreateNutritionProfileDto) {
    // Check if profile exists
    const existing = await this.prisma.nutritionProfile.findUnique({
      where: { elderId: dto.elderId },
    });

    if (existing) {
      return this.prisma.nutritionProfile.update({
        where: { elderId: dto.elderId },
        data: {
          dietaryRestrictions: dto.dietaryRestrictions,
          allergies: dto.allergies,
          preferredCuisines: dto.preferredCuisines,
          textureLevel: dto.textureLevel,
          dailyCalorieTarget: dto.dailyCalorieTarget,
          notes: dto.notes,
        },
      });
    }

    return this.prisma.nutritionProfile.create({
      data: dto,
    });
  }

  async getNutritionProfile(elderId: string) {
    const profile = await this.prisma.nutritionProfile.findUnique({
      where: { elderId },
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

    if (!profile) {
      throw new NotFoundException('Nutrition profile not found');
    }

    return profile;
  }

  // Meal Plans
  async createMealPlan(dto: CreateMealPlanDto, userId: string) {
    return this.prisma.mealPlan.create({
      data: {
        elderId: dto.elderId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdByUserId: userId,
        notes: dto.notes,
      },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getMealPlans(elderId: string) {
    return this.prisma.mealPlan.findMany({
      where: { elderId },
      include: {
        _count: {
          select: {
            mealItems: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getMealPlan(id: string) {
    const plan = await this.prisma.mealPlan.findUnique({
      where: { id },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
        mealItems: {
          orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }

    return plan;
  }

  async getWeeklyMealPlan(elderId: string, weekStart?: Date) {
    const start = weekStart ? startOfWeek(weekStart) : startOfWeek(new Date());
    const end = endOfWeek(start);

    // Find meal plan for this week
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: {
        elderId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: {
        mealItems: {
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
        },
      },
    });

    return {
      weekStart: start,
      weekEnd: end,
      mealPlan,
    };
  }

  // Meal Items
  async createMealItem(dto: CreateMealItemDto) {
    return this.prisma.mealItem.create({
      data: {
        mealPlanId: dto.mealPlanId,
        date: new Date(dto.date),
        mealType: dto.mealType,
        name: dto.name,
        description: dto.description,
        estimatedCalories: dto.estimatedCalories,
        notes: dto.notes,
      },
    });
  }

  async getMealItems(mealPlanId: string) {
    return this.prisma.mealItem.findMany({
      where: { mealPlanId },
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
    });
  }

  async updateMealItem(id: string, data: Partial<CreateMealItemDto>) {
    return this.prisma.mealItem.update({
      where: { id },
      data,
    });
  }

  async deleteMealItem(id: string) {
    return this.prisma.mealItem.delete({
      where: { id },
    });
  }

  // Meal Intake Logging
  async logMealIntake(dto: LogMealIntakeDto, userId: string) {
    return this.prisma.mealIntakeLog.create({
      data: {
        elderId: dto.elderId,
        mealItemId: dto.mealItemId,
        loggedAt: new Date(dto.loggedAt),
        intakeLevel: dto.intakeLevel,
        notes: dto.notes,
        loggedByUserId: userId,
      },
      include: {
        mealItem: true,
        loggedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async getIntakeLogs(elderId: string, days: number = 7) {
    const startDate = subDays(new Date(), days);

    return this.prisma.mealIntakeLog.findMany({
      where: {
        elderId,
        loggedAt: {
          gte: startDate,
        },
      },
      include: {
        mealItem: true,
        loggedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { loggedAt: 'desc' },
    });
  }

  // Nutrition Analytics
  async getNutritionStats(elderId: string, days: number = 7) {
    const startDate = subDays(new Date(), days);

    const logs = await this.prisma.mealIntakeLog.findMany({
      where: {
        elderId,
        loggedAt: {
          gte: startDate,
        },
      },
      include: {
        mealItem: true,
      },
    });

    const totalMeals = logs.length;
    const fullIntake = logs.filter((l) => l.intakeLevel === 'FULL').length;
    const mostlyIntake = logs.filter((l) => l.intakeLevel === 'MOSTLY').length;
    const halfIntake = logs.filter((l) => l.intakeLevel === 'HALF').length;
    const littleIntake = logs.filter((l) => l.intakeLevel === 'LITTLE').length;
    const noneIntake = logs.filter((l) => l.intakeLevel === 'NONE').length;

    // Calculate estimated calories consumed
    let totalEstimatedCalories = 0;
    for (const log of logs) {
      if (log.mealItem.estimatedCalories) {
        const percentage = this.getIntakePercentage(log.intakeLevel);
        totalEstimatedCalories += log.mealItem.estimatedCalories * (percentage / 100);
      }
    }

    const averageDailyCalories = days > 0 ? totalEstimatedCalories / days : 0;

    return {
      period: {
        startDate,
        endDate: new Date(),
        days,
      },
      totalMeals,
      byIntakeLevel: {
        FULL: fullIntake,
        MOSTLY: mostlyIntake,
        HALF: halfIntake,
        LITTLE: littleIntake,
        NONE: noneIntake,
      },
      intakeRate: totalMeals > 0 ? ((fullIntake + mostlyIntake) / totalMeals) * 100 : 0,
      totalEstimatedCalories: Math.round(totalEstimatedCalories),
      averageDailyCalories: Math.round(averageDailyCalories),
    };
  }

  private getIntakePercentage(level: string): number {
    switch (level) {
      case 'FULL': return 100;
      case 'MOSTLY': return 75;
      case 'HALF': return 50;
      case 'LITTLE': return 25;
      case 'NONE': return 0;
      default: return 0;
    }
  }
}
