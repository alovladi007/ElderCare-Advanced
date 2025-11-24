import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveAlertDto {
  @ApiProperty({ example: 'Issue resolved, patient stable', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
