import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { MedicationService } from '../services/medication.service';
import { MedicationFrequency } from '@prisma/client';
import { OptionalIntPipe } from '../../common/pipes/optional-int.pipe';

@ApiTags('care-management')
@Controller('care-management/medications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MedicationController {
  constructor(private medicationService: MedicationService) {}

  @Post()
  @ApiOperation({ summary: 'Create medication for elder' })
  async createMedication(
    @Body()
    body: {
      elderId: string;
      name: string;
      dosage: string;
      frequency: MedicationFrequency;
      startDate: string;
      endDate?: string;
      instructions?: string;
      sideEffects?: string;
      prescribedBy?: string;
      notes?: string;
    },
  ) {
    return this.medicationService.createMedication({
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Get('elder/:elderId')
  @ApiOperation({ summary: 'Get all medications for elder' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async getMedicationsByElder(
    @Param('elderId') elderId: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.medicationService.getMedicationsByElder(
      elderId,
      includeInactive === true,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medication by ID' })
  async getMedicationById(@Param('id') id: string) {
    return this.medicationService.getMedicationById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update medication' })
  async updateMedication(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      dosage?: string;
      frequency?: MedicationFrequency;
      instructions?: string;
      sideEffects?: string;
      prescribedBy?: string;
      endDate?: string;
      isActive?: boolean;
      notes?: string;
    },
  ) {
    return this.medicationService.updateMedication(id, {
      ...body,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete medication (soft delete)' })
  async deleteMedication(@Param('id') id: string) {
    return this.medicationService.deleteMedication(id);
  }

  @Get('elder/:elderId/upcoming-doses')
  @ApiOperation({ summary: 'Get upcoming doses for elder' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getUpcomingDoses(
    @Param('elderId') elderId: string,
    @Query('days', OptionalIntPipe) days?: number,
  ) {
    return this.medicationService.getUpcomingDoses(elderId, days);
  }

  @Post('doses/:doseId/mark-taken')
  @ApiOperation({ summary: 'Mark dose as taken' })
  async markDoseTaken(
    @Param('doseId') doseId: string,
    @Body() body?: { takenAt?: string },
  ) {
    return this.medicationService.markDoseTaken(
      doseId,
      body?.takenAt ? new Date(body.takenAt) : undefined,
    );
  }

  @Post('doses/:doseId/mark-missed')
  @ApiOperation({ summary: 'Mark dose as missed' })
  async markDoseMissed(@Param('doseId') doseId: string) {
    return this.medicationService.markDoseMissed(doseId);
  }

  @Get('elder/:elderId/adherence')
  @ApiOperation({ summary: 'Get medication adherence statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getAdherenceStats(
    @Param('elderId') elderId: string,
    @Query('days', OptionalIntPipe) days?: number,
  ) {
    return this.medicationService.getAdherenceStats(elderId, days);
  }
}
