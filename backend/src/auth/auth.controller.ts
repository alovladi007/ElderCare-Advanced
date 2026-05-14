import { Controller, Post, Get, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ auth: { limit: 5, ttl: 900000 } }) // 5 registrations per 15 minutes
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }) {
    return this.authService.register(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 900000 } }) // 5 login attempts per 15 minutes
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Request() req,
    @Body() body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @Request() req,
    @Body() body: {
      oldPassword: string;
      newPassword: string;
    },
  ) {
    return this.authService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword,
    );
  }

  @Post('forgot-password')
  @Throttle({ auth: { limit: 3, ttl: 3600000 } }) // 3 reset requests per hour
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  @Throttle({ auth: { limit: 5, ttl: 900000 } }) // 5 password resets per 15 minutes
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(
    @Body() body: {
      token: string;
      newPassword: string;
    },
  ) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
