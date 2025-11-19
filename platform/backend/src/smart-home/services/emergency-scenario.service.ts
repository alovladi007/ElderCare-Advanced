import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmergencyScenarioDto, CancelEmergencyScenarioDto } from '../dto/automation.dto';

@Injectable()
export class EmergencyScenarioService {
  private readonly logger = new Logger(EmergencyScenarioService.name);
  private activeScenarios: Map<string, NodeJS.Timeout[]> = new Map();

  constructor(private prisma: PrismaService) {}

  // Scenario Management
  async createScenario(homeId: string, dto: CreateEmergencyScenarioDto) {
    return this.prisma.emergencyScenario.create({
      data: {
        homeId,
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : true,
        triggerSignatureJson: dto.triggerSignatureJson,
        stepwiseActionsJson: dto.stepwiseActionsJson,
        notes: dto.notes,
      },
    });
  }

  async getScenarios(homeId: string) {
    return this.prisma.emergencyScenario.findMany({
      where: { homeId },
      include: {
        instances: {
          where: {
            status: {
              in: ['ACTIVE', 'ESCALATED'],
            },
          },
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateScenario(scenarioId: string, data: Partial<CreateEmergencyScenarioDto>) {
    return this.prisma.emergencyScenario.update({
      where: { id: scenarioId },
      data: {
        name: data.name,
        description: data.description,
        isEnabled: data.isEnabled,
        triggerSignatureJson: data.triggerSignatureJson,
        stepwiseActionsJson: data.stepwiseActionsJson,
        notes: data.notes,
      },
    });
  }

  // Trigger Emergency Scenario
  async triggerScenario(homeId: string, scenarioType: string, event?: any) {
    this.logger.warn(`🚨 Triggering emergency scenario: ${scenarioType} for home ${homeId}`);

    // Find matching scenario
    const scenarios = await this.prisma.emergencyScenario.findMany({
      where: {
        homeId,
        isEnabled: true,
      },
    });

    const matchingScenario = scenarios.find(s =>
      s.triggerSignatureJson?.type === scenarioType ||
      s.name.toUpperCase().includes(scenarioType)
    );

    if (!matchingScenario) {
      this.logger.warn(`No matching emergency scenario found for type: ${scenarioType}`);
      return null;
    }

    // Get home to find elder
    const home = await this.prisma.home.findUnique({
      where: { id: homeId },
    });

    if (!home) {
      this.logger.error('Home not found');
      return null;
    }

    // Create scenario instance
    const instance = await this.prisma.emergencyScenarioInstance.create({
      data: {
        scenarioId: matchingScenario.id,
        homeId,
        elderId: home.elderId,
        relatedSensorEventId: event?.id,
        cancelToken: this.generateCancelToken(),
      },
      include: {
        scenario: true,
        elder: {
          include: {
            user: true,
          },
        },
      },
    });

    // Update scenario last triggered
    await this.prisma.emergencyScenario.update({
      where: { id: matchingScenario.id },
      data: { lastTriggeredAt: new Date() },
    });

    // Start executing scenario steps
    await this.executeScenarioSteps(instance);

    return instance;
  }

  private async executeScenarioSteps(instance: any) {
    const steps = instance.scenario.stepwiseActionsJson;

    if (!Array.isArray(steps)) {
      this.logger.error('Invalid scenario steps');
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    for (const [index, step] of steps.entries()) {
      const timer = setTimeout(async () => {
        try {
          // Check if scenario was cancelled
          const current = await this.prisma.emergencyScenarioInstance.findUnique({
            where: { id: instance.id },
          });

          if (!current || current.status !== 'ACTIVE') {
            this.logger.log(`Scenario ${instance.id} was cancelled or resolved`);
            this.clearTimers(instance.id);
            return;
          }

          // Execute step
          await this.executeStep(instance, step, index);

          // Update current step index
          await this.prisma.emergencyScenarioInstance.update({
            where: { id: instance.id },
            data: {
              currentStepIndex: index + 1,
              lastActionAt: new Date(),
            },
          });
        } catch (error) {
          this.logger.error(`Error executing step ${index}:`, error);
        }
      }, step.delaySec * 1000);

      timers.push(timer);
    }

    this.activeScenarios.set(instance.id, timers);
  }

  private async executeStep(instance: any, step: any, index: number) {
    this.logger.log(`Executing step ${index} (${step.action}) for scenario ${instance.id}`);

    switch (step.action) {
      case 'ANNOUNCE':
        await this.announceMessage(instance, step.params);
        break;

      case 'CALL_FAMILY_IF_NO_CANCEL':
      case 'ALERT_FAMILY':
        await this.alertFamily(instance, step);
        break;

      case 'CALL_EMERGENCY_IF_NO_CANCEL':
      case 'ALERT_EMERGENCY':
        await this.alertEmergency(instance, step);
        break;

      case 'TURN_ON_LIGHTS':
        await this.turnOnLights(instance);
        break;

      case 'UNLOCK_DOORS':
        await this.unlockDoors(instance);
        break;

      case 'SOUND_SIREN':
        await this.soundSiren(instance);
        break;

      default:
        this.logger.warn(`Unknown step action: ${step.action}`);
    }
  }

  private async announceMessage(instance: any, params: any) {
    // Find TTS speakers
    const speakers = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId: instance.homeId,
        },
        actuatorType: 'SPEAKER_TTS',
      },
    });

    const message = params?.message ||
      `Emergency detected. If you are okay, please cancel this alert using the cancel code ${instance.cancelToken}`;

    for (const speaker of speakers) {
      await this.prisma.actuatorCommand.create({
        data: {
          homeId: instance.homeId,
          deviceId: speaker.deviceId,
          actuatorId: speaker.id,
          commandName: 'SPEAK',
          commandParamsJson: { message, volume: 100 },
          status: 'PENDING',
        },
      });
    }

    this.logger.log(`Announced: "${message}"`);
  }

  private async alertFamily(instance: any, step: any) {
    // Create CRITICAL alert
    await this.prisma.alert.create({
      data: {
        elderId: instance.elderId,
        type: 'SMART_HOME_FALL_UNRESPONSIVE',
        severity: 'CRITICAL',
        title: `Emergency: ${instance.scenario.name}`,
        message: `Emergency scenario triggered for ${instance.elder.user.firstName}. Please check immediately.`,
        sourceEntityType: 'EmergencyScenarioInstance',
        sourceEntityId: instance.id,
        notifiedFamily: true,
      },
    });

    this.logger.warn(`🚨 Family alerted for scenario ${instance.id}`);
  }

  private async alertEmergency(instance: any, step: any) {
    // Create CRITICAL emergency alert
    await this.prisma.alert.create({
      data: {
        elderId: instance.elderId,
        type: 'SMART_HOME_FALL_UNRESPONSIVE',
        severity: 'CRITICAL',
        title: `EMERGENCY: ${instance.scenario.name}`,
        message: `Emergency services may be needed for ${instance.elder.user.firstName}. No response to alerts.`,
        sourceEntityType: 'EmergencyScenarioInstance',
        sourceEntityId: instance.id,
        notifiedEmergency: true,
      },
    });

    // Update scenario to ESCALATED
    await this.prisma.emergencyScenarioInstance.update({
      where: { id: instance.id },
      data: { status: 'ESCALATED' },
    });

    this.logger.error(`🚨🚨 EMERGENCY ESCALATED for scenario ${instance.id}`);
  }

  private async turnOnLights(instance: any) {
    const lights = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId: instance.homeId,
        },
        actuatorType: 'LIGHT',
      },
    });

    for (const light of lights) {
      await this.prisma.actuatorCommand.create({
        data: {
          homeId: instance.homeId,
          deviceId: light.deviceId,
          actuatorId: light.id,
          commandName: 'SET_STATE',
          commandParamsJson: { on: true, brightness: 100 },
          status: 'PENDING',
        },
      });
    }

    this.logger.log('Turned on all lights');
  }

  private async unlockDoors(instance: any) {
    const locks = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId: instance.homeId,
        },
        actuatorType: 'DOOR_LOCK',
      },
    });

    for (const lock of locks) {
      await this.prisma.actuatorCommand.create({
        data: {
          homeId: instance.homeId,
          deviceId: lock.deviceId,
          actuatorId: lock.id,
          commandName: 'UNLOCK',
          commandParamsJson: { reason: 'emergency' },
          status: 'PENDING',
        },
      });
    }

    this.logger.log('Unlocked all doors for emergency access');
  }

  private async soundSiren(instance: any) {
    const sirens = await this.prisma.actuator.findMany({
      where: {
        device: {
          homeId: instance.homeId,
        },
        actuatorType: 'SIREN',
      },
    });

    for (const siren of sirens) {
      await this.prisma.actuatorCommand.create({
        data: {
          homeId: instance.homeId,
          deviceId: siren.deviceId,
          actuatorId: siren.id,
          commandName: 'ACTIVATE',
          commandParamsJson: { pattern: 'emergency', duration: 120 },
          status: 'PENDING',
        },
      });
    }
  }

  // Cancel Scenario
  async cancelScenario(dto: CancelEmergencyScenarioDto) {
    const instance = await this.prisma.emergencyScenarioInstance.findUnique({
      where: { id: dto.instanceId },
    });

    if (!instance || instance.status !== 'ACTIVE') {
      throw new Error('Scenario not found or already resolved');
    }

    // Clear timers
    this.clearTimers(dto.instanceId);

    // Update status
    await this.prisma.emergencyScenarioInstance.update({
      where: { id: dto.instanceId },
      data: {
        status: 'CANCELLED',
        resolvedAt: new Date(),
        notes: dto.notes || 'Cancelled by user',
      },
    });

    this.logger.log(`Scenario ${dto.instanceId} cancelled`);

    return { success: true };
  }

  private clearTimers(instanceId: string) {
    const timers = this.activeScenarios.get(instanceId);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.activeScenarios.delete(instanceId);
    }
  }

  private generateCancelToken(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}
