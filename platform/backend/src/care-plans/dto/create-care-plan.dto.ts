import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CarePlanStatus } from '@prisma/client';

export class CreateCarePlanDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: 'Standard Daily Care Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Daily ADL and IADL assistance plan' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: CarePlanStatus, example: CarePlanStatus.ACTIVE, required: false })
  @IsEnum(CarePlanStatus)
  @IsOptional()
  status?: CarePlanStatus;
}
