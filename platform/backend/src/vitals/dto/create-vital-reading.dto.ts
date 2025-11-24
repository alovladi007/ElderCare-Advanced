import { IsNumber, IsNotEmpty, IsUUID, IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VitalSource } from '@prisma/client';

export class CreateVitalReadingDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678', required: false })
  @IsUUID()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678', description: 'Vital Type ID' })
  @IsUUID()
  @IsNotEmpty()
  vitalTypeId: string;

  @ApiProperty({ example: 120, description: 'Primary value (e.g., systolic BP)' })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({ example: 80, description: 'Secondary value (e.g., diastolic BP)', required: false })
  @IsNumber()
  @IsOptional()
  valueSecondary?: number;

  @ApiProperty({ example: '2025-01-17T08:00:00Z' })
  @IsDateString()
  recordedAt: string;

  @ApiProperty({ enum: VitalSource, example: VitalSource.MANUAL_ENTRY })
  @IsEnum(VitalSource)
  source: VitalSource;

  @ApiProperty({ example: 'Patient feeling normal', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
