import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Robotics Types
 */
export enum RobotType {
  COMPANION = 'COMPANION',
  TELEPRESENCE = 'TELEPRESENCE',
  ASSISTANCE = 'ASSISTANCE',
  MONITORING = 'MONITORING',
}

export enum RobotModel {
  ELLIQ = 'ELLIQ',
  PARO = 'PARO',
  PEPPER = 'PEPPER',
  NAO = 'NAO',
  TELEPRESENCE_CUSTOM = 'TELEPRESENCE_CUSTOM',
  CARE_BOT = 'CARE_BOT',
}

export enum RobotStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  CHARGING = 'CHARGING',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE',
}

export enum RobotCapability {
  SPEAK = 'SPEAK',
  LISTEN = 'LISTEN',
  DISPLAY_EMOTION = 'DISPLAY_EMOTION',
  DISPLAY_CONTENT = 'DISPLAY_CONTENT',
  MOVE = 'MOVE',
  MANIPULATE = 'MANIPULATE',
  VIDEO_CALL = 'VIDEO_CALL',
  FACIAL_RECOGNITION = 'FACIAL_RECOGNITION',
  FALL_DETECTION = 'FALL_DETECTION',
  MEDICATION_REMINDER = 'MEDICATION_REMINDER',
  EXERCISE_GUIDANCE = 'EXERCISE_GUIDANCE',
  MUSIC_PLAYBACK = 'MUSIC_PLAYBACK',
  GAMES = 'GAMES',
}

export enum RobotEmotion {
  HAPPY = 'HAPPY',
  SAD = 'SAD',
  NEUTRAL = 'NEUTRAL',
  EXCITED = 'EXCITED',
  CONCERNED = 'CONCERNED',
  ENCOURAGING = 'ENCOURAGING',
  CALM = 'CALM',
}

export enum InteractionMode {
  PROACTIVE = 'PROACTIVE',
  REACTIVE = 'REACTIVE',
  AUTONOMOUS = 'AUTONOMOUS',
  SCHEDULED = 'SCHEDULED',
}

export interface RobotConfiguration {
  robotId: string;
  elderId: string;
  homeId: string;
  robotName: string;
  robotType: RobotType;
  robotModel: RobotModel;
  capabilities: RobotCapability[];
  preferences: RobotPreferences;
  status: RobotStatus;
  batteryLevel?: number;
  lastInteraction: Date;
}

