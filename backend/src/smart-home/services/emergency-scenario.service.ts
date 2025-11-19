import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DeviceService } from './device.service';

@Injectable()
export class EmergencyScenarioService {
  private activeScenarioTimers: Map<string, NodeJS.Timeout[]> = new Map();

  constructor(
    private prisma: PrismaService,
    private deviceService: DeviceService,
  ) {}

  /**
   * Trigger an emergency scenario by type
   */
  async triggerScenario(homeId: string, scenarioType: string, sensorEventId?: string) {
    // Find matching scenario
    const scenario = await this.prisma.emergencyScenario.findFirst({
      where: {
        homeId,
        isEnabled: true,
        triggerSignatureJson: {
          path: ['type'],
          equals: scenarioType,
        } as any,
      },
      include: {
        home: {
          include: {
            elder: true,
          },
        },
      },
    });

    if (!scenario) {
      console.log(`⚠️ No enabled scenario found for type: ${scenarioType}`);
      return null;
    }

    console.log(`🚨 Triggering emergency scenario: ${scenario.name}`);

    // Create scenario instance
    const instance = await this.prisma.emergencyScenarioInstance.create({
      data: {
        scenarioId: scenario.id,
        homeId,
        elderId: scenario.home.elderId,
        status: 'ACTIVE',
        currentStepIndex: 0,
        relatedSensorEventId: sensorEventId,
        cancelToken: this.generateCancelToken(),
        lastActionAt: new Date(),
      },
    });

    // Create initial alert
    await this.prisma.alert.create({
      data: {
        elderId: scenario.home.elderId,
        type: this.mapScenarioTypeToAlertType(scenarioType),
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: scenario.name,
        message: `Emergency scenario "${scenario.name}" has been triggered. Cancel code: ${instance.cancelToken}`,
        sourceEmergencyScenarioId: scenario.id,
        sourceSensorEventId: sensorEventId,
        triggeredAt: new Date(),
      },
    });

    // Update scenario last triggered time
    await this.prisma.emergencyScenario.update({
      where: { id: scenario.id },
      data: {
        lastTriggeredAt: new Date(),
      },
    });

    // Start executing stepwise actions
    await this.executeScenarioSteps(instance.id, scenario);

    return instance;
  }

  /**
   * Execute stepwise actions for a scenario
   */
  private async executeScenarioSteps(instanceId: string, scenario: any) {
    const steps = scenario.stepwiseActionsJson as any[];
    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const delaySec = step.delaySec || 0;

      const timer = setTimeout(async () => {
        // Check if scenario is still active
        const instance = await this.prisma.emergencyScenarioInstance.findUnique({
          where: { id: instanceId },
        });

        if (!instance || instance.status !== 'ACTIVE') {
          console.log(`Scenario ${instanceId} is no longer active, skipping step ${i}`);
          return;
        }

        console.log(`⏱️ Executing step ${i} of scenario: ${step.action}`);

        await this.executeScenarioAction(instanceId, scenario, step, i);

        // Update current step index
        await this.prisma.emergencyScenarioInstance.update({
          where: { id: instanceId },
          data: {
            currentStepIndex: i + 1,
            lastActionAt: new Date(),
          },
        });
      }, delaySec * 1000);

      timers.push(timer);
    }

