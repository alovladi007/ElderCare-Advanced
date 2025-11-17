import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MemoryCareService } from './memory-care.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateOrientationCardDto } from './dto/create-orientation-card.dto';
import { CreateBehaviorLogDto } from './dto/create-behavior-log.dto';

@ApiTags('memory-care')
@Controller('memory-care')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MemoryCareController {
  constructor(private readonly memoryCareService: MemoryCareService) {}

  // Memory Care Profile
  @Get('profile/:elderId')
  @ApiOperation({ summary: 'Get memory care profile' })
  getMemoryCareProfile(@Param('elderId') elderId: string) {
    return this.memoryCareService.getMemoryCareProfile(elderId);
  }

  // Orientation Dashboard
  @Get('orientation/:elderId')
  @ApiOperation({ summary: 'Get orientation dashboard for elder' })
  getOrientationDashboard(@Param('elderId') elderId: string) {
    return this.memoryCareService.getOrientationDashboard(elderId);
  }

  // Orientation Cards
  @Post('orientation-cards')
  @Roles(UserRole.FAMILY, UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create orientation card' })
  createOrientationCard(@Body() dto: CreateOrientationCardDto) {
    return this.memoryCareService.createOrientationCard(dto);
  }

  @Get('orientation-cards/:elderId')
  @ApiOperation({ summary: 'Get orientation cards for elder' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  getOrientationCards(
    @Param('elderId') elderId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.memoryCareService.getOrientationCards(elderId, activeOnly !== 'false');
  }

  @Patch('orientation-cards/:id')
  @Roles(UserRole.FAMILY, UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update orientation card' })
  updateOrientationCard(
    @Param('id') id: string,
    @Body() dto: Partial<CreateOrientationCardDto>,
  ) {
    return this.memoryCareService.updateOrientationCard(id, dto);
  }

  @Delete('orientation-cards/:id')
  @Roles(UserRole.FAMILY, UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete orientation card' })
  deleteOrientationCard(@Param('id') id: string) {
    return this.memoryCareService.deleteOrientationCard(id);
  }

  // Behavior Logs
  @Post('behavior-logs')
  @Roles(UserRole.CAREGIVER, UserRole.FAMILY, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Log behavior observation' })
  createBehaviorLog(@Body() dto: CreateBehaviorLogDto, @Request() req) {
    return this.memoryCareService.createBehaviorLog(dto, req.user.userId);
  }

  @Get('behavior-logs/:elderId')
  @ApiOperation({ summary: 'Get behavior logs for elder' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getBehaviorLogs(
    @Param('elderId') elderId: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days) : 30;
    return this.memoryCareService.getBehaviorLogs(elderId, numDays);
  }

  // Wandering Events
  @Get('wandering-events/:elderId')
  @ApiOperation({ summary: 'Get wandering events for elder' })
  getWanderingEvents(@Param('elderId') elderId: string) {
    return this.memoryCareService.getWanderingEvents(elderId);
  }

  @Post('wandering-events/:elderId')
  @Roles(UserRole.CAREGIVER, UserRole.FAMILY, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Report wandering event' })
  createWanderingEvent(
    @Param('elderId') elderId: string,
    @Body() body: { locationInfo?: string },
  ) {
    return this.memoryCareService.createWanderingEvent(elderId, body.locationInfo);
  }

  @Patch('wandering-events/:eventId/resolve')
  @Roles(UserRole.CAREGIVER, UserRole.FAMILY, UserRole.CLINICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve wandering event' })
  resolveWanderingEvent(@Param('eventId') eventId: string, @Request() req) {
    return this.memoryCareService.resolveWanderingEvent(eventId, req.user.userId);
  }
}
