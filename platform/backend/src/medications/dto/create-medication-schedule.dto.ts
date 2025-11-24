import { IsString, IsNotEmpty, IsUUID, IsEnum, IsArray, IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MedicationFrequencyType } from '@prisma/client';

export class CreateMedicationScheduleDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  medicationId: string;

  @ApiProperty({ example: '1 tablet' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ enum: MedicationFrequencyType, example: MedicationFrequencyType.TWICE_DAILY })
  @IsEnum(MedicationFrequencyType)
  frequencyType: MedicationFrequencyType;

  @ApiProperty({ example: ['08:00', '20:00'] })
  @IsArray()
  @IsString({ each: true })
  timesOfDay: string[];

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-12-31T23:59:59Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  requiresFood?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isCritical?: boolean;
}
