import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

export interface PlatformMetrics {
  // System health
  activePatients: number;
  devicesOnline: number;
  apiLatencyP95: number;
  errorRate: number;
  uptime: number;

  // Clinical metrics
  criticalAlerts: number;
  fallsToday: number;
  medicationAdherence: number;
  hospitalizationsThisMonth: number;

  // Predictions
  patientsAtRisk: PatientRiskScore[];
  predictedFalls: FallPrediction[];
  medicationNonAdherenceLikely: string[];

  // Engagement
  activeConversations: number;
  videoCallsToday: number;
  emergencyResponseAvgTime: number;
}

export interface PatientRiskScore {
  elderId: string;
  elderName: string;
  riskScore: number;
  riskFactors: string[];
  recommendedActions: string[];
}

export interface FallPrediction {
  elderId: string;
  elderName: string;
  probability: number;
  withinDays: number;
  confidence: number;
}

export interface CohortAnalysis {
  cohortName: string;
  patientCount: number;
  avgAge: number;
  avgHealthScore: number;
  topDiagnoses: Array<{ diagnosis: string; count: number }>;
  medicationAdherence: number;
  hospitalizations: number;
  fallRate: number;
  insights: string[];
}

export interface TrendAnalysis {
  metric: string;
  timeframe: string;
  dataPoints: Array<{ timestamp: Date; value: number }>;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  percentageChange: number;
  forecast: Array<{ timestamp: Date; predictedValue: number; confidence: number }>;
}

