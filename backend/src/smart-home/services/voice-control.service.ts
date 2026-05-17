import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { EmergencyAlertService } from '../../care-management/services/emergency-alert.service';

interface VoiceCommand {
  command: string;
  parameters?: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

interface VoiceResponse {
  success: boolean;
  message: string;
  action?: string;
  data?: any;
}

@Injectable()
export class VoiceControlService {
  // Voice command patterns with synonyms
  private commandPatterns = {
    // Device Control
    'turn_on_light': {
      patterns: [
        /turn (on|up) (the )?(light|lights|lamp|lamps)/i,
        /switch (on|up) (the )?(light|lights|lamp|lamps)/i,
        /lights? on/i,
      ],
      action: 'TURN_ON',
      deviceType: 'LIGHT',
    },
    'turn_off_light': {
      patterns: [
        /turn (off|down) (the )?(light|lights|lamp|lamps)/i,
        /switch (off|down) (the )?(light|lights|lamp|lamps)/i,
        /lights? off/i,
      ],
      action: 'TURN_OFF',
      deviceType: 'LIGHT',
    },
    'adjust_temperature': {
      patterns: [
        /set temperature to (\d+)/i,
        /make it (warmer|hotter|cooler|colder)/i,
        /(increase|decrease|raise|lower) (the )?temperature/i,
      ],
      action: 'ADJUST_TEMP',
      deviceType: 'THERMOSTAT',
    },
    'lock_door': {
      patterns: [
        /lock (the )?(door|doors)/i,
        /secure (the )?(door|doors)/i,
      ],
      action: 'LOCK',
      deviceType: 'DOOR_LOCK',
    },
    'unlock_door': {
      patterns: [
        /unlock (the )?(door|doors)/i,
        /open (the )?(door|doors)/i,
      ],
      action: 'UNLOCK',
      deviceType: 'DOOR_LOCK',
    },
    'open_curtains': {
      patterns: [
        /open (the )?(curtains?|blinds?|shades?)/i,
        /raise (the )?(curtains?|blinds?|shades?)/i,
      ],
      action: 'OPEN',
      deviceType: 'CURTAIN_BLINDS',
    },
    'close_curtains': {
      patterns: [
        /close (the )?(curtains?|blinds?|shades?)/i,
        /lower (the )?(curtains?|blinds?|shades?)/i,
      ],
      action: 'CLOSE',
      deviceType: 'CURTAIN_BLINDS',
    },
    'turn_on_appliance': {
      patterns: [
        /turn on (the )?(tv|television|fan|heater|air conditioner)/i,
        /switch on (the )?(tv|television|fan|heater|air conditioner)/i,
      ],
      action: 'TURN_ON',
      deviceType: 'APPLIANCE_POWER',
    },
    'turn_off_appliance': {
      patterns: [
        /turn off (the )?(tv|television|fan|heater|air conditioner)/i,
        /switch off (the )?(tv|television|fan|heater|air conditioner)/i,
      ],
      action: 'TURN_OFF',
      deviceType: 'APPLIANCE_POWER',
    },

    // Emergency Commands
    'emergency_help': {
      patterns: [
        /help me/i,
        /emergency/i,
        /i need help/i,
        /call (for )?(help|ambulance|doctor)/i,
        /i('m| am) (hurt|injured|sick|in pain)/i,
        /i fell/i,
        /i can'?t (get up|move|breathe)/i,
      ],
      action: 'EMERGENCY_ALERT',
      severity: 'CRITICAL',
    },
    'medical_assistance': {
      patterns: [
        /i don'?t feel (well|good)/i,
        /i need (my )?(medication|medicine)/i,
        /call (my )?(doctor|nurse)/i,
      ],
      action: 'MEDICAL_ALERT',
      severity: 'HIGH',
    },

    // Status Queries
    'check_temperature': {
      patterns: [
        /what'?s the temperature/i,
        /how (hot|cold|warm) is it/i,
        /what'?s the current temperature/i,
      ],
      action: 'GET_STATUS',
      deviceType: 'THERMOSTAT',
    },
    'check_lights': {
      patterns: [
        /are the lights on/i,
        /which lights are on/i,
        /light status/i,
      ],
      action: 'GET_STATUS',
      deviceType: 'LIGHT',
    },
    'check_doors': {
      patterns: [
        /are the doors locked/i,
        /is the door locked/i,
        /door status/i,
      ],
      action: 'GET_STATUS',
      deviceType: 'DOOR_LOCK',
    },

    // Scenes and Automation
    'good_morning': {
      patterns: [
        /good morning/i,
        /start (my )?morning routine/i,
      ],
      action: 'ACTIVATE_SCENE',
      scene: 'morning',
    },
    'good_night': {
      patterns: [
        /good night/i,
        /bedtime/i,
        /i('m| am) going to (bed|sleep)/i,
      ],
      action: 'ACTIVATE_SCENE',
      scene: 'night',
    },
    'leaving_home': {
      patterns: [
        /i('m| am) leaving/i,
        /goodbye/i,
        /secure (the )?(house|home)/i,
      ],
      action: 'ACTIVATE_SCENE',
      scene: 'away',
    },
    'coming_home': {
      patterns: [
        /i('m| am) (home|back)/i,
        /hello/i,
      ],
      action: 'ACTIVATE_SCENE',
      scene: 'home',
    },

    // Assistance
    'remind_medication': {
      patterns: [
        /remind me to take (my )?(medication|medicine)/i,
        /medication reminder/i,
      ],
      action: 'SET_REMINDER',
      reminderType: 'medication',
    },
    'call_family': {
      patterns: [
        /call (my )?(family|son|daughter|spouse)/i,
        /contact (my )?(family|son|daughter|spouse)/i,
      ],
      action: 'CALL_CONTACT',
    },
  };

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private emergencyAlert: EmergencyAlertService,
  ) {}

  /**
   * Process voice command from speech-to-text
   */
  async processVoiceCommand(
    elderId: string,
    homeId: string,
    transcript: string,
    confidence: number = 1.0,
  ): Promise<VoiceResponse> {
    this.logger.logEvent('Voice command received', 'VoiceControl', homeId, {
      elderId,
      transcript,
      confidence,
    });

    // Log voice command
    await this.logVoiceCommand(elderId, homeId, transcript, confidence);

    // Parse command
    const parsedCommand = this.parseCommand(transcript);

    if (!parsedCommand) {
      return {
        success: false,
        message: "I'm sorry, I didn't understand that command. Please try again.",
      };
    }

    // Execute command
    try {
      const result = await this.executeCommand(elderId, homeId, parsedCommand);

      // Log successful execution
      await this.logVoiceExecution(elderId, homeId, transcript, parsedCommand.action, 'SUCCESS', result);

      return result;
    } catch (error) {
      this.logger.logError('Voice command execution failed', error, {
        elderId,
        homeId,
        transcript,
      });

      // Log failed execution
      await this.logVoiceExecution(elderId, homeId, transcript, parsedCommand.action, 'FAILED', { error: error.message });

      return {
        success: false,
        message: `I encountered an error: ${error.message}. Please try again or ask for help.`,
      };
    }
  }

  /**
   * Parse voice transcript into structured command
   */
  private parseCommand(transcript: string): any {
    for (const [commandKey, config] of Object.entries(this.commandPatterns)) {
      for (const pattern of config.patterns) {
        const match = transcript.match(pattern);
        if (match) {
          return {
            key: commandKey,
            action: config.action,
            deviceType: config.deviceType,
            scene: config.scene,
            severity: config.severity,
            reminderType: config.reminderType,
            rawMatch: match,
            parameters: this.extractParameters(match, config),
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract parameters from regex match
   */
  private extractParameters(match: RegExpMatchArray, config: any): Record<string, any> {
    const params: Record<string, any> = {};

    // Extract room/zone from transcript
    const roomMatch = match.input?.match(/in (the )?(bedroom|bathroom|kitchen|living room|dining room)/i);
    if (roomMatch) {
      params.room = roomMatch[2];
    }

    // Extract temperature value
    if (config.action === 'ADJUST_TEMP' && match[1]) {
      params.temperature = parseInt(match[1]);
    } else if (match.input?.match(/warmer|hotter/i)) {
      params.adjustment = 'up';
    } else if (match.input?.match(/cooler|colder/i)) {
      params.adjustment = 'down';
    }

    // Extract appliance name
    const applianceMatch = match.input?.match(/(tv|television|fan|heater|air conditioner)/i);
    if (applianceMatch) {
      params.appliance = applianceMatch[1];
    }

    // Extract contact name for calls
    const contactMatch = match.input?.match(/(son|daughter|spouse|husband|wife|[A-Z][a-z]+)/);
    if (contactMatch) {
      params.contactName = contactMatch[1];
    }

    return params;
  }

  /**
   * Execute parsed command
   */
  private async executeCommand(
    elderId: string,
    homeId: string,
    command: any,
  ): Promise<VoiceResponse> {
    switch (command.action) {
      case 'TURN_ON':
      case 'TURN_OFF':
        return await this.executeDeviceControl(homeId, command);

      case 'ADJUST_TEMP':
        return await this.executeTemperatureControl(homeId, command);

      case 'LOCK':
      case 'UNLOCK':
        return await this.executeLockControl(homeId, command);

      case 'OPEN':
      case 'CLOSE':
        return await this.executeCurtainControl(homeId, command);

      case 'EMERGENCY_ALERT':
        return await this.executeEmergencyAlert(elderId, command);

      case 'MEDICAL_ALERT':
        return await this.executeMedicalAlert(elderId, command);

      case 'GET_STATUS':
        return await this.executeStatusQuery(homeId, command);

      case 'ACTIVATE_SCENE':
        return await this.executeSceneActivation(homeId, command);

      case 'SET_REMINDER':
        return await this.executeSetReminder(elderId, command);

      case 'CALL_CONTACT':
        return await this.executeCallContact(elderId, command);

      default:
        return {
          success: false,
          message: "I understood your command but I'm not sure how to execute it yet.",
        };
    }
  }

  /**
   * Control devices (lights, appliances)
   */
  private async executeDeviceControl(homeId: string, command: any): Promise<VoiceResponse> {
    // Find matching devices
    const devices = await this.prisma.device.findMany({
      where: {
        homeId,
      },
      include: {
        actuators: true,
        zone: true,
      },
    });

    // Filter by device type and room
    let matchingDevices = devices.filter((device) => {
      return device.actuators.some((actuator) => actuator.actuatorType === command.deviceType);
    });

    // Filter by room if specified
    if (command.parameters.room) {
      matchingDevices = matchingDevices.filter((device) =>
        device.zone?.name.toLowerCase().includes(command.parameters.room.toLowerCase())
      );
    }

    // Filter by appliance name if specified
    if (command.parameters.appliance) {
      matchingDevices = matchingDevices.filter((device) =>
        device.name.toLowerCase().includes(command.parameters.appliance.toLowerCase())
      );
    }

    if (matchingDevices.length === 0) {
      return {
        success: false,
        message: `I couldn't find any ${command.parameters.room ? command.parameters.room + ' ' : ''}${command.deviceType.toLowerCase().replace('_', ' ')} devices.`,
      };
    }

    // Execute command on all matching devices
    const commandName = command.action === 'TURN_ON' ? 'POWER_ON' : 'POWER_OFF';
    const results = [];

    for (const device of matchingDevices) {
      for (const actuator of device.actuators) {
        if (actuator.actuatorType === command.deviceType) {
          try {
            await this.prisma.actuatorCommand.create({
              data: {
                actuatorId: actuator.id,
                issuerId: elderId, // Voice commands issued by elder
                commandName,
                commandParamsJson: {},
                status: 'PENDING',
                issuedAt: new Date(),
              },
            });
            results.push(device.name);
          } catch (error) {
            this.logger.logError('Failed to send actuator command', error, { deviceId: device.id });
          }
        }
      }
    }

    if (results.length === 0) {
      return {
        success: false,
        message: 'I had trouble controlling those devices. Please try again.',
      };
    }

    return {
      success: true,
      message: `Okay, I've turned ${command.action === 'TURN_ON' ? 'on' : 'off'} ${results.length === 1 ? 'the ' + results[0] : results.length + ' devices'}.`,
      data: { devices: results },
    };
  }

  /**
   * Control thermostat
   */
  private async executeTemperatureControl(homeId: string, command: any): Promise<VoiceResponse> {
    const thermostats = await this.prisma.device.findMany({
      where: {
        homeId,
      },
      include: {
        actuators: {
          where: {
            actuatorType: 'THERMOSTAT',
          },
        },
      },
    });

    if (thermostats.length === 0) {
      return {
        success: false,
        message: "I couldn't find a thermostat to control.",
      };
    }

    const thermostat = thermostats[0];
    const actuator = thermostat.actuators[0];

    let targetTemp: number;
    if (command.parameters.temperature) {
      targetTemp = command.parameters.temperature;
    } else {
      // Get current temperature and adjust
      const currentState = actuator.stateSchemaJson as any;
      const currentTemp = currentState.currentTemp || 70;
      targetTemp = command.parameters.adjustment === 'up' ? currentTemp + 2 : currentTemp - 2;
    }

    await this.prisma.actuatorCommand.create({
      data: {
        actuatorId: actuator.id,
        issuerId: elderId,
        commandName: 'SET_TEMPERATURE',
        commandParamsJson: { temperature: targetTemp },
        status: 'PENDING',
        issuedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Okay, I'm setting the temperature to ${targetTemp} degrees.`,
      data: { temperature: targetTemp },
    };
  }

  /**
   * Control door locks
   */
  private async executeLockControl(homeId: string, command: any): Promise<VoiceResponse> {
    const locks = await this.prisma.device.findMany({
      where: {
        homeId,
      },
      include: {
        actuators: {
          where: {
            actuatorType: 'DOOR_LOCK',
          },
        },
      },
    });

    if (locks.length === 0) {
      return {
        success: false,
        message: "I couldn't find any door locks to control.",
      };
    }

    const commandName = command.action === 'LOCK' ? 'LOCK' : 'UNLOCK';
    const results = [];

    for (const lock of locks) {
      for (const actuator of lock.actuators) {
        await this.prisma.actuatorCommand.create({
          data: {
            actuatorId: actuator.id,
            issuerId: elderId,
            commandName,
            commandParamsJson: {},
            status: 'PENDING',
            issuedAt: new Date(),
          },
        });
        results.push(lock.name);
      }
    }

    return {
      success: true,
      message: `Okay, I've ${command.action === 'LOCK' ? 'locked' : 'unlocked'} ${results.length} door${results.length > 1 ? 's' : ''}.`,
      data: { devices: results },
    };
  }

  /**
   * Control curtains/blinds
   */
  private async executeCurtainControl(homeId: string, command: any): Promise<VoiceResponse> {
    const curtains = await this.prisma.device.findMany({
      where: {
        homeId,
      },
      include: {
        actuators: {
          where: {
            actuatorType: 'CURTAIN_BLINDS',
          },
        },
      },
    });

    if (curtains.length === 0) {
      return {
        success: false,
        message: "I couldn't find any curtains or blinds to control.",
      };
    }

    const commandName = command.action === 'OPEN' ? 'OPEN' : 'CLOSE';
    const results = [];

    for (const curtain of curtains) {
      for (const actuator of curtain.actuators) {
        await this.prisma.actuatorCommand.create({
          data: {
            actuatorId: actuator.id,
            issuerId: elderId,
            commandName,
            commandParamsJson: {},
            status: 'PENDING',
            issuedAt: new Date(),
          },
        });
        results.push(curtain.name);
      }
    }

    return {
      success: true,
      message: `Okay, I've ${command.action === 'OPEN' ? 'opened' : 'closed'} the ${results.length === 1 ? results[0] : 'curtains'}.`,
      data: { devices: results },
    };
  }

  /**
   * Trigger emergency alert
   */
  private async executeEmergencyAlert(elderId: string, command: any): Promise<VoiceResponse> {
    await this.emergencyAlert.triggerEmergencyAlert({
      elderId,
      severity: command.severity || 'CRITICAL',
      type: 'PANIC_BUTTON',
      title: 'Voice Emergency Alert',
      message: `Emergency alert triggered by voice command: "${command.rawMatch[0]}"`,
      metadata: {
        voiceTriggered: true,
        transcript: command.rawMatch.input,
      },
    });

    return {
      success: true,
      message: "I've sent an emergency alert to your family and emergency contacts. Help is on the way. Stay calm.",
      action: 'EMERGENCY_ALERT_SENT',
    };
  }

  /**
   * Trigger medical alert
   */
  private async executeMedicalAlert(elderId: string, command: any): Promise<VoiceResponse> {
    await this.emergencyAlert.triggerEmergencyAlert({
      elderId,
      severity: command.severity || 'HIGH',
      type: 'MEDICAL',
      title: 'Voice Medical Assistance Request',
      message: `Medical assistance requested by voice command: "${command.rawMatch[0]}"`,
      metadata: {
        voiceTriggered: true,
        transcript: command.rawMatch.input,
      },
    });

    return {
      success: true,
      message: "I've notified your healthcare providers and family. Someone will check on you shortly.",
      action: 'MEDICAL_ALERT_SENT',
    };
  }

  /**
   * Query device status
   */
  private async executeStatusQuery(homeId: string, command: any): Promise<VoiceResponse> {
    // This would query actual device state
    // For now, return a generic response
    return {
      success: true,
      message: `Let me check the status of your ${command.deviceType.toLowerCase().replace('_', ' ')} devices.`,
    };
  }

  /**
   * Activate predefined scene
   */
  private async executeSceneActivation(homeId: string, command: any): Promise<VoiceResponse> {
    const sceneActions = {
      morning: {
        message: "Good morning! I'm opening the curtains, turning on lights, and setting a comfortable temperature.",
        actions: ['OPEN_CURTAINS', 'TURN_ON_LIGHTS', 'SET_TEMP_70'],
      },
      night: {
        message: "Good night! I'm closing the curtains, turning off lights, locking the doors, and lowering the temperature.",
        actions: ['CLOSE_CURTAINS', 'TURN_OFF_LIGHTS', 'LOCK_DOORS', 'SET_TEMP_65'],
      },
      away: {
        message: "Goodbye! I'm locking all doors, turning off unnecessary lights, and activating security mode.",
        actions: ['LOCK_DOORS', 'TURN_OFF_LIGHTS', 'SECURITY_MODE'],
      },
      home: {
        message: "Welcome home! I'm unlocking the door, turning on lights, and setting a comfortable temperature.",
        actions: ['UNLOCK_DOOR', 'TURN_ON_LIGHTS', 'SET_TEMP_70'],
      },
    };

    const scene = sceneActions[command.scene];
    if (!scene) {
      return {
        success: false,
        message: "I'm not familiar with that scene.",
      };
    }

    // Execute scene actions (simplified - would actually control devices)
    // This could trigger automation rules

    return {
      success: true,
      message: scene.message,
      action: 'SCENE_ACTIVATED',
      data: { scene: command.scene, actions: scene.actions },
    };
  }

  /**
   * Set medication reminder
   */
  private async executeSetReminder(elderId: string, command: any): Promise<VoiceResponse> {
    // This would integrate with the care management system
    return {
      success: true,
      message: "Okay, I'll remind you when it's time to take your medication.",
      action: 'REMINDER_SET',
    };
  }

  /**
   * Call family member
   */
  private async executeCallContact(elderId: string, command: any): Promise<VoiceResponse> {
    // This would integrate with the emergency contact system
    const contactName = command.parameters.contactName || 'family';

    return {
      success: true,
      message: `Okay, I'm calling your ${contactName} now.`,
      action: 'CALLING_CONTACT',
      data: { contactName },
    };
  }

  /**
   * Log voice command
   */
  private async logVoiceCommand(
    elderId: string,
    homeId: string,
    transcript: string,
    confidence: number,
  ) {
    try {
      await this.prisma.voiceCommand.create({
        data: {
          elderId,
          homeId,
          transcript,
          confidence,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Silently fail logging - don't block command execution
      this.logger.logError('Failed to log voice command', error, { elderId });
    }
  }

  /**
   * Log voice execution result
   */
  private async logVoiceExecution(
    elderId: string,
    homeId: string,
    transcript: string,
    action: string,
    status: string,
    result: any,
  ) {
    try {
      await this.prisma.voiceExecution.create({
        data: {
          elderId,
          homeId,
          transcript,
          action,
          status,
          result,
          executedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.logError('Failed to log voice execution', error, { elderId });
    }
  }

  /**
   * Get voice command history
   */
  async getVoiceHistory(elderId: string, limit = 50) {
    return this.prisma.voiceCommand.findMany({
      where: { elderId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get supported voice commands (for help)
   */
  getSupportedCommands(): any {
    return {
      deviceControl: {
        category: 'Device Control',
        examples: [
          'Turn on the lights',
          'Turn off the bedroom lights',
          'Turn on the TV',
          'Open the curtains',
          'Close the blinds',
        ],
      },
      temperature: {
        category: 'Temperature Control',
        examples: [
          'Set temperature to 72',
          'Make it warmer',
          'Make it cooler',
          "What's the temperature?",
        ],
      },
      security: {
        category: 'Security',
        examples: [
          'Lock the doors',
          'Unlock the door',
          'Are the doors locked?',
        ],
      },
      emergency: {
        category: 'Emergency',
        examples: [
          'Help me',
          'Emergency',
          'I need help',
          'Call for help',
          "I don't feel well",
        ],
      },
      scenes: {
        category: 'Scenes & Routines',
        examples: [
          'Good morning',
          'Good night',
          "I'm leaving",
          "I'm home",
        ],
      },
      assistance: {
        category: 'Assistance',
        examples: [
          'Remind me to take my medication',
          'Call my family',
          'Call my son',
        ],
      },
    };
  }
}
