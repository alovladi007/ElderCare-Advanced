import { IsString, IsNotEmpty, IsUUID, IsEnum, IsInt, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrientationCardType } from '@prisma/client';

export class CreateOrientationCardDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ enum: OrientationCardType, example: OrientationCardType.DAILY_PLAN })
  @IsEnum(OrientationCardType)
  type: OrientationCardType;

  @ApiProperty({ example: 'Today\'s Schedule' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Morning walk, Lunch with family, Afternoon rest' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  displayOrder: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
