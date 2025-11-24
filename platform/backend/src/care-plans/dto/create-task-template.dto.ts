import { IsString, IsNotEmpty, IsUUID, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CareTaskCategory, FrequencyType, TaskPriority } from '@prisma/client';

export class CreateTaskTemplateDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  carePlanId: string;

  @ApiProperty({ enum: CareTaskCategory, example: CareTaskCategory.BATHING })
  @IsEnum(CareTaskCategory)
  category: CareTaskCategory;

  @ApiProperty({ example: 'Morning Bath Assistance' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Assist with bathing and personal hygiene' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: FrequencyType, example: FrequencyType.ONCE_DAILY })
  @IsEnum(FrequencyType)
  frequencyType: FrequencyType;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  timeWindowStart: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @IsNotEmpty()
  timeWindowEnd: string;

  @ApiProperty({ example: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] })
  @IsArray()
  @IsString({ each: true })
  daysOfWeek: string[];

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ example: 'Ensure water temperature is comfortable', required: false })
  @IsString()
  @IsOptional()
  instructions?: string;
}
