import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ElderProfileService } from './elder-profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('elder-profile')
@Controller('elder-profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ElderProfileController {
  constructor(private elderProfileService: ElderProfileService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CLINICIAN', 'CAREGIVER')
  @ApiOperation({ summary: 'Get all elder profiles' })
  async getAllElders() {
    return this.elderProfileService.getAllElders();
  }

  @Get(':elderId')
  @ApiOperation({ summary: 'Get unified elder profile' })
  async getUnifiedProfile(@Param('elderId') elderId: string) {
    return this.elderProfileService.getUnifiedProfile(elderId);
  }

  @Get(':elderId/dashboard')
  @ApiOperation({ summary: 'Get elder dashboard data for family portal' })
  async getDashboardData(@Param('elderId') elderId: string) {
    return this.elderProfileService.getDashboardData(elderId);
  }

  @Get(':elderId/health')
  @ApiOperation({ summary: 'Get elder health overview' })
  async getHealthOverview(@Param('elderId') elderId: string) {
    return this.elderProfileService.getHealthOverview(elderId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CLINICIAN')
  @ApiOperation({ summary: 'Create elder profile' })
  async createElderProfile(@Body() body: any) {
    return this.elderProfileService.createElderProfile(body);
  }

  @Patch(':elderId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CLINICIAN', 'CAREGIVER')
  @ApiOperation({ summary: 'Update elder profile' })
  async updateElderProfile(@Param('elderId') elderId: string, @Body() body: any) {
    return this.elderProfileService.updateElderProfile(elderId, body);
  }
}
