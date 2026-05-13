import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from '../dto/automation.dto';

@Injectable()
export class AutomationEngineService {
  private readonly logger = new Logger(AutomationEngineService.name);

  constructor(private prisma: PrismaService) {}

  // Rule Management
  async createRule(homeId: string, userId: string, dto: CreateAutomationRuleDto) {
    return this.prisma.automationRule.create({
      data: {
        homeId,
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : true,
        triggerType: dto.triggerType,
        triggerConfigJson: dto.triggerConfigJson,
        conditionConfigJson: dto.conditionConfigJson,
        actionsConfigJson: dto.actionsConfigJson,
        severity: dto.severity || 'INFO',
        createdByUserId: userId,
      },
    });
  }

  async getRules(homeId: string) {
    return this.prisma.automationRule.findMany({
      where: { homeId },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRule(ruleId: string, dto: UpdateAutomationRuleDto) {
    return this.prisma.automationRule.update({
      where: { id: ruleId },
      data: {
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled,
        triggerConfigJson: dto.triggerConfigJson,
        conditionConfigJson: dto.conditionConfigJson,
        actionsConfigJson: dto.actionsConfigJson,
      },
    });
  }

  async deleteRule(ruleId: string) {
    return this.prisma.automationRule.delete({
      where: { id: ruleId },
    });
  }

  // Rule Evaluation
  async evaluateEvent(event: any) {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        homeId: event.device.homeId,
        isEnabled: true,
        triggerType: 'SENSOR_EVENT',
      },
    });

    for (const rule of rules) {
      try {
        if (await this.doesEventMatchRule(event, rule)) {
          this.logger.log(`Event ${event.id} matches rule ${rule.name}`);
          await this.executeRuleActions(rule, event);
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }
  }

  private async doesEventMatchRule(event: any, rule: any): Promise<boolean> {
    const trigger = rule.triggerConfigJson;

    // Check sensor ID match
    if (trigger.sensorId && trigger.sensorId !== event.sensorId) {
      return false;
    }

    // Check sensor type match
    if (trigger.sensorType && trigger.sensorType !== event.sensor.sensorType) {
      return false;
    }

    // Check event type match
    if (trigger.eventType && trigger.eventType !== event.eventType) {
      return false;
    }

    // Check value match
    if (trigger.valueEquals !== undefined) {
      if (event.valueText !== trigger.valueEquals && event.valueNumeric !== trigger.valueEquals) {
        return false;
      }
    }

    // Check numeric value range
    if (trigger.valueMin !== undefined && event.valueNumeric < trigger.valueMin) {
      return false;
    }

    if (trigger.valueMax !== undefined && event.valueNumeric > trigger.valueMax) {
      return false;
    }

    // Check additional conditions
    if (rule.conditionConfigJson) {
      return await this.evaluateConditions(event, rule.conditionConfigJson);
    }

    return true;
  }

  private async evaluateConditions(event: any, conditions: any): Promise<boolean> {
    // Time range check
    if (conditions.timeRange) {
      const now = new Date();
      const hours = now.getHours();
      const { start, end } = conditions.timeRange;

      if (start <= end) {
        if (hours < start || hours >= end) return false;
      } else {
        // Overnight range
        if (hours < start && hours >= end) return false;
      }
    }

    // Zone check
    if (conditions.zoneId && event.device.zoneId !== conditions.zoneId) {
      return false;
    }

    // Day of week check
    if (conditions.daysOfWeek && Array.isArray(conditions.daysOfWeek)) {
      const dayOfWeek = new Date().getDay();
      if (!conditions.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }

    return true;
  }

  private async executeRuleActions(rule: any, event: any) {
    const actions = rule.actionsConfigJson;

    if (!Array.isArray(actions)) {
      this.logger.warn(`Rule ${rule.id} has invalid actions config`);
      return;
    }

    for (const action of actions) {
      try {
        await this.executeAction(action, rule, event);
      } catch (error) {
        this.logger.error(`Error executing action:`, error);
      }
    }
  }

  private async executeAction(action: any, rule: any, event: any) {
    switch (action.type) {
      case 'ACTUATOR_COMMAND':
        await this.issueActuatorCommand(action, rule.id);
        break;

      case 'CREATE_ALERT':
        await this.createAlert(action, rule, event);
        break;

      case 'TTS_ANNOUNCEMENT':
        await this.sendTTSAnnouncement(action, rule, event);
        break;

      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  private async issueActuatorCommand(action: any, ruleId: string) {
    const actuator = await this.prisma.actuator.findUnique({
      where: { id: action.actuatorId },
      include: { device: true },
    });

    if (!actuator) {
      this.logger.warn(`Actuator ${action.actuatorId} not found`);
      return;
    }

    await this.prisma.actuatorCommand.create({
      data: {
        homeId: actuator.device.homeId,
        deviceId: actuator.deviceId,
        actuatorId: action.actuatorId,
        commandName: action.commandName || 'SET_STATE',
        commandParamsJson: action.commandParams || {},
        issuedByRuleId: ruleId,
        status: 'PENDING',
      },
    });

    this.logger.log(`Issued command to actuator ${actuator.name} from rule`);
  }

  private async createAlert(action: any, rule: any, event: any) {
    const home = await this.prisma.home.findUnique({
      where: { id: rule.homeId },
    });

    if (!home) return;

    await this.prisma.alert.create({
      data: {
        elderId: home.elderId,
        type: action.alertType || 'SMART_HOME_CUSTOM',
        severity: action.severity || rule.severity,
        title: action.title || `Automation: ${rule.name}`,
        message: action.message || `Rule "${rule.name}" triggered`,
        sourceEntityType: 'AutomationRule',
        sourceEntityId: rule.id,
      },
    });
  }

  private async sendTTSAnnouncement(action: any, rule: any, event: any) {
    // Find TTS actuators in the home
    const ttsActuators = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId: rule.homeId,
        },
        actuatorType: 'SPEAKER_TTS',
      },
    });

    for (const actuator of ttsActuators) {
      await this.prisma.actuatorCommand.create({
        data: {
          homeId: rule.homeId,
          deviceId: actuator.deviceId,
          actuatorId: actuator.id,
          commandName: 'SPEAK',
          commandParamsJson: {
            message: action.message || 'Automation triggered',
            volume: action.volume || 70,
          },
          issuedByRuleId: rule.id,
          status: 'PENDING',
        },
      });
    }

    this.logger.log(`Sent TTS announcement: "${action.message}"`);
  }
}
