import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class EmailService {
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid configured successfully', 'EmailService');
    } else {
      this.logger.warn(
        'SENDGRID_API_KEY not configured - emails will be logged only',
        'EmailService',
      );
    }
  }

  /**
   * Send an email using SendGrid
   */
  async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
  }): Promise<boolean> {
    const from =
      data.from ||
      this.configService.get<string>('EMAIL_FROM') ||
      'noreply@eldercare.com';

    const msg = {
      to: data.to,
      from,
      subject: data.subject,
      html: data.html,
      text: data.text || this.stripHtml(data.html),
    };

    try {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

      if (!apiKey) {
        // Development mode - log email instead of sending
        this.logger.debug('Email (not sent - dev mode)', 'EmailService', {
          to: msg.to,
          subject: msg.subject,
          preview: msg.text?.substring(0, 100),
        });
        return true;
      }

      await sgMail.send(msg);

      this.logger.logEvent('Email sent', 'Email', '', {
        to: msg.to,
        subject: msg.subject,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send email', '', 'EmailService', {
        to: msg.to,
        subject: msg.subject,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(data: {
    to: string;
    firstName: string;
    role: string;
  }): Promise<boolean> {
    const subject = 'Welcome to ElderCare Advanced';
    const html = this.getWelcomeEmailTemplate(data.firstName, data.role);

    return this.sendEmail({ to: data.to, subject, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: {
    to: string;
    firstName: string;
    resetToken: string;
  }): Promise<boolean> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${data.resetToken}`;

    const subject = 'Password Reset Request';
    const html = this.getPasswordResetTemplate(data.firstName, resetLink);

    return this.sendEmail({ to: data.to, subject, html });
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmationEmail(data: {
    to: string;
    firstName: string;
    bookingDetails: {
      serviceType: string;
      date: Date;
      duration: number;
      clinicianName: string;
    };
  }): Promise<boolean> {
    const subject = 'Booking Confirmation - ElderCare';
    const html = this.getBookingConfirmationTemplate(
      data.firstName,
      data.bookingDetails,
    );

    return this.sendEmail({ to: data.to, subject, html });
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminderEmail(data: {
    to: string;
    firstName: string;
    appointmentDetails: {
      serviceType: string;
      date: Date;
      clinicianName: string;
    };
  }): Promise<boolean> {
    const subject = 'Appointment Reminder - Tomorrow';
    const html = this.getAppointmentReminderTemplate(
      data.firstName,
      data.appointmentDetails,
    );

    return this.sendEmail({ to: data.to, subject, html });
  }

  /**
   * Send medication reminder email
   */
  async sendMedicationReminderEmail(data: {
    to: string;
    firstName: string;
    medications: Array<{
      name: string;
      dosage: string;
      time: string;
    }>;
  }): Promise<boolean> {
    const subject = 'Medication Reminder';
    const html = this.getMedicationReminderTemplate(
      data.firstName,
      data.medications,
    );

    return this.sendEmail({ to: data.to, subject, html });
  }

  /**
   * Send alert notification email
   */
  async sendAlertNotificationEmail(data: {
    to: string;
    firstName: string;
    alert: {
      title: string;
      severity: string;
      message: string;
      elderName: string;
    };
  }): Promise<boolean> {
    const subject = `${data.alert.severity} Alert: ${data.alert.title}`;
    const html = this.getAlertNotificationTemplate(data.firstName, data.alert);

    return this.sendEmail({ to: data.to, subject, html });
  }

  /**
   * Send emergency alert email
   */
  async sendEmergencyAlertEmail(data: {
    to: string;
    firstName: string;
    emergency: {
      type: string;
      elderName: string;
      location: string;
      timestamp: Date;
      details: string;
    };
  }): Promise<boolean> {
    const subject = `🚨 EMERGENCY ALERT: ${data.emergency.type}`;
    const html = this.getEmergencyAlertTemplate(
      data.firstName,
      data.emergency,
    );

    return this.sendEmail({ to: data.to, subject, html });
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  private getWelcomeEmailTemplate(firstName: string, role: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ElderCare Advanced</h1>
    </div>
    <div class="content">
      <h2>Hello ${firstName}!</h2>
      <p>Welcome to ElderCare Advanced, your comprehensive elder care management platform.</p>
      <p>Your account has been created with the role: <strong>${role}</strong></p>
      <p>You can now:</p>
      <ul>
        <li>Access your personalized dashboard</li>
        <li>Manage appointments and bookings</li>
        <li>Monitor health metrics and alerts</li>
        <li>Connect with care providers</li>
      </ul>
      <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/dashboard" class="button">
        Go to Dashboard
      </a>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 ElderCare Advanced. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getPasswordResetTemplate(
    firstName: string,
    resetLink: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hello ${firstName},</h2>
      <p>We received a request to reset your password for your ElderCare Advanced account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetLink}" class="button">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #4F46E5;">${resetLink}</p>
      <div class="warning">
        <strong>Security Notice:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>This link will expire in 1 hour</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Never share this link with anyone</li>
        </ul>
      </div>
      <p>If you need assistance, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 ElderCare Advanced. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getBookingConfirmationTemplate(
    firstName: string,
    bookingDetails: any,
  ): string {
    const dateStr = new Date(bookingDetails.date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Booking Confirmed</h1>
    </div>
    <div class="content">
      <h2>Hello ${firstName},</h2>
      <p>Your booking has been confirmed! Here are the details:</p>
      <div class="booking-details">
        <div class="detail-row">
          <strong>Service:</strong>
          <span>${bookingDetails.serviceType}</span>
        </div>
        <div class="detail-row">
          <strong>Date & Time:</strong>
          <span>${dateStr}</span>
        </div>
        <div class="detail-row">
          <strong>Duration:</strong>
          <span>${bookingDetails.duration} minutes</span>
        </div>
        <div class="detail-row">
          <strong>Care Provider:</strong>
          <span>${bookingDetails.clinicianName}</span>
        </div>
      </div>
      <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/bookings" class="button">
        View Booking Details
      </a>
      <p>You will receive a reminder 24 hours before your appointment.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 ElderCare Advanced. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getAppointmentReminderTemplate(
    firstName: string,
    appointmentDetails: any,
  ): string {
    const dateStr = new Date(appointmentDetails.date).toLocaleString('en-US', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .reminder-box { background: #FEF3C7; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Appointment Reminder</h1>
    </div>
    <div class="content">
      <h2>Hello ${firstName},</h2>
      <p>This is a friendly reminder about your upcoming appointment:</p>
      <div class="reminder-box">
        <h3 style="margin: 0 0 10px 0;">${appointmentDetails.serviceType}</h3>
        <p style="font-size: 18px; margin: 10px 0;"><strong>${dateStr}</strong></p>
        <p style="margin: 10px 0 0 0;">with ${appointmentDetails.clinicianName}</p>
      </div>
      <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/bookings" class="button">
        View Appointment Details
      </a>
      <p>Please arrive 10 minutes early. If you need to reschedule, please contact us as soon as possible.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 ElderCare Advanced. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getMedicationReminderTemplate(
    firstName: string,
    medications: any[],
  ): string {
    const medicationList = medications
      .map(
        (med) => `
      <div style="padding: 15px; background: white; border-radius: 6px; margin: 10px 0;">
        <strong style="font-size: 16px;">${med.name}</strong><br>
        <span style="color: #6b7280;">Dosage: ${med.dosage}</span><br>
        <span style="color: #6b7280;">Time: ${med.time}</span>
      </div>
    `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💊 Medication Reminder</h1>
    </div>
    <div class="content">
      <h2>Hello ${firstName},</h2>
      <p>It's time to take your medication:</p>
      ${medicationList}
      <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/medications" class="button">
        View Medication Schedule
      </a>
      <p>Please remember to take your medications as prescribed. If you have any concerns, contact your healthcare provider.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 ElderCare Advanced. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getAlertNotificationTemplate(
    firstName: string,
    alert: any,
  ): string {
    const severityColors: Record<string, string> = {
      INFO: '#3B82F6',
      WARNING: '#F59E0B',
      CRITICAL: '#DC2626',
    };

    const color = severityColors[alert.severity] || '#6B7280';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert-box { background: white; padding: 20px; border-left: 4px solid ${color}; margin: 20px 0; }
    .button { display: inline-block; background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Alert Notification</h1>
    </div>
    <div class="content">
      <h2>Hello ${firstName},</h2>
      <p>An alert has been triggered for <strong>${alert.elderName}</strong>:</p>
      <div class="alert-box">
        <h3 style="margin: 0 0 10px 0; color: ${color};">${alert.severity}: ${alert.title}</h3>
        <p style="margin: 10px 0;">${alert.message}</p>
      </div>
      <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/alerts" class="button">
        View Alert Details
      </a>
      <p>Please review this alert and take appropriate action if needed.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 ElderCare Advanced. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getEmergencyAlertTemplate(
    firstName: string,
    emergency: any,
  ): string {
    const timestampStr = new Date(emergency.timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .emergency-box { background: #FEE2E2; padding: 20px; border: 3px solid #DC2626; border-radius: 6px; margin: 20px 0; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 EMERGENCY ALERT</h1>
    </div>
    <div class="content">
      <h2>URGENT: ${firstName}</h2>
      <p><strong>An emergency has been detected and requires immediate attention!</strong></p>
      <div class="emergency-box">
        <h3 style="margin: 0 0 15px 0; color: #DC2626;">${emergency.type}</h3>
        <div class="detail-row">
          <strong>Elder:</strong> ${emergency.elderName}
        </div>
        <div class="detail-row">
          <strong>Location:</strong> ${emergency.location}
        </div>
        <div class="detail-row">
          <strong>Time:</strong> ${timestampStr}
        </div>
        <div style="padding: 15px 0;">
          <strong>Details:</strong><br>
          ${emergency.details}
        </div>
      </div>
      <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/emergencies" class="button">
        VIEW EMERGENCY DETAILS
      </a>
      <p style="color: #DC2626; font-weight: bold;">
        Please respond immediately. Emergency services may have been contacted.
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2024 ElderCare Advanced. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}
