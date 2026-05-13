import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logging/logger.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DeviceService } from './device.service';
import { AlertSeverity, AutomationRuleTriggerType } from '@prisma/client';

@Injectable()
export class AutomationEngineService {
  constructor(
    private prisma: PrismaService,
    private deviceService: DeviceService,
    private logger: LoggerService,
  ) {}

  /**
   * Evaluate all enabled automation rules for a given sensor event
   */
  async evaluateRulesForEvent(event: any) {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        homeId: event.homeId,
        isEnabled: true,
        triggerType: {
          in: ['SENSOR_EVENT', 'COMPOSITE'],
        },
      },
    });

    console.log(`🔍 Evaluating ${rules.length} automation rules for event ${event.id}`);

    for (const rule of rules) {
      await this.evaluateRule(rule, event);
    }
  }

  /**
   * Evaluate a single automation rule against a sensor event
   */
  private async evaluateRule(rule: any, event: any) {
    const triggerConfig = rule.triggerConfigJson as any;
    const conditionConfig = rule.conditionConfigJson as any;

    let triggered = false;

    // Check trigger condition
    if (rule.triggerType === 'SENSOR_EVENT') {
      triggered = this.evaluateSensorEventTrigger(triggerConfig, event);
    } else if (rule.triggerType === 'COMPOSITE') {
      triggered = await this.evaluateCompositeTrigger(triggerConfig, event);
    }

    if (!triggered) {
      return;
    }

    // Check additional conditions if present
    if (conditionConfig) {
      const conditionsMet = this.evaluateConditions(conditionConfig, event);
      if (!conditionsMet) {
        return;
      }
    }

    console.log(`✅ Rule "${rule.name}" triggered by event ${event.id}`);

    // Execute actions
    await this.executeActions(rule, event);
  }

  /**
   * Evaluate a sensor event trigger
   */
  private evaluateSensorEventTrigger(triggerConfig: any, event: any): boolean {
    // Check sensor ID match
    if (triggerConfig.sensorId && triggerConfig.sensorId !== event.sensorId) {
      return false;
    }

    // Check sensor type match
    if (triggerConfig.sensorType && triggerConfig.sensorType !== event.sensor.sensorType) {
      return false;
    }

    // Check event type match
    if (triggerConfig.eventType && triggerConfig.eventType !== event.eventType) {
      return false;
    }

    // Check value match
    if (triggerConfig.valueEquals !== undefined) {
      if (event.valueText !== triggerConfig.valueEquals) {
        return false;
      }
    }

    // Check numeric value range
    if (triggerConfig.valueMin !== undefined || triggerConfig.valueMax !== undefined) {
      if (event.valueNumeric === null || event.valueNumeric === undefined) {
        return false;
      }

      if (triggerConfig.valueMin !== undefined && event.valueNumeric < triggerConfig.valueMin) {
        return false;
      }

      if (triggerConfig.valueMax !== undefined && event.valueNumeric > triggerConfig.valueMax) {
        return false;
      }
    }

    // Check zone
    if (triggerConfig.zoneId && triggerConfig.zoneId !== event.sensor.device.zoneId) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate composite trigger (multiple conditions)
   */
  private async evaluateCompositeTrigger(triggerConfig: any, event: any): boolean {
    // For now, implement simple AND logic
    // In a full implementation, this would support complex AND/OR/NOT logic
    const conditions = triggerConfig.conditions || [];

    for (const condition of conditions) {
      const conditionMet = this.evaluateSensorEventTrigger(condition, event);
      if (!conditionMet) {
        return false;
      }
    }

    return conditions.length > 0;
  }

  /**
   * Evaluate additional conditions (time ranges, etc.)
   */
  private evaluateConditions(conditionConfig: any, event: any): boolean {
    // Check time range
    if (conditionConfig.timeRange) {
      const currentHour = new Date().getHours();
      const startHour = parseInt(conditionConfig.timeRange.start.split(':')[0]);
      const endHour = parseInt(conditionConfig.timeRange.end.split(':')[0]);

      if (startHour <= endHour) {
        if (currentHour < startHour || currentHour >= endHour) {
          return false;
        }
      } else {
        // Wraps around midnight
        if (currentHour < startHour && currentHour >= endHour) {
          return false;
        }
      }
    }

    // Check day of week
    if (conditionConfig.daysOfWeek) {
      const currentDay = new Date().getDay(); // 0 = Sunday
      if (!conditionConfig.daysOfWeek.includes(currentDay)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute automation rule actions
   */
  private async executeActions(rule: any, event: any) {
    const actions = rule.actionsConfigJson as any[];

    for (const action of actions) {
      try {
        await this.executeAction(action, rule, event);
      } catch (error) {
        console.error(`Error executing action:`, error);
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: any, rule: any, event: any) {
    switch (action.type) {
      case 'ACTUATOR_COMMAND':
        await this.executeActuatorCommand(action, rule, event);
        break;

      case 'CREATE_ALERT':
        await this.executeCreateAlert(action, rule, event);
        break;

      case 'TTS_ANNOUNCEMENT':
        await this.executeTTSAnnouncement(action, rule, event);
        break;

      case 'TURN_ON_LIGHTS':
        await this.executeTurnOnLights(action, rule, event);
        break;

      case 'LOCK_DOORS':
        await this.executeLockDoors(action, rule, event);
        break;

      default:
        console.log(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute actuator command action
   */
  private async executeActuatorCommand(action: any, rule: any, event: any) {
    await this.deviceService.issueActuatorCommand({
      homeId: event.homeId,
      deviceId: action.deviceId || event.deviceId,
      actuatorId: action.actuatorId,
      commandName: action.commandName || 'SET_STATE',
      commandParamsJson: action.commandParams,
      issuedByRuleId: rule.id,
    });

    console.log(`🎛️ Actuator command issued by rule "${rule.name}"`);
  }

  /**
   * Execute create alert action
   */
  private async executeCreateAlert(action: any, rule: any, event: any) {
    await this.prisma.alert.create({
      data: {
        elderId: event.sensor.device.home.elderId,
        type: action.alertType || 'SMART_HOME_CUSTOM',
        severity: action.severity || rule.severity || 'INFO',
        status: 'ACTIVE',
        title: action.title || rule.name,
        message: action.message || `Triggered by ${event.sensor.name}`,
        sourceSensorEventId: event.id,
        triggeredAt: new Date(),
      },
    });

    console.log(`🚨 Alert created by rule "${rule.name}"`);
  }

  /**
   * Execute TTS announcement action
   */
  private async executeTTSAnnouncement(action: any, rule: any, event: any) {
    // Find TTS actuators in the home
    const ttsActuators = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId: event.homeId,
        },
        actuatorType: 'SPEAKER_TTS',
      },
      include: {
        device: true,
      },
    });

    for (const actuator of ttsActuators) {
      await this.deviceService.issueActuatorCommand({
        homeId: event.homeId,
        deviceId: actuator.deviceId,
        actuatorId: actuator.id,
        commandName: 'SPEAK',
        commandParamsJson: {
          message: action.message,
          volume: action.volume || 70,
          repeat: action.repeat || 1,
        },
        issuedByRuleId: rule.id,
      });
    }

    console.log(`🔊 TTS announcement: "${action.message}"`);
  }

  /**
   * Execute turn on lights action
   */
  private async executeTurnOnLights(action: any, rule: any, event: any) {
    const where: any = {
      device: {
        homeId: event.homeId,
      },
      actuatorType: 'LIGHT',
    };

    if (action.zoneId) {
      where.device.zoneId = action.zoneId;
    }

    const lightActuators = await this.prisma.actuator.findMany({
      where,
      include: {
        device: true,
      },
    });

    for (const actuator of lightActuators) {
      await this.deviceService.issueActuatorCommand({
        homeId: event.homeId,
        deviceId: actuator.deviceId,
        actuatorId: actuator.id,
        commandName: 'SET_STATE',
        commandParamsJson: {
          on: true,
          brightness: action.brightness || 100,
        },
        issuedByRuleId: rule.id,
      });
    }

    console.log(`💡 Lights turned on by rule "${rule.name}"`);
  }

  /**
   * Execute lock doors action
   */
  private async executeLockDoors(action: any, rule: any, event: any) {
    const lockActuators = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId: event.homeId,
        },
        actuatorType: 'DOOR_LOCK',
      },
      include: {
        device: true,
      },
    });

    for (const actuator of lockActuators) {
      await this.deviceService.issueActuatorCommand({
        homeId: event.homeId,
        deviceId: actuator.deviceId,
        actuatorId: actuator.id,
        commandName: 'SET_LOCK',
        commandParamsJson: {
          locked: action.locked !== undefined ? action.locked : true,
        },
        issuedByRuleId: rule.id,
      });
    }

    console.log(`🔒 Doors ${action.locked ? 'locked' : 'unlocked'} by rule "${rule.name}"`);
  }

  /**
   * Check for inactivity (runs periodically via cron job)
   */
  async checkInactivity() {
    const inactivityProfiles = await this.prisma.inactivityProfile.findMany({
      include: {
        home: {
          include: {
            elder: true,
          },
        },
      },
    });

    for (const profile of inactivityProfiles) {
      await this.checkInactivityForProfile(profile);
    }
  }

  /**
   * Check inactivity for a specific profile
   */
  private async checkInactivityForProfile(profile: any) {
    const config = profile.configJson as any;
    const now = new Date();
    const currentHour = now.getHours();

    // Parse wake hours
    const wakeStart = parseInt(config.wakeHours?.start?.split(':')[0] || '6');
    const wakeEnd = parseInt(config.wakeHours?.end?.split(':')[0] || '22');

    // Only check during wake hours
    const isWakeHours = currentHour >= wakeStart && currentHour < wakeEnd;
    if (!isWakeHours) {
      return;
    }

    const maxNoMotionMinutes = config.maxNoMotionMinutes || 90;
    const thresholdTime = new Date(now.getTime() - maxNoMotionMinutes * 60 * 1000);

    // Find last motion event
    const lastMotion = await this.prisma.sensorEvent.findFirst({
      where: {
        homeId: profile.homeId,
        sensor: {
          sensorType: {
            in: ['MOTION', 'PRESENCE_BED', 'PRESENCE_CHAIR', 'CONTACT_DOOR'],
          },
        },
        occurredAt: {
          gte: thresholdTime,
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
    });

    if (!lastMotion) {
      console.log(`⚠️ Inactivity detected for elder ${profile.elderId}`);

      // Check if we already have an active inactivity alert
      const existingAlert = await this.prisma.alert.findFirst({
        where: {
          elderId: profile.elderId,
          type: 'SMART_HOME_INACTIVITY',
          status: 'ACTIVE',
          createdAt: {
            gte: thresholdTime,
          },
        },
      });

      if (!existingAlert) {
        await this.prisma.alert.create({
          data: {
            elderId: profile.elderId,
            type: 'SMART_HOME_INACTIVITY',
            severity: 'WARNING',
            status: 'ACTIVE',
            title: 'Inactivity Detected',
            message: `No movement detected for ${maxNoMotionMinutes} minutes`,
            triggeredAt: now,
          },
        });

        console.log(`🚨 Inactivity alert created for elder ${profile.elderId}`);
      }
    }
  }

  /**
   * Create or update automation rule
   */
  async createAutomationRule(data: {
    homeId: string;
    name: string;
    description?: string;
    triggerType: AutomationRuleTriggerType;
    triggerConfigJson: any;
    conditionConfigJson?: any;
    actionsConfigJson: any;
    severity?: AlertSeverity;
    createdByUserId: string;
  }) {
    return this.prisma.automationRule.create({
      data,
    });
  }

  async getAutomationRules(homeId: string) {
    return this.prisma.automationRule.findMany({
      where: { homeId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateAutomationRule(ruleId: string, data: {
    name?: string;
    description?: string;
    isEnabled?: boolean;
    triggerConfigJson?: any;
    conditionConfigJson?: any;
    actionsConfigJson?: any;
    severity?: AlertSeverity;
  }) {
    return this.prisma.automationRule.update({
      where: { id: ruleId },
      data,
    });
  }

  async deleteAutomationRule(ruleId: string) {
    return this.prisma.automationRule.delete({
      where: { id: ruleId },
    });
  }
}
