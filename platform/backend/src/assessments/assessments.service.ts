import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentTemplateDto } from './dto/create-assessment-template.dto';
import { CreateAssessmentInstanceDto } from './dto/create-assessment-instance.dto';
import { subDays } from 'date-fns';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  // Assessment Templates
  async createTemplate(dto: CreateAssessmentTemplateDto) {
    return this.prisma.assessmentTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        schemaJson: dto.schemaJson,
      },
    });
  }

  async getTemplates(type?: string) {
    return this.prisma.assessmentTemplate.findMany({
      where: type ? { type: type as any } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplate(id: string) {
    const template = await this.prisma.assessmentTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assessmentInstances: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Assessment template not found');
    }

    return template;
  }

  async updateTemplate(id: string, data: Partial<CreateAssessmentTemplateDto>) {
    return this.prisma.assessmentTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.assessmentTemplate.delete({
      where: { id },
    });
  }

  // Assessment Instances
  async createInstance(dto: CreateAssessmentInstanceDto, userId: string) {
    // Validate template exists
    const template = await this.prisma.assessmentTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Assessment template not found');
    }

    // Calculate score if not provided
    let score = dto.totalScore;
    if (score === undefined || score === null) {
      score = this.calculateScore(template.schemaJson, dto.responsesJson);
    }

    return this.prisma.assessmentInstance.create({
      data: {
        templateId: dto.templateId,
        elderId: dto.elderId,
        performedByUserId: userId,
        performedAt: new Date(dto.performedAt),
        responsesJson: dto.responsesJson,
        totalScore: score,
        notes: dto.notes,
      },
      include: {
        template: true,
        elder: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        performedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async getAssessmentsByElder(elderId: string, templateId?: string, days?: number) {
    const where: any = { elderId };

    if (templateId) {
      where.templateId = templateId;
    }

    if (days) {
      const startDate = subDays(new Date(), days);
      where.performedAt = {
        gte: startDate,
      };
    }

    return this.prisma.assessmentInstance.findMany({
      where,
      include: {
        template: true,
        performedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { performedAt: 'desc' },
    });
  }

  async getAssessment(id: string) {
    const assessment = await this.prisma.assessmentInstance.findUnique({
      where: { id },
      include: {
        template: true,
        elder: {
          include: {
            user: true,
          },
        },
        performedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return assessment;
  }

  // Score calculation helper
  private calculateScore(schema: any, responses: any): number | null {
    if (!schema.questions || !Array.isArray(schema.questions)) {
      return null;
    }

    let totalPoints = 0;
    let maxPoints = 0;

    for (const question of schema.questions) {
      if (question.type === 'scale' && question.scale) {
        const response = responses[question.id];
        if (response && typeof response.value === 'number') {
          totalPoints += response.value;
          maxPoints += question.scale.max;
        }
      }
    }

    if (maxPoints === 0) {
      return null;
    }

    // Return percentage score
    return Math.round((totalPoints / maxPoints) * 100);
  }

  // Assessment trends
  async getAssessmentTrends(elderId: string, templateId: string, days: number = 90) {
    const startDate = subDays(new Date(), days);

    const assessments = await this.prisma.assessmentInstance.findMany({
      where: {
        elderId,
        templateId,
        performedAt: {
          gte: startDate,
        },
      },
      orderBy: { performedAt: 'asc' },
      select: {
        id: true,
        performedAt: true,
        totalScore: true,
      },
    });

    return {
      templateId,
      elderId,
      period: {
        startDate,
        endDate: new Date(),
        days,
      },
      count: assessments.length,
      trend: assessments,
      averageScore: assessments.length > 0
        ? assessments.reduce((sum, a) => sum + (a.totalScore || 0), 0) / assessments.length
        : null,
    };
  }
}
