import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logging/logger.service';
import { EmailService } from '../common/email/email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logger: LoggerService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        elderProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        elderProfile: user.elderProfile,
      },
    };
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role as any,
        isActive: true,
      },
    });

    // Send welcome email (async, don't wait for it)
    this.emailService.sendWelcomeEmail({
      to: user.email,
      firstName: user.firstName,
      role: user.role,
    }).catch(error => {
      this.logger.error('Failed to send welcome email', '', 'AuthService', {
        userId: user.id,
        error: (error as Error).message,
      });
    });

    const { password: _, ...result } = user;
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        elderProfile: {
          include: {
            home: {
              include: {
                zones: true,
                devices: {
                  include: {
                    sensors: true,
                    actuators: true,
                  },
                },
              },
            },
            vitals: {
              take: 10,
              orderBy: {
                recordedAt: 'desc',
              },
            },
            alerts: {
              where: {
                status: {
                  in: ['ACTIVE', 'ACKNOWLEDGED'],
                },
              },
              orderBy: {
                triggeredAt: 'desc',
              },
              take: 20,
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    const { password: _, ...result } = user;
    return result;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // In a real implementation, generate a reset token and send email
    const resetToken = this.jwtService.sign(
      { email: user.email, purpose: 'password-reset' },
      { expiresIn: '1h' },
    );

    this.logger.logAuth('Password reset requested', user.id, true, {
      email,
      tokenGenerated: true,
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      resetToken,
    });

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token) as any;

      if (decoded.purpose !== 'password-reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { email: decoded.email },
        data: {
          password: hashedPassword,
        },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
