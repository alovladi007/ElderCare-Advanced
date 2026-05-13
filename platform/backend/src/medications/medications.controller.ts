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
import { MedicationsService } from './medications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { CreateMedicationScheduleDto } from './dto/create-medication-schedule.dto';
import { LogAdministrationDto } from './dto/log-administration.dto';

@ApiTags('medications')
@Controller('medications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  // Medications
  @Post()
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a new medication' })
  createMedication(@Body() dto: CreateMedicationDto) {
    return this.medicationsService.createMedication(dto);
  }

  @Get('elder/:elderId')
  @ApiOperation({ summary: 'Get medications for an elder' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  getMedicationsByElder(
    @Param('elderId') elderId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.medicationsService.getMedicationsByElder(
      elderId,
      activeOnly !== 'false',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medication by ID' })
  getMedication(@Param('id') id: string) {
    return this.medicationsService.getMedication(id);
  }

  @Patch(':id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update medication' })
  updateMedication(@Param('id') id: string, @Body() dto: Partial<CreateMedicationDto>) {
    return this.medicationsService.updateMedication(id, dto);
  }

  // Schedules
  @Post('schedules')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create medication schedule' })
  createSchedule(@Body() dto: CreateMedicationScheduleDto) {
    return this.medicationsService.createSchedule(dto);
  }

  // Today's Medications
  @Get('elder/:elderId/today')
  @ApiOperation({ summary: 'Get today\'s medication timeline for an elder' })
  getTodaysMedications(@Param('elderId') elderId: string) {
    return this.medicationsService.getTodaysMedications(elderId);
  }

  // Administration Logging
  @Post('log')
  @Roles(UserRole.CAREGIVER, UserRole.FAMILY, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Log medication administration' })
  logAdministration(@Body() dto: LogAdministrationDto, @Request() req) {
    return this.medicationsService.logAdministration(dto, req.user.userId);
  }

  // Adherence Report
  @Get('elder/:elderId/adherence')
  @ApiOperation({ summary: 'Get medication adherence report' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getAdherenceReport(
    @Param('elderId') elderId: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days) : 30;
    return this.medicationsService.getAdherenceReport(elderId, numDays);
  }

  // Administration History
  @Get('elder/:elderId/history')
  @ApiOperation({ summary: 'Get medication administration history' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  getAdministrationHistory(
    @Param('elderId') elderId: string,
    @Query('limit') limit?: string,
  ) {
    const numLimit = limit ? parseInt(limit) : 50;
    return this.medicationsService.getAdministrationHistory(elderId, numLimit);
  }
}
