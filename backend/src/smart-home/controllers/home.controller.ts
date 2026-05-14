import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HomeService } from '../services/home.service';

@ApiTags('smart-home')
@Controller('homes')
export class HomeController {
  constructor(private homeService: HomeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new home for an elder' })
  async createHome(@Body() body: {
    elderId: string;
    name: string;
    address: string;
    timezone?: string;
    notes?: string;
  }) {
    return this.homeService.createHome(body);
  }

  @Get('elder/:elderId')
  @ApiOperation({ summary: 'Get home by elder ID' })
  async getHomeByElderId(@Param('elderId') elderId: string) {
    return this.homeService.getHomeByElderId(elderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get home by ID' })
  async getHomeById(@Param('id') id: string) {
    return this.homeService.getHomeById(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get home status summary' })
  async getHomeStatus(@Param('id') id: string) {
    return this.homeService.getHomeStatus(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update home' })
  async updateHome(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      address?: string;
      timezone?: string;
      notes?: string;
    },
  ) {
    return this.homeService.updateHome(id, body);
  }

  // Zone endpoints
  @Post(':homeId/zones')
  @ApiOperation({ summary: 'Create a zone in a home' })
  async createZone(
    @Param('homeId') homeId: string,
    @Body() body: {
      name: string;
      description?: string;
      floor?: string;
      isCriticalArea?: boolean;
    },
  ) {
    return this.homeService.createZone(homeId, body);
  }

  @Get(':homeId/zones')
  @ApiOperation({ summary: 'Get all zones in a home' })
  async getZones(@Param('homeId') homeId: string) {
    return this.homeService.getZonesByHomeId(homeId);
  }

  @Patch('zones/:zoneId')
  @ApiOperation({ summary: 'Update a zone' })
  async updateZone(
    @Param('zoneId') zoneId: string,
    @Body() body: {
      name?: string;
      description?: string;
      floor?: string;
      isCriticalArea?: boolean;
    },
  ) {
    return this.homeService.updateZone(zoneId, body);
  }

  @Delete('zones/:zoneId')
  @ApiOperation({ summary: 'Delete a zone' })
  async deleteZone(@Param('zoneId') zoneId: string) {
    return this.homeService.deleteZone(zoneId);
  }
}
