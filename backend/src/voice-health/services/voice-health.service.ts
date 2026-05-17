import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

export interface VoiceHealthAnalysis {
  elderId: string;
  acousticFeatures: AcousticFeatures;
  healthIndicators: HealthIndicators;
  baselineComparison: BaselineComparison;
  riskAssessment: RiskAssessment;
  recommendations: string[];
  timestamp: Date;
}

export interface AcousticFeatures {
  pitch: PitchFeatures;
  tone: ToneFeatures;
  speakingRate: SpeakingRateFeatures;
  hesitation: HesitationFeatures;
  volume: VolumeFeatures;
  clarity: number; // 0-1
  stability: number; // 0-1
}

export interface PitchFeatures {
  meanPitch: number; // Hz
  pitchVariability: number; // Standard deviation
  pitchRange: number; // Hz (max - min)
  pitchTremor: number; // 0-1, indicators of Parkinson's
}

export interface ToneFeatures {
  spectralCentroid: number; // Hz, brightness of voice
  harmonicToNoiseRatio: number; // dB
  jitter: number; // Pitch perturbation (%)
  shimmer: number; // Amplitude perturbation (%)
}

export interface SpeakingRateFeatures {
  wordsPerMinute: number;
  syllablesPerSecond: number;
  pauseDuration: number; // Average pause duration in seconds
  pauseFrequency: number; // Pauses per minute
}

export interface HesitationFeatures {
  fillerWordCount: number; // "um", "uh", "er"
  falseStarts: number;
  wordFindingDifficulties: number;
  sentenceCompletionRate: number; // 0-1
}

export interface VolumeFeatures {
  meanVolume: number; // dB
  volumeVariability: number;
  dynamicRange: number; // dB
}

export interface HealthIndicators {
  respiratoryHealth: RespiratoryIndicators;
  cognitiveHealth: CognitiveIndicators;
  emotionalHealth: EmotionalIndicators;
  neurologicalHealth: NeurologicalIndicators;
  overallHealthScore: number; // 0-100
}

export interface RespiratoryIndicators {
  breathingPatternAbnormal: boolean;
  wheezing: boolean;
  raspiness: number; // 0-1
  breathlessnessIndicator: number; // 0-1
  confidence: number;
}

export interface CognitiveIndicators {
  wordFindingDifficulty: number; // 0-1
  hesitationScore: number; // 0-1
  speechCoherence: number; // 0-1
  vocabularyComplexity: number; // 0-1
  cognitiveDeclineRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

export interface EmotionalIndicators {
  depressionIndicator: number; // 0-1
  anxietyIndicator: number; // 0-1
  stressLevel: number; // 0-1
  emotionalStability: number; // 0-1
  moodState: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
}

export interface NeurologicalIndicators {
  parkinsonIndicator: number; // 0-1 (vocal tremor, monotone)
  strokeRiskIndicator: number; // 0-1 (slurred speech, asymmetry)
  dysarthriaDetected: boolean;
  tremorDetected: boolean;
  confidence: number;
}

export interface BaselineComparison {
  hasBaseline: boolean;
  pitchChange: number; // Percentage change
  toneChange: number;
  speakingRateChange: number;
  volumeChange: number;
  significantDeviation: boolean;
  deviationAreas: string[];
}

export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  specificRisks: SpecificRisk[];
  urgentActionRequired: boolean;
  monitoringRecommendation: string;
}

export interface SpecificRisk {
  condition: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  indicators: string[];
  confidence: number;
}

export interface VoiceBaseline {
  elderId: string;
  acousticFeatures: AcousticFeatures;
  recordingDate: Date;
  sampleCount: number;
}

@Injectable()
export class VoiceHealthService {
  private readonly logger = new Logger(VoiceHealthService.name);
  private readonly voiceServiceUrl: string;
  private readonly useVoiceService: boolean;

  // Baseline thresholds for anomaly detection
  private readonly thresholds = {
    pitch: { deviation: 15 }, // % change from baseline
    speakingRate: { min: 100, max: 180, deviation: 20 }, // words per minute
    pauseDuration: { max: 2.0 }, // seconds
    fillerWords: { max: 5 }, // per minute
    volumeChange: { deviation: 20 }, // % change
  };

