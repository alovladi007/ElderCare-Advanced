import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

export interface FallDetectionEvent {
  detected: boolean;
  confidence: number;
  timestamp: Date;
  location: string;
  cameraId: string;
  bodyAngle: number;
  velocity: number;
  poseLandmarks?: any;
}

export interface ActivityRecognitionResult {
  activity: ActivityType;
  confidence: number;
  duration: number;
  timestamp: Date;
  location: string;
  metadata?: any;
}

export type ActivityType =
  | 'SITTING'
  | 'STANDING'
  | 'WALKING'
  | 'LYING_DOWN'
  | 'COOKING'
  | 'EATING'
  | 'CLEANING'
  | 'EXERCISE'
  | 'SLEEPING'
  | 'BATHROOM'
  | 'UNKNOWN';

export interface GaitAnalysisResult {
  gaitSpeed: number; // meters per second
  stepLength: number; // centimeters
  cadence: number; // steps per minute
  symmetry: number; // 0-100, 100 = perfect symmetry
  stability: number; // 0-100
  abnormalitiesDetected: string[];
  recommendations: string[];
}

export interface BehaviorAnalysisResult {
  behaviorsDetected: string[];
  wandering: boolean;
  confusion: boolean;
  repetitiveActions: boolean;
  socialInteractionLevel: number;
  concerns: string[];
}

