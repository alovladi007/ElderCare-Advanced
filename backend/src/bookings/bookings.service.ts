import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { BookingStatus, PreferredTime } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    fullName: string;
    email: string;
    phone: string;
    serviceType: string;
    preferredDate: Date;
    preferredTime: PreferredTime;
    address?: string;
    specialNeeds?: string;
  }) {
    return this.prisma.booking.create({
      data: {
        ...data,
        status: 'PENDING',
      },
      include: {
        service: true,
      },
    });
  }

  async findAll(filters?: {
    status?: BookingStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.preferredDate = {};
      if (filters.startDate) {
        where.preferredDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.preferredDate.lte = filters.endDate;
      }
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    return booking;
  }

  async update(id: string, data: {
    status?: BookingStatus;
    notes?: string;
  }) {
    return this.prisma.booking.update({
      where: { id },
      data,
      include: {
        service: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.booking.delete({
      where: { id },
    });
  }

  async getStats() {
    const total = await this.prisma.booking.count();
    const pending = await this.prisma.booking.count({ where: { status: 'PENDING' } });
    const confirmed = await this.prisma.booking.count({ where: { status: 'CONFIRMED' } });
    const completed = await this.prisma.booking.count({ where: { status: 'COMPLETED' } });

    return {
      total,
      pending,
      confirmed,
      completed,
    };
  }
}
