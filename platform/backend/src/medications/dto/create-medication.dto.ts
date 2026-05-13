import { IsString, IsNotEmpty, IsUUID, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MedicationForm, MedicationRoute } from '@prisma/client';

export class CreateMedicationDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: 'Metformin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Metformin Hydrochloride', required: false })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiProperty({ example: '500 mg' })
  @IsString()
  @IsNotEmpty()
  strength: string;

  @ApiProperty({ enum: MedicationForm, example: MedicationForm.TABLET })
  @IsEnum(MedicationForm)
  form: MedicationForm;

  @ApiProperty({ enum: MedicationRoute, example: MedicationRoute.ORAL })
  @IsEnum(MedicationRoute)
  route: MedicationRoute;

  @ApiProperty({ example: 'Dr. Smith', required: false })
  @IsString()
  @IsOptional()
  prescribedBy?: string;

  @ApiProperty({ example: 'Type 2 Diabetes', required: false })
  @IsString()
  @IsOptional()
  indication?: string;

  @ApiProperty({ example: 'Take with food', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
