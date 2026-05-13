import { IsString, IsNotEmpty, IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IntakeLevel } from '@prisma/client';

export class LogMealIntakeDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  mealItemId: string;

  @ApiProperty({ example: '2025-01-20T08:30:00Z' })
  @IsDateString()
  loggedAt: string;

  @ApiProperty({ enum: IntakeLevel, example: IntakeLevel.FULL })
  @IsEnum(IntakeLevel)
  intakeLevel: IntakeLevel;

  @ApiProperty({ example: 'Patient enjoyed the meal', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