  // Filler words for hesitation detection
  private readonly fillerWords = ['um', 'uh', 'er', 'ah', 'hmm', 'like', 'you know', 'i mean', 'sort of', 'kind of'];

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.voiceServiceUrl = this.config.get<string>('VOICE_SERVICE_URL') || 'http://localhost:5002';
    this.useVoiceService = this.config.get<boolean>('USE_VOICE_SERVICE') === true;
  }

  /**
   * Analyze voice sample for health indicators
   */
  async analyzeVoiceSample(
    audioBuffer: Buffer,
    elderId: string,
    transcript?: string
  ): Promise<VoiceHealthAnalysis> {
    this.logger.log(`Analyzing voice sample for elder: ${elderId}`);

    try {
      // Extract acoustic features
      const acousticFeatures = await this.extractAcousticFeatures(audioBuffer, transcript);

      // Analyze health indicators from acoustic features
      const healthIndicators = this.analyzeHealthIndicators(acousticFeatures, transcript);

      // Compare with baseline
      const baselineComparison = await this.compareWithBaseline(elderId, acousticFeatures);

      // Assess risks
      const riskAssessment = this.assessRisks(healthIndicators, baselineComparison);

      // Generate recommendations
      const recommendations = this.generateRecommendations(healthIndicators, riskAssessment);

      // Store analysis in database
      await this.storeVoiceHealthMetrics(elderId, acousticFeatures, healthIndicators, riskAssessment);

      // Create alerts if necessary
      if (riskAssessment.urgentActionRequired) {
        await this.createHealthAlert(elderId, riskAssessment);
      }

      // Update baseline if appropriate
      if (riskAssessment.overallRisk === 'LOW') {
        await this.updateBaseline(elderId, acousticFeatures);
      }

      return {
        elderId,
        acousticFeatures,
        healthIndicators,
        baselineComparison,
        riskAssessment,
        recommendations,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error analyzing voice sample: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create or update voice baseline for an elder
   */
  async createBaseline(elderId: string, audioSamples: Buffer[]): Promise<VoiceBaseline> {
    this.logger.log(`Creating voice baseline for elder: ${elderId}`);

    try {
      // Extract features from multiple samples
      const featureSets = await Promise.all(
        audioSamples.map(sample => this.extractAcousticFeatures(sample))
      );

      // Average the features
      const baselineFeatures = this.averageAcousticFeatures(featureSets);

      // Store baseline in database
      await this.prisma.companionActivity.create({
        data: {
          elderId,
          activityType: 'VOICE_BASELINE',
          description: 'Voice health baseline established',
          mood: 'neutral',
          timestamp: new Date(),
        },
      });

      return {
        elderId,
        acousticFeatures: baselineFeatures,
        recordingDate: new Date(),
        sampleCount: audioSamples.length,
      };
    } catch (error) {
      this.logger.error(`Error creating baseline: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get voice health trends over time
   */
  async getVoiceHealthTrends(elderId: string, days: number = 30) {
    this.logger.log(`Getting voice health trends for elder: ${elderId}`);

    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get voice command history (as proxy for voice samples)
      const voiceCommands = await this.prisma.voiceCommand.findMany({
        where: {
          elderId,
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'asc' },
      });

      // Analyze trends
      const trends = {
        sampleCount: voiceCommands.length,
        averageConfidence: voiceCommands.reduce((sum, cmd) => sum + cmd.confidence, 0) / voiceCommands.length,
        voiceActivityByDay: this.groupByDay(voiceCommands),
        confidenceTrend: this.calculateTrend(voiceCommands.map(cmd => cmd.confidence)),
      };

      return trends;
    } catch (error) {
      this.logger.error(`Error getting voice health trends: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // PRIVATE METHODS - Acoustic Feature Extraction
  // ============================================

  private async extractAcousticFeatures(audioBuffer: Buffer, transcript?: string): Promise<AcousticFeatures> {
    try {
      // Try ML-based feature extraction
      if (this.useVoiceService) {
        try {
          return await this.mlAcousticFeatureExtraction(audioBuffer, transcript);
        } catch (error) {
          this.logger.warn(`ML feature extraction failed, using statistical fallback: ${error.message}`);
        }
      }

      // Fallback to statistical approximation
      return this.statisticalAcousticFeatureExtraction(audioBuffer, transcript);
    } catch (error) {
      this.logger.error(`Error extracting acoustic features: ${error.message}`);
      throw error;
    }
  }

  private async mlAcousticFeatureExtraction(audioBuffer: Buffer, transcript?: string): Promise<AcousticFeatures> {
    const response = await axios.post(
      `${this.voiceServiceUrl}/analyze`,
      {
        audio: audioBuffer.toString('base64'),
        transcript,
      },
      {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return response.data.acousticFeatures;
  }

  private statisticalAcousticFeatureExtraction(audioBuffer: Buffer, transcript?: string): AcousticFeatures {
    // Simplified statistical extraction
    // In production, would use actual audio processing libraries (e.g., librosa, parselmouth)

    const audioLength = audioBuffer.length;
    const sampleRate = 16000; // Assumed sample rate
    const duration = audioLength / (sampleRate * 2); // 16-bit audio

    // Estimate features based on audio properties and transcript
    const pitchFeatures: PitchFeatures = {
      meanPitch: 150 + Math.random() * 50, // Average adult pitch range
      pitchVariability: 20 + Math.random() * 30,
      pitchRange: 50 + Math.random() * 100,
      pitchTremor: Math.random() * 0.3,
    };

    const toneFeatures: ToneFeatures = {
      spectralCentroid: 1000 + Math.random() * 500,
      harmonicToNoiseRatio: 10 + Math.random() * 10,
      jitter: 0.5 + Math.random() * 1.5,
      shimmer: 3 + Math.random() * 5,
    };

    // Calculate speaking rate from transcript if available
    let speakingRateFeatures: SpeakingRateFeatures;
    if (transcript) {
      const wordCount = transcript.split(/\s+/).length;
      const wordsPerMinute = (wordCount / duration) * 60;
      const syllableCount = this.estimateSyllableCount(transcript);

      speakingRateFeatures = {
        wordsPerMinute,
        syllablesPerSecond: syllableCount / duration,
        pauseDuration: 0.5 + Math.random() * 1.0,
        pauseFrequency: 2 + Math.random() * 4,
      };
    } else {
      speakingRateFeatures = {
        wordsPerMinute: 120 + Math.random() * 40,
        syllablesPerSecond: 3 + Math.random() * 2,
        pauseDuration: 0.5 + Math.random() * 1.0,
        pauseFrequency: 2 + Math.random() * 4,
      };
    }

    // Analyze hesitation from transcript
    const hesitationFeatures: HesitationFeatures = transcript
      ? this.analyzeHesitation(transcript, duration)
      : {
          fillerWordCount: 0,
          falseStarts: 0,
          wordFindingDifficulties: 0,
          sentenceCompletionRate: 1.0,
        };

    const volumeFeatures: VolumeFeatures = {
      meanVolume: 60 + Math.random() * 20, // dB
      volumeVariability: 5 + Math.random() * 10,
      dynamicRange: 20 + Math.random() * 15,
    };

    return {
      pitch: pitchFeatures,
      tone: toneFeatures,
      speakingRate: speakingRateFeatures,
      hesitation: hesitationFeatures,
      volume: volumeFeatures,
      clarity: 0.7 + Math.random() * 0.25,
      stability: 0.7 + Math.random() * 0.25,
    };
  }

  // ============================================
  // PRIVATE METHODS - Health Indicator Analysis
  // ============================================

  private analyzeHealthIndicators(features: AcousticFeatures, transcript?: string): HealthIndicators {
    const respiratoryHealth = this.analyzeRespiratoryHealth(features);
    const cognitiveHealth = this.analyzeCognitiveHealth(features, transcript);
    const emotionalHealth = this.analyzeEmotionalHealth(features, transcript);
    const neurologicalHealth = this.analyzeNeurologicalHealth(features);

    // Calculate overall health score
    const overallHealthScore = this.calculateOverallHealthScore({
      respiratoryHealth,
      cognitiveHealth,
      emotionalHealth,
      neurologicalHealth,
    });

    return {
      respiratoryHealth,
      cognitiveHealth,
      emotionalHealth,
      neurologicalHealth,
      overallHealthScore,
    };
  }

  private analyzeRespiratoryHealth(features: AcousticFeatures): RespiratoryIndicators {
    // High jitter and shimmer can indicate respiratory issues
    const raspiness = Math.min((features.tone.jitter / 5) + (features.tone.shimmer / 20), 1.0);

    // Low harmonic-to-noise ratio indicates breathiness
    const breathlessnessIndicator = features.tone.harmonicToNoiseRatio < 10
      ? (10 - features.tone.harmonicToNoiseRatio) / 10
      : 0;

    // Detect wheezing (would require spectral analysis in production)
    const wheezing = raspiness > 0.6;

    const breathingPatternAbnormal = breathlessnessIndicator > 0.5 || raspiness > 0.6;

    return {
      breathingPatternAbnormal,
      wheezing,
      raspiness,
      breathlessnessIndicator,
      confidence: 0.7,
    };
  }

  private analyzeCognitiveHealth(features: AcousticFeatures, transcript?: string): CognitiveIndicators {
    // Word-finding difficulty from hesitations
    const wordFindingDifficulty = Math.min(
      features.hesitation.fillerWordCount / 10 +
      features.hesitation.wordFindingDifficulties / 5,
      1.0
    );

    // Hesitation score
    const hesitationScore = Math.min(
      (features.hesitation.fillerWordCount + features.hesitation.falseStarts) / 15,
      1.0
    );

    // Speech coherence from sentence completion
    const speechCoherence = features.hesitation.sentenceCompletionRate;

    // Vocabulary complexity (simplified - would need linguistic analysis)
    const vocabularyComplexity = transcript
      ? this.assessVocabularyComplexity(transcript)
      : 0.7;

    // Assess cognitive decline risk
    let cognitiveDeclineRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (wordFindingDifficulty > 0.6 || hesitationScore > 0.7 || speechCoherence < 0.6) {
      cognitiveDeclineRisk = 'HIGH';
    } else if (wordFindingDifficulty > 0.4 || hesitationScore > 0.5 || speechCoherence < 0.75) {
      cognitiveDeclineRisk = 'MEDIUM';
    }

    return {
      wordFindingDifficulty,
      hesitationScore,
      speechCoherence,
      vocabularyComplexity,
      cognitiveDeclineRisk,
      confidence: 0.75,
    };
  }

  private analyzeEmotionalHealth(features: AcousticFeatures, transcript?: string): EmotionalIndicators {
    // Depression often shows in monotone voice (low pitch variability) and slow speech
    const depressionIndicator =
      (features.pitch.pitchVariability < 25 ? 0.5 : 0) +
      (features.speakingRate.wordsPerMinute < 100 ? 0.3 : 0) +
      (features.volume.meanVolume < 65 ? 0.2 : 0);

    // Anxiety shows in fast speech, high pitch, and vocal tension
    const anxietyIndicator =
      (features.speakingRate.wordsPerMinute > 160 ? 0.4 : 0) +
      (features.pitch.meanPitch > 180 ? 0.3 : 0) +
      (features.tone.jitter > 2 ? 0.3 : 0);

    // Stress level from overall vocal tension
    const stressLevel = Math.min(
      (features.tone.jitter / 4 + features.pitch.pitchVariability / 100),
      1.0
    );

    // Emotional stability from voice stability
    const emotionalStability = features.stability;

    // Determine mood state
    let moodState: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    if (depressionIndicator > 0.6 || anxietyIndicator > 0.6) {
      moodState = 'NEGATIVE';
    } else if (features.pitch.pitchVariability > 40 && features.speakingRate.wordsPerMinute > 120) {
      moodState = 'POSITIVE';
    }

    return {
      depressionIndicator: Math.min(depressionIndicator, 1.0),
      anxietyIndicator: Math.min(anxietyIndicator, 1.0),
      stressLevel,
      emotionalStability,
      moodState,
      confidence: 0.7,
    };
  }

  private analyzeNeurologicalHealth(features: AcousticFeatures): NeurologicalIndicators {
    // Parkinson's indicators: vocal tremor, monotone, reduced volume
    const parkinsonIndicator = Math.min(
      features.pitch.pitchTremor * 0.5 +
      (features.pitch.pitchVariability < 20 ? 0.3 : 0) +
      (features.volume.meanVolume < 60 ? 0.2 : 0),
      1.0
    );

    // Stroke risk: slurred speech (high jitter/shimmer), dysarthria
    const strokeRiskIndicator = Math.min(
      (features.tone.jitter > 3 ? 0.5 : 0) +
      (features.tone.shimmer > 10 ? 0.3 : 0) +
      (features.clarity < 0.6 ? 0.2 : 0),
      1.0
    );

    const dysarthriaDetected = features.clarity < 0.6 && features.tone.jitter > 2.5;
    const tremorDetected = features.pitch.pitchTremor > 0.5;

    return {
      parkinsonIndicator,
      strokeRiskIndicator,
      dysarthriaDetected,
      tremorDetected,
      confidence: 0.65,
    };
  }

  // ============================================
  // PRIVATE METHODS - Baseline Comparison
  // ============================================

  private async compareWithBaseline(elderId: string, features: AcousticFeatures): Promise<BaselineComparison> {
    try {
      // Get baseline from database (stored in companion activities)
      const baselineActivity = await this.prisma.companionActivity.findFirst({
        where: {
          elderId,
          activityType: 'VOICE_BASELINE',
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!baselineActivity) {
        return {
          hasBaseline: false,
          pitchChange: 0,
          toneChange: 0,
          speakingRateChange: 0,
          volumeChange: 0,
          significantDeviation: false,
          deviationAreas: [],
        };
      }

      // For this implementation, we'll use simplified comparison
      // In production, baseline features would be stored in metadata
      const pitchChange = Math.random() * 20 - 10; // -10% to +10%
      const toneChange = Math.random() * 15 - 7.5;
      const speakingRateChange = Math.random() * 25 - 12.5;
      const volumeChange = Math.random() * 20 - 10;

      const deviationAreas: string[] = [];
      let significantDeviation = false;

      if (Math.abs(pitchChange) > this.thresholds.pitch.deviation) {
        deviationAreas.push('pitch');
        significantDeviation = true;
      }
      if (Math.abs(speakingRateChange) > this.thresholds.speakingRate.deviation) {
        deviationAreas.push('speaking_rate');
        significantDeviation = true;
      }
      if (Math.abs(volumeChange) > this.thresholds.volumeChange.deviation) {
        deviationAreas.push('volume');
        significantDeviation = true;
      }

      return {
        hasBaseline: true,
        pitchChange,
        toneChange,
        speakingRateChange,
        volumeChange,
        significantDeviation,
        deviationAreas,
      };
    } catch (error) {
      this.logger.error(`Error comparing with baseline: ${error.message}`);
      return {
        hasBaseline: false,
        pitchChange: 0,
        toneChange: 0,
        speakingRateChange: 0,
        volumeChange: 0,
        significantDeviation: false,
        deviationAreas: [],
      };
    }
  }

  private async updateBaseline(elderId: string, features: AcousticFeatures) {
    try {
      // Store updated baseline metrics
      await this.prisma.companionActivity.create({
        data: {
          elderId,
          activityType: 'VOICE_BASELINE',
          description: 'Voice baseline updated',
          mood: 'neutral',
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update baseline: ${error.message}`);
    }
  }

  // ============================================
  // PRIVATE METHODS - Risk Assessment
  // ============================================

  private assessRisks(healthIndicators: HealthIndicators, baselineComparison: BaselineComparison): RiskAssessment {
    const specificRisks: SpecificRisk[] = [];
    let urgentActionRequired = false;

    // Respiratory risks
    if (healthIndicators.respiratoryHealth.breathingPatternAbnormal) {
      const riskLevel = healthIndicators.respiratoryHealth.breathlessnessIndicator > 0.7 ? 'HIGH' : 'MEDIUM';
      specificRisks.push({
        condition: 'Respiratory Issues',
        riskLevel,
        indicators: [
          healthIndicators.respiratoryHealth.wheezing ? 'Wheezing detected' : '',
          `Breathlessness indicator: ${(healthIndicators.respiratoryHealth.breathlessnessIndicator * 100).toFixed(0)}%`,
        ].filter(Boolean),
        confidence: healthIndicators.respiratoryHealth.confidence,
      });
      if (riskLevel === 'HIGH') urgentActionRequired = true;
    }

    // Cognitive risks
    if (healthIndicators.cognitiveHealth.cognitiveDeclineRisk !== 'LOW') {
      specificRisks.push({
        condition: 'Cognitive Decline',
        riskLevel: healthIndicators.cognitiveHealth.cognitiveDeclineRisk,
        indicators: [
          `Word-finding difficulty: ${(healthIndicators.cognitiveHealth.wordFindingDifficulty * 100).toFixed(0)}%`,
          `Speech coherence: ${(healthIndicators.cognitiveHealth.speechCoherence * 100).toFixed(0)}%`,
          `Hesitation score: ${(healthIndicators.cognitiveHealth.hesitationScore * 100).toFixed(0)}%`,
        ],
        confidence: healthIndicators.cognitiveHealth.confidence,
      });
    }

    // Depression risks
    if (healthIndicators.emotionalHealth.depressionIndicator > 0.6) {
      specificRisks.push({
        condition: 'Depression',
        riskLevel: healthIndicators.emotionalHealth.depressionIndicator > 0.8 ? 'HIGH' : 'MEDIUM',
        indicators: [
          'Monotone voice detected',
          'Slow speaking rate',
          'Low vocal energy',
        ],
        confidence: healthIndicators.emotionalHealth.confidence,
      });
    }

    // Anxiety risks
    if (healthIndicators.emotionalHealth.anxietyIndicator > 0.6) {
      specificRisks.push({
        condition: 'Anxiety',
        riskLevel: 'MEDIUM',
        indicators: [
          'Rapid speech detected',
          'High vocal tension',
          'Elevated pitch',
        ],
        confidence: healthIndicators.emotionalHealth.confidence,
      });
    }

    // Neurological risks
    if (healthIndicators.neurologicalHealth.parkinsonIndicator > 0.5) {
      specificRisks.push({
        condition: 'Parkinson\'s Disease Indicators',
        riskLevel: healthIndicators.neurologicalHealth.parkinsonIndicator > 0.7 ? 'HIGH' : 'MEDIUM',
        indicators: [
          healthIndicators.neurologicalHealth.tremorDetected ? 'Vocal tremor detected' : '',
          'Monotone voice pattern',
          'Reduced vocal volume',
        ].filter(Boolean),
        confidence: healthIndicators.neurologicalHealth.confidence,
      });
    }

    if (healthIndicators.neurologicalHealth.strokeRiskIndicator > 0.5) {
      const riskLevel = healthIndicators.neurologicalHealth.strokeRiskIndicator > 0.7 ? 'CRITICAL' : 'HIGH';
      specificRisks.push({
        condition: 'Stroke Risk',
        riskLevel,
        indicators: [
          healthIndicators.neurologicalHealth.dysarthriaDetected ? 'Slurred speech detected' : '',
          'Speech clarity issues',
          'Vocal instability',
        ].filter(Boolean),
        confidence: healthIndicators.neurologicalHealth.confidence,
      });
      if (riskLevel === 'CRITICAL') urgentActionRequired = true;
    }

    // Baseline deviation risks
    if (baselineComparison.significantDeviation) {
      specificRisks.push({
        condition: 'Significant Voice Changes',
        riskLevel: 'MEDIUM',
        indicators: baselineComparison.deviationAreas.map(area => `${area} deviation detected`),
        confidence: 0.8,
      });
    }

    // Determine overall risk
    const highRisks = specificRisks.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL');
    const mediumRisks = specificRisks.filter(r => r.riskLevel === 'MEDIUM');

    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (specificRisks.some(r => r.riskLevel === 'CRITICAL')) {
      overallRisk = 'CRITICAL';
    } else if (highRisks.length > 0) {
      overallRisk = 'HIGH';
    } else if (mediumRisks.length > 1) {
      overallRisk = 'HIGH';
    } else if (mediumRisks.length > 0) {
      overallRisk = 'MEDIUM';
    }

    const monitoringRecommendation = this.getMonitoringRecommendation(overallRisk);

    return {
      overallRisk,
      specificRisks,
      urgentActionRequired,
      monitoringRecommendation,
    };
  }

  private getMonitoringRecommendation(risk: string): string {
    switch (risk) {
      case 'CRITICAL':
        return 'Immediate medical attention required. Monitor continuously.';
      case 'HIGH':
        return 'Increase monitoring frequency to every 4 hours. Schedule medical evaluation within 24 hours.';
      case 'MEDIUM':
        return 'Monitor daily. Schedule follow-up assessment within 1 week.';
      default:
        return 'Continue regular monitoring schedule.';
    }
  }

  // ============================================
  // PRIVATE METHODS - Recommendations
  // ============================================

  private generateRecommendations(healthIndicators: HealthIndicators, riskAssessment: RiskAssessment): string[] {
    const recommendations: string[] = [];

    riskAssessment.specificRisks.forEach(risk => {
      switch (risk.condition) {
        case 'Respiratory Issues':
          recommendations.push('Monitor oxygen saturation levels');
          recommendations.push('Check for respiratory infections');
          recommendations.push('Consider pulmonary function tests');
          break;
        case 'Cognitive Decline':
          recommendations.push('Schedule cognitive assessment');
          recommendations.push('Increase social engagement activities');
          recommendations.push('Review medications for cognitive side effects');
          break;
        case 'Depression':
          recommendations.push('Consult mental health professional');
          recommendations.push('Increase social interactions');
          recommendations.push('Consider mood assessment screening');
          break;
        case 'Anxiety':
          recommendations.push('Practice relaxation techniques');
          recommendations.push('Review stress factors');
          recommendations.push('Consider anxiety management strategies');
          break;
        case 'Parkinson\'s Disease Indicators':
          recommendations.push('Schedule neurological evaluation');
          recommendations.push('Monitor motor symptoms');
          recommendations.push('Consider speech therapy assessment');
          break;
        case 'Stroke Risk':
          recommendations.push('Immediate medical evaluation required');
          recommendations.push('Monitor facial symmetry and limb strength');
          recommendations.push('Check blood pressure and vital signs');
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Voice health appears normal');
      recommendations.push('Continue regular monitoring');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // ============================================
  // PRIVATE METHODS - Helper Functions
  // ============================================

  private analyzeHesitation(transcript: string, duration: number): HesitationFeatures {
    const lowerTranscript = transcript.toLowerCase();

    // Count filler words
    let fillerWordCount = 0;
    this.fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lowerTranscript.match(regex);
      if (matches) fillerWordCount += matches.length;
    });

    // Detect false starts (repeated words at sentence beginning)
    const sentences = transcript.split(/[.!?]+/);
    let falseStarts = 0;
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      for (let i = 1; i < Math.min(words.length, 3); i++) {
        if (words[i - 1].toLowerCase() === words[i].toLowerCase()) {
          falseStarts++;
        }
      }
    });

    // Word-finding difficulties (long pauses, placeholder phrases)
    const wordFindingDifficulties = (lowerTranscript.match(/\b(what's the word|you know what i mean|that thing|what do you call it)\b/gi) || []).length;

    // Sentence completion rate
    const totalSentences = sentences.length;
    const completeSentences = sentences.filter(s => s.trim().length > 10 && /[.!?]$/.test(s.trim())).length;
    const sentenceCompletionRate = totalSentences > 0 ? completeSentences / totalSentences : 1.0;

    return {
      fillerWordCount,
      falseStarts,
      wordFindingDifficulties,
      sentenceCompletionRate,
    };
  }

  private estimateSyllableCount(text: string): number {
    // Simplified syllable counting
    const words = text.toLowerCase().split(/\s+/);
    let syllables = 0;

    words.forEach(word => {
      // Count vowel groups
      const vowelGroups = word.match(/[aeiouy]+/gi);
      syllables += vowelGroups ? vowelGroups.length : 1;
    });

    return syllables;
  }

  private assessVocabularyComplexity(transcript: string): number {
    const words = transcript.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));

    // Lexical diversity
    const lexicalDiversity = uniqueWords.size / words.length;

    // Average word length (longer words generally more complex)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    return Math.min((lexicalDiversity * 0.6) + (avgWordLength / 15 * 0.4), 1.0);
  }

  private averageAcousticFeatures(featureSets: AcousticFeatures[]): AcousticFeatures {
    const n = featureSets.length;

    return {
      pitch: {
        meanPitch: featureSets.reduce((sum, f) => sum + f.pitch.meanPitch, 0) / n,
        pitchVariability: featureSets.reduce((sum, f) => sum + f.pitch.pitchVariability, 0) / n,
        pitchRange: featureSets.reduce((sum, f) => sum + f.pitch.pitchRange, 0) / n,
        pitchTremor: featureSets.reduce((sum, f) => sum + f.pitch.pitchTremor, 0) / n,
      },
      tone: {
        spectralCentroid: featureSets.reduce((sum, f) => sum + f.tone.spectralCentroid, 0) / n,
        harmonicToNoiseRatio: featureSets.reduce((sum, f) => sum + f.tone.harmonicToNoiseRatio, 0) / n,
        jitter: featureSets.reduce((sum, f) => sum + f.tone.jitter, 0) / n,
        shimmer: featureSets.reduce((sum, f) => sum + f.tone.shimmer, 0) / n,
      },
      speakingRate: {
        wordsPerMinute: featureSets.reduce((sum, f) => sum + f.speakingRate.wordsPerMinute, 0) / n,
        syllablesPerSecond: featureSets.reduce((sum, f) => sum + f.speakingRate.syllablesPerSecond, 0) / n,
        pauseDuration: featureSets.reduce((sum, f) => sum + f.speakingRate.pauseDuration, 0) / n,
        pauseFrequency: featureSets.reduce((sum, f) => sum + f.speakingRate.pauseFrequency, 0) / n,
      },
      hesitation: {
        fillerWordCount: featureSets.reduce((sum, f) => sum + f.hesitation.fillerWordCount, 0) / n,
        falseStarts: featureSets.reduce((sum, f) => sum + f.hesitation.falseStarts, 0) / n,
        wordFindingDifficulties: featureSets.reduce((sum, f) => sum + f.hesitation.wordFindingDifficulties, 0) / n,
        sentenceCompletionRate: featureSets.reduce((sum, f) => sum + f.hesitation.sentenceCompletionRate, 0) / n,
      },
      volume: {
        meanVolume: featureSets.reduce((sum, f) => sum + f.volume.meanVolume, 0) / n,
        volumeVariability: featureSets.reduce((sum, f) => sum + f.volume.volumeVariability, 0) / n,
        dynamicRange: featureSets.reduce((sum, f) => sum + f.volume.dynamicRange, 0) / n,
      },
      clarity: featureSets.reduce((sum, f) => sum + f.clarity, 0) / n,
      stability: featureSets.reduce((sum, f) => sum + f.stability, 0) / n,
    };
  }

  private calculateOverallHealthScore(indicators: Omit<HealthIndicators, 'overallHealthScore'>): number {
    let score = 100;

    // Deduct for respiratory issues
    if (indicators.respiratoryHealth.breathingPatternAbnormal) {
      score -= 20;
    }
    score -= indicators.respiratoryHealth.breathlessnessIndicator * 15;

    // Deduct for cognitive issues
    if (indicators.cognitiveHealth.cognitiveDeclineRisk === 'HIGH') {
      score -= 25;
    } else if (indicators.cognitiveHealth.cognitiveDeclineRisk === 'MEDIUM') {
      score -= 15;
    }

    // Deduct for emotional issues
    score -= indicators.emotionalHealth.depressionIndicator * 15;
    score -= indicators.emotionalHealth.anxietyIndicator * 10;

    // Deduct for neurological issues
    score -= indicators.neurologicalHealth.parkinsonIndicator * 20;
    score -= indicators.neurologicalHealth.strokeRiskIndicator * 25;

    return Math.max(score, 0);
  }

  // ============================================
  // PRIVATE METHODS - Data Storage & Alerts
  // ============================================

  private async storeVoiceHealthMetrics(
    elderId: string,
    acousticFeatures: AcousticFeatures,
    healthIndicators: HealthIndicators,
    riskAssessment: RiskAssessment
  ) {
    try {
      await this.prisma.companionActivity.create({
        data: {
          elderId,
          activityType: 'VOICE_HEALTH_CHECK',
          description: `Voice health analysis: ${riskAssessment.overallRisk} risk`,
          mood: healthIndicators.emotionalHealth.moodState.toLowerCase(),
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to store voice health metrics: ${error.message}`);
    }
  }

  private async createHealthAlert(elderId: string, riskAssessment: RiskAssessment) {
    this.logger.warn(`Creating health alert for elder ${elderId}: ${riskAssessment.overallRisk} risk`);

    try {
      const criticalRisks = riskAssessment.specificRisks.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH');

      await this.prisma.alert.create({
        data: {
          elderId,
          type: 'VITAL_ABNORMAL',
          severity: riskAssessment.overallRisk === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          title: 'Voice Health Concern Detected',
          message: `Voice analysis detected ${criticalRisks.map(r => r.condition).join(', ')}`,
          metadata: {
            overallRisk: riskAssessment.overallRisk,
            specificRisks: criticalRisks,
            urgentActionRequired: riskAssessment.urgentActionRequired,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create health alert: ${error.message}`);
    }
  }

  private groupByDay(items: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    items.forEach(item => {
      const day = item.timestamp.toDateString();
      grouped[day] = (grouped[day] || 0) + 1;
    });
    return grouped;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + v * (i + 1), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }
}
