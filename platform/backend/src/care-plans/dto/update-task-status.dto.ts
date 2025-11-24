import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.COMPLETED })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ example: 'Task completed successfully', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  incidentReported?: boolean;
}
