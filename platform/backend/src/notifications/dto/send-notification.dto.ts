import { IsString, IsNotEmpty, IsUUID, IsEnum, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationChannel } from '@prisma/client';

export class SendNotificationDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.TASK_REMINDER })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel, example: NotificationChannel.EMAIL })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ example: 'Medication Reminder', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ example: 'Time to take your morning medication' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: { medicationId: 'abc-123', time: '08:00' },
    required: false
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
