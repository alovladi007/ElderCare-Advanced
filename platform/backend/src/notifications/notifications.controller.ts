import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, NotificationStatus } from '@prisma/client';
import { SendNotificationDto } from './dto/send-notification.dto';
import {
  CreateNotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification-preference.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Send Notification (Admin/System use)
  @Post('send')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Send a notification to a user' })
  sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendNotification(dto);
  }

  // Notification Preferences
  @Post('preferences')
  @ApiOperation({ summary: 'Create notification preference' })
  createPreference(@Body() dto: CreateNotificationPreferenceDto, @Request() req) {
    return this.notificationsService.createPreference(req.user.userId, dto);
  }

  @Get('preferences/me')
  @ApiOperation({ summary: 'Get my notification preferences' })
  getMyPreferences(@Request() req) {
    return this.notificationsService.getUserPreferences(req.user.userId);
  }

  @Get('preferences/user/:userId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Get notification preferences for a user' })
  getUserPreferences(@Param('userId') userId: string) {
    return this.notificationsService.getUserPreferences(userId);
  }

  @Patch('preferences/:id')
  @ApiOperation({ summary: 'Update notification preference' })
  updatePreference(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.notificationsService.updatePreference(id, dto);
  }

  @Delete('preferences/:id')
  @ApiOperation({ summary: 'Delete notification preference' })
  deletePreference(@Param('id') id: string) {
    return this.notificationsService.deletePreference(id);
  }

  // Notification History
  @Get('me')
  @ApiOperation({ summary: 'Get my notifications' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus })
  getMyNotifications(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('status') status?: NotificationStatus,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.notificationsService.getUserNotifications(
      req.user.userId,
      limitNum,
      status,
    );
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Get notifications for a user' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus })
  getUserNotifications(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('status') status?: NotificationStatus,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.notificationsService.getUserNotifications(
      userId,
      limitNum,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  getNotification(@Param('id') id: string) {
    return this.notificationsService.getNotification(id);
  }

  @Post(':id/retry')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retry a failed notification' })
  retryNotification(@Param('id') id: string) {
    return this.notificationsService.retryNotification(id);
  }

  // Service Status
  @Get('status/services')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Check notification services status' })
  getServiceStatus() {
    return this.notificationsService.getServiceStatus();
  }
}
