import { IsString, IsNotEmpty, IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMealPlanDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: '2025-01-20T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-01-26T23:59:59Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Weekly meal plan for balanced nutrition', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
