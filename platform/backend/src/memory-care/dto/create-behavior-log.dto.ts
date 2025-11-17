import { IsString, IsNotEmpty, IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Mood } from '@prisma/client';

export class CreateBehaviorLogDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: '2025-01-17T14:30:00Z' })
  @IsDateString()
  loggedAt: string;

  @ApiProperty({ enum: Mood, example: Mood.CALM })
  @IsEnum(Mood)
  mood: Mood;

  @ApiProperty({ example: 'Patient was calm and cooperative during activities' })
  @IsString()
  @IsNotEmpty()
  behavior: string;

  @ApiProperty({ example: 'Music playing in the background', required: false })
  @IsString()
  @IsOptional()
  trigger?: string;

  @ApiProperty({ example: 'Continued with planned activities', required: false })
  @IsString()
  @IsOptional()
  resolution?: string;
}
