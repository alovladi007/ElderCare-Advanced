import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { HomeService } from './services/home.service';
import { CreateHomeDto, CreateHomeZoneDto } from './dto/create-home.dto';

@ApiTags('smart-home/homes')
@Controller('smart-home/homes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY)
  @ApiOperation({ summary: 'Create a smart home for an elder' })
  createHome(@Body() dto: CreateHomeDto) {
    return this.homeService.createHome(dto);
  }

  @Get('elder/:elderId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get home by elder ID' })
  getHomeByElderId(@Param('elderId') elderId: string) {
    return this.homeService.getHomeByElderId(elderId);
  }

  @Get(':homeId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get home by ID' })
  getHomeById(@Param('homeId') homeId: string) {
    return this.homeService.getHomeById(homeId);
  }

  @Get(':homeId/status')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get home status summary' })
  getHomeStatus(@Param('homeId') homeId: string) {
    return this.homeService.getHomeStatus(homeId);
  }

  @Patch(':homeId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY)
  @ApiOperation({ summary: 'Update home' })
  updateHome(@Param('homeId') homeId: string, @Body() dto: Partial<CreateHomeDto>) {
    return this.homeService.updateHome(homeId, dto);
  }

  @Post(':homeId/zones')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY)
  @ApiOperation({ summary: 'Create a zone (room) in the home' })
  createZone(@Param('homeId') homeId: string, @Body() dto: CreateHomeZoneDto) {
    return this.homeService.createZone(homeId, dto);
  }

  @Get(':homeId/zones')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all zones in a home' })
  getZones(@Param('homeId') homeId: string) {
    return this.homeService.getZones(homeId);
  }

  @Patch('zones/:zoneId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY)
  @ApiOperation({ summary: 'Update zone' })
  updateZone(@Param('zoneId') zoneId: string, @Body() dto: Partial<CreateHomeZoneDto>) {
    return this.homeService.updateZone(zoneId, dto);
  }
}
