import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { CreateMedicationScheduleDto } from './dto/create-medication-schedule.dto';
import { LogAdministrationDto } from './dto/log-administration.dto';
import { startOfDay, endOfDay, subDays, parseISO } from 'date-fns';

@Injectable()
export class MedicationsService {
  constructor(private prisma: PrismaService) {}

  // Medications
  async createMedication(dto: CreateMedicationDto) {
    return this.prisma.medication.create({
      data: {
        elderId: dto.elderId,
        name: dto.name,
        genericName: dto.genericName,
        strength: dto.strength,
        form: dto.form,
        route: dto.route,
        prescribedBy: dto.prescribedBy,
        indication: dto.indication,
        notes: dto.notes,
        active: dto.active !== false,
      },
    });
  }

  async getMedicationsByElder(elderId: string, activeOnly: boolean = true) {
    return this.prisma.medication.findMany({
      where: {
        elderId,
        ...(activeOnly && { active: true }),
      },
      include: {
        schedules: {
          where: {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
        },
        _count: {
          select: {
            administrationLog: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMedication(id: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
      include: {
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
        schedules: true,
      },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    return medication;
  }

  async updateMedication(id: string, data: Partial<CreateMedicationDto>) {
    return this.prisma.medication.update({
      where: { id },
      data,
    });
  }

  // Medication Schedules
  async createSchedule(dto: CreateMedicationScheduleDto) {
    return this.prisma.medicationSchedule.create({
      data: {
        medicationId: dto.medicationId,
        dosage: dto.dosage,
        frequencyType: dto.frequencyType,
        timesOfDay: dto.timesOfDay,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        requiresFood: dto.requiresFood || false,
        isCritical: dto.isCritical || false,
      },
      include: {
        medication: true,
      },
    });
  }

  // Today's Medications Timeline
  async getTodaysMedications(elderId: string) {
    const today = new Date();
    const medications = await this.prisma.medication.findMany({
      where: {
        elderId,
        active: true,
      },
      include: {
        schedules: {
          where: {
            startDate: { lte: today },
            OR: [
              { endDate: null },
              { endDate: { gte: today } },
            ],
          },
        },
      },
    });

    // Build timeline for today
    const timeline = [];
    for (const med of medications) {
      for (const schedule of med.schedules) {
        for (const time of schedule.timesOfDay) {
          // Check if already administered
          const [hours, minutes] = time.split(':');
          const plannedDateTime = new Date(today);
          plannedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          const log = await this.prisma.medicationAdministrationLog.findFirst({
            where: {
              medicationId: med.id,
              scheduleId: schedule.id,
              plannedTime: {
                gte: startOfDay(today),
                lte: endOfDay(today),
              },
            },
          });

          timeline.push({
            medication: med,
            schedule,
            time,
            plannedDateTime,
            status: log?.status || 'PENDING',
            administrationLog: log,
            isCritical: schedule.isCritical,
          });
        }
      }
    }

    // Sort by time
    timeline.sort((a, b) => a.plannedDateTime.getTime() - b.plannedDateTime.getTime());

    return timeline;
  }

  // Log Administration
  async logAdministration(dto: LogAdministrationDto, userId: string) {
    const log = await this.prisma.medicationAdministrationLog.create({
      data: {
        medicationId: dto.medicationId,
        scheduleId: dto.scheduleId,
        elderId: dto.elderId,
        administeredByUserId: userId,
        plannedTime: new Date(dto.plannedTime),
        status: dto.status,
        actualTime: dto.actualTime ? new Date(dto.actualTime) : null,
        notes: dto.notes,
      },
      include: {
        medication: true,
        schedule: true,
        administeredBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Create alert if medication was missed and is critical
    if (dto.status === 'MISSED') {
      const medication = await this.prisma.medication.findUnique({
        where: { id: dto.medicationId },
        include: { schedules: true },
      });

      const schedule = medication.schedules.find((s) => s.id === dto.scheduleId);
      if (schedule?.isCritical) {
        await this.prisma.alert.create({
          data: {
            elderId: dto.elderId,
            type: 'MED_MISSED',
            severity: 'WARNING',
            title: 'Critical Medication Missed',
            message: `${medication.name} (${medication.strength}) was missed at scheduled time`,
            sourceEntityType: 'MedicationAdministrationLog',
            sourceEntityId: log.id,
          },
        });
      }
    }

    return log;
  }

  // Adherence Report
  async getAdherenceReport(elderId: string, days: number = 30) {
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const logs = await this.prisma.medicationAdministrationLog.findMany({
      where: {
        elderId,
        plannedTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        medication: true,
      },
    });

    const total = logs.length;
    const taken = logs.filter((l) => l.status === 'TAKEN').length;
    const missed = logs.filter((l) => l.status === 'MISSED').length;
    const refused = logs.filter((l) => l.status === 'REFUSED').length;
    const skipped = logs.filter((l) => l.status === 'SKIPPED').length;

    // Group by medication
    const byMedication = {};
    for (const log of logs) {
      const medId = log.medication.id;
      if (!byMedication[medId]) {
        byMedication[medId] = {
          medication: log.medication,
          total: 0,
          taken: 0,
          missed: 0,
          refused: 0,
          adherenceRate: 0,
        };
      }
      byMedication[medId].total++;
      if (log.status === 'TAKEN') byMedication[medId].taken++;
      if (log.status === 'MISSED') byMedication[medId].missed++;
      if (log.status === 'REFUSED') byMedication[medId].refused++;
    }

    // Calculate adherence rates
    Object.values(byMedication).forEach((med: any) => {
      med.adherenceRate = med.total > 0 ? (med.taken / med.total) * 100 : 0;
    });

    return {
      period: {
        startDate,
        endDate,
        days,
      },
      overall: {
        total,
        taken,
        missed,
        refused,
        skipped,
        adherenceRate: total > 0 ? (taken / total) * 100 : 0,
      },
      byMedication: Object.values(byMedication),
    };
  }

  // Get administration history
  async getAdministrationHistory(elderId: string, limit: number = 50) {
    return this.prisma.medicationAdministrationLog.findMany({
      where: { elderId },
      include: {
        medication: true,
        schedule: true,
        administeredBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { plannedTime: 'desc' },
      take: limit,
    });
  }
}
