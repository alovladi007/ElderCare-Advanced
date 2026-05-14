import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CarePlanService } from '../services/care-plan.service';
import { CareTaskStatus, CareTaskPriority } from '@prisma/client';

@ApiTags('care-management')
@Controller('care-management/care-plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CarePlanController {
  constructor(private carePlanService: CarePlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create care plan for elder' })
  async createCarePlan(
    @Body()
    body: {
      elderId: string;
      title: string;
      description?: string;
      goals?: any;
      services?: any;
      startDate: string;
      endDate?: string;
      notes?: string;
    },
  ) {
    return this.carePlanService.createCarePlan({
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Get('elder/:elderId')
  @ApiOperation({ summary: 'Get care plan by elder ID' })
  async getCarePlanByElder(@Param('elderId') elderId: string) {
    return this.carePlanService.getCarePlanByElder(elderId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update care plan' })
  async updateCarePlan(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      goals?: any;
      services?: any;
      endDate?: string;
      isActive?: boolean;
      notes?: string;
    },
  ) {
    return this.carePlanService.updateCarePlan(id, {
      ...body,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete care plan' })
  async deleteCarePlan(@Param('id') id: string) {
    return this.carePlanService.deleteCarePlan(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get care plan statistics' })
  async getCarePlanStats(@Param('id') _carePlanId: string) {
    // Need to get elderId from carePlan
    const carePlan = await this.carePlanService.getCarePlanByElder(''); // This needs refactoring
    return this.carePlanService.getCarePlanStats(carePlan!.elderId);
  }

  // ============================================================================
  // CARE TASKS
  // ============================================================================

  @Post(':carePlanId/tasks')
  @ApiOperation({ summary: 'Create care task' })
  async createTask(
    @Param('carePlanId') _carePlanId: string,
    @Body()
    body: {
      title: string;
      description?: string;
      assignedTo?: string;
      priority?: CareTaskPriority;
      dueDate: string;
      notes?: string;
    },
  ) {
    return this.carePlanService.createTask({
      carePlanId,
      ...body,
      dueDate: new Date(body.dueDate),
    });
  }

  @Get(':carePlanId/tasks')
  @ApiOperation({ summary: 'Get tasks by care plan' })
  @ApiQuery({ name: 'includeCompleted', required: false, type: Boolean })
  async getTasksByCarePlan(
    @Param('carePlanId') _carePlanId: string,
    @Query('includeCompleted') includeCompleted?: boolean,
  ) {
    return this.carePlanService.getTasksByCarePlan(
      carePlanId,
      includeCompleted === true,
    );
  }

  @Get('elder/:elderId/overdue-tasks')
  @ApiOperation({ summary: 'Get overdue tasks for elder' })
  async getOverdueTasks(@Param('elderId') elderId: string) {
    return this.carePlanService.getOverdueTasks(elderId);
  }

  @Put('tasks/:taskId')
  @ApiOperation({ summary: 'Update care task' })
  async updateTask(
    @Param('taskId') taskId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      assignedTo?: string;
      priority?: CareTaskPriority;
      status?: CareTaskStatus;
      dueDate?: string;
      notes?: string;
    },
  ) {
    return this.carePlanService.updateTask(taskId, {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
  }

  @Post('tasks/:taskId/complete')
  @ApiOperation({ summary: 'Mark task as completed' })
  async completeTask(
    @Param('taskId') taskId: string,
    @Body() body?: { notes?: string },
  ) {
    return this.carePlanService.completeTask(taskId, body?.notes);
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Delete care task' })
  async deleteTask(@Param('taskId') taskId: string) {
    return this.carePlanService.deleteTask(taskId);
  }
}
