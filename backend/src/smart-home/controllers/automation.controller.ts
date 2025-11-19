import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AutomationEngineService } from '../services/automation-engine.service';
import { EventProcessorService } from '../services/event-processor.service';

@ApiTags('automation')
@Controller('automation')
export class AutomationController {
  constructor(
    private automationEngine: AutomationEngineService,
    private eventProcessor: EventProcessorService,
  ) {}

  // Automation Rules
  @Post('rules')
  @ApiOperation({ summary: 'Create automation rule' })
  async createRule(@Body() body: any) {
    return this.automationEngine.createAutomationRule(body);
  }

  @Get('rules/home/:homeId')
  @ApiOperation({ summary: 'Get automation rules for a home' })
  async getRules(@Param('homeId') homeId: string) {
    return this.automationEngine.getAutomationRules(homeId);
  }

  @Patch('rules/:ruleId')
  @ApiOperation({ summary: 'Update automation rule' })
  async updateRule(
    @Param('ruleId') ruleId: string,
    @Body() body: any,
  ) {
    return this.automationEngine.updateAutomationRule(ruleId, body);
  }

  @Delete('rules/:ruleId')
  @ApiOperation({ summary: 'Delete automation rule' })
  async deleteRule(@Param('ruleId') ruleId: string) {
    return this.automationEngine.deleteAutomationRule(ruleId);
  }

  // Events
  @Get('events/home/:homeId')
  @ApiOperation({ summary: 'Get recent sensor events for a home' })
  async getEvents(
    @Param('homeId') homeId: string,
    @Query('sensorType') sensorType?: string,
    @Query('severity') severity?: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventProcessor.getRecentEvents(homeId, {
      sensorType,
      severity: severity as any,
      limit: limit ? parseInt(limit) : 100,
    });
  }

  @Get('events/home/:homeId/stats')
  @ApiOperation({ summary: 'Get event statistics for a home' })
  async getEventStats(
    @Param('homeId') homeId: string,
    @Query('days') days?: string,
  ) {
    return this.eventProcessor.getEventStats(
      homeId,
      days ? parseInt(days) : 7,
    );
  }
}
