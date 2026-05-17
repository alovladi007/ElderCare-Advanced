import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { EmergencyAlertService } from './emergency-alert.service';
import { HealthMonitoringService } from './health-monitoring.service';

@Injectable()
export class ContinuousMonitoringService implements OnModuleInit, OnModuleDestroy {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private globalCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private emergencyAlert: EmergencyAlertService,
    private healthMonitoring: HealthMonitoringService,
  ) {}

  /**
   * Start monitoring when module initializes
   */
  async onModuleInit() {
    this.logger.logEvent('Continuous monitoring service starting', 'ContinuousMonitoring', 'system', {});

    // Start global check every 60 seconds
    this.globalCheckInterval = setInterval(async () => {
      await this.runGlobalHealthCheck();
    }, 60000); // Check every minute

    // Initialize monitoring for all active elders
    // TODO: Update to use correct Prisma models (ElderProfile, User, etc.)
    // await this.initializeAllMonitoring();
  }

  /**
   * Stop monitoring when module destroys
   */
  async onModuleDestroy() {
    this.logger.logEvent('Continuous monitoring service stopping', 'ContinuousMonitoring', 'system', {});

    // Clear all intervals
    if (this.globalCheckInterval) {
      clearInterval(this.globalCheckInterval);
    }

    for (const [elderId, interval] of this.monitoringIntervals.entries()) {
      clearInterval(interval);
      this.logger.logEvent('Stopped monitoring', 'ContinuousMonitoring', elderId, {});
    }

    this.monitoringIntervals.clear();
  }

  /**
   * Initialize monitoring for all active elders
   */
  private async initializeAllMonitoring() {
    const activeElders = await this.prisma.elder.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        monitoringConfig: true,
      },
    });

    for (const elder of activeElders) {
      if (elder.monitoringConfig?.enabled !== false) {
        await this.startMonitoring(elder.id);
      }
    }

    this.logger.logEvent('Initialized monitoring for all active elders', 'ContinuousMonitoring', 'system', {
      count: activeElders.length,
    });
  }

  /**
   * Start monitoring for specific elder
   */
  async startMonitoring(elderId: string) {
    // Get monitoring config or use defaults
    const config = await this.prisma.monitoringConfig.findUnique({
      where: { elderId },
    });

    const checkInterval = config?.vitalCheckInterval || 300; // 5 minutes default

    // Clear existing interval if any
    if (this.monitoringIntervals.has(elderId)) {
      clearInterval(this.monitoringIntervals.get(elderId)!);
    }

    // Start new monitoring interval
    const interval = setInterval(async () => {
      await this.checkElderHealth(elderId);
    }, checkInterval * 1000);

    this.monitoringIntervals.set(elderId, interval);

    this.logger.logEvent('Started continuous monitoring', 'ContinuousMonitoring', elderId, {
      checkInterval,
    });

    // Run initial check immediately
    await this.checkElderHealth(elderId);
  }

  /**
   * Stop monitoring for specific elder
   */
  async stopMonitoring(elderId: string) {
    if (this.monitoringIntervals.has(elderId)) {
      clearInterval(this.monitoringIntervals.get(elderId)!);
      this.monitoringIntervals.delete(elderId);

      this.logger.logEvent('Stopped continuous monitoring', 'ContinuousMonitoring', elderId, {});
    }
  }

  /**
   * Check elder health status
   */
  private async checkElderHealth(elderId: string) {
    try {
      const config = await this.prisma.monitoringConfig.findUnique({
        where: { elderId },
      });

      // Skip if monitoring disabled
      if (config && !config.enabled) {
        return;
      }

      // Check if we're in quiet hours
      if (config && this.isQuietHours(config.quietHoursStart, config.quietHoursEnd)) {
        return; // Skip non-critical checks during quiet hours
      }

      // Get latest vitals
      const latestVitals = await this.healthMonitoring.getLatestVitals(elderId);

      // Get health summary
      const healthSummary = await this.healthMonitoring.getHealthSummary(elderId, 1);

      // Check for stale vital readings (no readings in last 24 hours)
      const hasRecentVitals = Object.keys(latestVitals).length > 0;
      if (!hasRecentVitals) {
        // Check last vital reading time
        const lastVital = await this.prisma.vitalReading.findFirst({
          where: { elderId },
          orderBy: { recordedAt: 'desc' },
        });

        if (lastVital) {
          const hoursSinceLastVital = (Date.now() - lastVital.recordedAt.getTime()) / (1000 * 60 * 60);

          // Alert if no vitals in 24 hours
          if (hoursSinceLastVital > 24) {
            await this.emergencyAlert.triggerEmergencyAlert({
              elderId,
              severity: 'MEDIUM',
              type: 'VITAL_ABNORMAL',
              title: 'No Recent Vital Readings',
              message: `No vital signs recorded in the last ${Math.round(hoursSinceLastVital)} hours. Please check on the patient.`,
              metadata: {
                lastVitalTime: lastVital.recordedAt,
                hoursSinceLastVital,
              },
            });
          }
        }
      }

      // Check for critical health status
      if (healthSummary.healthStatus === 'critical') {
        // Get active critical alerts
        const criticalAlerts = healthSummary.recentAlerts.filter(
          a => a.severity === 'CRITICAL' && a.status === 'ACTIVE'
        );

        // Check if we need to escalate (auto-escalate after escalationDelay)
        if (config?.autoEscalateCritical && criticalAlerts.length > 0) {
          const escalationDelay = config.escalationDelay || 300; // 5 min default

          for (const alert of criticalAlerts) {
            const minutesSinceAlert = (Date.now() - alert.triggeredAt.getTime()) / (1000 * 60);

            // Escalate if alert has been active for more than delay and not acknowledged
            if (minutesSinceAlert > escalationDelay / 60 && !alert.acknowledgedAt) {
              await this.escalateAlert(alert, elderId);
            }
          }
        }
      }

      // Check for vital trends (deteriorating health)
      await this.checkVitalTrends(elderId);

      // Check for inactivity (if smart home devices available)
      await this.checkInactivity(elderId, config?.inactivityTimeout || 3600);

    } catch (error) {
      this.logger.logError('Error checking elder health', error, { elderId });
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  private isQuietHours(start?: string, end?: string): boolean {
    if (!start || !end) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Handle quiet hours that cross midnight
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  /**
   * Escalate unacknowledged critical alert
   */
  private async escalateAlert(alert: any, elderId: string) {
    this.logger.logSecurity('Escalating unacknowledged critical alert', 'critical', {
      alertId: alert.id,
      elderId,
      minutesSinceTriggered: (Date.now() - alert.triggeredAt.getTime()) / (1000 * 60),
    });

    // Trigger emergency alert with escalation
    await this.emergencyAlert.triggerEmergencyAlert({
      elderId,
      severity: 'CRITICAL',
      type: alert.type,
      title: `ESCALATED: ${alert.title}`,
      message: `${alert.message}\n\nThis alert has been automatically escalated due to no acknowledgment within the configured time period.`,
      metadata: {
        originalAlertId: alert.id,
        escalated: true,
        escalatedAt: new Date(),
      },
    });
  }

  /**
   * Check vital sign trends for deterioration
   */
  private async checkVitalTrends(elderId: string) {
    // Get vital stats for different time periods
    const vitalTypes = ['HEART_RATE', 'BLOOD_PRESSURE', 'SPO2', 'TEMPERATURE'];

    for (const vitalType of vitalTypes) {
      try {
        const stats = await this.healthMonitoring.getVitalStats(elderId, vitalType as any, 7);

        if (stats && stats.statistics.trend === 'increasing') {
          // Check if increasing trend is concerning (for heart rate, BP, temp)
          if (['HEART_RATE', 'BLOOD_PRESSURE', 'TEMPERATURE'].includes(vitalType)) {
            const recentAvg = stats.latestReading?.value || 0;
            const normalMax = stats.normalRange.max;

            // Alert if trending upward and approaching upper limit
            if (recentAvg > normalMax * 0.9) {
              await this.emergencyAlert.triggerEmergencyAlert({
                elderId,
                severity: 'MEDIUM',
                type: 'VITAL_ABNORMAL',
                title: `Concerning Trend: ${vitalType.replace('_', ' ')}`,
                message: `${vitalType.replace('_', ' ')} showing increasing trend and approaching abnormal range. Current: ${recentAvg}, Normal max: ${normalMax}`,
                vitalData: stats,
                metadata: {
                  vitalType,
                  trend: 'increasing',
                  recentAvg,
                  normalMax,
                },
              });
            }
          }
        } else if (stats && stats.statistics.trend === 'decreasing') {
          // Check if decreasing trend is concerning (for SPO2)
          if (vitalType === 'SPO2') {
            const recentAvg = stats.latestReading?.value || 0;
            const normalMin = stats.normalRange.min;

            // Alert if trending downward and approaching lower limit
            if (recentAvg < normalMin * 1.05) {
              await this.emergencyAlert.triggerEmergencyAlert({
                elderId,
                severity: 'HIGH',
                type: 'VITAL_ABNORMAL',
                title: `Concerning Trend: Oxygen Saturation`,
                message: `Oxygen saturation showing decreasing trend and approaching low range. Current: ${recentAvg}%, Normal min: ${normalMin}%`,
                vitalData: stats,
                metadata: {
                  vitalType,
                  trend: 'decreasing',
                  recentAvg,
                  normalMin,
                },
              });
            }
          }
        }
      } catch (error) {
        // Skip if vital type has no data
        continue;
      }
    }
  }

  /**
   * Check for inactivity based on smart home sensors
   */
  private async checkInactivity(elderId: string, timeoutSeconds: number) {
    // Get elder's home
    const home = await this.prisma.home.findUnique({
      where: { elderId },
    });

    if (!home) return;

    // Get latest sensor events
    const latestEvent = await this.prisma.sensorEvent.findFirst({
      where: {
        homeId: home.id,
      },
      orderBy: {
        eventTime: 'desc',
      },
    });

    if (latestEvent) {
      const secondsSinceLastActivity = (Date.now() - latestEvent.eventTime.getTime()) / 1000;

      // Alert if no activity detected for longer than timeout
      if (secondsSinceLastActivity > timeoutSeconds) {
        // Check if we already have an active inactivity alert
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            elderId,
            type: 'SMART_HOME_INACTIVITY',
            status: 'ACTIVE',
          },
        });

        if (!existingAlert) {
          await this.emergencyAlert.triggerEmergencyAlert({
            elderId,
            severity: 'HIGH',
            type: 'ENVIRONMENTAL',
            title: 'Prolonged Inactivity Detected',
            message: `No activity detected in the home for ${Math.round(secondsSinceLastActivity / 60)} minutes. Please check on the patient.`,
            metadata: {
              lastActivityTime: latestEvent.eventTime,
              minutesSinceLastActivity: Math.round(secondsSinceLastActivity / 60),
              lastSensorType: latestEvent.sensorType,
              lastLocation: latestEvent.location,
            },
          });
        }
      }
    }
  }

  /**
   * Run global health check for all monitored elders
   */
  private async runGlobalHealthCheck() {
    try {
      // Get count of active monitors
      const activeCount = this.monitoringIntervals.size;

      // Get system health metrics
      const criticalAlertCount = await this.prisma.alert.count({
        where: {
          severity: 'CRITICAL',
          status: 'ACTIVE',
        },
      });

      const pendingDispatchCount = await this.prisma.emergencyDispatch.count({
        where: {
          status: 'PENDING',
        },
      });

      // Log system status
      this.logger.logEvent('Global health check', 'ContinuousMonitoring', 'system', {
        activeMonitors: activeCount,
        criticalAlerts: criticalAlertCount,
        pendingDispatches: pendingDispatchCount,
      });

      // Alert if there are critical issues that need attention
      if (criticalAlertCount > 10) {
        this.logger.logSecurity('High number of critical alerts', 'high', {
          count: criticalAlertCount,
        });
      }

    } catch (error) {
      this.logger.logError('Error in global health check', error, {});
    }
  }

  /**
   * Get monitoring status for an elder
   */
  async getMonitoringStatus(elderId: string) {
    const isMonitoring = this.monitoringIntervals.has(elderId);
    const config = await this.prisma.monitoringConfig.findUnique({
      where: { elderId },
    });

    const latestVitals = await this.healthMonitoring.getLatestVitals(elderId);
    const healthSummary = await this.healthMonitoring.getHealthSummary(elderId, 7);

    return {
      isMonitoring,
      enabled: config?.enabled ?? true,
      config,
      latestVitals,
      healthSummary,
      lastCheckTime: new Date(),
    };
  }

  /**
   * Update monitoring configuration
   */
  async updateMonitoringConfig(elderId: string, config: any) {
    const updated = await this.prisma.monitoringConfig.upsert({
      where: { elderId },
      create: {
        elderId,
        ...config,
      },
      update: config,
    });

    // Restart monitoring with new config
    if (config.enabled !== false) {
      await this.startMonitoring(elderId);
    } else {
      await this.stopMonitoring(elderId);
    }

    return updated;
  }
}
