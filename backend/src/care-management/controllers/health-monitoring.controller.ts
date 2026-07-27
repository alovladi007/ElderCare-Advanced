import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { HealthMonitoringService } from '../services/health-monitoring.service';
import { VitalType } from '@prisma/client';
import { OptionalIntPipe } from '../../common/pipes/optional-int.pipe';

@ApiTags('care-management')
@Controller('care-management/health')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HealthMonitoringController {
  constructor(private healthService: HealthMonitoringService) {}

  @Post('vitals')
  @ApiOperation({ summary: 'Record vital reading' })
  async recordVital(
    @Body()
    body: {
      elderId: string;
      vitalType: VitalType;
      value: number;
      unit: string;
      systolic?: number;
      diastolic?: number;
      deviceId?: string;
      notes?: string;
    },
  ) {
    return this.healthService.recordVital(body);
  }

  @Get('vitals/elder/:elderId')
  @ApiOperation({ summary: 'Get vitals by elder' })
  @ApiQuery({ name: 'vitalType', required: false, enum: VitalType })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getVitalsByElder(
    @Param('elderId') elderId: string,
    @Query('vitalType') vitalType?: VitalType,
    @Query('days', OptionalIntPipe) days?: number,
  ) {
    return this.healthService.getVitalsByElder(elderId, vitalType, days);
  }

  @Get('vitals/elder/:elderId/latest')
  @ApiOperation({ summary: 'Get latest vitals for elder (one of each type)' })
  async getLatestVitals(@Param('elderId') elderId: string) {
    return this.healthService.getLatestVitals(elderId);
  }

  @Get('vitals/elder/:elderId/stats')
  @ApiOperation({ summary: 'Get vital statistics' })
  @ApiQuery({ name: 'vitalType', required: true, enum: VitalType })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getVitalStats(
    @Param('elderId') elderId: string,
    @Query('vitalType') vitalType: VitalType,
    @Query('days', OptionalIntPipe) days?: number,
  ) {
    return this.healthService.getVitalStats(elderId, vitalType, days);
  }

  @Get('elder/:elderId/summary')
  @ApiOperation({ summary: 'Get health summary for elder' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getHealthSummary(
    @Param('elderId') elderId: string,
    @Query('days', OptionalIntPipe) days?: number,
  ) {
    return this.healthService.getHealthSummary(elderId, days);
  }

  @Delete('vitals/:vitalId')
  @ApiOperation({ summary: 'Delete vital reading' })
  async deleteVital(@Param('vitalId') vitalId: string) {
    return this.healthService.deleteVital(vitalId);
  }
}
