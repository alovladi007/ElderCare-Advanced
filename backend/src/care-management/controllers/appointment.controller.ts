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
import { AppointmentService } from '../services/appointment.service';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

@ApiTags('care-management')
@Controller('care-management/appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create appointment' })
  async createAppointment(
    @Body()
    body: {
      elderId: string;
      title: string;
      type: AppointmentType;
      description?: string;
      location?: string;
      startTime: string;
      endTime: string;
      attendees?: any;
      notes?: string;
    },
  ) {
    return this.appointmentService.createAppointment({
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });
  }

  @Get('elder/:elderId')
  @ApiOperation({ summary: 'Get appointments by elder' })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'type', required: false, enum: AppointmentType })
  @ApiQuery({ name: 'includeCompleted', required: false, type: Boolean })
  async getAppointmentsByElder(
    @Param('elderId') elderId: string,
    @Query('status') status?: AppointmentStatus,
    @Query('type') type?: AppointmentType,
    @Query('includeCompleted') includeCompleted?: boolean,
  ) {
    return this.appointmentService.getAppointmentsByElder(elderId, {
      status,
      type,
      includeCompleted: includeCompleted === true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async getAppointmentById(@Param('id') id: string) {
    return this.appointmentService.getAppointmentById(id);
  }

  @Get('elder/:elderId/upcoming')
  @ApiOperation({ summary: 'Get upcoming appointments' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getUpcomingAppointments(
    @Param('elderId') elderId: string,
    @Query('days') days?: number,
  ) {
    return this.appointmentService.getUpcomingAppointments(elderId, days);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update appointment' })
  async updateAppointment(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      type?: AppointmentType;
      description?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
      status?: AppointmentStatus;
      attendees?: any;
      notes?: string;
    },
  ) {
    return this.appointmentService.updateAppointment(id, {
      ...body,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    });
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  async cancelAppointment(
    @Param('id') id: string,
    @Body() body?: { reason?: string },
  ) {
    return this.appointmentService.cancelAppointment(id, body?.reason);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark appointment as completed' })
  async completeAppointment(
    @Param('id') id: string,
    @Body() body?: { notes?: string },
  ) {
    return this.appointmentService.completeAppointment(id, body?.notes);
  }

  @Get('elder/:elderId/stats')
  @ApiOperation({ summary: 'Get appointment statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getAppointmentStats(
    @Param('elderId') elderId: string,
    @Query('days') days?: number,
  ) {
    return this.appointmentService.getAppointmentStats(elderId, days);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment' })
  async deleteAppointment(@Param('id') id: string) {
    return this.appointmentService.deleteAppointment(id);
  }
}
