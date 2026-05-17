import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logging/logger.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Roles } from '../../auth/roles.decorator';

/**
 * Mobile API Controller
 * Mobile-optimized endpoints for React Native apps (Family & Caregiver)
 */
@Controller('mobile-api')
export class MobileApiController {
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    private prisma: PrismaService,
  ) {}

  /**
   * ========================================
   * FAMILY MEMBER APP ENDPOINTS
   * ========================================
   */

  /**
   * Get family dashboard (optimized for mobile)
   */
  @Get('family/dashboard')
  @Roles('family')
  async getFamilyDashboard(@Request() req: any) {
    try {
      const userId = req.user.id;

      // Fetch elder profiles for family member
      const elderProfiles = await this.prisma.elderProfile.findMany({
        where: {
          familyMembers: {
            some: { userId },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          location: true,
          devices: {
            where: { status: 'active' },
            take: 5,
          },
        },
      });

      // Fetch critical alerts (last 24 hours)
      const alerts = await this.prisma.alert.findMany({
        where: {
          userId: {
            in: elderProfiles.map(ep => ep.userId),
          },
          severity: { in: ['high', 'critical'] },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Fetch latest vital signs for each elder
      const vitalsPromises = elderProfiles.map(ep =>
        this.prisma.vitalSigns.findFirst({
          where: { userId: ep.userId },
          orderBy: { timestamp: 'desc' },
        }),
      );
      const vitals = await Promise.all(vitalsPromises);

      // Build compact dashboard response
      const dashboard = {
        elders: elderProfiles.map((ep, index) => ({
          id: ep.id,
          name: ep.user.name,
          age: ep.age,
          status: this.calculateElderStatus(alerts.filter(a => a.userId === ep.userId)),
          location: ep.location
            ? {
                address: ep.location.address,
                coordinates: {
                  lat: ep.location.latitude,
                  lng: ep.location.longitude,
                },
              }
            : null,
          latestVitals: vitals[index]
            ? {
                heartRate: vitals[index]?.heartRate,
                bloodPressure: vitals[index]?.bloodPressure,
                temperature: vitals[index]?.temperature,
                oxygenSaturation: vitals[index]?.oxygenSaturation,
                timestamp: vitals[index]?.timestamp,
              }
            : null,
          activeDevices: ep.devices.length,
        })),
        alerts: alerts.map(alert => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          elderName: elderProfiles.find(ep => ep.userId === alert.userId)?.user.name,
          timestamp: alert.createdAt,
          acknowledged: alert.acknowledged,
        })),
        summary: {
          totalElders: elderProfiles.length,
          criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
          highAlerts: alerts.filter(a => a.severity === 'high').length,
        },
      };

      this.logger.debug('Family dashboard loaded', 'MobileApiController', {
        userId,
        eldersCount: elderProfiles.length,
      });

      return {
        success: true,
        data: dashboard,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to load family dashboard', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Failed to load dashboard');
    }
  }

  /**
   * Get real-time vitals for specific elder
   */
  @Get('family/elder/:elderId/vitals')
  @Roles('family')
  async getElderVitals(
    @Param('elderId') elderId: string,
    @Query('hours') hours?: string,
  ) {
    try {
      const hoursBack = parseInt(hours || '24');
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      const elderProfile = await this.prisma.elderProfile.findUnique({
        where: { id: elderId },
        include: { user: true },
      });

      if (!elderProfile) {
        throw new BadRequestException('Elder profile not found');
      }

      const vitals = await this.prisma.vitalSigns.findMany({
        where: {
          userId: elderProfile.userId,
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'desc' },
      });

      // Format for mobile charts
      const formatted = {
        elder: {
          id: elderId,
          name: elderProfile.user.name,
        },
        vitals: vitals.map(v => ({
          heartRate: v.heartRate,
          bloodPressure: v.bloodPressure,
          temperature: v.temperature,
          oxygenSaturation: v.oxygenSaturation,
          timestamp: v.timestamp,
        })),
        trends: this.calculateVitalTrends(vitals),
      };

      return {
        success: true,
        data: formatted,
      };
    } catch (error) {
      this.logger.error('Failed to get elder vitals', '', 'MobileApiController', {
        error: (error as Error).message,
        elderId,
      });
      throw error;
    }
  }

  /**
   * Get alerts for family member
   */
  @Get('family/alerts')
  @Roles('family')
  async getFamilyAlerts(
    @Request() req: any,
    @Query('acknowledged') acknowledged?: string,
    @Query('severity') severity?: string,
  ) {
    try {
      const userId = req.user.id;

      // Get elder IDs for family member
      const elderProfiles = await this.prisma.elderProfile.findMany({
        where: {
          familyMembers: {
            some: { userId },
          },
        },
        select: { userId: true },
      });

      const elderIds = elderProfiles.map(ep => ep.userId);

      const where: any = {
        userId: { in: elderIds },
      };

      if (acknowledged !== undefined) {
        where.acknowledged = acknowledged === 'true';
      }

      if (severity) {
        where.severity = severity;
      }

      const alerts = await this.prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      return {
        success: true,
        data: alerts.map(alert => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          elderName: alert.user.name,
          elderId: alert.userId,
          timestamp: alert.createdAt,
          acknowledged: alert.acknowledged,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get family alerts', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Acknowledge alert
   */
  @Put('family/alerts/:alertId/acknowledge')
  @Roles('family')
  async acknowledgeAlert(@Param('alertId') alertId: string, @Request() req: any) {
    try {
      const alert = await this.prisma.alert.update({
        where: { id: alertId },
        data: {
          acknowledged: true,
          acknowledgedBy: req.user.id,
          acknowledgedAt: new Date(),
        },
      });

      this.logger.logEvent('Alert acknowledged', 'Alert', alertId, {
        userId: req.user.id,
      });

      return {
        success: true,
        data: alert,
      };
    } catch (error) {
      this.logger.error('Failed to acknowledge alert', '', 'MobileApiController', {
        error: (error as Error).message,
        alertId,
      });
      throw error;
    }
  }

  /**
   * Initiate video call with elder
   */
  @Post('family/video-call')
  @Roles('family')
  async initiateVideoCall(
    @Body() body: { elderId: string; emergencyCall?: boolean },
    @Request() req: any,
  ) {
    try {
      const elderProfile = await this.prisma.elderProfile.findUnique({
        where: { id: body.elderId },
      });

      if (!elderProfile) {
        throw new BadRequestException('Elder profile not found');
      }

      // Create video call session
      const session = await this.prisma.videoCallSession.create({
        data: {
          callerId: req.user.id,
          calleeId: elderProfile.userId,
          type: body.emergencyCall ? 'emergency' : 'family',
          status: 'initiated',
        },
      });

      // Generate WebRTC signaling token
      const token = this.generateCallToken(session.id, req.user.id, elderProfile.userId);

      // Send push notification to elder's device
      await this.sendCallNotification(elderProfile.userId, {
        type: body.emergencyCall ? 'emergency_call' : 'video_call',
        caller: req.user.name,
        sessionId: session.id,
      });

      this.logger.logEvent('Video call initiated', 'VideoCall', session.id, {
        caller: req.user.id,
        callee: elderProfile.userId,
        emergency: body.emergencyCall,
      });

      return {
        success: true,
        data: {
          sessionId: session.id,
          token,
          status: 'initiated',
        },
      };
    } catch (error) {
      this.logger.error('Failed to initiate video call', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Send message to elder
   */
  @Post('family/messages')
  @Roles('family')
  async sendMessage(
    @Body() body: { elderId: string; message: string; urgent?: boolean },
    @Request() req: any,
  ) {
    try {
      const elderProfile = await this.prisma.elderProfile.findUnique({
        where: { id: body.elderId },
      });

      if (!elderProfile) {
        throw new BadRequestException('Elder profile not found');
      }

      const message = await this.prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: elderProfile.userId,
          content: body.message,
          urgent: body.urgent || false,
        },
      });

      // Send push notification
      await this.sendPushNotification(elderProfile.userId, {
        title: body.urgent ? 'Urgent Message' : 'New Message',
        body: body.message,
        priority: body.urgent ? 'high' : 'normal',
        bypassDND: body.urgent,
      });

      return {
        success: true,
        data: message,
      };
    } catch (error) {
      this.logger.error('Failed to send message', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get elder location
   */
  @Get('family/elder/:elderId/location')
  @Roles('family')
  async getElderLocation(@Param('elderId') elderId: string) {
    try {
      const elderProfile = await this.prisma.elderProfile.findUnique({
        where: { id: elderId },
        include: {
          user: true,
          location: true,
        },
      });

      if (!elderProfile) {
        throw new BadRequestException('Elder profile not found');
      }

      // Get latest location update
      const locationHistory = await this.prisma.locationUpdate.findFirst({
        where: { userId: elderProfile.userId },
        orderBy: { timestamp: 'desc' },
      });

      return {
        success: true,
        data: {
          elder: {
            id: elderId,
            name: elderProfile.user.name,
          },
          currentLocation: elderProfile.location
            ? {
                address: elderProfile.location.address,
                coordinates: {
                  lat: elderProfile.location.latitude,
                  lng: elderProfile.location.longitude,
                },
                lastUpdated: locationHistory?.timestamp || elderProfile.location.updatedAt,
              }
            : null,
          geofence: elderProfile.geofenceEnabled
            ? {
                radius: elderProfile.geofenceRadius,
                alertOnExit: true,
              }
            : null,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get elder location', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * ========================================
   * CAREGIVER APP ENDPOINTS
   * ========================================
   */

  /**
   * Get caregiver dashboard
   */
  @Get('caregiver/dashboard')
  @Roles('caregiver')
  async getCaregiverDashboard(@Request() req: any) {
    try {
      const caregiverId = req.user.id;

      // Get today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookings = await this.prisma.booking.findMany({
        where: {
          caregiverId,
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, phone: true },
          },
          elderProfile: {
            include: {
              location: true,
            },
          },
        },
        orderBy: { scheduledDate: 'asc' },
      });

      // Get active care plans
      const carePlans = await this.prisma.carePlan.findMany({
        where: {
          assignedCaregiverId: caregiverId,
          status: 'active',
        },
        include: {
          elderProfile: {
            include: { user: true },
          },
        },
        take: 10,
      });

      // Get pending tasks
      const tasks = await this.prisma.careTask.findMany({
        where: {
          assignedTo: caregiverId,
          status: { in: ['pending', 'in_progress'] },
          dueDate: { gte: today },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      });

      return {
        success: true,
        data: {
          bookings: bookings.map(b => ({
            id: b.id,
            elder: {
              id: b.elderProfile?.id,
              name: b.user.name,
              phone: b.user.phone,
              address: b.elderProfile?.location?.address,
            },
            scheduledTime: b.scheduledDate,
            duration: b.duration,
            services: b.services,
            status: b.status,
            notes: b.notes,
          })),
          carePlans: carePlans.map(cp => ({
            id: cp.id,
            elder: cp.elderProfile.user.name,
            title: cp.title,
            description: cp.description,
            startDate: cp.startDate,
            endDate: cp.endDate,
          })),
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.dueDate,
            status: t.status,
          })),
          summary: {
            todayBookings: bookings.length,
            activePlans: carePlans.length,
            pendingTasks: tasks.filter(t => t.status === 'pending').length,
          },
        },
      };
    } catch (error) {
      this.logger.error('Failed to load caregiver dashboard', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check-in to booking
   */
  @Post('caregiver/bookings/:bookingId/checkin')
  @Roles('caregiver')
  async checkInToBooking(
    @Param('bookingId') bookingId: string,
    @Body() body: { location?: { lat: number; lng: number } },
    @Request() req: any,
  ) {
    try {
      const booking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'in_progress',
          checkedInAt: new Date(),
          checkedInLocation: body.location
            ? `${body.location.lat},${body.location.lng}`
            : null,
        },
      });

      this.logger.logEvent('Caregiver checked in', 'Booking', bookingId, {
        caregiverId: req.user.id,
      });

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      this.logger.error('Failed to check in', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Complete booking
   */
  @Post('caregiver/bookings/:bookingId/complete')
  @Roles('caregiver')
  async completeBooking(
    @Param('bookingId') bookingId: string,
    @Body() body: { notes?: string; tasksCompleted?: string[] },
    @Request() req: any,
  ) {
    try {
      const booking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          completionNotes: body.notes,
        },
      });

      // Mark tasks as completed
      if (body.tasksCompleted && body.tasksCompleted.length > 0) {
        await this.prisma.careTask.updateMany({
          where: {
            id: { in: body.tasksCompleted },
          },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });
      }

      this.logger.logEvent('Booking completed', 'Booking', bookingId, {
        caregiverId: req.user.id,
      });

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      this.logger.error('Failed to complete booking', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update task status
   */
  @Put('caregiver/tasks/:taskId')
  @Roles('caregiver')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() body: { status?: string; notes?: string },
    @Request() req: any,
  ) {
    try {
      const task = await this.prisma.careTask.update({
        where: { id: taskId },
        data: {
          status: body.status,
          notes: body.notes,
          ...(body.status === 'completed' && { completedAt: new Date() }),
        },
      });

      return {
        success: true,
        data: task,
      };
    } catch (error) {
      this.logger.error('Failed to update task', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * ========================================
   * OFFLINE SYNC ENDPOINTS
   * ========================================
   */

  /**
   * Sync offline data
   */
  @Post('sync')
  async syncOfflineData(
    @Body() body: { actions: any[]; lastSync?: string },
    @Request() req: any,
  ) {
    try {
      const results = [];
      const errors = [];

      // Process offline actions
      for (const action of body.actions) {
        try {
          const result = await this.processOfflineAction(action, req.user.id);
          results.push({ actionId: action.id, success: true, result });
        } catch (error) {
          errors.push({
            actionId: action.id,
            error: (error as Error).message,
          });
        }
      }

      // Get updates since last sync
      const lastSyncDate = body.lastSync ? new Date(body.lastSync) : new Date(0);
      const updates = await this.getUpdatesSinceLastSync(req.user.id, lastSyncDate);

      return {
        success: true,
        data: {
          processed: results.length,
          errors,
          updates,
          syncTimestamp: new Date(),
        },
      };
    } catch (error) {
      this.logger.error('Failed to sync offline data', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * ========================================
   * PUSH NOTIFICATIONS
   * ========================================
   */

  /**
   * Register device for push notifications
   */
  @Post('push/register')
  async registerPushDevice(
    @Body() body: { token: string; platform: 'ios' | 'android'; deviceId: string },
    @Request() req: any,
  ) {
    try {
      const device = await this.prisma.pushDevice.upsert({
        where: { deviceId: body.deviceId },
        update: {
          token: body.token,
          platform: body.platform,
          updatedAt: new Date(),
        },
        create: {
          userId: req.user.id,
          token: body.token,
          platform: body.platform,
          deviceId: body.deviceId,
        },
      });

      this.logger.log('Push device registered', 'MobileApiController', {
        userId: req.user.id,
        platform: body.platform,
      });

      return {
        success: true,
        data: device,
      };
    } catch (error) {
      this.logger.error('Failed to register push device', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  @Put('push/settings')
  async updateNotificationSettings(
    @Body()
    body: {
      criticalAlerts?: boolean;
      generalNotifications?: boolean;
      quietHoursStart?: string;
      quietHoursEnd?: string;
    },
    @Request() req: any,
  ) {
    try {
      const settings = await this.prisma.notificationSettings.upsert({
        where: { userId: req.user.id },
        update: body,
        create: {
          userId: req.user.id,
          ...body,
        },
      });

      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      this.logger.error('Failed to update notification settings', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * ========================================
   * LOCATION TRACKING
   * ========================================
   */

  /**
   * Update user location
   */
  @Post('location/update')
  async updateLocation(
    @Body()
    body: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: string;
    },
    @Request() req: any,
  ) {
    try {
      const location = await this.prisma.locationUpdate.create({
        data: {
          userId: req.user.id,
          latitude: body.latitude,
          longitude: body.longitude,
          accuracy: body.accuracy,
          timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        },
      });

      // Check geofence violations
      await this.checkGeofenceViolations(req.user.id, body.latitude, body.longitude);

      return {
        success: true,
        data: location,
      };
    } catch (error) {
      this.logger.error('Failed to update location', '', 'MobileApiController', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * ========================================
   * WEBSOCKET CONNECTION INFO
   * ========================================
   */

  /**
   * Get WebSocket connection details for real-time updates
   */
  @Get('websocket/info')
  async getWebSocketInfo(@Request() req: any) {
    const wsUrl = this.configService.get<string>('WEBSOCKET_URL') || 'ws://localhost:3000';
    const token = this.generateWebSocketToken(req.user.id);

    return {
      success: true,
      data: {
        url: wsUrl,
        token,
        channels: [
          `user:${req.user.id}`,
          'alerts',
          'vitals',
          'messages',
          'video-calls',
        ],
      },
    };
  }

  /**
   * ========================================
   * HELPER METHODS
   * ========================================
   */

  /**
   * Calculate elder status based on alerts
   */
  private calculateElderStatus(alerts: any[]): string {
    if (alerts.some(a => a.severity === 'critical' && !a.acknowledged)) {
      return 'critical';
    }
    if (alerts.some(a => a.severity === 'high' && !a.acknowledged)) {
      return 'warning';
    }
    return 'normal';
  }

  /**
   * Calculate vital trends
   */
  private calculateVitalTrends(vitals: any[]) {
    if (vitals.length < 2) return null;

    const latest = vitals[0];
    const previous = vitals[Math.min(5, vitals.length - 1)];

    return {
      heartRate: latest.heartRate && previous.heartRate
        ? this.getTrend(latest.heartRate, previous.heartRate)
        : null,
      temperature: latest.temperature && previous.temperature
        ? this.getTrend(latest.temperature, previous.temperature)
        : null,
      oxygenSaturation: latest.oxygenSaturation && previous.oxygenSaturation
        ? this.getTrend(latest.oxygenSaturation, previous.oxygenSaturation)
        : null,
    };
  }

  /**
   * Get trend direction
   */
  private getTrend(current: number, previous: number): string {
    const diff = current - previous;
    if (Math.abs(diff) < 2) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Generate call token
   */
  private generateCallToken(sessionId: string, callerId: string, calleeId: string): string {
    const payload = { sessionId, callerId, calleeId, iat: Date.now() };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Send call notification
   */
  private async sendCallNotification(userId: string, data: any) {
    // Implementation would use FCM/APNS
    this.logger.debug('Call notification sent', 'MobileApiController', {
      userId,
      type: data.type,
    });
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(userId: string, notification: any) {
    try {
      const devices = await this.prisma.pushDevice.findMany({
        where: { userId },
      });

      // Get notification settings
      const settings = await this.prisma.notificationSettings.findUnique({
        where: { userId },
      });

      // Check quiet hours
      if (settings && !notification.bypassDND) {
        const now = new Date();
        const currentTime = `${now.getHours()}:${now.getMinutes()}`;
        if (
          settings.quietHoursStart &&
          settings.quietHoursEnd &&
          this.isInQuietHours(currentTime, settings.quietHoursStart, settings.quietHoursEnd)
        ) {
          this.logger.debug('Notification blocked by quiet hours', 'MobileApiController');
          return;
        }
      }

      // Send to each device (FCM/APNS implementation)
      for (const device of devices) {
        this.logger.debug('Push notification queued', 'MobileApiController', {
          platform: device.platform,
          token: device.token.substring(0, 10) + '...',
        });
        // Actual FCM/APNS send would go here
      }
    } catch (error) {
      this.logger.error('Failed to send push notification', '', 'MobileApiController', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(current: string, start: string, end: string): boolean {
    // Simple time comparison
    return current >= start && current <= end;
  }

  /**
   * Process offline action
   */
  private async processOfflineAction(action: any, userId: string) {
    switch (action.type) {
      case 'acknowledge_alert':
        return this.prisma.alert.update({
          where: { id: action.data.alertId },
          data: { acknowledged: true, acknowledgedBy: userId },
        });

      case 'update_task':
        return this.prisma.careTask.update({
          where: { id: action.data.taskId },
          data: action.data.updates,
        });

      case 'send_message':
        return this.prisma.message.create({
          data: {
            senderId: userId,
            receiverId: action.data.receiverId,
            content: action.data.content,
          },
        });

      default:
        throw new BadRequestException(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Get updates since last sync
   */
  private async getUpdatesSinceLastSync(userId: string, lastSync: Date) {
    const [alerts, messages, tasks] = await Promise.all([
      this.prisma.alert.findMany({
        where: { updatedAt: { gte: lastSync } },
        take: 50,
      }),
      this.prisma.message.findMany({
        where: {
          receiverId: userId,
          createdAt: { gte: lastSync },
        },
        take: 50,
      }),
      this.prisma.careTask.findMany({
        where: {
          assignedTo: userId,
          updatedAt: { gte: lastSync },
        },
        take: 50,
      }),
    ]);

    return { alerts, messages, tasks };
  }

  /**
   * Check geofence violations
   */
  private async checkGeofenceViolations(
    userId: string,
    latitude: number,
    longitude: number,
  ) {
    const elderProfile = await this.prisma.elderProfile.findFirst({
      where: { userId },
      include: { location: true },
    });

    if (!elderProfile?.geofenceEnabled || !elderProfile.location) {
      return;
    }

    const distance = this.calculateDistance(
      latitude,
      longitude,
      elderProfile.location.latitude,
      elderProfile.location.longitude,
    );

    if (distance > (elderProfile.geofenceRadius || 1000)) {
      // Create geofence violation alert
      await this.prisma.alert.create({
        data: {
          userId,
          type: 'geofence_violation',
          severity: 'high',
          message: `Elder has left the designated area (${Math.round(distance)}m from home)`,
        },
      });

      this.logger.logSecurity('Geofence violation detected', 'high', {
        userId,
        distance: Math.round(distance),
      });
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Generate WebSocket token
   */
  private generateWebSocketToken(userId: string): string {
    const payload = { userId, iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}
