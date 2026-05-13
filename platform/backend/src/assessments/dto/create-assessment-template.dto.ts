import { IsString, IsNotEmpty, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';

export class CreateAssessmentTemplateDto {
  @ApiProperty({ example: 'Weekly Health Assessment' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Comprehensive weekly health evaluation' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: AssessmentType, example: AssessmentType.GENERAL })
  @IsEnum(AssessmentType)
  type: AssessmentType;

  @ApiProperty({
    example: {
      questions: [
        {
          id: 'q1',
          text: 'How is overall mood?',
          type: 'scale',
          scale: { min: 1, max: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] }
        },
        {
          id: 'q2',
          text: 'Any pain or discomfort?',
          type: 'yesno'
        }
      ]
    }
  })
  @IsObject()
  schemaJson: any;
}
