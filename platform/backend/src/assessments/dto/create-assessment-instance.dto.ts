import { IsString, IsNotEmpty, IsUUID, IsObject, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssessmentInstanceDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  @IsNotEmpty()
  elderId: string;

  @ApiProperty({ example: '2025-01-17T10:00:00Z' })
  @IsDateString()
  performedAt: string;

  @ApiProperty({
    example: {
      q1: { value: 4, text: 'Very Good' },
      q2: { value: 'no' }
    }
  })
  @IsObject()
  responsesJson: any;

  @ApiProperty({ example: 85, required: false })
  @IsNumber()
  @IsOptional()
  totalScore?: number;

  @ApiProperty({ example: 'Patient is doing well overall', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
