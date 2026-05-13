import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateAssessmentTemplateDto } from './dto/create-assessment-template.dto';
import { CreateAssessmentInstanceDto } from './dto/create-assessment-instance.dto';

@ApiTags('assessments')
@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  // Templates
  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Create assessment template (Admin/Clinician only)' })
  createTemplate(@Body() dto: CreateAssessmentTemplateDto) {
    return this.assessmentsService.createTemplate(dto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all assessment templates' })
  @ApiQuery({ name: 'type', required: false, example: 'GENERAL' })
  getTemplates(@Query('type') type?: string) {
    return this.assessmentsService.getTemplates(type);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get assessment template by ID' })
  getTemplate(@Param('id') id: string) {
    return this.assessmentsService.getTemplate(id);
  }

  @Patch('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Update assessment template' })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAssessmentTemplateDto>,
  ) {
    return this.assessmentsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete assessment template (Admin only)' })
  deleteTemplate(@Param('id') id: string) {
    return this.assessmentsService.deleteTemplate(id);
  }

  // Instances
  @Post('instances')
  @Roles(UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create assessment instance (perform assessment)' })
  createInstance(@Body() dto: CreateAssessmentInstanceDto, @Request() req) {
    return this.assessmentsService.createInstance(dto, req.user.userId);
  }

  @Get('elder/:elderId')
  @ApiOperation({ summary: 'Get assessments for an elder' })
  @ApiQuery({ name: 'templateId', required: false })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getAssessmentsByElder(
    @Param('elderId') elderId: string,
    @Query('templateId') templateId?: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days) : undefined;
    return this.assessmentsService.getAssessmentsByElder(elderId, templateId, numDays);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get assessment instance by ID' })
  getAssessment(@Param('id') id: string) {
    return this.assessmentsService.getAssessment(id);
  }

  @Get('elder/:elderId/trends/:templateId')
  @ApiOperation({ summary: 'Get assessment trends over time' })
  @ApiQuery({ name: 'days', required: false, example: 90 })
  getAssessmentTrends(
    @Param('elderId') elderId: string,
    @Param('templateId') templateId: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days) : 90;
    return this.assessmentsService.getAssessmentTrends(elderId, templateId, numDays);
  }
}
