import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';

export class CreateDeviceDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ enum: DeviceType, example: DeviceType.BLOOD_PRESSURE_CUFF })
  @IsEnum(DeviceType)
  type: DeviceType;

  @ApiProperty({ example: 'Omron', required: false })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({ example: 'BP786N', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 'SN123456789', required: false })
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiProperty({ example: 'OmronConnect', required: false })
  @IsString()
  @IsOptional()
  integrationProvider?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
