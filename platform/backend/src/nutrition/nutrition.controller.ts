import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NutritionService } from './nutrition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateNutritionProfileDto } from './dto/create-nutrition-profile.dto';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { CreateMealItemDto } from './dto/create-meal-item.dto';
import { LogMealIntakeDto } from './dto/log-meal-intake.dto';

@ApiTags('nutrition')
@Controller('nutrition')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  // Nutrition Profile
  @Post('profile')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create or update nutrition profile' })
  createOrUpdateProfile(@Body() dto: CreateNutritionProfileDto) {
    return this.nutritionService.createOrUpdateProfile(dto);
  }

  @Get('profile/:elderId')
  @ApiOperation({ summary: 'Get nutrition profile for elder' })
  getNutritionProfile(@Param('elderId') elderId: string) {
    return this.nutritionService.getNutritionProfile(elderId);
  }

  // Meal Plans
  @Post('meal-plans')
  @Roles(UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create meal plan' })
  createMealPlan(@Body() dto: CreateMealPlanDto, @Request() req) {
    return this.nutritionService.createMealPlan(dto, req.user.userId);
  }

  @Get('meal-plans/elder/:elderId')
  @ApiOperation({ summary: 'Get meal plans for elder' })
  getMealPlans(@Param('elderId') elderId: string) {
    return this.nutritionService.getMealPlans(elderId);
  }

  @Get('meal-plans/:id')
  @ApiOperation({ summary: 'Get meal plan by ID' })
  getMealPlan(@Param('id') id: string) {
    return this.nutritionService.getMealPlan(id);
  }

  @Get('meal-plans/elder/:elderId/weekly')
  @ApiOperation({ summary: 'Get weekly meal plan for elder' })
  @ApiQuery({ name: 'weekStart', required: false, example: '2025-01-20' })
  getWeeklyMealPlan(
    @Param('elderId') elderId: string,
    @Query('weekStart') weekStart?: string,
  ) {
    const date = weekStart ? new Date(weekStart) : undefined;
    return this.nutritionService.getWeeklyMealPlan(elderId, date);
  }

  // Meal Items
  @Post('meal-items')
  @Roles(UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create meal item' })
  createMealItem(@Body() dto: CreateMealItemDto) {
    return this.nutritionService.createMealItem(dto);
  }

  @Get('meal-items/plan/:mealPlanId')
  @ApiOperation({ summary: 'Get meal items for a plan' })
  getMealItems(@Param('mealPlanId') mealPlanId: string) {
    return this.nutritionService.getMealItems(mealPlanId);
  }

  @Patch('meal-items/:id')
  @Roles(UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update meal item' })
  updateMealItem(@Param('id') id: string, @Body() dto: Partial<CreateMealItemDto>) {
    return this.nutritionService.updateMealItem(id, dto);
  }

  @Delete('meal-items/:id')
  @Roles(UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete meal item' })
  deleteMealItem(@Param('id') id: string) {
    return this.nutritionService.deleteMealItem(id);
  }

  // Intake Logging
  @Post('intake')
  @Roles(UserRole.CAREGIVER, UserRole.FAMILY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Log meal intake' })
  logMealIntake(@Body() dto: LogMealIntakeDto, @Request() req) {
    return this.nutritionService.logMealIntake(dto, req.user.userId);
  }

  @Get('intake/elder/:elderId')
  @ApiOperation({ summary: 'Get meal intake logs for elder' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  getIntakeLogs(@Param('elderId') elderId: string, @Query('days') days?: string) {
    const numDays = days ? parseInt(days) : 7;
    return this.nutritionService.getIntakeLogs(elderId, numDays);
  }

  // Analytics
  @Get('stats/elder/:elderId')
  @ApiOperation({ summary: 'Get nutrition statistics for elder' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  getNutritionStats(@Param('elderId') elderId: string, @Query('days') days?: string) {
    const numDays = days ? parseInt(days) : 7;
    return this.nutritionService.getNutritionStats(elderId, numDays);
  }
}
