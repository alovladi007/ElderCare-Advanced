import { IsString, IsUUID, IsOptional, IsEnum, IsInt, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SmartDeviceCategory, SmartDeviceStatus, SensorType, ActuatorType } from '@prisma/client';

export class CreateSmartDeviceTypeDto {
  @ApiProperty({ example: 'Ceiling Motion Sensor' })
  @IsString()
  name: string;

  @ApiProperty({ enum: SmartDeviceCategory, example: SmartDeviceCategory.SENSOR })
  @IsEnum(SmartDeviceCategory)
  category: SmartDeviceCategory;

  @ApiProperty({ example: { sensors: ['MOTION'], features: ['battery-powered'] } })
  @IsObject()
  capabilitiesJson: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  vendor?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSmartDeviceDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678', required: false })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  deviceTypeId: string;

  @ApiProperty({ example: 'Living Room Motion Sensor' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'AA:BB:CC:DD:EE:FF' })
  @IsString()
  identifier: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  batteryLevel?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  settingsJson?: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSensorDto {
  @ApiProperty({ enum: SensorType, example: SensorType.MOTION })
  @IsEnum(SensorType)
  sensorType: SensorType;

  @ApiProperty({ example: 'Main Motion Detector' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isCritical?: boolean;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  calibrationJson?: any;
}

export class CreateActuatorDto {
  @ApiProperty({ enum: ActuatorType, example: ActuatorType.LIGHT })
  @IsEnum(ActuatorType)
  actuatorType: ActuatorType;

  @ApiProperty({ example: 'Main Light Switch' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  stateSchemaJson?: any;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isCritical?: boolean;
}
