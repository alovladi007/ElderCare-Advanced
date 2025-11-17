import { IsNumber, IsNotEmpty, IsUUID, IsEnum, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AlertSeverity } from '@prisma/client';

export class CreateVitalAlertRuleDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678', description: 'Vital Type ID' })
  @IsUUID()
  @IsNotEmpty()
  vitalTypeId: string;

  @ApiProperty({ example: 90, description: 'Minimum threshold', required: false })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiProperty({ example: 140, description: 'Maximum threshold', required: false })
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @ApiProperty({ example: 1, description: 'Number of consecutive readings', required: false })
  @IsInt()
  @IsOptional()
  consecutiveReadings?: number;

  @ApiProperty({ example: 60, description: 'Time window in minutes', required: false })
  @IsInt()
  @IsOptional()
  timeWindowMinutes?: number;

  @ApiProperty({ enum: AlertSeverity, example: AlertSeverity.WARNING })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  notifyFamily?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  notifyClinician?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  autoEscalateEmergency?: boolean;
}
