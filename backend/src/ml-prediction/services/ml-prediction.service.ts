import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

export interface FallRiskScore {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contributingFactors: FactorContribution[];
  recommendations: string[];
  predictedWithinDays: number;
  confidence: number;
}

export interface FactorContribution {
  factor: string;
  impact: number; // -1 to 1
  description: string;
}

export interface HealthDeteriorationPrediction {
  deteriorationLikely: boolean;
  timeframeDays: number;
  confidence: number;
  warnings: string[];
  recommendedActions: string[];
  vitalsOfConcern: string[];
}

export interface MedicationAdherencePrediction {
  adherenceScore: number; // 0-100
  riskOfNonAdherence: number; // 0-100
  predictedMissedDoses: number;
  barriers: string[];
  interventions: string[];
}

@Injectable()
export class MLPredictionService {
  private readonly logger = new Logger(MLPredictionService.name);
  private readonly mlServiceUrl: string;
  private readonly useMLService: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.mlServiceUrl = this.config.get<string>('ML_SERVICE_URL') || 'http://localhost:8501';
    this.useMLService = this.config.get<boolean>('USE_ML_SERVICE') === true;
  }

  /**
   * Predict fall risk for an elder based on 90 days of historical data
   * Uses TensorFlow Serving for ML inference or statistical fallback
   */
  async predictFallRisk(elderId: string): Promise<FallRiskScore> {
    this.logger.log(`Predicting fall risk for elder: ${elderId}`);

    try {
      // Get 90 days of historical data
      const data = await this.getHistoricalData(elderId, 90);

      // Feature engineering
      const features = this.engineerFallRiskFeatures(data);

      // Try ML service first
      if (this.useMLService) {
        try {
          const mlPrediction = await this.callMLService('fall_risk', features);
          return this.formatFallRiskPrediction(mlPrediction);
        } catch (error) {
          this.logger.warn(`ML service unavailable, using statistical fallback: ${error.message}`);
        }
      }

      // Fallback to rule-based statistical model
      return this.statisticalFallRiskPrediction(features, data);
    } catch (error) {
      this.logger.error(`Error predicting fall risk: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Predict health deterioration 72 hours in advance
   */
  async predictHealthDeterioration(elderId: string): Promise<HealthDeteriorationPrediction> {
    this.logger.log(`Predicting health deterioration for elder: ${elderId}`);

    const data = await this.getHistoricalData(elderId, 30);
    const features = this.engineerHealthDeteriorationFeatures(data);

    if (this.useMLService) {
      try {
        const mlPrediction = await this.callMLService('health_deterioration', features);
        return this.formatHealthDeteriorationPrediction(mlPrediction);
      } catch (error) {
        this.logger.warn(`ML service unavailable, using statistical fallback`);
      }
    }

    return this.statisticalHealthDeteriorationPrediction(features, data);
  }

  /**
   * Predict medication adherence issues before they occur
   */
  async predictMedicationAdherence(elderId: string): Promise<MedicationAdherencePrediction> {
    this.logger.log(`Predicting medication adherence for elder: ${elderId}`);

    const adherenceHistory = await this.prisma.medicationLog.findMany({
      where: {
        medication: { elderId },
        recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      include: { medication: true },
      orderBy: { recordedAt: 'asc' }
    });

    const features = this.engineerAdherenceFeatures(adherenceHistory);

    if (this.useMLService) {
      try {
        const mlPrediction = await this.callMLService('medication_adherence', features);
        return this.formatAdherencePrediction(mlPrediction);
      } catch (error) {
        this.logger.warn(`ML service unavailable, using statistical fallback`);
      }
    }

    return this.statisticalAdherencePrediction(features, adherenceHistory);
  }

  /**
   * Run comprehensive predictive analytics for an elder
   */
  async runComprehensiveAnalytics(elderId: string) {
    this.logger.log(`Running comprehensive predictive analytics for elder: ${elderId}`);

    const [fallRisk, healthDeterioration, medicationAdherence] = await Promise.all([
      this.predictFallRisk(elderId),
      this.predictHealthDeterioration(elderId),
      this.predictMedicationAdherence(elderId),
    ]);

    // Store predictions in database
    await this.prisma.mlPrediction.create({
      data: {
        elderId,
        predictionType: 'COMPREHENSIVE',
        predictions: {
          fallRisk,
          healthDeterioration,
          medicationAdherence,
        },
        generatedAt: new Date(),
      },
    });

    // Trigger alerts if high risk detected
    if (fallRisk.riskLevel === 'HIGH' || fallRisk.riskLevel === 'CRITICAL') {
      await this.triggerFallRiskAlert(elderId, fallRisk);
    }

    if (healthDeterioration.deteriorationLikely && healthDeterioration.confidence > 0.7) {
      await this.triggerHealthDeteriorationAlert(elderId, healthDeterioration);
    }

    return {
      fallRisk,
      healthDeterioration,
      medicationAdherence,
      generatedAt: new Date(),
    };
  }

  // ============================================
  // PRIVATE METHODS - Data Collection
  // ============================================

  private async getHistoricalData(elderId: string, days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [vitals, activities, medications, alerts] = await Promise.all([
      this.prisma.vitalReading.findMany({
        where: { elderId, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'asc' },
      }),
      this.prisma.activityLog.findMany({
        where: { elderId, timestamp: { gte: since } },
        orderBy: { timestamp: 'asc' },
      }),
      this.prisma.medicationLog.findMany({
        where: {
          medication: { elderId },
          recordedAt: { gte: since },
        },
        include: { medication: true },
        orderBy: { recordedAt: 'asc' },
      }),
      this.prisma.alert.findMany({
        where: { elderId, createdAt: { gte: since } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return { vitals, activities, medications, alerts };
  }

  // ============================================
  // PRIVATE METHODS - Feature Engineering
  // ============================================

  private engineerFallRiskFeatures(data: any): Record<string, number> {
    const { vitals, activities, alerts } = data;

    // Calculate mobility metrics
    const walkingActivities = activities.filter(a => a.activityType === 'WALKING');
    const avgWalkingDuration = walkingActivities.length > 0
      ? walkingActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / walkingActivities.length
      : 0;

    // Calculate balance score from accelerometer data (if available)
    const balanceScore = this.calculateBalanceScore(activities);

    // Blood pressure variability
    const bpReadings = vitals.filter(v => v.vitalType === 'BLOOD_PRESSURE');
    const bpVariability = this.calculateVariability(bpReadings.map(v => v.value));

    // Recent fall history
    const recentFalls = alerts.filter(a => a.type === 'FALL_DETECTED').length;

    // Medication affecting balance
    const medicationsAffectingBalance = data.medications.filter(m =>
      ['sedative', 'antihypertensive', 'antidepressant'].includes(m.medication.category?.toLowerCase())
    ).length;

    return {
      age: 75, // Would come from elder profile
      avgWalkingDuration,
      balanceScore,
      bpVariability,
      recentFalls,
      medicationsAffectingBalance,
      activityLevel: activities.length / 90, // activities per day
      vitalReadingsPerDay: vitals.length / 90,
    };
  }

  private engineerHealthDeteriorationFeatures(data: any): Record<string, number> {
    const { vitals, activities } = data;

    // Vital sign trends
    const heartRateReadings = vitals.filter(v => v.vitalType === 'HEART_RATE');
    const heartRateTrend = this.calculateTrend(heartRateReadings.map(v => v.value));

    const bloodPressureReadings = vitals.filter(v => v.vitalType === 'BLOOD_PRESSURE');
    const bpTrend = this.calculateTrend(bloodPressureReadings.map(v => v.value));

    const oxygenReadings = vitals.filter(v => v.vitalType === 'OXYGEN_SATURATION');
    const oxygenTrend = this.calculateTrend(oxygenReadings.map(v => v.value));

    // Activity level change
    const recentActivities = activities.filter(a =>
      a.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const olderActivities = activities.filter(a =>
      a.timestamp <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const activityChange = (recentActivities - olderActivities / 3) / (olderActivities / 3 || 1);

    return {
      heartRateTrend,
      bpTrend,
      oxygenTrend,
      activityChange,
      vitalsOutOfRange: this.countOutOfRangeVitals(vitals),
      consecutiveDaysLowActivity: this.calculateConsecutiveLowActivityDays(activities),
    };
  }

  private engineerAdherenceFeatures(adherenceHistory: any[]): Record<string, number> {
    const totalDoses = adherenceHistory.length;
    const takenDoses = adherenceHistory.filter(log => log.status === 'TAKEN').length;
    const missedDoses = adherenceHistory.filter(log => log.status === 'MISSED').length;

    // Calculate adherence pattern
    const recentAdherence = adherenceHistory.slice(-14); // Last 14 days
    const recentMissed = recentAdherence.filter(log => log.status === 'MISSED').length;

    // Time of day analysis
    const morningMissed = adherenceHistory.filter(log =>
      log.status === 'MISSED' && new Date(log.scheduledAt).getHours() < 12
    ).length;

    return {
      overallAdherence: (takenDoses / totalDoses) * 100,
      recentAdherence: ((recentAdherence.length - recentMissed) / recentAdherence.length) * 100,
      missedDosesLast7Days: recentMissed,
      morningMissedPercent: (morningMissed / missedDoses) * 100,
      consecutiveMissedDays: this.calculateConsecutiveMissedDays(adherenceHistory),
    };
  }

  // ============================================
  // PRIVATE METHODS - ML Service Integration
  // ============================================

  private async callMLService(modelName: string, features: Record<string, number>) {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/v1/models/${modelName}:predict`,
        {
          instances: [Object.values(features)],
          signature_name: 'serving_default',
        },
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      return response.data.predictions[0];
    } catch (error) {
      this.logger.error(`ML service call failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // PRIVATE METHODS - Statistical Fallbacks
  // ============================================

  private statisticalFallRiskPrediction(features: Record<string, number>, data: any): FallRiskScore {
    // Rule-based scoring system
    let score = 0;
    const factors: FactorContribution[] = [];

    // Recent falls (highest weight)
    if (features.recentFalls > 0) {
      score += features.recentFalls * 15;
      factors.push({
        factor: 'Recent Falls',
        impact: 0.8,
        description: `${features.recentFalls} fall(s) in last 90 days significantly increases risk`,
      });
    }

    // Balance score
    if (features.balanceScore < 50) {
      score += (50 - features.balanceScore) * 0.5;
      factors.push({
        factor: 'Balance',
        impact: 0.6,
        description: 'Poor balance detected from activity patterns',
      });
    }

    // Medication risk
    if (features.medicationsAffectingBalance > 2) {
      score += features.medicationsAffectingBalance * 5;
      factors.push({
        factor: 'Medications',
        impact: 0.4,
        description: 'Multiple medications that may affect balance',
      });
    }

    // Blood pressure variability
    if (features.bpVariability > 20) {
      score += 10;
      factors.push({
        factor: 'BP Variability',
        impact: 0.3,
        description: 'High blood pressure variability increases dizziness risk',
      });
    }

    // Activity level
    if (features.activityLevel < 5) {
      score += 10;
      factors.push({
        factor: 'Low Activity',
        impact: 0.3,
        description: 'Reduced physical activity weakens muscles',
      });
    }

    // Cap at 100
    score = Math.min(score, 100);

    const riskLevel = this.categorizeRisk(score);

    return {
      riskScore: score,
      riskLevel,
      contributingFactors: factors,
      recommendations: this.generateFallRiskRecommendations(factors, riskLevel),
      predictedWithinDays: this.estimateFallTimeframe(score),
      confidence: 0.75, // Statistical model confidence
    };
  }

  private statisticalHealthDeteriorationPrediction(
    features: Record<string, number>,
    data: any
  ): HealthDeteriorationPrediction {
    const warnings: string[] = [];
    let deteriorationLikely = false;

    // Check vital trends
    if (features.heartRateTrend > 5) {
      warnings.push('Heart rate increasing trend detected');
      deteriorationLikely = true;
    }

    if (features.bpTrend > 10) {
      warnings.push('Blood pressure showing concerning upward trend');
      deteriorationLikely = true;
    }

    if (features.oxygenTrend < -2) {
      warnings.push('Oxygen saturation declining');
      deteriorationLikely = true;
    }

    if (features.activityChange < -0.3) {
      warnings.push('Significant decrease in activity level');
      deteriorationLikely = true;
    }

    if (features.consecutiveDaysLowActivity > 3) {
      warnings.push(`${features.consecutiveDaysLowActivity} consecutive days of low activity`);
      deteriorationLikely = true;
    }

    const confidence = warnings.length / 5; // More warnings = higher confidence

    return {
      deteriorationLikely,
      timeframeDays: deteriorationLikely ? 3 : 7,
      confidence,
      warnings,
      recommendedActions: this.generateHealthDeteriorationActions(warnings),
      vitalsOfConcern: this.identifyVitalsOfConcern(features),
    };
  }

  private statisticalAdherencePrediction(
    features: Record<string, number>,
    history: any[]
  ): MedicationAdherencePrediction {
    const adherenceScore = features.overallAdherence;
    const riskOfNonAdherence = 100 - features.recentAdherence;

    // Predict missed doses in next 7 days
    const predictedMissedDoses = Math.round((features.missedDosesLast7Days / 7) * 7);

    const barriers: string[] = [];
    if (features.morningMissedPercent > 50) {
      barriers.push('Difficulty with morning medications');
    }
    if (features.consecutiveMissedDays > 2) {
      barriers.push('Pattern of consecutive missed days detected');
    }
    if (adherenceScore < 80) {
      barriers.push('Overall low adherence indicates potential comprehension or access issues');
    }

    return {
      adherenceScore,
      riskOfNonAdherence,
      predictedMissedDoses,
      barriers,
      interventions: this.generateAdherenceInterventions(barriers, adherenceScore),
    };
  }

  // ============================================
  // PRIVATE METHODS - Helper Functions
  // ============================================

  private calculateVariability(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + v * (i + 1), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateBalanceScore(activities: any[]): number {
    // Simplified balance calculation based on activity patterns
    const steadyActivities = activities.filter(a =>
      ['WALKING', 'STANDING', 'EXERCISE'].includes(a.activityType)
    ).length;
    return Math.min((steadyActivities / activities.length) * 100, 100);
  }

  private countOutOfRangeVitals(vitals: any[]): number {
    return vitals.filter(v => {
      if (v.vitalType === 'BLOOD_PRESSURE') return v.value > 140 || v.value < 90;
      if (v.vitalType === 'HEART_RATE') return v.value > 100 || v.value < 60;
      if (v.vitalType === 'OXYGEN_SATURATION') return v.value < 95;
      return false;
    }).length;
  }

  private calculateConsecutiveLowActivityDays(activities: any[]): number {
    // Group activities by day
    const dayGroups = new Map<string, number>();
    activities.forEach(a => {
      const day = new Date(a.timestamp).toDateString();
      dayGroups.set(day, (dayGroups.get(day) || 0) + 1);
    });

    let consecutive = 0;
    let maxConsecutive = 0;
    const sortedDays = Array.from(dayGroups.entries()).sort((a, b) =>
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );

    sortedDays.forEach(([day, count]) => {
      if (count < 5) {
        consecutive++;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      } else {
        consecutive = 0;
      }
    });

    return maxConsecutive;
  }

  private calculateConsecutiveMissedDays(history: any[]): number {
    const missedDates = history
      .filter(log => log.status === 'MISSED')
      .map(log => new Date(log.scheduledAt).toDateString());

    let consecutive = 0;
    let maxConsecutive = 0;

    for (let i = 1; i < missedDates.length; i++) {
      const prev = new Date(missedDates[i - 1]);
      const curr = new Date(missedDates[i]);
      const daysDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        consecutive++;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      } else {
        consecutive = 0;
      }
    }

    return maxConsecutive;
  }

  private categorizeRisk(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  private estimateFallTimeframe(score: number): number {
    if (score >= 75) return 7; // Within 7 days
    if (score >= 50) return 14; // Within 14 days
    if (score >= 25) return 30; // Within 30 days
    return 90; // Within 90 days
  }

  private generateFallRiskRecommendations(factors: FactorContribution[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      recommendations.push('Schedule immediate assessment with healthcare provider');
      recommendations.push('Implement 24/7 fall monitoring system');
      recommendations.push('Consider physical therapy for balance and strength');
    }

    if (factors.some(f => f.factor === 'Medications')) {
      recommendations.push('Review medications with doctor - some may increase fall risk');
    }

    if (factors.some(f => f.factor === 'Balance')) {
      recommendations.push('Start balance exercises (tai chi, yoga)');
      recommendations.push('Install grab bars and remove trip hazards at home');
    }

    if (factors.some(f => f.factor === 'Low Activity')) {
      recommendations.push('Gradually increase daily physical activity');
      recommendations.push('Join a senior exercise program');
    }

    recommendations.push('Wear appropriate footwear with non-slip soles');
    recommendations.push('Ensure adequate lighting in all rooms');

    return recommendations;
  }

  private generateHealthDeteriorationActions(warnings: string[]): string[] {
    const actions: string[] = [];

    if (warnings.some(w => w.includes('Heart rate'))) {
      actions.push('Monitor heart rate more frequently (every 4 hours)');
      actions.push('Contact cardiologist if rate exceeds 100 bpm at rest');
    }

    if (warnings.some(w => w.includes('Blood pressure'))) {
      actions.push('Check blood pressure twice daily');
      actions.push('Review sodium intake and current BP medications');
    }

    if (warnings.some(w => w.includes('Oxygen'))) {
      actions.push('Contact healthcare provider immediately for oxygen assessment');
      actions.push('Monitor for breathing difficulties');
    }

    if (warnings.some(w => w.includes('activity'))) {
      actions.push('Assess for pain, fatigue, or other mobility barriers');
      actions.push('Schedule wellness check within 24-48 hours');
    }

    actions.push('Increase monitoring frequency for next 72 hours');
    actions.push('Document any new symptoms');

    return actions;
  }

  private identifyVitalsOfConcern(features: Record<string, number>): string[] {
    const vitals: string[] = [];

    if (Math.abs(features.heartRateTrend) > 3) vitals.push('Heart Rate');
    if (Math.abs(features.bpTrend) > 5) vitals.push('Blood Pressure');
    if (features.oxygenTrend < -1) vitals.push('Oxygen Saturation');

    return vitals;
  }

  private generateAdherenceInterventions(barriers: string[], adherenceScore: number): string[] {
    const interventions: string[] = [];

    if (barriers.some(b => b.includes('morning'))) {
      interventions.push('Set up morning medication alarms');
      interventions.push('Consider automated medication dispenser');
    }

    if (barriers.some(b => b.includes('consecutive'))) {
      interventions.push('Daily check-in calls for medication reminders');
      interventions.push('Simplify medication schedule if possible');
    }

    if (adherenceScore < 80) {
      interventions.push('Medication education session with pharmacist');
      interventions.push('Evaluate for cognitive or physical barriers');
      interventions.push('Consider blister pack or pill organizer');
    }

    interventions.push('Involve family member in medication management');

    return interventions;
  }

  private formatFallRiskPrediction(mlPrediction: any): FallRiskScore {
    return {
      riskScore: mlPrediction.risk * 100,
      riskLevel: this.categorizeRisk(mlPrediction.risk * 100),
      contributingFactors: mlPrediction.factors || [],
      recommendations: mlPrediction.recommendations || [],
      predictedWithinDays: mlPrediction.timeframe || 7,
      confidence: mlPrediction.confidence || 0.85,
    };
  }

  private formatHealthDeteriorationPrediction(mlPrediction: any): HealthDeteriorationPrediction {
    return {
      deteriorationLikely: mlPrediction.deterioration_likely,
      timeframeDays: mlPrediction.timeframe_days || 3,
      confidence: mlPrediction.confidence || 0.8,
      warnings: mlPrediction.warnings || [],
      recommendedActions: mlPrediction.actions || [],
      vitalsOfConcern: mlPrediction.vitals || [],
    };
  }

  private formatAdherencePrediction(mlPrediction: any): MedicationAdherencePrediction {
    return {
      adherenceScore: mlPrediction.adherence_score * 100,
      riskOfNonAdherence: (1 - mlPrediction.adherence_score) * 100,
      predictedMissedDoses: mlPrediction.predicted_missed || 0,
      barriers: mlPrediction.barriers || [],
      interventions: mlPrediction.interventions || [],
    };
  }

  // ============================================
  // PRIVATE METHODS - Alert Triggering
  // ============================================

  private async triggerFallRiskAlert(elderId: string, fallRisk: FallRiskScore) {
    this.logger.warn(`High fall risk detected for elder ${elderId}: ${fallRisk.riskScore}`);

    try {
      await this.prisma.alert.create({
        data: {
          elderId,
          type: 'FALL_RISK_HIGH',
          severity: fallRisk.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          message: `Fall risk predicted: ${fallRisk.riskScore}/100 within ${fallRisk.predictedWithinDays} days`,
          metadata: fallRisk,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create fall risk alert: ${error.message}`);
    }
  }

  private async triggerHealthDeteriorationAlert(
    elderId: string,
    prediction: HealthDeteriorationPrediction
  ) {
    this.logger.warn(`Health deterioration predicted for elder ${elderId}`);

    try {
      await this.prisma.alert.create({
        data: {
          elderId,
          type: 'HEALTH_DETERIORATION_PREDICTED',
          severity: 'HIGH',
          message: `Health deterioration likely within ${prediction.timeframeDays} days (confidence: ${prediction.confidence * 100}%)`,
          metadata: prediction,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create health deterioration alert: ${error.message}`);
    }
  }
}