@Injectable()
export class ComputerVisionService {
  private readonly logger = new Logger(ComputerVisionService.name);
  private readonly cvServiceUrl: string;
  private readonly useCVService: boolean;
  private readonly privacyMode: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.cvServiceUrl = this.config.get<string>('CV_SERVICE_URL') || 'http://localhost:5000';
    this.useCVService = this.config.get<boolean>('USE_CV_SERVICE') === true;
    this.privacyMode = this.config.get<boolean>('CV_PRIVACY_MODE') !== false; // Privacy by default
  }

  /**
   * Process video frame for fall detection using pose estimation
   * All processing done on edge device - only alerts sent to cloud
   */
  async detectFall(frameData: Buffer, cameraId: string, location: string): Promise<FallDetectionEvent> {
    this.logger.log(`Processing fall detection for camera: ${cameraId}`);

    try {
      if (this.useCVService) {
        const result = await this.callCVService('/detect-fall', {
          frame: frameData.toString('base64'),
          cameraId,
          location,
        });

        if (result.detected && result.confidence > 0.8) {
          await this.handleFallDetected(result, cameraId);
        }

        return result;
      }

      // Fallback: motion-based detection
      return this.motionBasedFallDetection(frameData, cameraId, location);
    } catch (error) {
      this.logger.error(`Error in fall detection: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Recognize activity from video stream
   */
  async recognizeActivity(frameData: Buffer, cameraId: string, location: string): Promise<ActivityRecognitionResult> {
    this.logger.log(`Recognizing activity for camera: ${cameraId}`);

    try {
      if (this.useCVService) {
        const result = await this.callCVService('/recognize-activity', {
          frame: frameData.toString('base64'),
          cameraId,
          location,
        });

        // Store activity in database
        await this.storeActivity(result, cameraId);

        return result;
      }

      // Fallback: rule-based activity detection
      return this.ruleBasedActivityDetection(location);
    } catch (error) {
      this.logger.error(`Error in activity recognition: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Analyze gait pattern for mobility assessment
   */
  async analyzeGait(videoSegment: Buffer, elderId: string): Promise<GaitAnalysisResult> {
    this.logger.log(`Analyzing gait for elder: ${elderId}`);

    try {
      if (this.useCVService) {
        const result = await this.callCVService('/analyze-gait', {
          video: videoSegment.toString('base64'),
          elderId,
        });

        // Store gait analysis
        await this.storeGaitAnalysis(elderId, result);

        return result;
      }

      // Fallback: simplified gait assessment from activity data
      return this.simplifiedGaitAnalysis(elderId);
    } catch (error) {
      this.logger.error(`Error in gait analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Analyze behavior patterns for cognitive assessment
   */
  async analyzeBehavior(elderId: string, days: number = 7): Promise<BehaviorAnalysisResult> {
    this.logger.log(`Analyzing behavior patterns for elder: ${elderId}`);

    try {
      // Get recent activity logs
      const activities = await this.prisma.activityLog.findMany({
        where: {
          elderId,
          timestamp: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
        },
        orderBy: { timestamp: 'asc' },
      });

      // Get location tracking data
      const locationData = await this.prisma.locationTracking.findMany({
        where: {
          elderId,
          timestamp: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
        },
        orderBy: { timestamp: 'asc' },
      });

      return this.performBehaviorAnalysis(activities, locationData);
    } catch (error) {
      this.logger.error(`Error in behavior analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Detect unusual inactivity patterns
   */
  async detectInactivityAnomalies(elderId: string): Promise<{ anomalyDetected: boolean; hours: number; lastActivity: Date }> {
    this.logger.log(`Checking inactivity anomalies for elder: ${elderId}`);

    const recentActivity = await this.prisma.activityLog.findFirst({
      where: { elderId },
      orderBy: { timestamp: 'desc' },
    });

    if (!recentActivity) {
      return {
        anomalyDetected: false,
        hours: 0,
        lastActivity: new Date(),
      };
    }

    const hoursSinceActivity = (Date.now() - recentActivity.timestamp.getTime()) / (1000 * 60 * 60);

    // Alert if no activity for more than 12 hours during day
    const anomalyDetected = hoursSinceActivity > 12;

    if (anomalyDetected) {
      await this.triggerInactivityAlert(elderId, hoursSinceActivity);
    }

    return {
      anomalyDetected,
      hours: hoursSinceActivity,
      lastActivity: recentActivity.timestamp,
    };
  }

  /**
   * Monitor sleep quality from bedroom camera (privacy-preserving)
   */
  async assessSleepQuality(elderId: string, date: Date): Promise<any> {
    this.logger.log(`Assessing sleep quality for elder: ${elderId}`);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get bedroom activities during night
    const nightActivities = await this.prisma.activityLog.findMany({
      where: {
        elderId,
        location: 'BEDROOM',
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { timestamp: 'asc' },
    });

    return this.analyzeSleepPattern(nightActivities);
  }

  // ============================================
  // PRIVATE METHODS - CV Service Integration
  // ============================================

  private async callCVService(endpoint: string, data: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.cvServiceUrl}${endpoint}`,
        data,
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`CV service call failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // PRIVATE METHODS - Fallback Detection
  // ============================================

  private async motionBasedFallDetection(
    frameData: Buffer,
    cameraId: string,
    location: string
  ): Promise<FallDetectionEvent> {
    // Simplified fall detection based on motion sensors
    // In production, this would use actual computer vision
    const camera = await this.prisma.camera.findUnique({
      where: { id: cameraId },
    });

    // Check motion sensor data if available
    const recentMotion = await this.prisma.motionSensor.findFirst({
      where: {
        location,
        timestamp: { gte: new Date(Date.now() - 5000) }, // Last 5 seconds
      },
      orderBy: { timestamp: 'desc' },
    });

    const detected = recentMotion && recentMotion.intensity > 0.8; // High intensity = possible fall

    return {
      detected: detected || false,
      confidence: detected ? 0.6 : 0.1, // Lower confidence without CV
      timestamp: new Date(),
      location,
      cameraId,
      bodyAngle: 0,
      velocity: recentMotion?.intensity || 0,
    };
  }

  private async ruleBasedActivityDetection(location: string): Promise<ActivityRecognitionResult> {
    // Rule-based activity inference from location and time
    const hour = new Date().getHours();

    let activity: ActivityType = 'UNKNOWN';

    if (location === 'KITCHEN' && (hour >= 7 && hour <= 9 || hour >= 12 && hour <= 14 || hour >= 18 && hour <= 20)) {
      activity = 'COOKING';
    } else if (location === 'BEDROOM' && (hour >= 22 || hour <= 6)) {
      activity = 'SLEEPING';
    } else if (location === 'BATHROOM') {
      activity = 'BATHROOM';
    } else if (location === 'LIVING_ROOM') {
      activity = 'SITTING';
    }

    return {
      activity,
      confidence: 0.5, // Lower confidence without actual CV
      duration: 0,
      timestamp: new Date(),
      location,
    };
  }

  private async simplifiedGaitAnalysis(elderId: string): Promise<GaitAnalysisResult> {
    // Simplified gait analysis from activity logs
    const walkingActivities = await this.prisma.activityLog.findMany({
      where: {
        elderId,
        activityType: 'WALKING',
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    const avgDuration = walkingActivities.length > 0
      ? walkingActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / walkingActivities.length
      : 0;

    // Estimate gait speed (very rough)
    const estimatedSpeed = avgDuration > 60 ? 0.8 : avgDuration > 30 ? 1.0 : 1.2;

    return {
      gaitSpeed: estimatedSpeed,
      stepLength: 60, // Average
      cadence: 100, // Average
      symmetry: 85,
      stability: 75,
      abnormalitiesDetected: walkingActivities.length < 5 ? ['Low walking frequency'] : [],
      recommendations: walkingActivities.length < 5
        ? ['Encourage more walking', 'Monitor for mobility issues']
        : ['Gait appears normal'],
    };
  }

  private performBehaviorAnalysis(activities: any[], locationData: any[]): BehaviorAnalysisResult {
    const behaviorsDetected: string[] = [];
    let wandering = false;
    let confusion = false;
    let repetitiveActions = false;
    const concerns: string[] = [];

    // Detect wandering (frequent location changes, especially at night)
    const nightLocations = locationData.filter(l => {
      const hour = new Date(l.timestamp).getHours();
      return hour >= 22 || hour <= 6;
    });

    if (nightLocations.length > 10) {
      wandering = true;
      behaviorsDetected.push('Nighttime wandering');
      concerns.push('Frequent nighttime movements may indicate sleep disturbance or confusion');
    }

    // Detect repetitive actions
    const activityCounts = new Map<string, number>();
    activities.forEach(a => {
      const count = activityCounts.get(a.activityType) || 0;
      activityCounts.set(a.activityType, count + 1);
    });

    activityCounts.forEach((count, activityType) => {
      if (count > 20) {
        repetitiveActions = true;
        behaviorsDetected.push(`Repetitive ${activityType.toLowerCase()}`);
      }
    });

    // Assess social interaction
    const socialActivities = activities.filter(a =>
      ['VIDEO_CALL', 'PHONE_CALL', 'VISITOR'].includes(a.activityType)
    );
    const socialInteractionLevel = Math.min((socialActivities.length / 7) * 100, 100);

    if (socialInteractionLevel < 20) {
      concerns.push('Low social interaction - risk of loneliness');
    }

    // Detect confusion indicators
    const unusualPatterns = this.detectUnusualPatterns(activities);
    if (unusualPatterns.length > 0) {
      confusion = true;
      behaviorsDetected.push(...unusualPatterns);
      concerns.push('Unusual activity patterns detected - may indicate cognitive changes');
    }

    return {
      behaviorsDetected,
      wandering,
      confusion,
      repetitiveActions,
      socialInteractionLevel,
      concerns,
    };
  }

  private detectUnusualPatterns(activities: any[]): string[] {
    const patterns: string[] = [];

    // Check for activities at unusual times
    const nightActivities = activities.filter(a => {
      const hour = new Date(a.timestamp).getHours();
      return (hour >= 1 && hour <= 5) && a.activityType !== 'SLEEPING';
    });

    if (nightActivities.length > 5) {
      patterns.push('Unusual activity during typical sleep hours');
    }

    // Check for skipped meals
    const mealActivities = activities.filter(a => a.activityType === 'EATING');
    if (mealActivities.length < 2) {
      patterns.push('Fewer than expected meal activities');
    }

    return patterns;
  }

  private analyzeSleepPattern(nightActivities: any[]): any {
    // Analyze movements and disturbances during sleep
    const bedtimeActivities = nightActivities.filter(a => {
      const hour = new Date(a.timestamp).getHours();
      return hour >= 22 || hour <= 6;
    });

    const disturbances = bedtimeActivities.filter(a => a.activityType !== 'SLEEPING').length;

    let sleepQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    if (disturbances === 0) sleepQuality = 'EXCELLENT';
    else if (disturbances <= 2) sleepQuality = 'GOOD';
    else if (disturbances <= 4) sleepQuality = 'FAIR';
    else sleepQuality = 'POOR';

    return {
      date: new Date(),
      sleepQuality,
      disturbances,
      estimatedSleepHours: 8 - (disturbances * 0.5),
      recommendations: disturbances > 3
        ? [
            'Investigate causes of sleep disturbance',
            'Review evening medications',
            'Ensure comfortable sleep environment',
          ]
        : ['Sleep pattern appears normal'],
    };
  }

  // ============================================
  // PRIVATE METHODS - Data Storage
  // ============================================

  private async handleFallDetected(fallEvent: FallDetectionEvent, cameraId: string) {
    this.logger.warn(`Fall detected with ${fallEvent.confidence * 100}% confidence at ${fallEvent.location}`);

    try {
      const camera = await this.prisma.camera.findUnique({
        where: { id: cameraId },
        include: { home: { include: { elders: true } } },
      });

      if (!camera || camera.home.elders.length === 0) {
        this.logger.error('No elder found for camera');
        return;
      }

      const elder = camera.home.elders[0];

      // Create critical alert
      await this.prisma.alert.create({
        data: {
          elderId: elder.id,
          type: 'FALL_DETECTED',
          severity: 'CRITICAL',
          message: `Fall detected at ${fallEvent.location} with ${Math.round(fallEvent.confidence * 100)}% confidence`,
          metadata: {
            ...fallEvent,
            cameraId,
          },
        },
      });

      // Log activity
      await this.prisma.activityLog.create({
        data: {
          elderId: elder.id,
          activityType: 'FALL_DETECTED',
          location: fallEvent.location,
          timestamp: fallEvent.timestamp,
          metadata: fallEvent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to handle fall detection: ${error.message}`);
    }
  }

  private async storeActivity(activity: ActivityRecognitionResult, cameraId: string) {
    try {
      const camera = await this.prisma.camera.findUnique({
        where: { id: cameraId },
        include: { home: { include: { elders: true } } },
      });

      if (!camera || camera.home.elders.length === 0) return;

      const elder = camera.home.elders[0];

      // Only store if significant activity (not UNKNOWN)
      if (activity.activity !== 'UNKNOWN' && activity.confidence > 0.7) {
        await this.prisma.activityLog.create({
          data: {
            elderId: elder.id,
            activityType: activity.activity,
            location: activity.location,
            timestamp: activity.timestamp,
            duration: activity.duration,
            metadata: activity,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to store activity: ${error.message}`);
    }
  }

  private async storeGaitAnalysis(elderId: string, result: GaitAnalysisResult) {
    try {
      await this.prisma.gaitAnalysis.create({
        data: {
          elderId,
          gaitSpeed: result.gaitSpeed,
          stepLength: result.stepLength,
          cadence: result.cadence,
          symmetry: result.symmetry,
          stability: result.stability,
          abnormalities: result.abnormalitiesDetected,
          recommendations: result.recommendations,
          analyzedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to store gait analysis: ${error.message}`);
    }
  }

  private async triggerInactivityAlert(elderId: string, hours: number) {
    this.logger.warn(`Inactivity anomaly detected for elder ${elderId}: ${hours.toFixed(1)} hours`);

    try {
      await this.prisma.alert.create({
        data: {
          elderId,
          type: 'INACTIVITY_DETECTED',
          severity: hours > 24 ? 'CRITICAL' : 'HIGH',
          message: `No activity detected for ${hours.toFixed(1)} hours`,
          metadata: { hoursSinceActivity: hours },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create inactivity alert: ${error.message}`);
    }
  }
}
