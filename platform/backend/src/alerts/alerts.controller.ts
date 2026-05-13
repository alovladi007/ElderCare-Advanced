import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, AlertSeverity, AlertType } from '@prisma/client';
import { ResolveAlertDto } from './dto/resolve-alert.dto';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get alerts with filters' })
  @ApiQuery({ name: 'elderId', required: false })
  @ApiQuery({ name: 'severity', enum: AlertSeverity, required: false })
  @ApiQuery({ name: 'resolved', type: Boolean, required: false })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  getAlerts(
    @Query('elderId') elderId?: string,
    @Query('severity') severity?: AlertSeverity,
    @Query('resolved') resolved?: string,
    @Query('limit') limit?: string,
  ) {
    const resolvedBool = resolved === 'true' ? true : resolved === 'false' ? false : undefined;
    const numLimit = limit ? parseInt(limit) : 50;
    return this.alertsService.getAlerts(elderId, severity, resolvedBool, numLimit);
  }

  @Get('unresolved')
  @ApiOperation({ summary: 'Get unresolved alerts' })
  @ApiQuery({ name: 'elderId', required: false })
  getUnresolvedAlerts(@Query('elderId') elderId?: string) {
    return this.alertsService.getUnresolvedAlerts(elderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  getAlert(@Param('id') id: string) {
    return this.alertsService.getAlert(id);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.CAREGIVER, UserRole.FAMILY, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve an alert' })
  resolveAlert(
    @Param('id') id: string,
    @Body() dto: ResolveAlertDto,
    @Request() req,
  ) {
    return this.alertsService.resolveAlert(id, req.user.userId, dto.notes);
  }

  @Get('elder/:elderId/type/:type')
  @ApiOperation({ summary: 'Get alerts by type for an elder' })
  getAlertsByType(
    @Param('elderId') elderId: string,
    @Param('type') type: AlertType,
  ) {
    return this.alertsService.getAlertsByType(elderId, type);
  }

  @Get('elder/:elderId/stats')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getAlertStats(
    @Param('elderId') elderId: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days) : 30;
    return this.alertsService.getAlertStats(elderId, numDays);
  }
}
