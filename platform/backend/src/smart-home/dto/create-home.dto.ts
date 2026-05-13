import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHomeDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  elderId: string;

  @ApiProperty({ example: 'Main Apartment' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main St, Apt 4B, New York, NY 10001' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'America/New_York', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateHomeZoneDto {
  @ApiProperty({ example: 'Bedroom' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, example: '1st Floor' })
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  isCriticalArea?: boolean;
}
