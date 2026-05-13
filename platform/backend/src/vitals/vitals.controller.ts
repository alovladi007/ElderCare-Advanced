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
import { VitalsService } from './vitals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CreateVitalReadingDto } from './dto/create-vital-reading.dto';
import { CreateVitalAlertRuleDto } from './dto/create-vital-alert-rule.dto';

@ApiTags('vitals')
@Controller('vitals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  // Devices
  @Post('devices')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a new device' })
  createDevice(@Body() dto: CreateDeviceDto) {
    return this.vitalsService.createDevice(dto);
  }

  @Get('devices/elder/:elderId')
  @ApiOperation({ summary: 'Get devices for an elder' })
  getDevicesByElder(@Param('elderId') elderId: string) {
    return this.vitalsService.getDevicesByElder(elderId);
  }

  // Vital Readings
  @Post('readings')
  @Roles(UserRole.CAREGIVER, UserRole.FAMILY, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Record a vital reading' })
  createVitalReading(@Body() dto: CreateVitalReadingDto, @Request() req) {
    return this.vitalsService.createVitalReading(dto, req.user.userId);
  }

  @Get('readings/elder/:elderId')
  @ApiOperation({ summary: 'Get vital readings for an elder' })
  @ApiQuery({ name: 'vitalTypeCode', required: false, example: 'BP_SYS' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  getVitalReadings(
    @Param('elderId') elderId: string,
    @Query('vitalTypeCode') vitalTypeCode?: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days) : 7;
    return this.vitalsService.getVitalReadings(elderId, vitalTypeCode, numDays);
  }

  @Get('readings/elder/:elderId/latest')
  @ApiOperation({ summary: 'Get latest reading for each vital type' })
  getLatestVitals(@Param('elderId') elderId: string) {
    return this.vitalsService.getLatestVitals(elderId);
  }

  // Alert Rules
  @Post('alert-rules')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create vital alert rule' })
  createAlertRule(@Body() dto: CreateVitalAlertRuleDto) {
    return this.vitalsService.createAlertRule(dto);
  }

  @Get('alert-rules/elder/:elderId')
  @ApiOperation({ summary: 'Get alert rules for an elder' })
  getAlertRulesByElder(@Param('elderId') elderId: string) {
    return this.vitalsService.getAlertRulesByElder(elderId);
  }

  @Patch('alert-rules/:id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update alert rule' })
  updateAlertRule(@Param('id') id: string, @Body() dto: Partial<CreateVitalAlertRuleDto>) {
    return this.vitalsService.updateAlertRule(id, dto);
  }

  @Delete('alert-rules/:id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete alert rule' })
  deleteAlertRule(@Param('id') id: string) {
    return this.vitalsService.deleteAlertRule(id);
  }

  // Vital Types
  @Get('types')
  @ApiOperation({ summary: 'Get all vital types' })
  getVitalTypes() {
    return this.vitalsService.getVitalTypes();
  }

  // Analytics
  @Get('stats/elder/:elderId/:vitalTypeCode')
  @ApiOperation({ summary: 'Get vital statistics' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getVitalStats(
    @Param('elderId') elderId: string,
    @Param('vitalTypeCode') vitalTypeCode: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days) : 30;
    return this.vitalsService.getVitalStats(elderId, vitalTypeCode, numDays);
  }
}
