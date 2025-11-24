import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmergencyScenarioService } from '../services/emergency-scenario.service';

@ApiTags('emergency')
@Controller('emergency')
export class EmergencyController {
  constructor(private emergencyScenario: EmergencyScenarioService) {}

  // Emergency Scenarios
  @Post('scenarios')
  @ApiOperation({ summary: 'Create emergency scenario' })
  async createScenario(@Body() body: any) {
    return this.emergencyScenario.createEmergencyScenario(body);
  }

  @Get('scenarios/home/:homeId')
  @ApiOperation({ summary: 'Get emergency scenarios for a home' })
  async getScenarios(@Param('homeId') homeId: string) {
    return this.emergencyScenario.getEmergencyScenarios(homeId);
  }

  @Patch('scenarios/:scenarioId')
  @ApiOperation({ summary: 'Update emergency scenario' })
  async updateScenario(
    @Param('scenarioId') scenarioId: string,
    @Body() body: any,
  ) {
    return this.emergencyScenario.updateEmergencyScenario(scenarioId, body);
  }

  // Active Scenarios
  @Get('active/home/:homeId')
  @ApiOperation({ summary: 'Get active emergency scenarios' })
  async getActiveScenarios(@Param('homeId') homeId: string) {
    return this.emergencyScenario.getActiveScenarios(homeId);
  }

  @Post('cancel/:instanceId')
  @ApiOperation({ summary: 'Cancel an active emergency scenario' })
  async cancelScenario(
    @Param('instanceId') instanceId: string,
    @Body() body: { cancelToken?: string },
  ) {
    return this.emergencyScenario.cancelScenario(instanceId, body.cancelToken);
  }

  // Help Triggers
  @Post('help-trigger')
  @ApiOperation({ summary: 'Create a help trigger (panic button, voice, etc.)' })
  async createHelpTrigger(@Body() body: {
    homeId: string;
    elderId: string;
    triggerType: string;
    sourceDeviceId?: string;
    rawPayloadJson?: any;
    notes?: string;
  }) {
    return this.emergencyScenario.createHelpTrigger(body);
  }
}
