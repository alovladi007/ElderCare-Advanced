import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AutomationEngineService } from './services/automation-engine.service';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from './dto/automation.dto';

@ApiTags('smart-home/automation')
@Controller('smart-home/automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AutomationController {
  constructor(private readonly automationEngine: AutomationEngineService) {}

  @Post('homes/:homeId/rules')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY)
  @ApiOperation({ summary: 'Create automation rule' })
  createRule(
    @Param('homeId') homeId: string,
    @Body() dto: CreateAutomationRuleDto,
    @Request() req,
  ) {
    return this.automationEngine.createRule(homeId, req.user.userId, dto);
  }

  @Get('homes/:homeId/rules')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all automation rules for home' })
  getRules(@Param('homeId') homeId: string) {
    return this.automationEngine.getRules(homeId);
  }

  @Patch('rules/:ruleId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY)
  @ApiOperation({ summary: 'Update automation rule' })
  updateRule(@Param('ruleId') ruleId: string, @Body() dto: UpdateAutomationRuleDto) {
    return this.automationEngine.updateRule(ruleId, dto);
  }

  @Delete('rules/:ruleId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Delete automation rule' })
  deleteRule(@Param('ruleId') ruleId: string) {
    return this.automationEngine.deleteRule(ruleId);
  }
}
