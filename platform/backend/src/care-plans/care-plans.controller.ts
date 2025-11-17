import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CarePlansService } from './care-plans.service';
import { TaskSchedulerService } from './services/task-scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';

@ApiTags('care-plans')
@Controller('care-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CarePlansController {
  constructor(
    private readonly carePlansService: CarePlansService,
    private readonly taskSchedulerService: TaskSchedulerService,
  ) {}

  // Care Plans
  @Post()
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new care plan' })
  createCarePlan(@Body() dto: CreateCarePlanDto, @Request() req) {
    return this.carePlansService.createCarePlan(dto, req.user.userId);
  }

  @Get('elder/:elderId')
  @ApiOperation({ summary: 'Get all care plans for an elder' })
  getCarePlansByElder(@Param('elderId') elderId: string) {
    return this.carePlansService.getCarePlansByElder(elderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get care plan by ID' })
  getCarePlan(@Param('id') id: string) {
    return this.carePlansService.getCarePlan(id);
  }

  // Task Templates
  @Post('templates')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a task template' })
  createTaskTemplate(@Body() dto: CreateTaskTemplateDto) {
    return this.carePlansService.createTaskTemplate(dto);
  }

  // Task Instances
  @Get('elder/:elderId/tasks')
  @ApiOperation({ summary: 'Get tasks for an elder by date' })
  @ApiQuery({ name: 'date', required: false, example: '2025-01-17' })
  getTasksForElderByDate(
    @Param('elderId') elderId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    return this.carePlansService.getTasksForElderByDate(elderId, targetDate);
  }

  @Get('caregiver/:caregiverId/tasks')
  @Roles(UserRole.CAREGIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get tasks assigned to a caregiver by date' })
  @ApiQuery({ name: 'date', required: false, example: '2025-01-17' })
  getTasksByCaregiverAndDate(
    @Param('caregiverId') caregiverId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    return this.carePlansService.getTasksByCaregiverAndDate(caregiverId, targetDate);
  }

  @Patch('tasks/:taskId/status')
  @Roles(UserRole.CAREGIVER, UserRole.FAMILY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update task status' })
  updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    return this.carePlansService.updateTaskStatus(taskId, dto, req.user.userId);
  }

  @Patch('tasks/:taskId/assign/:caregiverId')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign task to caregiver' })
  assignTaskToCaregiver(
    @Param('taskId') taskId: string,
    @Param('caregiverId') caregiverId: string,
  ) {
    return this.carePlansService.assignTaskToCaregiver(taskId, caregiverId);
  }

  // Incidents
  @Post('incidents')
  @Roles(UserRole.CAREGIVER, UserRole.FAMILY, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Report an incident' })
  createIncident(@Body() dto: CreateIncidentDto, @Request() req) {
    return this.carePlansService.createIncident(dto, req.user.userId);
  }

  @Get('elder/:elderId/incidents')
  @ApiOperation({ summary: 'Get incidents for an elder' })
  getIncidentsByElder(@Param('elderId') elderId: string) {
    return this.carePlansService.getIncidentsByElder(elderId);
  }

  // Analytics
  @Get('elder/:elderId/stats')
  @ApiOperation({ summary: 'Get task completion statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getTaskCompletionStats(
    @Param('elderId') elderId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.carePlansService.getTaskCompletionStats(elderId, start, end);
  }

  // Manual task generation
  @Post('elder/:elderId/generate-tasks')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually generate tasks for an elder' })
  @ApiQuery({ name: 'date', required: false })
  async generateTasksForElder(
    @Param('elderId') elderId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    await this.taskSchedulerService.generateTasksForElder(elderId, targetDate);
    return { message: 'Tasks generated successfully', date: targetDate };
  }
}
