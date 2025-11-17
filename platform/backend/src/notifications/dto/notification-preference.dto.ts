import { IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannel, AlertSeverity } from '@prisma/client';

export class CreateNotificationPreferenceDto {
  @ApiProperty({ enum: NotificationChannel, example: NotificationChannel.EMAIL })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ enum: AlertSeverity, example: AlertSeverity.CRITICAL })
  @IsEnum(AlertSeverity)
  forAlertSeverity: AlertSeverity;
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}
