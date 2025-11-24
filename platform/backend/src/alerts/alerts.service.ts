import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertType, AlertSeverity } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async getAlerts(
    elderId?: string,
    severity?: AlertSeverity,
    resolved?: boolean,
    limit: number = 50,
  ) {
    const where: any = {};

    if (elderId) {
      where.elderId = elderId;
    }

    if (severity) {
      where.severity = severity;
    }

    if (resolved !== undefined) {
      if (resolved) {
        where.resolvedAt = { not: null };
      } else {
        where.resolvedAt = null;
      }
    }

    return this.prisma.alert.findMany({
      where,
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
        resolvedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAlert(id: string) {
    return this.prisma.alert.findUnique({
      where: { id },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
        resolvedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async resolveAlert(id: string, userId: string, notes?: string) {
    const alert = await this.prisma.alert.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedByUserId: userId,
      },
      include: {
        elder: {
          include: {
            user: true,
          },
        },
        resolvedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Optionally log the resolution
    if (notes) {
      await this.prisma.careNote.create({
        data: {
          elderId: alert.elderId,
          authorUserId: userId,
          category: 'GENERAL',
          content: `Alert resolved: ${alert.title}\nNotes: ${notes}`,
          visibleToFamily: true,
          visibleToCaregivers: true,
          visibleToClinicians: true,
        },
      });
    }

    return alert;
  }

  async getUnresolvedAlerts(elderId?: string) {
    return this.getAlerts(elderId, undefined, false, 100);
  }

  async getAlertsByType(elderId: string, type: AlertType) {
    return this.prisma.alert.findMany({
      where: {
        elderId,
        type,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAlertStats(elderId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const alerts = await this.prisma.alert.findMany({
      where: {
        elderId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    const total = alerts.length;
    const resolved = alerts.filter((a) => a.resolvedAt !== null).length;
    const unresolved = total - resolved;

    const bySeverity = {
      INFO: alerts.filter((a) => a.severity === 'INFO').length,
      WARNING: alerts.filter((a) => a.severity === 'WARNING').length,
      CRITICAL: alerts.filter((a) => a.severity === 'CRITICAL').length,
    };

    const byType = {};
    alerts.forEach((alert) => {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    });

    return {
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      total,
      resolved,
      unresolved,
      bySeverity,
      byType,
    };
  }
}
