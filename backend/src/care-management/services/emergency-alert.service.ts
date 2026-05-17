import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

interface AlertRecipient {
  type: 'HOSPITAL' | 'CLINIC' | 'POLICE' | 'FAMILY' | 'CAREGIVER';
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  priority: number; // 1 = highest, send immediately
}

interface EmergencyAlert {
  elderId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'MEDICAL' | 'FALL' | 'VITAL_ABNORMAL' | 'DEVICE_ALERT' | 'PANIC_BUTTON' | 'ENVIRONMENTAL';
  title: string;
  message: string;
  vitalData?: any;
  locationData?: any;
  metadata?: any;
}

@Injectable()
export class EmergencyAlertService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private config: ConfigService,
  ) {
    // Initialize SendGrid
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (apiKey && apiKey !== 'SG.test_key_replace_with_real_sendgrid_key') {
      sgMail.setApiKey(apiKey);
    }
  }

  /**
   * Trigger emergency alert - main entry point
   */
  async triggerEmergencyAlert(alert: EmergencyAlert) {
    this.logger.logSecurity('Emergency alert triggered', 'critical', {
      elderId: alert.elderId,
      type: alert.type,
      severity: alert.severity,
    });

    // 1. Get elder profile and emergency contacts
    const elder = await this.prisma.elder.findUnique({
      where: { id: alert.elderId },
      include: {
        emergencyContacts: {
          where: { active: true },
          orderBy: { isPrimary: 'desc' },
        },
        user: true,
      },
    });

    if (!elder) {
      throw new Error(`Elder not found: ${alert.elderId}`);
    }

    // 2. Get registered healthcare providers and emergency services
    const recipients = await this.getAlertRecipients(alert, elder);

    // 3. Generate comprehensive report
    const report = await this.generateEmergencyReport(alert, elder);

    // 4. Create alert record in database
    const alertRecord = await this.prisma.alert.create({
      data: {
        elderId: alert.elderId,
        type: alert.type,
        severity: alert.severity,
        status: 'ACTIVE',
        title: alert.title,
        message: alert.message,
        metadata: {
          ...alert.metadata,
          reportId: report.id,
          recipientCount: recipients.length,
        },
        triggeredAt: new Date(),
      },
    });

    // 5. Send alerts based on severity and type
    const notifications = await this.sendAlerts(
      recipients,
      alert,
      elder,
      report,
      alertRecord.id,
    );

    // 6. Log all notifications
    for (const notification of notifications) {
      await this.prisma.emergencyNotification.create({
        data: {
          alertId: alertRecord.id,
          recipientType: notification.recipientType,
          recipientName: notification.recipientName,
          recipientContact: notification.recipientContact,
          method: notification.method,
          status: notification.status,
          sentAt: new Date(),
          metadata: notification.metadata,
        },
      });
    }

    this.logger.logEvent('Emergency alert processed', 'EmergencyAlert', alertRecord.id, {
      elderId: alert.elderId,
      recipientCount: recipients.length,
      notificationsSent: notifications.filter(n => n.status === 'SENT').length,
    });

    return {
      alertId: alertRecord.id,
      reportId: report.id,
      recipientCount: recipients.length,
      notificationsSent: notifications.filter(n => n.status === 'SENT').length,
      notifications,
    };
  }

  /**
   * Get list of recipients for alert based on severity and type
   */
  private async getAlertRecipients(alert: EmergencyAlert, elder: any): Promise<AlertRecipient[]> {
    const recipients: AlertRecipient[] = [];

    // Always include primary emergency contact
    const primaryContact = elder.emergencyContacts.find(c => c.isPrimary);
    if (primaryContact) {
      recipients.push({
        type: 'FAMILY',
        name: primaryContact.name,
        email: primaryContact.email,
        phone: primaryContact.phone,
        address: primaryContact.address,
        priority: 1,
      });
    }

    // Add all emergency contacts for CRITICAL alerts
    if (alert.severity === 'CRITICAL') {
      elder.emergencyContacts.forEach((contact, index) => {
        if (!contact.isPrimary) {
          recipients.push({
            type: 'FAMILY',
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            priority: index + 2,
          });
        }
      });
    }

    // Get registered healthcare providers
    const healthcareProviders = await this.prisma.healthcareProvider.findMany({
      where: {
        elderId: elder.id,
        active: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });

    healthcareProviders.forEach(provider => {
      // Only notify hospitals/clinics for medical emergencies
      if (alert.type === 'MEDICAL' || alert.type === 'VITAL_ABNORMAL' || alert.severity === 'CRITICAL') {
        recipients.push({
          type: provider.type as 'HOSPITAL' | 'CLINIC',
          name: provider.name,
          email: provider.email,
          phone: provider.phone,
          address: provider.address,
          priority: provider.priority || 5,
        });
      }
    });

    // Get emergency services (police) for specific alert types
    if (
      alert.type === 'FALL' ||
      alert.type === 'PANIC_BUTTON' ||
      (alert.severity === 'CRITICAL' && alert.type === 'ENVIRONMENTAL')
    ) {
      const emergencyServices = await this.prisma.emergencyService.findMany({
        where: {
          elderId: elder.id,
          active: true,
        },
      });

      emergencyServices.forEach(service => {
        recipients.push({
          type: service.type as 'POLICE',
          name: service.name,
          email: service.email,
          phone: service.phone,
          address: service.address,
          priority: 1, // Highest priority for emergency services
        });
      });
    }

    // Sort by priority (lowest number = highest priority)
    return recipients.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate comprehensive emergency report
   */
  private async generateEmergencyReport(alert: EmergencyAlert, elder: any) {
    // Get recent vital signs (last 24 hours)
    const recentVitals = await this.prisma.vitalReading.findMany({
      where: {
        elderId: alert.elderId,
        recordedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });

    // Get active medications
    const medications = await this.prisma.medication.findMany({
      where: {
        elderId: alert.elderId,
        status: 'ACTIVE',
      },
    });

    // Get medical conditions and allergies
    const medicalHistory = await this.prisma.medicalHistory.findFirst({
      where: {
        elderId: alert.elderId,
      },
    });

    // Get recent alerts (last 7 days)
    const recentAlerts = await this.prisma.alert.findMany({
      where: {
        elderId: alert.elderId,
        triggeredAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        triggeredAt: 'desc',
      },
      take: 10,
    });

    // Create report record
    const report = await this.prisma.emergencyReport.create({
      data: {
        elderId: alert.elderId,
        alertType: alert.type,
        severity: alert.severity,
        title: `Emergency Report: ${alert.title}`,
        summary: alert.message,
        reportData: {
          alert: {
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            timestamp: new Date().toISOString(),
            vitalData: alert.vitalData,
            locationData: alert.locationData,
          },
          patient: {
            id: elder.id,
            firstName: elder.firstName,
            lastName: elder.lastName,
            dateOfBirth: elder.dateOfBirth,
            gender: elder.gender,
            bloodType: elder.bloodType,
            address: elder.address,
            city: elder.city,
            state: elder.state,
            zipCode: elder.zipCode,
          },
          medicalHistory: {
            conditions: medicalHistory?.conditions || [],
            allergies: medicalHistory?.allergies || [],
            surgeries: medicalHistory?.surgeries || [],
            chronicDiseases: medicalHistory?.chronicDiseases || [],
          },
          currentMedications: medications.map(med => ({
            name: med.medicationName,
            dosage: med.dosage,
            frequency: med.frequency,
            prescribedBy: med.prescribedBy,
          })),
          recentVitals: recentVitals.slice(0, 20).map(vital => ({
            type: vital.vitalType,
            value: vital.value,
            unit: vital.unit,
            systolic: vital.systolic,
            diastolic: vital.diastolic,
            recordedAt: vital.recordedAt,
          })),
          recentAlerts: recentAlerts.map(a => ({
            type: a.type,
            severity: a.severity,
            title: a.title,
            message: a.message,
            triggeredAt: a.triggeredAt,
          })),
          emergencyContacts: elder.emergencyContacts.map(contact => ({
            name: contact.name,
            relationship: contact.relationship,
            phone: contact.phone,
            email: contact.email,
            isPrimary: contact.isPrimary,
          })),
        },
        generatedAt: new Date(),
      },
    });

    return report;
  }

  /**
   * Send alerts to all recipients via appropriate channels
   */
  private async sendAlerts(
    recipients: AlertRecipient[],
    alert: EmergencyAlert,
    elder: any,
    report: any,
    alertId: string,
  ) {
    const notifications = [];

    for (const recipient of recipients) {
      // Send email if available
      if (recipient.email) {
        const emailResult = await this.sendEmailAlert(recipient, alert, elder, report, alertId);
        notifications.push(emailResult);
      }

      // Send SMS for CRITICAL alerts (would integrate with Twilio)
      if (recipient.phone && alert.severity === 'CRITICAL') {
        const smsResult = await this.sendSMSAlert(recipient, alert, elder, alertId);
        notifications.push(smsResult);
      }

      // For police/emergency services, also log for dispatcher follow-up
      if (recipient.type === 'POLICE' && alert.severity === 'CRITICAL') {
        const dispatchResult = await this.notifyEmergencyDispatch(recipient, alert, elder, report);
        notifications.push(dispatchResult);
      }
    }

    return notifications;
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(
    recipient: AlertRecipient,
    alert: EmergencyAlert,
    elder: any,
    report: any,
    alertId: string,
  ) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    const fromEmail = this.config.get<string>('EMAIL_FROM', 'noreply@eldercare.com');

    // Format email based on recipient type
    const subject = `[${alert.severity}] ${alert.title} - ${elder.firstName} ${elder.lastName}`;
    let htmlContent = '';

    if (recipient.type === 'HOSPITAL' || recipient.type === 'CLINIC') {
      htmlContent = this.generateHealthcareProviderEmail(recipient, alert, elder, report);
    } else if (recipient.type === 'POLICE') {
      htmlContent = this.generateEmergencyServicesEmail(recipient, alert, elder, report);
    } else {
      htmlContent = this.generateFamilyEmail(recipient, alert, elder, report);
    }

    try {
      // Only send if real SendGrid key is configured
      if (apiKey && apiKey !== 'SG.test_key_replace_with_real_sendgrid_key') {
        await sgMail.send({
          to: recipient.email!,
          from: fromEmail,
          subject,
          html: htmlContent,
        });

        return {
          recipientType: recipient.type,
          recipientName: recipient.name,
          recipientContact: recipient.email,
          method: 'EMAIL',
          status: 'SENT',
          metadata: { subject, alertId },
        };
      } else {
        // Log email that would be sent (for testing)
        this.logger.logEvent('Email alert (test mode)', 'EmergencyNotification', alertId, {
          to: recipient.email,
          subject,
          recipientType: recipient.type,
        });

        return {
          recipientType: recipient.type,
          recipientName: recipient.name,
          recipientContact: recipient.email,
          method: 'EMAIL',
          status: 'QUEUED',
          metadata: { subject, alertId, testMode: true },
        };
      }
    } catch (error) {
      this.logger.logError('Failed to send email alert', error, { recipient: recipient.name });
      return {
        recipientType: recipient.type,
        recipientName: recipient.name,
        recipientContact: recipient.email,
        method: 'EMAIL',
        status: 'FAILED',
        metadata: { error: error.message, alertId },
      };
    }
  }

  /**
   * Send SMS alert (Twilio integration)
   */
  private async sendSMSAlert(recipient: AlertRecipient, alert: EmergencyAlert, elder: any, alertId: string) {
    // TODO: Integrate with Twilio
    // For now, log SMS that would be sent
    const message = `EMERGENCY: ${alert.title} for ${elder.firstName} ${elder.lastName}. ${alert.message}. Contact: ${elder.emergencyContacts[0]?.phone || 'N/A'}`;

    this.logger.logEvent('SMS alert (not configured)', 'EmergencyNotification', alertId, {
      to: recipient.phone,
      message,
      recipientType: recipient.type,
    });

    return {
      recipientType: recipient.type,
      recipientName: recipient.name,
      recipientContact: recipient.phone,
      method: 'SMS',
      status: 'PENDING', // Would be 'SENT' with Twilio configured
      metadata: { message, alertId, requiresTwilio: true },
    };
  }

  /**
   * Notify emergency dispatch (for police/fire/ambulance)
   */
  private async notifyEmergencyDispatch(
    recipient: AlertRecipient,
    alert: EmergencyAlert,
    elder: any,
    report: any,
  ) {
    // Create dispatch record for manual follow-up
    const dispatch = await this.prisma.emergencyDispatch.create({
      data: {
        elderId: elder.id,
        reportId: report.id,
        serviceType: recipient.type,
        serviceName: recipient.name,
        serviceContact: recipient.phone || recipient.email,
        priority: 'IMMEDIATE',
        status: 'PENDING',
        incidentType: alert.type,
        incidentSeverity: alert.severity,
        location: {
          address: elder.address,
          city: elder.city,
          state: elder.state,
          zipCode: elder.zipCode,
          coordinates: alert.locationData,
        },
        patientInfo: {
          name: `${elder.firstName} ${elder.lastName}`,
          age: elder.dateOfBirth ? Math.floor((Date.now() - new Date(elder.dateOfBirth).getTime()) / 31557600000) : null,
          gender: elder.gender,
          bloodType: elder.bloodType,
        },
        notes: alert.message,
        createdAt: new Date(),
      },
    });

    this.logger.logSecurity('Emergency dispatch created', 'critical', {
      dispatchId: dispatch.id,
      serviceType: recipient.type,
      elderId: elder.id,
    });

    return {
      recipientType: recipient.type,
      recipientName: recipient.name,
      recipientContact: recipient.phone || recipient.email,
      method: 'DISPATCH',
      status: 'PENDING',
      metadata: { dispatchId: dispatch.id },
    };
  }

  /**
   * Generate email for healthcare providers
   */
  private generateHealthcareProviderEmail(
    recipient: AlertRecipient,
    alert: EmergencyAlert,
    elder: any,
    report: any,
  ): string {
    const reportData = report.reportData as any;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .critical { background: #dc2626; }
          .high { background: #f59e0b; }
          .content { padding: 20px; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="header ${alert.severity.toLowerCase()}">
          <h1>🚨 EMERGENCY ALERT - ${alert.severity}</h1>
          <p>${alert.title}</p>
        </div>

        <div class="content">
          <div class="section">
            <h2>Patient Information</h2>
            <p><span class="label">Name:</span> ${elder.firstName} ${elder.lastName}</p>
            <p><span class="label">DOB:</span> ${elder.dateOfBirth || 'N/A'}</p>
            <p><span class="label">Gender:</span> ${elder.gender || 'N/A'}</p>
            <p><span class="label">Blood Type:</span> ${elder.bloodType || 'Unknown'}</p>
            <p><span class="label">Address:</span> ${elder.address}, ${elder.city}, ${elder.state} ${elder.zipCode}</p>
          </div>

          <div class="section">
            <h2>Alert Details</h2>
            <p><span class="label">Type:</span> ${alert.type}</p>
            <p><span class="label">Severity:</span> ${alert.severity}</p>
            <p><span class="label">Message:</span> ${alert.message}</p>
            <p><span class="label">Time:</span> ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>Current Medications</h2>
            <table>
              <tr><th>Medication</th><th>Dosage</th><th>Frequency</th></tr>
              ${reportData.currentMedications.map(med => `
                <tr>
                  <td>${med.name}</td>
                  <td>${med.dosage}</td>
                  <td>${med.frequency}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Medical Conditions & Allergies</h2>
            <p><span class="label">Conditions:</span> ${reportData.medicalHistory.conditions.join(', ') || 'None reported'}</p>
            <p><span class="label">Allergies:</span> ${reportData.medicalHistory.allergies.join(', ') || 'None reported'}</p>
          </div>

          <div class="section">
            <h2>Recent Vital Signs</h2>
            <table>
              <tr><th>Type</th><th>Value</th><th>Time</th></tr>
              ${reportData.recentVitals.slice(0, 5).map(vital => `
                <tr>
                  <td>${vital.type}</td>
                  <td>${vital.systolic ? `${vital.systolic}/${vital.diastolic}` : vital.value} ${vital.unit}</td>
                  <td>${new Date(vital.recordedAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Emergency Contacts</h2>
            ${reportData.emergencyContacts.map(contact => `
              <p>
                <span class="label">${contact.name} (${contact.relationship})${contact.isPrimary ? ' - PRIMARY' : ''}:</span><br>
                Phone: ${contact.phone || 'N/A'}<br>
                Email: ${contact.email || 'N/A'}
              </p>
            `).join('')}
          </div>

          <div class="section">
            <p style="color: #dc2626; font-weight: bold;">
              ⚠️ This is an automated emergency alert. Please respond immediately.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate email for emergency services
   */
  private generateEmergencyServicesEmail(
    recipient: AlertRecipient,
    alert: EmergencyAlert,
    elder: any,
    report: any,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .section { margin: 20px 0; background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 EMERGENCY DISPATCH REQUIRED</h1>
          <p>${alert.title}</p>
        </div>

        <div class="content">
          <div class="section">
            <h2>IMMEDIATE RESPONSE REQUIRED</h2>
            <p><span class="label">Incident Type:</span> ${alert.type}</p>
            <p><span class="label">Severity:</span> ${alert.severity}</p>
            <p><span class="label">Details:</span> ${alert.message}</p>
            <p><span class="label">Time:</span> ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>Location</h2>
            <p><span class="label">Address:</span> ${elder.address}</p>
            <p><span class="label">City:</span> ${elder.city}, ${elder.state} ${elder.zipCode}</p>
            ${alert.locationData ? `<p><span class="label">Coordinates:</span> ${JSON.stringify(alert.locationData)}</p>` : ''}
          </div>

          <div class="section">
            <h2>Patient</h2>
            <p><span class="label">Name:</span> ${elder.firstName} ${elder.lastName}</p>
            <p><span class="label">Age:</span> ${elder.dateOfBirth ? Math.floor((Date.now() - new Date(elder.dateOfBirth).getTime()) / 31557600000) : 'Unknown'}</p>
            <p><span class="label">Gender:</span> ${elder.gender || 'N/A'}</p>
            <p><span class="label">Blood Type:</span> ${elder.bloodType || 'Unknown'}</p>
          </div>

          <div class="section">
            <h2>Primary Emergency Contact</h2>
            ${elder.emergencyContacts[0] ? `
              <p><span class="label">Name:</span> ${elder.emergencyContacts[0].name}</p>
              <p><span class="label">Relationship:</span> ${elder.emergencyContacts[0].relationship}</p>
              <p><span class="label">Phone:</span> ${elder.emergencyContacts[0].phone}</p>
            ` : '<p>No emergency contact on file</p>'}
          </div>

          <div class="section">
            <p style="color: #dc2626; font-weight: bold; font-size: 18px;">
              ⚠️ IMMEDIATE DISPATCH REQUIRED - AUTOMATED EMERGENCY ALERT
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate email for family members
   */
  private generateFamilyEmail(
    recipient: AlertRecipient,
    alert: EmergencyAlert,
    elder: any,
    report: any,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .critical { background: #dc2626; }
          .content { padding: 20px; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header ${alert.severity === 'CRITICAL' ? 'critical' : ''}">
          <h1>⚠️ Health Alert: ${elder.firstName} ${elder.lastName}</h1>
        </div>

        <div class="content">
          <div class="section">
            <p>Dear ${recipient.name},</p>
            <p>This is an automated alert from the ElderCare monitoring system regarding <strong>${elder.firstName} ${elder.lastName}</strong>.</p>
          </div>

          <div class="section">
            <h2>Alert Information</h2>
            <p><span class="label">Alert Type:</span> ${alert.type}</p>
            <p><span class="label">Severity:</span> ${alert.severity}</p>
            <p><span class="label">Details:</span> ${alert.message}</p>
            <p><span class="label">Time:</span> ${new Date().toLocaleString()}</p>
          </div>

          ${alert.severity === 'CRITICAL' ? `
          <div class="section" style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626;">
            <p style="color: #dc2626; font-weight: bold;">
              ⚠️ CRITICAL ALERT - Immediate action may be required.
            </p>
            <p>We recommend contacting ${elder.firstName} immediately or dispatching emergency services if needed.</p>
          </div>
          ` : ''}

          <div class="section">
            <h2>Location</h2>
            <p>${elder.address}, ${elder.city}, ${elder.state} ${elder.zipCode}</p>
          </div>

          <div class="section">
            <h2>What to do next</h2>
            <ul>
              <li>Try to contact ${elder.firstName} directly</li>
              <li>Check the monitoring dashboard for more details</li>
              ${alert.severity === 'CRITICAL' ? '<li><strong>Consider calling emergency services (911) if you cannot reach them</strong></li>' : ''}
              <li>Healthcare providers have been notified</li>
            </ul>
          </div>

          <div class="section">
            <p>This is an automated message from ElderCare Advanced Monitoring System.</p>
            <p>For questions, contact support or check your dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get alert history
   */
  async getAlertHistory(elderId: string, days = 30) {
    return this.prisma.alert.findMany({
      where: {
        elderId,
        triggeredAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        emergencyNotifications: true,
      },
      orderBy: {
        triggeredAt: 'desc',
      },
    });
  }

  /**
   * Get emergency reports
   */
  async getEmergencyReports(elderId: string, limit = 10) {
    return this.prisma.emergencyReport.findMany({
      where: {
        elderId,
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Acknowledge/resolve alert
   */
  async acknowledgeAlert(alertId: string, userId: string, notes?: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        metadata: {
          acknowledgmentNotes: notes,
        },
      },
    });
  }
}
