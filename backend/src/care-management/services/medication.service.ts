import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { EmailService } from '../../common/email/email.service';
import { MedicationFrequency, DoseStatus } from '@prisma/client';

@Injectable()
export class MedicationService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private emailService: EmailService,
  ) {}

  /**
   * Create medication for elder
   */
  async createMedication(data: {
    elderId: string;
    name: string;
    dosage: string;
    frequency: MedicationFrequency;
    startDate: Date;
    endDate?: Date;
    instructions?: string;
    sideEffects?: string;
    prescribedBy?: string;
    notes?: string;
  }) {
    const medication = await this.prisma.medication.create({
      data: {
        ...data,
        isActive: true,
      },
    });

    // Schedule doses based on frequency
    await this.scheduleDoses(medication.id, medication.frequency, medication.startDate, medication.endDate);

    this.logger.logEvent('Medication created', 'Medication', medication.id, {
      elderId: data.elderId,
      name: data.name,
      frequency: data.frequency,
    });

    return medication;
  }

  /**
   * Get all medications for elder
   */
  async getMedicationsByElder(elderId: string, includeInactive = false) {
    return this.prisma.medication.findMany({
      where: {
        elderId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        doses: {
          where: {
            scheduledAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          orderBy: {
            scheduledAt: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get medication by ID
   */
  async getMedicationById(medicationId: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id: medicationId },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
        doses: {
          orderBy: {
            scheduledAt: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!medication) {
      throw new NotFoundException(`Medication ${medicationId} not found`);
    }

    return medication;
  }

  /**
   * Update medication
   */
  async updateMedication(
    medicationId: string,
    data: {
      name?: string;
      dosage?: string;
      frequency?: MedicationFrequency;
      instructions?: string;
      sideEffects?: string;
      prescribedBy?: string;
      endDate?: Date;
      isActive?: boolean;
      notes?: string;
    },
  ) {
    const medication = await this.prisma.medication.update({
      where: { id: medicationId },
      data,
    });

    // If frequency changed, reschedule doses
    if (data.frequency) {
      await this.rescheduleFutureDoses(medicationId, data.frequency);
    }

    this.logger.logEvent('Medication updated', 'Medication', medicationId, {
      changes: Object.keys(data),
    });

    return medication;
  }

  /**
   * Delete medication (soft delete by marking inactive)
   */
  async deleteMedication(medicationId: string) {
    return this.prisma.medication.update({
      where: { id: medicationId },
      data: { isActive: false },
    });
  }

  /**
   * Get upcoming doses for elder
   */
  async getUpcomingDoses(elderId: string, days = 7) {
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.medicationDose.findMany({
      where: {
        medication: {
          elderId,
          isActive: true,
        },
        scheduledAt: {
          gte: new Date(),
          lte: endDate,
        },
        status: 'PENDING',
      },
      include: {
        medication: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  /**
   * Mark dose as taken
   */
  async markDoseTaken(doseId: string, takenAt?: Date) {
    const dose = await this.prisma.medicationDose.update({
      where: { id: doseId },
      data: {
        status: 'TAKEN',
        takenAt: takenAt || new Date(),
      },
      include: {
        medication: {
          include: {
            elder: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    this.logger.logEvent('Medication dose taken', 'MedicationDose', doseId, {
      medicationId: dose.medicationId,
      elderId: dose.medication.elderId,
    });

    return dose;
  }

  /**
   * Mark dose as missed
   */
  async markDoseMissed(doseId: string) {
    const dose = await this.prisma.medicationDose.update({
      where: { id: doseId },
      data: {
        status: 'MISSED',
      },
      include: {
        medication: {
          include: {
            elder: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Create alert for missed medication
    await this.prisma.alert.create({
      data: {
        elderId: dose.medication.elderId,
        type: 'MEDICATION_MISSED',
        severity: 'WARNING',
        status: 'ACTIVE',
        title: 'Medication Missed',
        message: `Missed dose of ${dose.medication.name} scheduled at ${dose.scheduledAt.toLocaleString()}`,
        metadata: {
          medicationId: dose.medicationId,
          doseId: dose.id,
        },
        triggeredAt: new Date(),
      },
    });

    this.logger.logSecurity('Medication dose missed', 'medium', {
      doseId,
      medicationId: dose.medicationId,
      elderId: dose.medication.elderId,
      medicationName: dose.medication.name,
    });

    // Send email notification if family members exist
    // TODO: Get family members and send email

    return dose;
  }

  /**
   * Get medication adherence statistics
   */
  async getAdherenceStats(elderId: string, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const doses = await this.prisma.medicationDose.findMany({
      where: {
        medication: {
          elderId,
          isActive: true,
        },
        scheduledAt: {
          gte: startDate,
          lte: new Date(),
        },
      },
    });

    const totalDoses = doses.length;
    const takenDoses = doses.filter(d => d.status === 'TAKEN').length;
    const missedDoses = doses.filter(d => d.status === 'MISSED').length;
    const pendingDoses = doses.filter(d => d.status === 'PENDING').length;

    const adherenceRate = totalDoses > 0 ? (takenDoses / (totalDoses - pendingDoses)) * 100 : 100;

    return {
      totalDoses,
      takenDoses,
      missedDoses,
      pendingDoses,
      adherenceRate: Math.round(adherenceRate * 10) / 10, // Round to 1 decimal
      period: {
        startDate,
        endDate: new Date(),
        days,
      },
    };
  }

  /**
   * Check for missed doses and create alerts (run periodically via cron)
   */
  async checkMissedDoses() {
    const now = new Date();
    const gracePeriod = 30 * 60 * 1000; // 30 minutes grace period

    const missedDoses = await this.prisma.medicationDose.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          lte: new Date(now.getTime() - gracePeriod),
        },
        medication: {
          isActive: true,
        },
      },
      include: {
        medication: {
          include: {
            elder: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    for (const dose of missedDoses) {
      await this.markDoseMissed(dose.id);
    }

    return { checkedDoses: missedDoses.length };
  }

  /**
   * Schedule doses for medication based on frequency
   */
  private async scheduleDoses(
    medicationId: string,
    frequency: MedicationFrequency,
    startDate: Date,
    endDate?: Date,
  ) {
    const schedules = this.generateDoseSchedule(frequency, startDate, endDate);

    const dosesToCreate = schedules.map(scheduledAt => ({
      medicationId,
      scheduledAt,
      status: 'PENDING' as DoseStatus,
    }));

    await this.prisma.medicationDose.createMany({
      data: dosesToCreate,
    });

    this.logger.debug('Medication doses scheduled', 'MedicationService', {
      medicationId,
      frequency,
      dosesCount: dosesToCreate.length,
    });
  }

  /**
   * Generate dose schedule based on frequency
   */
  private generateDoseSchedule(
    frequency: MedicationFrequency,
    startDate: Date,
    endDate?: Date,
  ): Date[] {
    const schedules: Date[] = [];
    const maxDays = 90; // Schedule up to 90 days in advance
    const finalDate = endDate || new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);

    let currentDate = new Date(startDate);

    const timeSlots = {
      ONCE_DAILY: [[9, 0]], // 9 AM
      TWICE_DAILY: [[9, 0], [21, 0]], // 9 AM, 9 PM
      THREE_TIMES_DAILY: [[9, 0], [14, 0], [21, 0]], // 9 AM, 2 PM, 9 PM
      FOUR_TIMES_DAILY: [[9, 0], [13, 0], [17, 0], [21, 0]], // 9 AM, 1 PM, 5 PM, 9 PM
    };

    const slots = timeSlots[frequency as keyof typeof timeSlots];

    if (!slots) {
      // For AS_NEEDED, WEEKLY, MONTHLY, CUSTOM - no automatic scheduling
      return schedules;
    }

    while (currentDate <= finalDate) {
      for (const [hour, minute] of slots) {
        const doseTime = new Date(currentDate);
        doseTime.setHours(hour, minute, 0, 0);

        if (doseTime >= startDate && doseTime <= finalDate) {
          schedules.push(new Date(doseTime));
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedules;
  }

  /**
   * Reschedule future doses when frequency changes
   */
  private async rescheduleFutureDoses(medicationId: string, newFrequency: MedicationFrequency) {
    // Delete future pending doses
    await this.prisma.medicationDose.deleteMany({
      where: {
        medicationId,
        status: 'PENDING',
        scheduledAt: {
          gte: new Date(),
        },
      },
    });

    // Get medication details
    const medication = await this.prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (medication) {
      // Create new schedule
      await this.scheduleDoses(
        medicationId,
        newFrequency,
        new Date(),
        medication.endDate || undefined,
      );
    }
  }
}
