import { IsString, IsNotEmpty, IsUUID, IsEnum, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TextureLevel } from '@prisma/client';

export class CreateNutritionProfileDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: 'Low sodium, Diabetic diet', required: false })
  @IsString()
  @IsOptional()
  dietaryRestrictions?: string;

  @ApiProperty({ example: 'Shellfish, Peanuts', required: false })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiProperty({ example: 'Italian, Mediterranean', required: false })
  @IsString()
  @IsOptional()
  preferredCuisines?: string;

  @ApiProperty({ enum: TextureLevel, example: TextureLevel.REGULAR })
  @IsEnum(TextureLevel)
  textureLevel: TextureLevel;

  @ApiProperty({ example: 1800, required: false })
  @IsInt()
  @IsOptional()
  dailyCalorieTarget?: number;

  @ApiProperty({ example: 'Prefers small frequent meals', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
