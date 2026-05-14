import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { EmailService } from '../../common/email/email.service';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private emailService: EmailService,
  ) {}

  /**
   * Create appointment
   */
  async createAppointment(data: {
    elderId: string;
    title: string;
    type: AppointmentType;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    attendees?: any;
    notes?: string;
  }) {
    const appointment = await this.prisma.appointment.create({
      data: {
        ...data,
        status: 'SCHEDULED',
      },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
      },
    });

    // Send confirmation email
    await this.emailService.sendAppointmentReminderEmail({
      to: appointment.elder.user.email,
      firstName: appointment.elder.user.firstName,
      appointmentDetails: {
        serviceType: data.title,
        date: data.startTime,
        clinicianName: data.attendees?.clinician || 'Healthcare Provider',
      },
    }).catch(error => {
      this.logger.error('Failed to send appointment email', '', 'AppointmentService', {
        appointmentId: appointment.id,
        error: (error as Error).message,
      });
    });

    this.logger.logEvent('Appointment created', 'Appointment', appointment.id, {
      elderId: data.elderId,
      type: data.type,
      startTime: data.startTime.toISOString(),
    });

    return appointment;
  }

  /**
   * Get appointments by elder
   */
  async getAppointmentsByElder(
    elderId: string,
    options?: {
      status?: AppointmentStatus;
      type?: AppointmentType;
      startDate?: Date;
      endDate?: Date;
      includeCompleted?: boolean;
    },
  ) {
    const where: any = { elderId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.startDate || options?.endDate) {
      where.startTime = {};
      if (options.startDate) {
        where.startTime.gte = options.startDate;
      }
      if (options.endDate) {
        where.startTime.lte = options.endDate;
      }
    }

    if (!options?.includeCompleted) {
      where.status = { not: 'COMPLETED' };
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }

    return appointment;
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(elderId: string, days = 30) {
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.appointment.findMany({
      where: {
        elderId,
        startTime: {
          gte: new Date(),
          lte: endDate,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Update appointment
   */
  async updateAppointment(
    appointmentId: string,
    data: {
      title?: string;
      type?: AppointmentType;
      description?: string;
      location?: string;
      startTime?: Date;
      endTime?: Date;
      status?: AppointmentStatus;
      attendees?: any;
      notes?: string;
    },
  ) {
    const appointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data,
      include: {
        elder: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.logEvent('Appointment updated', 'Appointment', appointmentId, {
      changes: Object.keys(data),
    });

    return appointment;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string) {
    const appointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
      },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.logEvent('Appointment cancelled', 'Appointment', appointmentId, {
      reason,
    });

    return appointment;
  }

  /**
   * Mark appointment as completed
   */
  async completeAppointment(appointmentId: string, notes?: string) {
    const appointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        notes,
      },
    });

    this.logger.logEvent('Appointment completed', 'Appointment', appointmentId, {});

    return appointment;
  }

  /**
   * Send reminders for upcoming appointments (run via cron)
   */
  async sendAppointmentReminders() {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: {
          gte: tomorrow,
          lte: dayAfterTomorrow,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const appointment of appointments) {
      await this.emailService.sendAppointmentReminderEmail({
        to: appointment.elder.user.email,
        firstName: appointment.elder.user.firstName,
        appointmentDetails: {
          serviceType: appointment.title,
          date: appointment.startTime,
          clinicianName: (appointment.attendees as any)?.clinician || 'Healthcare Provider',
        },
      }).catch(error => {
        this.logger.error('Failed to send appointment reminder', '', 'AppointmentService', {
          appointmentId: appointment.id,
          error: (error as Error).message,
        });
      });
    }

    this.logger.debug('Appointment reminders sent', 'AppointmentService', {
      count: appointments.length,
    });

    return { remindersSent: appointments.length };
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(elderId: string, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        elderId,
        startTime: {
          gte: startDate,
        },
      },
    });

    const totalAppointments = appointments.length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    const noShow = appointments.filter(a => a.status === 'NO_SHOW').length;
    const upcoming = appointments.filter(
      a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED',
    ).length;

    const attendanceRate = totalAppointments > 0 ? (completed / (totalAppointments - cancelled)) * 100 : 100;

    return {
      period: { days, startDate, endDate: new Date() },
      totalAppointments,
      completed,
      cancelled,
      noShow,
      upcoming,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    };
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(appointmentId: string) {
    return this.prisma.appointment.delete({
      where: { id: appointmentId },
    });
  }
}
