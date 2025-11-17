import { IsString, IsNotEmpty, IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IncidentType, IncidentSeverity } from '@prisma/client';

export class CreateIncidentDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678', required: false })
  @IsUUID()
  @IsOptional()
  careTaskInstanceId?: string;

  @ApiProperty({ enum: IncidentType, example: IncidentType.FALL })
  @IsEnum(IncidentType)
  type: IncidentType;

  @ApiProperty({ enum: IncidentSeverity, example: IncidentSeverity.MODERATE })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty({ example: 'Patient slipped in bathroom during morning routine' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2025-01-17T08:30:00Z' })
  @IsDateString()
  occurredAt: string;

  @ApiProperty({ example: 'Applied ice pack, contacted family member', required: false })
  @IsString()
  @IsOptional()
  followUpActions?: string;
}
