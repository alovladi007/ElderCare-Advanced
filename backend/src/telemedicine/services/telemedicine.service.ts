import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logging/logger.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

// Twilio Video SDK types (will be initialized dynamically)
type TwilioClient = any;
type AgoraClient = any;

/**
 * Video consultation session interface
 */
export interface VideoSession {
  id: string;
  roomName: string;
  patientId: string;
  doctorId: string;
  token: string;
  expiresAt: Date;
  provider: 'twilio' | 'agora' | 'fallback';
  roomUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Medical context for video consultation
 */
export interface MedicalContext {
  patientId: string;
  demographics: {
    name: string;
    age: number;
    gender: string;
    bloodType?: string;
  };
  vitalSigns: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSaturation?: number;
    timestamp: Date;
  }[];
  activeConditions: string[];
  activeMedications: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  allergies: string[];
  recentVisits: {
    date: Date;
    doctor: string;
    diagnosis: string;
  }[];
  labResults?: any[];
}

/**
 * FHIR Resource interface (HL7 FHIR standard)
 */
export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
  [key: string]: any;
}

/**
 * Prescription interface
 */
export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  consultationId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refills: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

/**
 * RPM (Remote Patient Monitoring) billing codes
 */
export enum RPMCode {
  SETUP = '99453', // Initial setup and patient education
  DEVICE_SUPPLY = '99454', // Device supply with daily recording/transmission
  FIRST_20_MIN = '99457', // First 20 minutes of clinical staff time
  ADDITIONAL_20_MIN = '99458', // Each additional 20 minutes
}

export interface RPMBillingRecord {
  id: string;
  patientId: string;
  providerId: string;
  cptCode: string;
  month: string;
  minutesTracked?: number;
  daysOfData?: number;
  status: 'pending' | 'submitted' | 'approved' | 'denied';
  amount?: number;
  createdAt: Date;
}

/**
 * Telemedicine Service
 * Handles video consultations, EHR integration, prescriptions, and RPM billing
 */