    this.activeScenarioTimers.set(instanceId, timers);
  }

  /**
   * Execute a single scenario action
   */
  private async executeScenarioAction(instanceId: string, scenario: any, step: any, stepIndex: number) {
    const instance = await this.prisma.emergencyScenarioInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) return;

    switch (step.action) {
      case 'ANNOUNCE':
        await this.executeAnnouncement(instance.homeId, step.params);
        break;

      case 'TURN_ON_LIGHTS':
        await this.executeTurnOnLights(instance.homeId, step.params);
        break;

      case 'CALL_FAMILY_IF_NO_CANCEL':
        await this.executeCallFamily(instance, step.params);
        break;

      case 'CALL_EMERGENCY_IF_NO_CANCEL':
        await this.executeCallEmergency(instance, step.params);
        break;

      case 'UNLOCK_DOORS':
        await this.executeUnlockDoors(instance.homeId, step.params);
        break;

      case 'ACTIVATE_SIREN':
        await this.executeActivateSiren(instance.homeId, step.params);
        break;

      case 'CHECK_HELP_TRIGGER':
        // This is passive - just log that we're waiting
        console.log(`⏳ Waiting for help trigger or cancel...`);
        break;

      default:
        console.log(`Unknown scenario action: ${step.action}`);
    }
  }

  /**
   * Execute announcement action
   */
  private async executeAnnouncement(homeId: string, params: any) {
    const ttsActuators = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId,
          status: 'ONLINE',
        },
        actuatorType: 'SPEAKER_TTS',
      },
    });

    for (const actuator of ttsActuators) {
      await this.deviceService.issueActuatorCommand({
        homeId,
        deviceId: actuator.deviceId,
        actuatorId: actuator.id,
        commandName: 'SPEAK',
        commandParamsJson: {
          message: params.message,
          volume: params.volume || 80,
          repeat: params.repeat || 2,
        },
      });
    }

    console.log(`🔊 Emergency announcement: "${params.message}"`);
  }

  /**
   * Execute turn on lights action
   */
  private async executeTurnOnLights(homeId: string, params: any) {
    const lightActuators = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId,
          status: 'ONLINE',
        },
        actuatorType: 'LIGHT',
      },
    });

    for (const actuator of lightActuators) {
      await this.deviceService.issueActuatorCommand({
        homeId,
        deviceId: actuator.deviceId,
        actuatorId: actuator.id,
        commandName: 'SET_STATE',
        commandParamsJson: {
          on: true,
          brightness: 100,
        },
      });
    }

    console.log(`💡 All lights turned on for emergency`);
  }

  /**
   * Execute call family action
   */
  private async executeCallFamily(instance: any, params: any) {
    // In a real system, this would trigger phone calls, SMS, push notifications
    console.log(`📞 ALERT: Calling family members for elder ${instance.elderId}`);

    await this.prisma.alert.create({
      data: {
        elderId: instance.elderId,
        type: 'SMART_HOME_CUSTOM',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: 'Emergency - Family Contacted',
        message: `Family members have been contacted due to emergency scenario. Cancel code: ${instance.cancelToken}`,
        sourceEmergencyScenarioId: instance.scenarioId,
        triggeredAt: new Date(),
        metadata: {
          action: 'FAMILY_CONTACTED',
          instanceId: instance.id,
        },
      },
    });
  }

  /**
   * Execute call emergency action
   */
  private async executeCallEmergency(instance: any, params: any) {
    // In a real system, this would call 911 or emergency services
    console.log(`🚨 CRITICAL: Calling emergency services for elder ${instance.elderId}`);

    await this.prisma.alert.create({
      data: {
        elderId: instance.elderId,
        type: 'SMART_HOME_CUSTOM',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: 'EMERGENCY SERVICES CONTACTED',
        message: `Emergency services have been contacted. This is a critical alert.`,
        sourceEmergencyScenarioId: instance.scenarioId,
        triggeredAt: new Date(),
        metadata: {
          action: 'EMERGENCY_SERVICES_CONTACTED',
          instanceId: instance.id,
        },
      },
    });

    // Escalate the instance
    await this.prisma.emergencyScenarioInstance.update({
      where: { id: instance.id },
      data: {
        status: 'ESCALATED',
      },
    });
  }

  /**
   * Execute unlock doors action
   */
  private async executeUnlockDoors(homeId: string, params: any) {
    const doorLocks = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId,
        },
        actuatorType: 'DOOR_LOCK',
      },
    });

    for (const actuator of doorLocks) {
      await this.deviceService.issueActuatorCommand({
        homeId,
        deviceId: actuator.deviceId,
        actuatorId: actuator.id,
        commandName: 'SET_LOCK',
        commandParamsJson: {
          locked: false,
        },
      });
    }

    console.log(`🔓 All doors unlocked for emergency responders`);
  }

  /**
   * Execute activate siren action
   */
  private async executeActivateSiren(homeId: string, params: any) {
    const sirens = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId,
        },
        actuatorType: 'SIREN',
      },
    });

    for (const actuator of sirens) {
      await this.deviceService.issueActuatorCommand({
        homeId,
        deviceId: actuator.deviceId,
        actuatorId: actuator.id,
        commandName: 'ACTIVATE',
        commandParamsJson: {
          duration: params.duration || 60,
          pattern: params.pattern || 'CONTINUOUS',
        },
      });
    }

    console.log(`🚨 Siren activated`);
  }

  /**
   * Cancel an active emergency scenario
   */
  async cancelScenario(instanceId: string, cancelToken?: string) {
    const instance = await this.prisma.emergencyScenarioInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('Scenario instance not found');
    }

    if (instance.status !== 'ACTIVE') {
      throw new Error('Scenario is not active');
    }

    if (cancelToken && instance.cancelToken !== cancelToken) {
      throw new Error('Invalid cancel token');
    }

    // Clear timers
    const timers = this.activeScenarioTimers.get(instanceId);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.activeScenarioTimers.delete(instanceId);
    }

    // Update instance status
    await this.prisma.emergencyScenarioInstance.update({
      where: { id: instanceId },
      data: {
        status: 'CANCELLED',
        resolvedAt: new Date(),
        notes: 'Cancelled by user',
      },
    });

    console.log(`✅ Emergency scenario ${instanceId} cancelled`);

    return instance;
  }

  /**
   * Create help trigger (panic button, voice command, etc.)
   */
  async createHelpTrigger(data: {
    homeId: string;
    elderId: string;
    triggerType: string;
    sourceDeviceId?: string;
    rawPayloadJson?: any;
    notes?: string;
  }) {
    const helpTrigger = await this.prisma.helpTrigger.create({
      data: {
        homeId: data.homeId,
        elderId: data.elderId,
        triggerType: data.triggerType as any,
        sourceDeviceId: data.sourceDeviceId,
        rawPayloadJson: data.rawPayloadJson || {},
        occurredAt: new Date(),
        notes: data.notes,
      },
    });

    console.log(`🆘 Help trigger created: ${data.triggerType}`);

    // Create alert
    const alert = await this.prisma.alert.create({
      data: {
        elderId: data.elderId,
        type: 'SMART_HOME_CUSTOM',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: 'HELP Requested',
        message: `Elder has requested help via ${data.triggerType}`,
        triggeredAt: new Date(),
        metadata: {
          helpTriggerId: helpTrigger.id,
        },
      },
    });

    // Update help trigger with alert ID
    await this.prisma.helpTrigger.update({
      where: { id: helpTrigger.id },
      data: {
        handledAlertId: alert.id,
      },
    });

    return helpTrigger;
  }

  /**
   * Get active emergency scenarios
   */
  async getActiveScenarios(homeId: string) {
    return this.prisma.emergencyScenarioInstance.findMany({
      where: {
        homeId,
        status: 'ACTIVE',
      },
      include: {
        scenario: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  /**
   * Create or update emergency scenario
   */
  async createEmergencyScenario(data: {
    homeId: string;
    name: string;
    description?: string;
    triggerSignatureJson: any;
    stepwiseActionsJson: any;
    notes?: string;
  }) {
    return this.prisma.emergencyScenario.create({
      data,
    });
  }

  async getEmergencyScenarios(homeId: string) {
    return this.prisma.emergencyScenario.findMany({
      where: { homeId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateEmergencyScenario(scenarioId: string, data: {
    name?: string;
    description?: string;
    isEnabled?: boolean;
    triggerSignatureJson?: any;
    stepwiseActionsJson?: any;
    notes?: string;
  }) {
    return this.prisma.emergencyScenario.update({
      where: { id: scenarioId },
      data,
    });
  }

  /**
   * Generate a random cancel token
   */
  private generateCancelToken(): string {
    const digits = '0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += digits[Math.floor(Math.random() * digits.length)];
    }
    return token;
  }

  /**
   * Map scenario type to alert type
   */
  private mapScenarioTypeToAlertType(scenarioType: string): string {
    const mapping: Record<string, string> = {
      FALL_UNRESPONSIVE: 'SMART_HOME_FALL_UNRESPONSIVE',
      SMOKE_FIRE: 'SMART_HOME_SMOKE',
      GAS_LEAK: 'SMART_HOME_GAS',
      NIGHT_WANDERING: 'SMART_HOME_DOOR_OPEN_NIGHT',
    };

    return mapping[scenarioType] || 'SMART_HOME_CUSTOM';
  }
}
