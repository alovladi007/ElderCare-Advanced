import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;
  private fromNumber: string;

  constructor(private config: ConfigService) {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get<string>('TWILIO_PHONE_NUMBER');

    if (accountSid && authToken && this.fromNumber) {
      this.twilioClient = twilio(accountSid, authToken);
      this.logger.log('Twilio SMS service initialized');
    } else {
      this.logger.warn('Twilio credentials not configured - SMS service disabled');
    }
  }

  async sendSms(to: string, message: string): Promise<any> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio not configured, SMS not sent');
      throw new Error('SMS service not configured');
    }

    try {
      // Ensure phone number has country code
      const formattedTo = to.startsWith('+') ? to : `+1${to}`;

      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedTo,
      });

      this.logger.log(`SMS sent successfully to ${formattedTo}: ${result.sid}`);
      return { success: true, sid: result.sid, status: result.status };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      throw error;
    }
  }

  async sendBulkSms(recipients: string[], message: string): Promise<any[]> {
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendSms(recipient, message);
        results.push({ recipient, success: true, result });
      } catch (error) {
        this.logger.error(`Failed to send SMS to ${recipient}:`, error);
        results.push({
          recipient,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  isConfigured(): boolean {
    return !!this.twilioClient;
  }
}
