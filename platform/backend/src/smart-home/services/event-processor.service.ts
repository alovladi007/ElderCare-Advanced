import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationEngineService } from './automation-engine.service';
import { EmergencyScenarioService } from './emergency-scenario.service';

@Injectable()
export class EventProcessorService {
  private readonly logger = new Logger(EventProcessorService.name);

  constructor(
    private prisma: PrismaService,
    private automationEngine: AutomationEngineService,
    private emergencyScenario: EmergencyScenarioService,
  ) {}

  async processEvent(event: any) {
    try {
      this.logger.log(`Processing sensor event ${event.id} of type ${event.eventType}`);

      // Check if this is a critical event that might trigger emergency scenarios
      if (event.severity === 'CRITICAL' || event.sensor.isCritical) {
        await this.handleCriticalEvent(event);
      }

      // Evaluate automation rules
      await this.automationEngine.evaluateEvent(event);

      // Mark event as processed
      await this.prisma.sensorEvent.update({
        where: { id: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      this.logger.log(`Successfully processed event ${event.id}`);
    } catch (error) {
      this.logger.error(`Error processing event ${event.id}:`, error);
      throw error;
    }
  }

  private async handleCriticalEvent(event: any) {
    this.logger.warn(`Handling critical event: ${event.sensor.sensorType}`);

    // Check for specific critical sensor types
    switch (event.sensor.sensorType) {
      case 'FALL_DETECTOR':
        if (event.valueText === 'DETECTED' || event.eventType === 'ALERT') {
          await this.emergencyScenario.triggerScenario(
            event.device.homeId,
            'FALL_UNRESPONSIVE',
            event
          );
        }
        break;

      case 'SMOKE':
        if (event.valueText === 'DETECTED' || event.severity === 'CRITICAL') {
          await this.emergencyScenario.triggerScenario(
            event.device.homeId,
            'SMOKE_FIRE',
            event
          );
        }
        break;

      case 'GAS_LEAK':
        if (event.valueText === 'DETECTED' || event.severity === 'CRITICAL') {
          await this.emergencyScenario.triggerScenario(
            event.device.homeId,
            'GAS_LEAK',
            event
          );
        }
        break;

      case 'WATER_LEAK':
        if (event.valueText === 'DETECTED') {
          await this.createSmartHomeAlert(
            event,
            'SMART_HOME_WATER_LEAK',
            'WARNING',
            'Water leak detected'
          );
        }
        break;

      case 'CONTACT_DOOR':
      case 'CONTACT_WINDOW':
        // Check if it's night time and door/window opened
        await this.checkNightWandering(event);
        break;

      case 'BUTTON_PANIC':
        if (event.valueText === 'PRESSED') {
          await this.emergencyScenario.triggerScenario(
            event.device.homeId,
            'PANIC_BUTTON',
            event
          );
        }
        break;
    }
  }

  private async checkNightWandering(event: any) {
    const now = new Date();
    const hours = now.getHours();

    // Check if it's night time (10 PM to 6 AM)
    if ((hours >= 22 || hours < 6) && event.valueText === 'OPEN') {
      this.logger.warn('Door/window opened during night time - possible wandering');

      await this.createSmartHomeAlert(
        event,
        'SMART_HOME_DOOR_OPEN_NIGHT',
        'WARNING',
        `${event.device.zone?.name || 'Unknown zone'} door/window opened at night`
      );
    }
  }

  private async createSmartHomeAlert(
    event: any,
    type: string,
    severity: string,
    message: string
  ) {
    const home = await this.prisma.home.findUnique({
      where: { id: event.device.homeId },
    });

    if (!home) {
      this.logger.error('Home not found for event');
      return;
    }

    return this.prisma.alert.create({
      data: {
        elderId: home.elderId,
        type: type as any,
        severity: severity as any,
        title: `Smart Home Alert: ${event.sensor.sensorType}`,
        message,
        sourceEntityType: 'SensorEvent',
        sourceEntityId: event.id,
      },
    });
  }
}