export interface RobotPreferences {
  voiceGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  voiceSpeed: number; // 0.5 - 2.0
  volume: number; // 0 - 100
  language: string;
  interactionMode: InteractionMode;
  proactivityLevel: number; // 0 - 100
  personalityTraits: {
    warmth: number; // 0 - 100
    humor: number; // 0 - 100
    formality: number; // 0 - 100
    patience: number; // 0 - 100
  };
  schedules: RobotSchedule[];
  elderName: string;
  elderPreferences: {
    musicGenres?: string[];
    topics?: string[];
    activityLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface RobotSchedule {
  id: string;
  action: string;
  time: string; // HH:MM
  days: string[]; // ['MON', 'TUE', ...]
  enabled: boolean;
}

export interface RobotCommand {
  commandId: string;
  robotId: string;
  commandType: string;
  parameters: any;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  timeout?: number;
}

export interface RobotResponse {
  commandId: string;
  robotId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
}

export interface CommunicationRequest {
  robotId: string;
  type: 'SPEAK' | 'LISTEN' | 'DISPLAY' | 'EMOTION';
  content: any;
  emotion?: RobotEmotion;
  waitForResponse?: boolean;
}

export interface PhysicalAssistanceRequest {
  robotId: string;
  assistanceType: 'FETCH_ITEM' | 'MEDICATION_REMINDER' | 'EXERCISE_GUIDANCE' | 'EMERGENCY_CALL';
  parameters: any;
  urgent?: boolean;
}

export interface MonitoringData {
  robotId: string;
  timestamp: Date;
  dataType: 'FALL_DETECTION' | 'MOOD_ASSESSMENT' | 'ACTIVITY_TRACKING' | 'VITAL_SIGNS';
  data: any;
  confidence: number;
  requiresAction: boolean;
}

export interface RobotInteraction {
  interactionId: string;
  robotId: string;
  elderId: string;
  startTime: Date;
  endTime?: Date;
  type: string;
  content: any;
  elderResponse?: any;
  outcome: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'INCOMPLETE';
  notes?: string;
}

/**
 * Robotics Service
 * Manages companion robots, telepresence, and assistance robots
 */
@Injectable()
export class RoboticsService {
  private readonly logger = new Logger(RoboticsService.name);
  private robotCache: Map<string, RobotConfiguration> = new Map();
  private activeInteractions: Map<string, RobotInteraction> = new Map();
  private commandQueues: Map<string, RobotCommand[]> = new Map();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.initializeRoboticsService();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeRoboticsService() {
    this.logger.log('Initializing Robotics Service...');

    // Start periodic health checks
    this.startRobotHealthChecks();

    // Start scheduled action processor
    this.startScheduledActionProcessor();

    this.logger.log('Robotics Service initialized successfully');
  }

  private startRobotHealthChecks() {
    // Check robot health every minute
    setInterval(async () => {
      await this.checkAllRobotHealth();
    }, 60000);
  }

  private startScheduledActionProcessor() {
    // Process scheduled actions every minute
    setInterval(async () => {
      await this.processScheduledActions();
    }, 60000);
  }

  // ============================================================================
  // ROBOT REGISTRATION & CONFIGURATION
  // ============================================================================

  /**
   * Register a new robot
   */
  async registerRobot(config: {
    robotId: string;
    elderId: string;
    homeId: string;
    robotName: string;
    robotType: RobotType;
    robotModel: RobotModel;
    capabilities: RobotCapability[];
  }): Promise<RobotConfiguration> {
    this.logger.log(`Registering robot: ${config.robotName} (${config.robotModel})`);

    try {
      const defaultPreferences = this.getDefaultPreferences(config.elderId, config.robotType);

      const robot = await this.prisma.robot.create({
        data: {
          robotId: config.robotId,
          elderId: config.elderId,
          homeId: config.homeId,
          robotName: config.robotName,
          robotType: config.robotType,
          robotModel: config.robotModel,
          capabilities: config.capabilities,
          preferences: defaultPreferences,
          status: RobotStatus.ONLINE,
          batteryLevel: 100,
          lastInteraction: new Date(),
          registeredAt: new Date(),
        },
      });

      const robotConfig: RobotConfiguration = {
        robotId: robot.robotId,
        elderId: robot.elderId,
        homeId: robot.homeId,
        robotName: robot.robotName,
        robotType: robot.robotType as RobotType,
        robotModel: robot.robotModel as RobotModel,
        capabilities: robot.capabilities as RobotCapability[],
        preferences: robot.preferences as RobotPreferences,
        status: robot.status as RobotStatus,
        batteryLevel: robot.batteryLevel,
        lastInteraction: robot.lastInteraction,
      };

      // Cache robot configuration
      this.robotCache.set(config.robotId, robotConfig);

      // Initialize command queue
      this.commandQueues.set(config.robotId, []);

      this.logger.log(`Robot registered successfully: ${config.robotId}`);
      return robotConfig;
    } catch (error) {
      this.logger.error(`Error registering robot: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get default preferences based on robot type
   */
  private getDefaultPreferences(elderId: string, robotType: RobotType): RobotPreferences {
    return {
      voiceGender: 'FEMALE',
      voiceSpeed: 0.9, // Slightly slower for clarity
      volume: 70,
      language: 'en-US',
      interactionMode: robotType === RobotType.COMPANION ? InteractionMode.PROACTIVE : InteractionMode.REACTIVE,
      proactivityLevel: robotType === RobotType.COMPANION ? 70 : 30,
      personalityTraits: {
        warmth: 85,
        humor: 60,
        formality: 40,
        patience: 95,
      },
      schedules: [
        {
          id: 'morning-greeting',
          action: 'MORNING_GREETING',
          time: '08:00',
          days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          enabled: true,
        },
        {
          id: 'medication-reminder',
          action: 'MEDICATION_REMINDER',
          time: '09:00',
          days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          enabled: true,
        },
        {
          id: 'afternoon-checkin',
          action: 'WELLNESS_CHECKIN',
          time: '15:00',
          days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          enabled: true,
        },
        {
          id: 'evening-routine',
          action: 'EVENING_ROUTINE',
          time: '20:00',
          days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          enabled: true,
        },
      ],
      elderName: 'Friend', // Would be fetched from elder profile
      elderPreferences: {
        musicGenres: ['classical', 'jazz', 'oldies'],
        topics: ['gardening', 'family', 'history'],
        activityLevel: 'MEDIUM',
      },
    };
  }

  /**
   * Update robot preferences
   */
  async updateRobotPreferences(robotId: string, preferences: Partial<RobotPreferences>): Promise<void> {
    const robot = await this.getRobot(robotId);

    const updatedPreferences = {
      ...robot.preferences,
      ...preferences,
    };

    await this.prisma.robot.update({
      where: { robotId },
      data: { preferences: updatedPreferences },
    });

    // Update cache
    if (this.robotCache.has(robotId)) {
      this.robotCache.get(robotId).preferences = updatedPreferences;
    }

    this.logger.log(`Updated preferences for robot ${robotId}`);
  }

  /**
   * Get robot by ID
   */
  async getRobot(robotId: string): Promise<RobotConfiguration> {
    // Check cache first
    if (this.robotCache.has(robotId)) {
      return this.robotCache.get(robotId);
    }

    const robot = await this.prisma.robot.findUnique({
      where: { robotId },
    });

    if (!robot) {
      throw new NotFoundException(`Robot ${robotId} not found`);
    }

    const config: RobotConfiguration = {
      robotId: robot.robotId,
      elderId: robot.elderId,
      homeId: robot.homeId,
      robotName: robot.robotName,
      robotType: robot.robotType as RobotType,
      robotModel: robot.robotModel as RobotModel,
      capabilities: robot.capabilities as RobotCapability[],
      preferences: robot.preferences as RobotPreferences,
      status: robot.status as RobotStatus,
      batteryLevel: robot.batteryLevel,
      lastInteraction: robot.lastInteraction,
    };

    this.robotCache.set(robotId, config);
    return config;
  }

  /**
   * Get robots by elder
   */
  async getRobotsByElder(elderId: string): Promise<RobotConfiguration[]> {
    const robots = await this.prisma.robot.findMany({
      where: { elderId },
      orderBy: { robotName: 'asc' },
    });

    return robots.map(r => ({
      robotId: r.robotId,
      elderId: r.elderId,
      homeId: r.homeId,
      robotName: r.robotName,
      robotType: r.robotType as RobotType,
      robotModel: r.robotModel as RobotModel,
      capabilities: r.capabilities as RobotCapability[],
      preferences: r.preferences as RobotPreferences,
      status: r.status as RobotStatus,
      batteryLevel: r.batteryLevel,
      lastInteraction: r.lastInteraction,
    }));
  }

  // ============================================================================
  // COMMUNICATION (SPEAK, LISTEN, DISPLAY EMOTION)
  // ============================================================================

  /**
   * Make robot speak
   */
  async speak(robotId: string, text: string, emotion?: RobotEmotion): Promise<RobotResponse> {
    this.logger.log(`Robot ${robotId} speaking: ${text.substring(0, 50)}...`);

    const robot = await this.getRobot(robotId);

    if (!robot.capabilities.includes(RobotCapability.SPEAK)) {
      throw new Error(`Robot ${robotId} does not have SPEAK capability`);
    }

    const command: RobotCommand = {
      commandId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      robotId,
      commandType: 'SPEAK',
      parameters: {
        text,
        emotion,
        voice: robot.preferences.voiceGender,
        speed: robot.preferences.voiceSpeed,
        volume: robot.preferences.volume,
        language: robot.preferences.language,
      },
      priority: 'NORMAL',
    };

    const response = await this.executeCommand(command);

    // Log interaction
    await this.logInteraction({
      robotId,
      elderId: robot.elderId,
      type: 'SPEECH',
      content: { text, emotion },
      outcome: response.success ? 'POSITIVE' : 'INCOMPLETE',
    });

    return response;
  }

  /**
   * Make robot listen
   */
  async listen(robotId: string, duration: number = 10): Promise<RobotResponse> {
    this.logger.log(`Robot ${robotId} listening for ${duration} seconds`);

    const robot = await this.getRobot(robotId);

    if (!robot.capabilities.includes(RobotCapability.LISTEN)) {
      throw new Error(`Robot ${robotId} does not have LISTEN capability`);
    }

    const command: RobotCommand = {
      commandId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      robotId,
      commandType: 'LISTEN',
      parameters: {
        duration,
        language: robot.preferences.language,
      },
      priority: 'HIGH',
      timeout: duration * 1000 + 5000,
    };

    const response = await this.executeCommand(command);

    // Log interaction
    await this.logInteraction({
      robotId,
      elderId: robot.elderId,
      type: 'LISTENING',
      content: { duration },
      elderResponse: response.result?.transcript,
      outcome: response.success ? 'POSITIVE' : 'INCOMPLETE',
    });

    return response;
  }

  /**
   * Display emotion
   */
  async displayEmotion(robotId: string, emotion: RobotEmotion): Promise<RobotResponse> {
    this.logger.log(`Robot ${robotId} displaying emotion: ${emotion}`);

    const robot = await this.getRobot(robotId);

    if (!robot.capabilities.includes(RobotCapability.DISPLAY_EMOTION)) {
      throw new Error(`Robot ${robotId} does not have DISPLAY_EMOTION capability`);
    }

    const command: RobotCommand = {
      commandId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      robotId,
      commandType: 'DISPLAY_EMOTION',
      parameters: { emotion },
      priority: 'NORMAL',
    };

    return this.executeCommand(command);
  }

  /**
   * Have a conversation
   */
  async haveConversation(
    robotId: string,
    topic: string,
    duration: number = 300,
  ): Promise<RobotInteraction> {
    this.logger.log(`Starting conversation with robot ${robotId} about: ${topic}`);

    const robot = await this.getRobot(robotId);
    const interactionId = `int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const interaction: RobotInteraction = {
      interactionId,
      robotId,
      elderId: robot.elderId,
      startTime: new Date(),
      type: 'CONVERSATION',
      content: { topic, duration },
      outcome: 'NEUTRAL',
    };

    this.activeInteractions.set(interactionId, interaction);

    try {
      // Start conversation
      await this.speak(
        robotId,
        this.generateConversationStarter(topic, robot.preferences),
        RobotEmotion.HAPPY
      );

      // Listen for response
      const response = await this.listen(robotId, 30);

      if (response.success && response.result?.transcript) {
        interaction.elderResponse = response.result.transcript;
        interaction.outcome = 'POSITIVE';

        // Continue conversation based on response
        const reply = this.generateConversationReply(response.result.transcript, topic);
        await this.speak(robotId, reply, RobotEmotion.NEUTRAL);
      }

      interaction.endTime = new Date();
      await this.saveInteraction(interaction);

      return interaction;
    } catch (error) {
      this.logger.error(`Error in conversation: ${error.message}`);
      interaction.outcome = 'NEGATIVE';
      interaction.endTime = new Date();
      await this.saveInteraction(interaction);
      throw error;
    } finally {
      this.activeInteractions.delete(interactionId);
    }
  }

  // ============================================================================
  // PHYSICAL ASSISTANCE
  // ============================================================================

  /**
   * Request physical assistance
   */
  async provideAssistance(request: PhysicalAssistanceRequest): Promise<RobotResponse> {
    this.logger.log(`Assistance request: ${request.assistanceType} for robot ${request.robotId}`);

    const robot = await this.getRobot(request.robotId);

    switch (request.assistanceType) {
      case 'FETCH_ITEM':
        return this.fetchItem(robot, request.parameters);

      case 'MEDICATION_REMINDER':
        return this.provideMedicationReminder(robot, request.parameters);

      case 'EXERCISE_GUIDANCE':
        return this.provideExerciseGuidance(robot, request.parameters);

      case 'EMERGENCY_CALL':
        return this.initiateEmergencyCall(robot, request.parameters);

      default:
        throw new Error(`Unknown assistance type: ${request.assistanceType}`);
    }
  }

  /**
   * Fetch item for elder
   */
  private async fetchItem(robot: RobotConfiguration, params: any): Promise<RobotResponse> {
    if (!robot.capabilities.includes(RobotCapability.MOVE) ||
        !robot.capabilities.includes(RobotCapability.MANIPULATE)) {
      throw new Error('Robot does not have required capabilities for fetching items');
    }

    const command: RobotCommand = {
      commandId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      robotId: robot.robotId,
      commandType: 'FETCH_ITEM',
      parameters: {
        item: params.item,
        location: params.location,
        deliveryLocation: params.deliveryLocation || 'elder',
      },
      priority: 'NORMAL',
      timeout: 60000, // 1 minute
    };

    // Announce action
    await this.speak(
      robot.robotId,
      `I'll fetch the ${params.item} for you. One moment please.`,
      RobotEmotion.ENCOURAGING
    );

    const response = await this.executeCommand(command);

    if (response.success) {
      await this.speak(
        robot.robotId,
        `Here is your ${params.item}. Is there anything else I can help with?`,
        RobotEmotion.HAPPY
      );
    } else {
      await this.speak(
        robot.robotId,
        `I'm sorry, I couldn't retrieve the ${params.item}. Let me call someone to help.`,
        RobotEmotion.CONCERNED
      );
    }

    return response;
  }

  /**
   * Provide medication reminder
   */
  private async provideMedicationReminder(
    robot: RobotConfiguration,
    params: any,
  ): Promise<RobotResponse> {
    const medication = params.medication || 'your medication';
    const dosage = params.dosage || '';

    // Display emotion and speak
    await this.displayEmotion(robot.robotId, RobotEmotion.ENCOURAGING);

    await this.speak(
      robot.robotId,
      `Hello ${robot.preferences.elderName}, it's time to take ${medication}${dosage ? ` - ${dosage}` : ''}. ` +
      `Would you like me to get some water for you?`,
      RobotEmotion.ENCOURAGING
    );

    // Listen for response
    const response = await this.listen(robot.robotId, 15);

    // Log medication reminder
    await this.logInteraction({
      robotId: robot.robotId,
      elderId: robot.elderId,
      type: 'MEDICATION_REMINDER',
      content: { medication, dosage },
      elderResponse: response.result?.transcript,
      outcome: response.success ? 'POSITIVE' : 'INCOMPLETE',
    });

    return response;
  }

  /**
   * Provide exercise guidance
   */
  private async provideExerciseGuidance(
    robot: RobotConfiguration,
    params: any,
  ): Promise<RobotResponse> {
    if (!robot.capabilities.includes(RobotCapability.EXERCISE_GUIDANCE)) {
      throw new Error('Robot does not have EXERCISE_GUIDANCE capability');
    }

    const exerciseType = params.exerciseType || 'stretching';
    const duration = params.duration || 10;

    await this.speak(
      robot.robotId,
      `Let's do some ${exerciseType} exercises together. This will take about ${duration} minutes. ` +
      `Are you ready to begin?`,
      RobotEmotion.EXCITED
    );

    const readyResponse = await this.listen(robot.robotId, 10);

    if (readyResponse.success) {
      const command: RobotCommand = {
        commandId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        robotId: robot.robotId,
        commandType: 'GUIDE_EXERCISE',
        parameters: {
          exerciseType,
          duration,
          difficulty: params.difficulty || 'easy',
        },
        priority: 'NORMAL',
        timeout: duration * 60 * 1000,
      };

      const response = await this.executeCommand(command);

      await this.speak(
        robot.robotId,
        `Great job! You did wonderfully. How are you feeling?`,
        RobotEmotion.HAPPY
      );

      return response;
    }

    return readyResponse;
  }

  /**
   * Initiate emergency call
   */
  private async initiateEmergencyCall(
    robot: RobotConfiguration,
    params: any,
  ): Promise<RobotResponse> {
    this.logger.warn(`Emergency call initiated by robot ${robot.robotId}`);

    await this.speak(
      robot.robotId,
      `I'm calling for help right now. Please stay calm.`,
      RobotEmotion.CONCERNED
    );

    const command: RobotCommand = {
      commandId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      robotId: robot.robotId,
      commandType: 'EMERGENCY_CALL',
      parameters: {
        reason: params.reason || 'Emergency assistance needed',
        contacts: params.contacts,
      },
      priority: 'URGENT',
    };

    const response = await this.executeCommand(command);

    // Create emergency alert
    await this.prisma.alert.create({
      data: {
        elderId: robot.elderId,
        type: 'EMERGENCY',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: 'Robot-Initiated Emergency Call',
        message: params.reason || 'Robot initiated emergency assistance',
        metadata: { robotId: robot.robotId, callInitiated: true },
        triggeredAt: new Date(),
      },
    });

    return response;
  }

  // ============================================================================
  // MONITORING (FALL DETECTION, MOOD, ACTIVITY)
  // ============================================================================

  /**
   * Process monitoring data from robot
   */
  async processMonitoringData(data: MonitoringData): Promise<void> {
    this.logger.debug(`Processing monitoring data: ${data.dataType} from robot ${data.robotId}`);

    const robot = await this.getRobot(data.robotId);

    try {
      switch (data.dataType) {
        case 'FALL_DETECTION':
          await this.handleFallDetection(robot, data);
          break;

        case 'MOOD_ASSESSMENT':
          await this.handleMoodAssessment(robot, data);
          break;

        case 'ACTIVITY_TRACKING':
          await this.handleActivityTracking(robot, data);
          break;

        case 'VITAL_SIGNS':
          await this.handleVitalSigns(robot, data);
          break;

        default:
          this.logger.warn(`Unknown monitoring data type: ${data.dataType}`);
      }

      // Store monitoring data
      await this.prisma.robotMonitoring.create({
        data: {
          robotId: data.robotId,
          elderId: robot.elderId,
          dataType: data.dataType,
          data: data.data,
          confidence: data.confidence,
          requiresAction: data.requiresAction,
          timestamp: data.timestamp,
        },
      });
    } catch (error) {
      this.logger.error(`Error processing monitoring data: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle fall detection
   */
  private async handleFallDetection(robot: RobotConfiguration, data: MonitoringData): Promise<void> {
    if (data.data.fallDetected && data.confidence > 0.8) {
      this.logger.warn(`Fall detected by robot ${robot.robotId} for elder ${robot.elderId}`);

      // Speak to elder immediately
      await this.speak(
        robot.robotId,
        'I detected a fall. Are you okay? Please respond if you can hear me.',
        RobotEmotion.CONCERNED
      );

      // Listen for response
      const response = await this.listen(robot.robotId, 15);

      if (!response.success || !response.result?.transcript) {
        // No response - initiate emergency call
        await this.provideAssistance({
          robotId: robot.robotId,
          assistanceType: 'EMERGENCY_CALL',
          parameters: { reason: 'Fall detected with no response from elder' },
          urgent: true,
        });
      }

      // Create alert
      await this.prisma.alert.create({
        data: {
          elderId: robot.elderId,
          type: 'FALL_DETECTED',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          title: 'Fall Detected by Robot',
          message: 'Robot detected a potential fall',
          metadata: {
            robotId: robot.robotId,
            confidence: data.confidence,
            location: data.data.location,
            elderResponded: !!response.result?.transcript,
          },
          triggeredAt: data.timestamp,
        },
      });
    }
  }

  /**
   * Handle mood assessment
   */
  private async handleMoodAssessment(robot: RobotConfiguration, data: MonitoringData): Promise<void> {
    const mood = data.data.mood; // 'happy', 'sad', 'anxious', 'neutral', etc.
    const moodScore = data.data.score; // 0-100

    if (mood === 'sad' || mood === 'anxious' || moodScore < 40) {
      this.logger.log(`Negative mood detected for elder ${robot.elderId}: ${mood} (${moodScore})`);

      // Offer support
      await this.speak(
        robot.robotId,
        `I noticed you might be feeling a bit down. Would you like to talk, listen to some music, ` +
        `or perhaps I could call someone for you?`,
        RobotEmotion.CONCERNED
      );

      const response = await this.listen(robot.robotId, 20);

      if (response.success && response.result?.transcript) {
        const transcript = response.result.transcript.toLowerCase();

        if (transcript.includes('music')) {
          await this.playMusic(robot.robotId, robot.preferences.elderPreferences.musicGenres?.[0] || 'classical');
        } else if (transcript.includes('call') || transcript.includes('talk')) {
          await this.speak(
            robot.robotId,
            'Let me connect you with someone. One moment please.',
            RobotEmotion.ENCOURAGING
          );
          // Initiate video call (would connect to family/caregiver)
        }
      }
    }

    // Store mood data
    await this.prisma.moodAssessment.create({
      data: {
        elderId: robot.elderId,
        mood,
        score: moodScore,
        source: 'ROBOT',
        sourceId: robot.robotId,
        confidence: data.confidence,
        timestamp: data.timestamp,
      },
    });
  }

  /**
   * Handle activity tracking
   */
  private async handleActivityTracking(robot: RobotConfiguration, data: MonitoringData): Promise<void> {
    const activity = data.data.activity;
    const duration = data.data.duration;
    const location = data.data.location;

    // Check for concerning patterns
    if (activity === 'SEDENTARY' && duration > 180) {
      // Sedentary for more than 3 hours
      await this.speak(
        robot.robotId,
        `${robot.preferences.elderName}, you've been sitting for a while. ` +
        `How about a short walk or some stretching exercises?`,
        RobotEmotion.ENCOURAGING
      );
    }

    // Log activity
    this.logger.debug(`Activity tracked for elder ${robot.elderId}: ${activity} for ${duration} minutes`);
  }

  /**
   * Handle vital signs from robot sensors
   */
  private async handleVitalSigns(robot: RobotConfiguration, data: MonitoringData): Promise<void> {
    const vitalType = data.data.type;
    const value = data.data.value;

    // Store as vital reading
    await this.prisma.vitalReading.create({
      data: {
        elderId: robot.elderId,
        vitalType,
        value,
        unit: data.data.unit,
        deviceId: robot.robotId,
        recordedAt: data.timestamp,
      },
    });
  }

  // ============================================================================
  // COMMAND EXECUTION
  // ============================================================================

  /**
   * Execute robot command
   */
  private async executeCommand(command: RobotCommand): Promise<RobotResponse> {
    const startTime = Date.now();

    try {
      // In production: send command to robot via API/WebSocket/ROS
      // For now, simulate execution
      const result = await this.simulateCommandExecution(command);

      const executionTime = Date.now() - startTime;

      const response: RobotResponse = {
        commandId: command.commandId,
        robotId: command.robotId,
        success: true,
        result,
        executionTime,
        timestamp: new Date(),
      };

      // Update last interaction time
      await this.updateLastInteraction(command.robotId);

      return response;
    } catch (error) {
      this.logger.error(`Error executing command: ${error.message}`, error.stack);

      return {
        commandId: command.commandId,
        robotId: command.robotId,
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Simulate command execution (replace with actual robot API calls)
   */
  private async simulateCommandExecution(command: RobotCommand): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));

    switch (command.commandType) {
      case 'SPEAK':
        return { spoken: true, text: command.parameters.text };

      case 'LISTEN':
        return {
          listened: true,
          transcript: 'Yes, I am okay. Thank you for checking.',
          language: command.parameters.language,
        };

      case 'DISPLAY_EMOTION':
        return { emotionDisplayed: command.parameters.emotion };

      case 'FETCH_ITEM':
        return { itemFetched: true, item: command.parameters.item };

      case 'GUIDE_EXERCISE':
        return { exerciseCompleted: true, duration: command.parameters.duration };

      case 'EMERGENCY_CALL':
        return { callInitiated: true, contacts: command.parameters.contacts };

      default:
        return { executed: true };
    }
  }

  // ============================================================================
  // SCHEDULED ACTIONS
  // ============================================================================

  /**
   * Process scheduled actions for all robots
   */
  private async processScheduledActions(): Promise<void> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];

    const robots = await this.prisma.robot.findMany({
      where: { status: RobotStatus.ONLINE },
    });

    for (const robotData of robots) {
      const robot: RobotConfiguration = {
        robotId: robotData.robotId,
        elderId: robotData.elderId,
        homeId: robotData.homeId,
        robotName: robotData.robotName,
        robotType: robotData.robotType as RobotType,
        robotModel: robotData.robotModel as RobotModel,
        capabilities: robotData.capabilities as RobotCapability[],
        preferences: robotData.preferences as RobotPreferences,
        status: robotData.status as RobotStatus,
        batteryLevel: robotData.batteryLevel,
        lastInteraction: robotData.lastInteraction,
      };

      const schedules = robot.preferences.schedules.filter(
        s => s.enabled && s.time === currentTime && s.days.includes(currentDay)
      );

      for (const schedule of schedules) {
        try {
          await this.executeScheduledAction(robot, schedule);
        } catch (error) {
          this.logger.error(
            `Error executing scheduled action ${schedule.action} for robot ${robot.robotId}: ${error.message}`
          );
        }
      }
    }
  }

  /**
   * Execute a scheduled action
   */
  private async executeScheduledAction(robot: RobotConfiguration, schedule: RobotSchedule): Promise<void> {
    this.logger.log(`Executing scheduled action: ${schedule.action} for robot ${robot.robotId}`);

    switch (schedule.action) {
      case 'MORNING_GREETING':
        await this.speak(
          robot.robotId,
          `Good morning ${robot.preferences.elderName}! I hope you slept well. ` +
          `How are you feeling today?`,
          RobotEmotion.HAPPY
        );
        await this.listen(robot.robotId, 15);
        break;

      case 'MEDICATION_REMINDER':
        await this.provideMedicationReminder(robot, { medication: 'your morning medication' });
        break;

      case 'WELLNESS_CHECKIN':
        await this.speak(
          robot.robotId,
          `Hello ${robot.preferences.elderName}! Just checking in on you. How is your day going?`,
          RobotEmotion.NEUTRAL
        );
        await this.listen(robot.robotId, 15);
        break;

      case 'EVENING_ROUTINE':
        await this.speak(
          robot.robotId,
          `Good evening ${robot.preferences.elderName}. It's getting late. ` +
          `Would you like me to play some relaxing music before bed?`,
          RobotEmotion.CALM
        );
        await this.listen(robot.robotId, 15);
        break;

      default:
        this.logger.warn(`Unknown scheduled action: ${schedule.action}`);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async updateLastInteraction(robotId: string): Promise<void> {
    await this.prisma.robot.update({
      where: { robotId },
      data: { lastInteraction: new Date() },
    });

    if (this.robotCache.has(robotId)) {
      this.robotCache.get(robotId).lastInteraction = new Date();
    }
  }

  private async logInteraction(interaction: Partial<RobotInteraction>): Promise<void> {
    try {
      await this.prisma.robotInteraction.create({
        data: {
          robotId: interaction.robotId,
          elderId: interaction.elderId,
          type: interaction.type,
          content: interaction.content,
          elderResponse: interaction.elderResponse,
          outcome: interaction.outcome,
          notes: interaction.notes,
          startTime: interaction.startTime || new Date(),
          endTime: interaction.endTime,
        },
      });
    } catch (error) {
      this.logger.error(`Error logging interaction: ${error.message}`);
    }
  }

  private async saveInteraction(interaction: RobotInteraction): Promise<void> {
    await this.logInteraction(interaction);
  }

  private generateConversationStarter(topic: string, preferences: RobotPreferences): string {
    const warmthLevel = preferences.personalityTraits.warmth;
    const humorLevel = preferences.personalityTraits.humor;

    const starters = {
      gardening: `I'd love to hear about your garden! What are you growing this season?`,
      family: `Tell me about your family. I always enjoy hearing your stories about them.`,
      history: `I find history fascinating! What historical period interests you most?`,
      default: `Let's chat about ${topic}. What would you like to share?`,
    };

    return starters[topic] || starters.default;
  }

  private generateConversationReply(transcript: string, topic: string): string {
    // In production: use NLP to generate contextual replies
    return `That's wonderful! Thank you for sharing that with me. I really enjoy our conversations.`;
  }

  private async playMusic(robotId: string, genre: string): Promise<void> {
    await this.speak(
      robotId,
      `I'll play some ${genre} music for you. I hope you enjoy it!`,
      RobotEmotion.HAPPY
    );

    const command: RobotCommand = {
      commandId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      robotId,
      commandType: 'PLAY_MUSIC',
      parameters: { genre },
      priority: 'NORMAL',
    };

    await this.executeCommand(command);
  }

  private async checkAllRobotHealth(): Promise<void> {
    const robots = await this.prisma.robot.findMany();

    for (const robot of robots) {
      // Check battery level
      if (robot.batteryLevel && robot.batteryLevel < 20) {
        this.logger.warn(`Low battery for robot ${robot.robotId}: ${robot.batteryLevel}%`);

        if (robot.batteryLevel < 10 && robot.status !== RobotStatus.CHARGING) {
          // Auto-dock for charging if possible
          await this.prisma.robot.update({
            where: { robotId: robot.robotId },
            data: { status: RobotStatus.CHARGING },
          });
        }
      }

      // Check last interaction time
      const hoursSinceInteraction = (Date.now() - robot.lastInteraction.getTime()) / (1000 * 60 * 60);
      if (hoursSinceInteraction > 24) {
        this.logger.warn(`No interaction for robot ${robot.robotId} in ${Math.round(hoursSinceInteraction)} hours`);
      }
    }
  }
}