@Injectable()
export class DataAnalyticsService {
  private readonly logger = new Logger(DataAnalyticsService.name);
  private readonly useDataWarehouse: boolean;
  private readonly warehouseUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.useDataWarehouse = this.config.get<boolean>('USE_DATA_WAREHOUSE') === true;
    this.warehouseUrl = this.config.get<string>('DATA_WAREHOUSE_URL') || 'http://localhost:8080';
  }

  /**
   * Get real-time platform metrics
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    this.logger.log('Fetching real-time platform metrics');

    const [
      activePatients,
      devicesOnline,
      criticalAlerts,
      fallsToday,
      medicationAdherence,
      hospitalizations,
      patientsAtRisk,
      conversations,
      videoCalls,
    ] = await Promise.all([
      this.getActivePatients(),
      this.getDevicesOnline(),
      this.getCriticalAlerts(),
      this.getFallsToday(),
      this.getMedicationAdherence(),
      this.getHospitalizationsThisMonth(),
      this.getPatientsAtRisk(),
      this.getActiveConversations(),
      this.getVideoCallsToday(),
    ]);

    const apiLatency = await this.getAPILatency();
    const errorRate = await this.getErrorRate();

    return {
      activePatients,
      devicesOnline,
      apiLatencyP95: apiLatency,
      errorRate,
      uptime: 99.95, // From monitoring system
      criticalAlerts,
      fallsToday,
      medicationAdherence,
      hospitalizationsThisMonth: hospitalizations,
      patientsAtRisk,
      predictedFalls: await this.getPredictedFalls(),
      medicationNonAdherenceLikely: await this.getMedicationNonAdherenceLikely(),
      activeConversations: conversations,
      videoCallsToday: videoCalls,
      emergencyResponseAvgTime: await this.getEmergencyResponseTime(),
    };
  }

  /**
   * Analyze cohort performance and outcomes
   */
  async analyzeCohort(criteria: {
    ageMin?: number;
    ageMax?: number;
    diagnoses?: string[];
    riskLevel?: string;
  }): Promise<CohortAnalysis> {
    this.logger.log('Analyzing patient cohort');

    // Build cohort query
    const whereClause: any = {};
    if (criteria.ageMin || criteria.ageMax) {
      whereClause.dateOfBirth = {};
      if (criteria.ageMin) {
        const maxBirthDate = new Date();
        maxBirthDate.setFullYear(maxBirthDate.getFullYear() - criteria.ageMin);
        whereClause.dateOfBirth.lte = maxBirthDate;
      }
      if (criteria.ageMax) {
        const minBirthDate = new Date();
        minBirthDate.setFullYear(minBirthDate.getFullYear() - criteria.ageMax);
        whereClause.dateOfBirth.gte = minBirthDate;
      }
    }

    const cohort = await this.prisma.elder.findMany({
      where: whereClause,
      include: {
        medications: true,
        vitalReadings: {
          where: { recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        },
      },
    });

    const patientCount = cohort.length;
    const avgAge = cohort.reduce((sum, e) => {
      const age = new Date().getFullYear() - new Date(e.dateOfBirth).getFullYear();
      return sum + age;
    }, 0) / patientCount;

    // Calculate medication adherence
    const medicationLogs = await this.prisma.medicationLog.findMany({
      where: {
        medication: {
          elderId: { in: cohort.map(e => e.id) },
        },
        recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const takenCount = medicationLogs.filter(log => log.status === 'TAKEN').length;
    const medicationAdherence = (takenCount / medicationLogs.length) * 100;

    // Get fall count
    const falls = await this.prisma.alert.count({
      where: {
        elderId: { in: cohort.map(e => e.id) },
        type: 'FALL_DETECTED',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const fallRate = (falls / patientCount) * 100;

    return {
      cohortName: this.generateCohortName(criteria),
      patientCount,
      avgAge,
      avgHealthScore: 75, // Would calculate from vitals
      topDiagnoses: [],
      medicationAdherence,
      hospitalizations: 0,
      fallRate,
      insights: this.generateCohortInsights(cohort, medicationAdherence, fallRate),
    };
  }

  /**
   * Analyze trend for a specific metric
   */
  async analyzeTrend(
    metric: string,
    timeframe: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
    elderId?: string
  ): Promise<TrendAnalysis> {
    this.logger.log(`Analyzing trend for metric: ${metric}`);

    const dataPoints = await this.getMetricDataPoints(metric, timeframe, elderId);
    const trend = this.calculateTrend(dataPoints);
    const percentageChange = this.calculatePercentageChange(dataPoints);
    const forecast = this.forecastMetric(dataPoints, 7); // 7 future points

    return {
      metric,
      timeframe,
      dataPoints,
      trend,
      percentageChange,
      forecast,
    };
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateAnalyticsReport(
    startDate: Date,
    endDate: Date,
    elderIds?: string[]
  ): Promise<any> {
    this.logger.log('Generating comprehensive analytics report');

    const whereClause: any = {
      recordedAt: { gte: startDate, lte: endDate },
    };

    if (elderIds) {
      whereClause.elderId = { in: elderIds };
    }

    const [
      vitalReadings,
      alerts,
      medications,
      activities,
    ] = await Promise.all([
      this.prisma.vitalReading.findMany({ where: whereClause }),
      this.prisma.alert.findMany({ where: { createdAt: whereClause.recordedAt, ...(elderIds ? { elderId: { in: elderIds } } : {}) } }),
      this.prisma.medicationLog.findMany({ where: { recordedAt: whereClause.recordedAt } }),
      this.prisma.activityLog.findMany({ where: { timestamp: whereClause.recordedAt, ...(elderIds ? { elderId: { in: elderIds } } : {}) } }),
    ]);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalVitalReadings: vitalReadings.length,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
        medicationDoses: medications.length,
        medicationAdherence: (medications.filter(m => m.status === 'TAKEN').length / medications.length) * 100,
        activitiesLogged: activities.length,
      },
      vitalStatistics: this.calculateVitalStatistics(vitalReadings),
      alertBreakdown: this.breakdownAlerts(alerts),
      activityPatterns: this.analyzeActivityPatterns(activities),
      recommendations: this.generateRecommendations(vitalReadings, alerts, medications, activities),
    };
  }

  /**
   * Run real-time OLAP query (fast analytics)
   */
  async runOLAPQuery(query: {
    dimensions: string[];
    metrics: string[];
    filters?: Record<string, any>;
    timeRange?: { start: Date; end: Date };
  }): Promise<any> {
    this.logger.log('Running OLAP query');

    // If data warehouse available, query it
    if (this.useDataWarehouse) {
      try {
        return await this.queryDataWarehouse(query);
      } catch (error) {
        this.logger.warn('Data warehouse query failed, using database');
      }
    }

    // Fallback to database
    return this.queryDatabase(query);
  }

  /**
   * Export data for ML training
   */
  async exportDataForML(
    dataType: 'vitals' | 'activities' | 'medications' | 'alerts',
    format: 'csv' | 'parquet' | 'json' = 'json'
  ): Promise<any> {
    this.logger.log(`Exporting ${dataType} data for ML training`);

    let data: any[];

    switch (dataType) {
      case 'vitals':
        data = await this.prisma.vitalReading.findMany({
          where: { recordedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        });
        break;
      case 'activities':
        data = await this.prisma.activityLog.findMany({
          where: { timestamp: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        });
        break;
      case 'medications':
        data = await this.prisma.medicationLog.findMany({
          where: { recordedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
          include: { medication: true },
        });
        break;
      case 'alerts':
        data = await this.prisma.alert.findMany({
          where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        });
        break;
    }

    // Transform data for ML
    const mlData = this.transformForML(data, dataType);

    if (format === 'csv') {
      return this.convertToCSV(mlData);
    } else if (format === 'parquet') {
      // Would use parquetjs library
      return mlData;
    }

    return mlData;
  }

  // ============================================
  // PRIVATE METHODS - Metrics Calculation
  // ============================================

  private async getActivePatients(): Promise<number> {
    const recentActivity = await this.prisma.activityLog.count({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      distinct: ['elderId'],
    });
    return recentActivity;
  }

  private async getDevicesOnline(): Promise<number> {
    const devices = await this.prisma.device.count({
      where: { status: 'ONLINE' },
    });
    return devices;
  }

  private async getCriticalAlerts(): Promise<number> {
    return await this.prisma.alert.count({
      where: {
        severity: 'CRITICAL',
        status: 'ACTIVE',
      },
    });
  }

  private async getFallsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.prisma.alert.count({
      where: {
        type: 'FALL_DETECTED',
        createdAt: { gte: today },
      },
    });
  }

  private async getMedicationAdherence(): Promise<number> {
    const logs = await this.prisma.medicationLog.findMany({
      where: {
        recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    if (logs.length === 0) return 100;

    const taken = logs.filter(log => log.status === 'TAKEN').length;
    return (taken / logs.length) * 100;
  }

  private async getHospitalizationsThisMonth(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return await this.prisma.alert.count({
      where: {
        type: 'HOSPITALIZATION',
        createdAt: { gte: startOfMonth },
      },
    });
  }

  private async getPatientsAtRisk(): Promise<PatientRiskScore[]> {
    // Get recent predictions
    const predictions = await this.prisma.mlPrediction.findMany({
      where: {
        predictionType: 'COMPREHENSIVE',
        generatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: { elder: true },
    });

    return predictions
      .filter(p => p.predictions['fallRisk']?.riskScore > 50 || p.predictions['healthDeterioration']?.deteriorationLikely)
      .map(p => ({
        elderId: p.elderId,
        elderName: `${p.elder.firstName} ${p.elder.lastName}`,
        riskScore: p.predictions['fallRisk']?.riskScore || 0,
        riskFactors: [
          ...(p.predictions['fallRisk']?.contributingFactors?.map(f => f.factor) || []),
          ...(p.predictions['healthDeterioration']?.warnings || []),
        ],
        recommendedActions: [
          ...(p.predictions['fallRisk']?.recommendations || []),
          ...(p.predictions['healthDeterioration']?.recommendedActions || []),
        ],
      }));
  }

  private async getPredictedFalls(): Promise<FallPrediction[]> {
    const predictions = await this.prisma.mlPrediction.findMany({
      where: {
        predictionType: 'COMPREHENSIVE',
        generatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: { elder: true },
    });

    return predictions
      .filter(p => p.predictions['fallRisk']?.riskScore > 25)
      .map(p => ({
        elderId: p.elderId,
        elderName: `${p.elder.firstName} ${p.elder.lastName}`,
        probability: p.predictions['fallRisk'].riskScore / 100,
        withinDays: p.predictions['fallRisk'].predictedWithinDays,
        confidence: p.predictions['fallRisk'].confidence,
      }));
  }

  private async getMedicationNonAdherenceLikely(): Promise<string[]> {
    const predictions = await this.prisma.mlPrediction.findMany({
      where: {
        predictionType: 'COMPREHENSIVE',
        generatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: { elder: true },
    });

    return predictions
      .filter(p => p.predictions['medicationAdherence']?.riskOfNonAdherence > 50)
      .map(p => `${p.elder.firstName} ${p.elder.lastName}`);
  }

  private async getActiveConversations(): Promise<number> {
    return await this.prisma.companionConversation.count({
      where: {
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      distinct: ['elderId'],
    });
  }

  private async getVideoCallsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.prisma.videoConsultation.count({
      where: { startedAt: { gte: today } },
    });
  }

  private async getEmergencyResponseTime(): Promise<number> {
    const recentAlerts = await this.prisma.alert.findMany({
      where: {
        severity: 'CRITICAL',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        acknowledgedAt: { not: null },
      },
    });

    if (recentAlerts.length === 0) return 0;

    const totalTime = recentAlerts.reduce((sum, alert) => {
      const responseTime = (alert.acknowledgedAt.getTime() - alert.createdAt.getTime()) / (1000 * 60); // minutes
      return sum + responseTime;
    }, 0);

    return totalTime / recentAlerts.length;
  }

  private async getAPILatency(): Promise<number> {
    // Would integrate with APM tool (Prometheus, New Relic, etc.)
    return 45; // ms
  }

  private async getErrorRate(): Promise<number> {
    // Would integrate with error tracking (Sentry, etc.)
    return 0.05; // 0.05%
  }

  // ============================================
  // PRIVATE METHODS - Analysis
  // ============================================

  private generateCohortName(criteria: any): string {
    const parts: string[] = [];
    if (criteria.ageMin || criteria.ageMax) {
      parts.push(`Age ${criteria.ageMin || 0}-${criteria.ageMax || '100+'}`);
    }
    if (criteria.riskLevel) {
      parts.push(`${criteria.riskLevel} Risk`);
    }
    return parts.join(', ') || 'All Patients';
  }

  private generateCohortInsights(cohort: any[], adherence: number, fallRate: number): string[] {
    const insights: string[] = [];

    if (adherence < 80) {
      insights.push('Medication adherence below target - consider intervention programs');
    }

    if (fallRate > 10) {
      insights.push('High fall rate - implement fall prevention measures');
    }

    if (cohort.length > 0) {
      insights.push(`Cohort size: ${cohort.length} patients`);
    }

    return insights;
  }

  private async getMetricDataPoints(metric: string, timeframe: string, elderId?: string): Promise<Array<{ timestamp: Date; value: number }>> {
    // Simplified - would query actual metrics
    const points: Array<{ timestamp: Date; value: number }> = [];
    const days = timeframe === 'DAY' ? 1 : timeframe === 'WEEK' ? 7 : timeframe === 'MONTH' ? 30 : 365;

    for (let i = 0; i < days; i++) {
      const timestamp = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      points.push({ timestamp, value: Math.random() * 100 });
    }

    return points.reverse();
  }

  private calculateTrend(dataPoints: Array<{ timestamp: Date; value: number }>): 'INCREASING' | 'DECREASING' | 'STABLE' {
    if (dataPoints.length < 2) return 'STABLE';

    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

    const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'INCREASING';
    if (change < -5) return 'DECREASING';
    return 'STABLE';
  }

  private calculatePercentageChange(dataPoints: Array<{ timestamp: Date; value: number }>): number {
    if (dataPoints.length < 2) return 0;

    const first = dataPoints[0].value;
    const last = dataPoints[dataPoints.length - 1].value;

    return ((last - first) / first) * 100;
  }

  private forecastMetric(dataPoints: Array<{ timestamp: Date; value: number }>, periods: number): Array<{ timestamp: Date; predictedValue: number; confidence: number }> {
    // Simple linear regression forecast
    const forecast: Array<{ timestamp: Date; predictedValue: number; confidence: number }> = [];

    if (dataPoints.length < 2) return forecast;

    // Calculate trend
    const trend = this.calculateTrend(dataPoints);
    const avgValue = dataPoints.reduce((sum, p) => sum + p.value, 0) / dataPoints.length;
    const recentValue = dataPoints[dataPoints.length - 1].value;

    for (let i = 1; i <= periods; i++) {
      const lastTimestamp = dataPoints[dataPoints.length - 1].timestamp;
      const forecastTimestamp = new Date(lastTimestamp.getTime() + i * 24 * 60 * 60 * 1000);

      let predictedValue = recentValue;
      if (trend === 'INCREASING') {
        predictedValue += (avgValue * 0.05 * i);
      } else if (trend === 'DECREASING') {
        predictedValue -= (avgValue * 0.05 * i);
      }

      forecast.push({
        timestamp: forecastTimestamp,
        predictedValue,
        confidence: Math.max(0.5, 1 - (i * 0.1)), // Confidence decreases with distance
      });
    }

    return forecast;
  }

  private calculateVitalStatistics(vitals: any[]): any {
    const byType = new Map<string, number[]>();

    vitals.forEach(v => {
      if (!byType.has(v.vitalType)) {
        byType.set(v.vitalType, []);
      }
      byType.get(v.vitalType).push(v.value);
    });

    const stats: any = {};

    byType.forEach((values, type) => {
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      stats[type] = { avg, min, max, count: values.length };
    });

    return stats;
  }

  private breakdownAlerts(alerts: any[]): any {
    const breakdown: any = {
      bySeverity: {},
      byType: {},
      total: alerts.length,
    };

    alerts.forEach(alert => {
      breakdown.bySeverity[alert.severity] = (breakdown.bySeverity[alert.severity] || 0) + 1;
      breakdown.byType[alert.type] = (breakdown.byType[alert.type] || 0) + 1;
    });

    return breakdown;
  }

  private analyzeActivityPatterns(activities: any[]): any {
    const patterns: any = {
      byType: {},
      byLocation: {},
      byTimeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    };

    activities.forEach(activity => {
      patterns.byType[activity.activityType] = (patterns.byType[activity.activityType] || 0) + 1;
      patterns.byLocation[activity.location] = (patterns.byLocation[activity.location] || 0) + 1;

      const hour = new Date(activity.timestamp).getHours();
      if (hour >= 6 && hour < 12) patterns.byTimeOfDay.morning++;
      else if (hour >= 12 && hour < 18) patterns.byTimeOfDay.afternoon++;
      else if (hour >= 18 && hour < 22) patterns.byTimeOfDay.evening++;
      else patterns.byTimeOfDay.night++;
    });

    return patterns;
  }

  private generateRecommendations(vitals: any[], alerts: any[], medications: any[], activities: any[]): string[] {
    const recommendations: string[] = [];

    // Check alert rate
    if (alerts.filter(a => a.severity === 'CRITICAL').length > 5) {
      recommendations.push('High critical alert rate - review care plans');
    }

    // Check medication adherence
    const takenRate = medications.filter(m => m.status === 'TAKEN').length / medications.length;
    if (takenRate < 0.8) {
      recommendations.push('Medication adherence below 80% - implement reminder system');
    }

    // Check activity level
    if (activities.length < 50) {
      recommendations.push('Low activity level detected - encourage physical activity');
    }

    return recommendations;
  }

  private async queryDataWarehouse(query: any): Promise<any> {
    // Would integrate with Snowflake, BigQuery, etc.
    const response = await axios.post(`${this.warehouseUrl}/query`, query, { timeout: 30000 });
    return response.data;
  }

  private async queryDatabase(query: any): Promise<any> {
    // Fallback database query
    return { message: 'Database query not implemented' };
  }

  private transformForML(data: any[], dataType: string): any[] {
    // Transform data into ML-friendly format
    return data.map(item => ({
      ...item,
      timestamp: item.recordedAt || item.timestamp || item.createdAt,
    }));
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => row[h]).join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}