@Injectable()
export class TelemedicineService {
  private twilioClient: TwilioClient | null = null;
  private agoraClient: AgoraClient | null = null;
  private videoProvider: 'twilio' | 'agora' | 'fallback';

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    private prisma: PrismaService,
  ) {
    this.initializeVideoProviders();
  }

  /**
   * Initialize video providers with fallback
   */
  private initializeVideoProviders() {
    const twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const agoraAppId = this.configService.get<string>('AGORA_APP_ID');

    // Try Twilio first
    if (twilioAccountSid && twilioAuthToken) {
      try {
        // Dynamic import to avoid errors if package not installed
        const twilio = require('twilio');
        this.twilioClient = twilio(twilioAccountSid, twilioAuthToken);
        this.videoProvider = 'twilio';
        this.logger.log('Twilio Video initialized successfully', 'TelemedicineService');
        return;
      } catch (error) {
        this.logger.warn('Twilio SDK not available, trying Agora', 'TelemedicineService');
      }
    }

    // Try Agora as fallback
    if (agoraAppId) {
      try {
        const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
        this.agoraClient = { RtcTokenBuilder, RtcRole };
        this.videoProvider = 'agora';
        this.logger.log('Agora Video initialized successfully', 'TelemedicineService');
        return;
      } catch (error) {
        this.logger.warn('Agora SDK not available', 'TelemedicineService');
      }
    }

    // Fallback to simple WebRTC
    this.videoProvider = 'fallback';
    this.logger.warn(
      'No video provider configured - using fallback mode',
      'TelemedicineService',
    );
  }

  /**
   * Create video consultation session
   */
  async createVideoSession(data: {
    patientId: string;
    doctorId: string;
    scheduledTime?: Date;
    duration?: number; // in minutes
  }): Promise<VideoSession> {
    try {
      const roomName = `consultation-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const expiresAt = new Date(Date.now() + (data.duration || 60) * 60 * 1000);

      let token: string;
      let roomUrl: string | undefined;

      // Generate token based on provider
      if (this.videoProvider === 'twilio' && this.twilioClient) {
        token = await this.generateTwilioToken(roomName, data.patientId, data.doctorId);
        roomUrl = `https://video.twilio.com/rooms/${roomName}`;
      } else if (this.videoProvider === 'agora' && this.agoraClient) {
        token = this.generateAgoraToken(roomName, data.patientId);
        roomUrl = `agora://${roomName}`;
      } else {
        // Fallback: generate simple JWT-like token
        token = this.generateFallbackToken(roomName, data.patientId, data.doctorId);
        roomUrl = `/video/room/${roomName}`;
      }

      // Store session in database
      const session = await this.prisma.telemedicineSession.create({
        data: {
          roomName,
          patientId: data.patientId,
          doctorId: data.doctorId,
          token,
          provider: this.videoProvider,
          roomUrl,
          scheduledTime: data.scheduledTime,
          duration: data.duration || 60,
          status: 'scheduled',
          expiresAt,
        },
      });

      this.logger.logEvent('Video session created', 'VideoSession', session.id, {
        provider: this.videoProvider,
        patientId: data.patientId,
        doctorId: data.doctorId,
      });

      return {
        id: session.id,
        roomName,
        patientId: data.patientId,
        doctorId: data.doctorId,
        token,
        expiresAt,
        provider: this.videoProvider,
        roomUrl,
      };
    } catch (error) {
      this.logger.error('Failed to create video session', '', 'TelemedicineService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Failed to create video session');
    }
  }

  /**
   * Generate Twilio video token
   */
  private async generateTwilioToken(
    roomName: string,
    patientId: string,
    doctorId: string,
  ): Promise<string> {
    const AccessToken = require('twilio').jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(
      this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      this.configService.get<string>('TWILIO_API_KEY_SID'),
      this.configService.get<string>('TWILIO_API_KEY_SECRET'),
    );

    token.identity = `patient-${patientId}`;
    const videoGrant = new VideoGrant({
      room: roomName,
    });
    token.addGrant(videoGrant);

    return token.toJwt();
  }

  /**
   * Generate Agora video token
   */
  private generateAgoraToken(roomName: string, userId: string): string {
    const { RtcTokenBuilder, RtcRole } = this.agoraClient;
    const appId = this.configService.get<string>('AGORA_APP_ID');
    const appCertificate = this.configService.get<string>('AGORA_APP_CERTIFICATE');
    const channelName = roomName;
    const uid = parseInt(userId.slice(-8), 16) || 0; // Convert part of userId to number
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
    );
  }

  /**
   * Generate fallback token (simple JWT-like)
   */
  private generateFallbackToken(roomName: string, patientId: string, doctorId: string): string {
    const payload = {
      room: roomName,
      patientId,
      doctorId,
      iat: Date.now(),
      exp: Date.now() + 3600000, // 1 hour
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Build medical context for doctor
   */
  async buildMedicalContext(patientId: string): Promise<MedicalContext> {
    try {
      // Fetch patient data
      const patient = await this.prisma.user.findUnique({
        where: { id: patientId },
        include: {
          elderProfile: {
            include: {
              medicalConditions: true,
              medications: true,
              allergies: true,
            },
          },
        },
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      // Fetch recent vital signs
      const vitalSigns = await this.prisma.vitalSigns.findMany({
        where: { userId: patientId },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      // Fetch recent consultations
      const recentVisits = await this.prisma.telemedicineSession.findMany({
        where: {
          patientId,
          status: 'completed',
        },
        orderBy: { scheduledTime: 'desc' },
        take: 5,
        include: {
          doctor: true,
        },
      });

      const context: MedicalContext = {
        patientId,
        demographics: {
          name: patient.name,
          age: this.calculateAge(patient.dateOfBirth || new Date()),
          gender: patient.elderProfile?.gender || 'unknown',
          bloodType: patient.elderProfile?.bloodType,
        },
        vitalSigns: vitalSigns.map(vs => ({
          heartRate: vs.heartRate || undefined,
          bloodPressure: vs.bloodPressure || undefined,
          temperature: vs.temperature || undefined,
          oxygenSaturation: vs.oxygenSaturation || undefined,
          timestamp: vs.timestamp,
        })),
        activeConditions: patient.elderProfile?.medicalConditions.map(c => c.name) || [],
        activeMedications:
          patient.elderProfile?.medications.map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
          })) || [],
        allergies: patient.elderProfile?.allergies.map(a => a.allergen) || [],
        recentVisits: recentVisits.map(v => ({
          date: v.scheduledTime || v.createdAt,
          doctor: v.doctor.name,
          diagnosis: v.diagnosis || 'N/A',
        })),
      };

      this.logger.logEvent('Medical context built', 'MedicalContext', patientId, {
        conditionsCount: context.activeConditions.length,
        medicationsCount: context.activeMedications.length,
      });

      return context;
    } catch (error) {
      this.logger.error('Failed to build medical context', '', 'TelemedicineService', {
        error: (error as Error).message,
        patientId,
      });
      throw error;
    }
  }

  /**
   * Stream vital signs during consultation
   */
  async streamVitalSigns(sessionId: string, vitalSigns: any) {
    try {
      // Store vital signs
      const session = await this.prisma.telemedicineSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      const vital = await this.prisma.vitalSigns.create({
        data: {
          userId: session.patientId,
          heartRate: vitalSigns.heartRate,
          bloodPressure: vitalSigns.bloodPressure,
          temperature: vitalSigns.temperature,
          oxygenSaturation: vitalSigns.oxygenSaturation,
          timestamp: new Date(),
          source: 'telemedicine_session',
        },
      });

      // Emit real-time update via WebSocket (implementation depends on your WebSocket setup)
      // this.eventEmitter.emit('vitals.update', { sessionId, vitalSigns });

      return vital;
    } catch (error) {
      this.logger.error('Failed to stream vital signs', '', 'TelemedicineService', {
        error: (error as Error).message,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Export patient data to FHIR format (HL7 FHIR standard)
   */
  async exportToFHIR(patientId: string): Promise<FHIRResource[]> {
    try {
      const context = await this.buildMedicalContext(patientId);
      const resources: FHIRResource[] = [];

      // Patient resource
      resources.push({
        resourceType: 'Patient',
        id: patientId,
        name: [{ text: context.demographics.name }],
        gender: context.demographics.gender.toLowerCase(),
        birthDate: this.calculateBirthDate(context.demographics.age),
      });

      // Observation resources (vital signs)
      context.vitalSigns.forEach((vital, index) => {
        if (vital.heartRate) {
          resources.push({
            resourceType: 'Observation',
            id: `obs-hr-${index}`,
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '8867-4',
                  display: 'Heart rate',
                },
              ],
            },
            subject: { reference: `Patient/${patientId}` },
            effectiveDateTime: vital.timestamp.toISOString(),
            valueQuantity: {
              value: vital.heartRate,
              unit: 'beats/minute',
              system: 'http://unitsofmeasure.org',
              code: '/min',
            },
          });
        }
      });

      // Condition resources
      context.activeConditions.forEach((condition, index) => {
        resources.push({
          resourceType: 'Condition',
          id: `cond-${index}`,
          subject: { reference: `Patient/${patientId}` },
          code: {
            text: condition,
          },
          clinicalStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
              },
            ],
          },
        });
      });

      // MedicationStatement resources
      context.activeMedications.forEach((medication, index) => {
        resources.push({
          resourceType: 'MedicationStatement',
          id: `med-${index}`,
          status: 'active',
          medicationCodeableConcept: {
            text: medication.name,
          },
          subject: { reference: `Patient/${patientId}` },
          dosage: [
            {
              text: `${medication.dosage} ${medication.frequency}`,
            },
          ],
        });
      });

      this.logger.logEvent('FHIR export completed', 'FHIR', patientId, {
        resourceCount: resources.length,
      });

      return resources;
    } catch (error) {
      this.logger.error('Failed to export to FHIR', '', 'TelemedicineService', {
        error: (error as Error).message,
        patientId,
      });
      throw error;
    }
  }

  /**
   * Create prescription
   */
  async createPrescription(data: {
    patientId: string;
    doctorId: string;
    consultationId: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    refills?: number;
  }): Promise<Prescription> {
    try {
      const prescription = await this.prisma.prescription.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          consultationId: data.consultationId,
          medication: data.medication,
          dosage: data.dosage,
          frequency: data.frequency,
          duration: data.duration,
          instructions: data.instructions,
          refills: data.refills || 0,
          status: 'pending',
        },
      });

      this.logger.logEvent('Prescription created', 'Prescription', prescription.id, {
        medication: data.medication,
        patientId: data.patientId,
      });

      // Send notification to patient (implement notification service)
      // await this.notificationService.sendPrescriptionNotification(prescription);

      return {
        id: prescription.id,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        consultationId: prescription.consultationId,
        medication: prescription.medication,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        instructions: prescription.instructions || undefined,
        refills: prescription.refills,
        status: prescription.status as any,
        createdAt: prescription.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create prescription', '', 'TelemedicineService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Failed to create prescription');
    }
  }

  /**
   * Track RPM billing (Remote Patient Monitoring)
   */
  async trackRPMBilling(data: {
    patientId: string;
    providerId: string;
    cptCode: RPMCode;
    month: string;
    minutesTracked?: number;
    daysOfData?: number;
  }): Promise<RPMBillingRecord> {
    try {
      // Validate CPT code requirements
      this.validateRPMCode(data.cptCode, data.minutesTracked, data.daysOfData);

      const record = await this.prisma.rpmBillingRecord.create({
        data: {
          patientId: data.patientId,
          providerId: data.providerId,
          cptCode: data.cptCode,
          month: data.month,
          minutesTracked: data.minutesTracked,
          daysOfData: data.daysOfData,
          status: 'pending',
          amount: this.calculateRPMAmount(data.cptCode),
        },
      });

      this.logger.logEvent('RPM billing record created', 'RPMBilling', record.id, {
        cptCode: data.cptCode,
        month: data.month,
      });

      return {
        id: record.id,
        patientId: record.patientId,
        providerId: record.providerId,
        cptCode: record.cptCode,
        month: record.month,
        minutesTracked: record.minutesTracked || undefined,
        daysOfData: record.daysOfData || undefined,
        status: record.status as any,
        amount: record.amount || undefined,
        createdAt: record.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to track RPM billing', '', 'TelemedicineService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Failed to track RPM billing');
    }
  }

  /**
   * Validate RPM code requirements
   */
  private validateRPMCode(code: RPMCode, minutes?: number, days?: number) {
    switch (code) {
      case RPMCode.SETUP:
        // 99453: No special requirements
        break;
      case RPMCode.DEVICE_SUPPLY:
        // 99454: Requires 16 days of data
        if (!days || days < 16) {
          throw new BadRequestException('99454 requires at least 16 days of data');
        }
        break;
      case RPMCode.FIRST_20_MIN:
        // 99457: Requires 20 minutes of clinical staff time
        if (!minutes || minutes < 20) {
          throw new BadRequestException('99457 requires at least 20 minutes');
        }
        break;
      case RPMCode.ADDITIONAL_20_MIN:
        // 99458: Requires additional 20 minutes
        if (!minutes || minutes < 20) {
          throw new BadRequestException('99458 requires at least 20 minutes');
        }
        break;
    }
  }

  /**
   * Calculate RPM billing amount
   */
  private calculateRPMAmount(code: RPMCode): number {
    const amounts = {
      [RPMCode.SETUP]: 19.19,
      [RPMCode.DEVICE_SUPPLY]: 64.48,
      [RPMCode.FIRST_20_MIN]: 50.72,
      [RPMCode.ADDITIONAL_20_MIN]: 41.21,
    };
    return amounts[code];
  }

  /**
   * Start recording consultation
   */
  async startRecording(sessionId: string): Promise<{ recordingId: string }> {
    try {
      const session = await this.prisma.telemedicineSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      let recordingId: string;

      if (this.videoProvider === 'twilio' && this.twilioClient) {
        // Start Twilio recording
        const recording = await this.twilioClient.video.v1
          .rooms(session.roomName)
          .recordings.create();
        recordingId = recording.sid;
      } else {
        // Generate fallback recording ID
        recordingId = `rec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      }

      await this.prisma.telemedicineSession.update({
        where: { id: sessionId },
        data: { recordingId },
      });

      this.logger.logEvent('Consultation recording started', 'Recording', recordingId, {
        sessionId,
      });

      return { recordingId };
    } catch (error) {
      this.logger.error('Failed to start recording', '', 'TelemedicineService', {
        error: (error as Error).message,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Share patient data with doctor
   */
  async shareDataWithDoctor(data: {
    patientId: string;
    doctorId: string;
    dataTypes: string[];
    expiresAt?: Date;
  }) {
    try {
      const permission = await this.prisma.dataSharePermission.create({
        data: {
          patientId: data.patientId,
          sharedWithId: data.doctorId,
          dataTypes: data.dataTypes,
          expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'active',
        },
      });

      this.logger.logEvent('Data shared with doctor', 'DataShare', permission.id, {
        patientId: data.patientId,
        doctorId: data.doctorId,
        dataTypes: data.dataTypes,
      });

      return permission;
    } catch (error) {
      this.logger.error('Failed to share data', '', 'TelemedicineService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * End video session
   */
  async endVideoSession(sessionId: string) {
    try {
      const session = await this.prisma.telemedicineSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          endedAt: new Date(),
        },
      });

      // Stop recording if active
      if (session.recordingId && this.videoProvider === 'twilio' && this.twilioClient) {
        try {
          await this.twilioClient.video.v1
            .rooms(session.roomName)
            .recordings(session.recordingId)
            .update({ status: 'stopped' });
        } catch (error) {
          this.logger.warn('Failed to stop recording', 'TelemedicineService', {
            error: (error as Error).message,
          });
        }
      }

      this.logger.logEvent('Video session ended', 'VideoSession', sessionId, {});

      return session;
    } catch (error) {
      this.logger.error('Failed to end video session', '', 'TelemedicineService', {
        error: (error as Error).message,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Get consultation history
   */
  async getConsultationHistory(patientId: string, limit = 10) {
    return this.prisma.telemedicineSession.findMany({
      where: { patientId },
      orderBy: { scheduledTime: 'desc' },
      take: limit,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Helper: Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Helper: Calculate birth date from age (approximate)
   */
  private calculateBirthDate(age: number): string {
    const year = new Date().getFullYear() - age;
    return `${year}-01-01`;
  }
}
