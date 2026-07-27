import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ElderProfileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get unified elder profile with ALL data from all systems:
   * - Personal information
   * - Smart home status
   * - Health vitals
   * - Alerts
   * - Medications
   * - Appointments
   * - Care plan & tasks
   */
  async getUnifiedProfile(elderId: string) {
    const profile = await this.prisma.elderProfile.findUnique({
      where: { id: elderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        // Smart Home Data
        home: {
          include: {
            zones: {
              include: {
                devices: {
                  where: {
                    status: {
                      in: ['ONLINE', 'OFFLINE'],
                    },
                  },
                  include: {
                    deviceType: true,
                    sensors: true,
                    actuators: true,
                  },
                },
              },
            },
            automationRules: {
              where: {
                isEnabled: true,
              },
            },
            emergencyScenarios: {
              where: {
                isEnabled: true,
              },
            },
          },
        },
        // Health Data
        vitals: {
          take: 20,
          orderBy: {
            recordedAt: 'desc',
          },
        },
        // Alerts
        alerts: {
          where: {
            status: {
              in: ['ACTIVE', 'ACKNOWLEDGED'],
            },
          },
          orderBy: {
            triggeredAt: 'desc',
          },
          take: 50,
        },
        // Care Plan
        carePlan: {
          include: {
            tasks: {
              where: {
                status: {
                  not: 'COMPLETED',
                },
              },
              orderBy: {
                dueDate: 'asc',
              },
            },
          },
        },
        // Medications
        medications: {
          where: {
            isActive: true,
          },
          include: {
            doses: {
              where: {
                status: {
                  in: ['PENDING', 'MISSED'],
                },
                scheduledAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
              },
              orderBy: {
                scheduledAt: 'asc',
              },
            },
          },
        },
        // Appointments
        appointments: {
          where: {
            startTime: {
              gte: new Date(),
            },
            status: {
              not: 'CANCELLED',
            },
          },
          orderBy: {
            startTime: 'asc',
          },
          take: 10,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Elder profile ${elderId} not found`);
    }

    // Calculate summary statistics
    const summary = {
      health: {
        latestVitals: profile.vitals[0] || null,
        totalVitals: profile.vitals.length,
        activeAlerts: profile.alerts.filter(a => a.status === 'ACTIVE').length,
        criticalAlerts: profile.alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length,
      },
      smartHome: {
        isConfigured: !!profile.home,
        totalDevices: profile.home?.zones.reduce((sum, zone) => sum + zone.devices.length, 0) || 0,
        onlineDevices: profile.home?.zones.reduce(
          (sum, zone) => sum + zone.devices.filter(d => d.status === 'ONLINE').length,
          0,
        ) || 0,
        offlineDevices: profile.home?.zones.reduce(
          (sum, zone) => sum + zone.devices.filter(d => d.status === 'OFFLINE').length,
          0,
        ) || 0,
        totalZones: profile.home?.zones.length || 0,
        activeRules: profile.home?.automationRules.length || 0,
        activeScenarios: profile.home?.emergencyScenarios.length || 0,
      },
      care: {
        hasCarePlan: !!profile.carePlan,
        pendingTasks: profile.carePlan?.tasks.length || 0,
        activeMedications: profile.medications.length,
        missedDoses: profile.medications.reduce(
          (sum, med) => sum + med.doses.filter(d => d.status === 'MISSED').length,
          0,
        ),
        upcomingAppointments: profile.appointments.length,
        nextAppointment: profile.appointments[0] || null,
      },
    };

    return {
      profile,
      summary,
    };
  }

  /**
   * Get elder dashboard data - optimized for family portal
   */
  async getDashboardData(elderId: string) {
    const { profile, summary } = await this.getUnifiedProfile(elderId);

    // Get recent activity
    const recentSensorEvents = profile.home
      ? await this.prisma.sensorEvent.findMany({
          where: {
            homeId: profile.home.id,
            severity: {
              in: ['WARNING', 'CRITICAL'],
            },
          },
          include: {
            sensor: true,
            device: {
              include: {
                zone: true,
              },
            },
          },
          orderBy: {
            occurredAt: 'desc',
          },
          take: 10,
        })
      : [];

    return {
      elder: {
        id: profile.id,
        name: `${profile.user.firstName} ${profile.user.lastName}`,
        age: Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
        gender: profile.gender,
        medicalRecordNo: profile.medicalRecordNo,
        address: profile.address,
        emergencyContact: profile.emergencyContact,
        status: profile.status,
      },
      summary,
      recentAlerts: profile.alerts.slice(0, 5),
      recentVitals: profile.vitals.slice(0, 5),
      recentEvents: recentSensorEvents,
      upcomingTasks: profile.carePlan?.tasks.slice(0, 5) || [],
      upcomingAppointments: profile.appointments.slice(0, 3),
      pendingMedications: profile.medications
        .flatMap(med => med.doses.filter(d => d.status === 'PENDING'))
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
        .slice(0, 5),
    };
  }

  /**
   * Get elder health overview
   */
  async getHealthOverview(elderId: string) {
    const profile = await this.prisma.elderProfile.findUnique({
      where: { id: elderId },
      include: {
        vitals: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 100,
        },
        medications: {
          where: {
            isActive: true,
          },
          include: {
            doses: {
              where: {
                scheduledAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            },
          },
        },
        alerts: {
          where: {
            type: {
              in: ['VITAL_ABNORMAL', 'MEDICATION_MISSED'],
            },
          },
          orderBy: {
            triggeredAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Elder profile ${elderId} not found`);
    }

    // Group vitals by type
    const vitalsByType: Record<string, any[]> = {};
    profile.vitals.forEach(vital => {
      if (!vitalsByType[vital.vitalType]) {
        vitalsByType[vital.vitalType] = [];
      }
      vitalsByType[vital.vitalType].push(vital);
    });

    // Calculate medication adherence
    const totalDoses = profile.medications.reduce((sum, med) => sum + med.doses.length, 0);
    const takenDoses = profile.medications.reduce(
      (sum, med) => sum + med.doses.filter(d => d.status === 'TAKEN').length,
      0,
    );
    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 100;

    return {
      vitals: vitalsByType,
      medications: profile.medications,
      adherence: {
        rate: Math.round(adherenceRate),
        totalDoses,
        takenDoses,
        missedDoses: totalDoses - takenDoses,
      },
      alerts: profile.alerts,
    };
  }

  /**
   * Create or update elder profile
   */
  async createElderProfile(data: {
    userId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    medicalRecordNo: string;
    bloodType?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    emergencyContact?: any;
    medicalConditions?: any;
    allergies?: any;
  }) {
    // Medications are a separate relation, not a column on ElderProfile - they
    // are created through the medication endpoints once the profile exists.
    return this.prisma.elderProfile.create({
      data,
      include: {
        user: true,
      },
    });
  }

  async updateElderProfile(elderId: string, data: any) {
    return this.prisma.elderProfile.update({
      where: { id: elderId },
      data,
      include: {
        user: true,
      },
    });
  }

  /**
   * Get all elders (for admin/caregiver)
   */
  async getAllElders() {
    return this.prisma.elderProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        home: {
          select: {
            id: true,
            name: true,
          },
        },
        alerts: {
          where: {
            status: 'ACTIVE',
            severity: 'CRITICAL',
          },
        },
      },
      orderBy: {
        user: {
          lastName: 'asc',
        },
      },
    });
  }
}
