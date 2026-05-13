import { IsString, IsNotEmpty, IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MedAdministrationStatus } from '@prisma/client';

export class LogAdministrationDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  medicationId: string;

  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678', required: false })
  @IsUUID()
  @IsOptional()
  scheduleId?: string;

  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: '2025-01-17T08:00:00Z' })
  @IsDateString()
  plannedTime: string;

  @ApiProperty({ enum: MedAdministrationStatus, example: MedAdministrationStatus.TAKEN })
  @IsEnum(MedAdministrationStatus)
  status: MedAdministrationStatus;

  @ApiProperty({ example: '2025-01-17T08:05:00Z', required: false })
  @IsDateString()
  @IsOptional()
  actualTime?: string;

  @ApiProperty({ example: 'Patient refused, feeling nauseous', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
