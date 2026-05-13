import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { EmergencyScenarioService } from './services/emergency-scenario.service';
import { CreateEmergencyScenarioDto, CancelEmergencyScenarioDto, CreateHelpTriggerDto } from '../dto/automation.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('smart-home/emergency')
@Controller('smart-home/emergency')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmergencyController {
  constructor(
    private readonly emergencyScenario: EmergencyScenarioService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('homes/:homeId/scenarios')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Create emergency scenario' })
  createScenario(@Param('homeId') homeId: string, @Body() dto: CreateEmergencyScenarioDto) {
    return this.emergencyScenario.createScenario(homeId, dto);
  }

  @Get('homes/:homeId/scenarios')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get emergency scenarios for home' })
  getScenarios(@Param('homeId') homeId: string) {
    return this.emergencyScenario.getScenarios(homeId);
  }

  @Patch('scenarios/:scenarioId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Update emergency scenario' })
  updateScenario(@Param('scenarioId') scenarioId: string, @Body() dto: Partial<CreateEmergencyScenarioDto>) {
    return this.emergencyScenario.updateScenario(scenarioId, dto);
  }

  @Post('scenarios/cancel')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER, UserRole.ELDER)
  @ApiOperation({ summary: 'Cancel active emergency scenario' })
  cancelScenario(@Body() dto: CancelEmergencyScenarioDto) {
    return this.emergencyScenario.cancelScenario(dto);
  }

  @Post('homes/:homeId/help')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER, UserRole.ELDER)
  @ApiOperation({ summary: 'Trigger help/panic button' })
  async triggerHelp(@Param('homeId') homeId: string, @Body() dto: CreateHelpTriggerDto) {
    const helpTrigger = await this.prisma.helpTrigger.create({
      data: {
        homeId,
        elderId: dto.elderId,
        triggerType: dto.triggerType as any,
        sourceDeviceId: dto.sourceDeviceId,
        rawPayloadJson: dto.rawPayloadJson,
        notes: dto.notes,
      },
    });

    // Trigger panic button scenario
    await this.emergencyScenario.triggerScenario(homeId, 'PANIC_BUTTON');

    return helpTrigger;
  }
}
