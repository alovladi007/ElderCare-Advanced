import { IsString, IsNotEmpty, IsUUID, IsEnum, IsDateString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MealType } from '@prisma/client';

export class CreateMealItemDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  mealPlanId: string;

  @ApiProperty({ example: '2025-01-20T00:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: MealType, example: MealType.BREAKFAST })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiProperty({ example: 'Oatmeal with berries' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Steel-cut oatmeal topped with fresh blueberries and walnuts', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 350, required: false })
  @IsInt()
  @IsOptional()
  estimatedCalories?: number;

  @ApiProperty({ example: 'Low sodium, heart-healthy', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
