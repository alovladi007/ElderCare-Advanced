import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('EMAIL_HOST'),
      port: this.config.get<number>('EMAIL_PORT'),
      secure: this.config.get<boolean>('EMAIL_SECURE'),
      auth: {
        user: this.config.get<string>('EMAIL_USER'),
        pass: this.config.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, message: string, html?: string) {
    try {
      const from = this.config.get<string>('EMAIL_FROM');

      const mailOptions = {
        from,
        to,
        subject,
        text: message,
        html: html || message,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendTemplateEmail(
    to: string,
    subject: string,
    templateName: string,
    context: any
  ) {
    try {
      const templatePath = path.join(
        __dirname,
        '..',
        'templates',
        `${templateName}.hbs`
      );

      let html: string;
      if (fs.existsSync(templatePath)) {
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const template = handlebars.compile(templateSource);
        html = template(context);
      } else {
        // Fallback to simple HTML if template doesn't exist
        html = this.generateSimpleHtml(subject, context);
      }

      return await this.sendEmail(to, subject, context.message || '', html);
    } catch (error) {
      this.logger.error(`Failed to send template email:`, error);
      throw error;
    }
  }

  private generateSimpleHtml(subject: string, context: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ElderCare Platform</h1>
            </div>
            <div class="content">
              <h2>${subject}</h2>
              <p>${context.message || ''}</p>
              ${context.details ? `<div>${JSON.stringify(context.details)}</div>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated message from ElderCare Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed:', error);
      return false;
    }
  }
}
