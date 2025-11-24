import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SensorEventType, EventSeverity } from '@prisma/client';

export class IngestIoTEventDto {
  @ApiProperty({ example: 'AA:BB:CC:DD:EE:FF' })
  @IsString()
  deviceIdentifier: string;

  @ApiProperty({ enum: SensorEventType, example: SensorEventType.STATE_CHANGE })
  @IsEnum(SensorEventType)
  eventType: SensorEventType;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  valueNumeric?: number;

  @ApiProperty({ required: false, example: 'OPEN' })
  @IsString()
  @IsOptional()
  valueText?: string;

  @ApiProperty({ enum: EventSeverity, required: false })
  @IsEnum(EventSeverity)
  @IsOptional()
  severity?: EventSeverity;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  occurredAt?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  rawPayloadJson?: any;
}

export class AcknowledgeActuatorCommandDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsString()
  commandId: string;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;
}

export class IssueActuatorCommandDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsString()
  actuatorId: string;

  @ApiProperty({ example: 'SET_STATE' })
  @IsString()
  commandName: string;

  @ApiProperty({ example: { on: true } })
  @IsObject()
  commandParamsJson: any;
}
