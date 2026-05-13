import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EldersService } from './elders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('elders')
@Controller('elders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EldersController {
  constructor(private readonly eldersService: EldersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all elders' })
  findAll() {
    return this.eldersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get elder by ID' })
  findOne(@Param('id') id: string) {
    return this.eldersService.findOne(id);
  }

  @Get(':id/overview')
  @ApiOperation({ summary: 'Get elder overview with vitals, meds, and alerts' })
  getOverview(@Param('id') id: string) {
    return this.eldersService.getOverview(id);
  }
}
