import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeviceService } from '../services/device.service';

@ApiTags('smart-home')
@Controller('devices')
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  // Device Type endpoints
  @Post('types')
  @ApiOperation({ summary: 'Create a device type' })
  async createDeviceType(@Body() body: any) {
    return this.deviceService.createDeviceType(body);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all device types' })
  async getAllDeviceTypes() {
    return this.deviceService.getAllDeviceTypes();
  }

  // Device endpoints
  @Post()
  @ApiOperation({ summary: 'Create a device' })
  async createDevice(@Body() body: {
    homeId: string;
    deviceTypeId: string;
    name: string;
    identifier: string;
    zoneId?: string;
    settingsJson?: any;
    notes?: string;
  }) {
    return this.deviceService.createDevice(body);
  }

  @Get('home/:homeId')
  @ApiOperation({ summary: 'Get all devices in a home' })
  async getDevicesByHomeId(@Param('homeId') homeId: string) {
    return this.deviceService.getDevicesByHomeId(homeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  async getDeviceById(@Param('id') id: string) {
    return this.deviceService.getDeviceById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device' })
  async updateDevice(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.deviceService.updateDevice(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete device' })
  async deleteDevice(@Param('id') id: string) {
    return this.deviceService.deleteDevice(id);
  }

  // Sensor endpoints
  @Post(':deviceId/sensors')
  @ApiOperation({ summary: 'Create a sensor' })
  async createSensor(
    @Param('deviceId') deviceId: string,
    @Body() body: any,
  ) {
    return this.deviceService.createSensor({
      deviceId,
      ...body,
    });
  }

  @Get(':deviceId/sensors')
  @ApiOperation({ summary: 'Get sensors for a device' })
  async getSensorsByDeviceId(@Param('deviceId') deviceId: string) {
    return this.deviceService.getSensorsByDeviceId(deviceId);
  }

  // Actuator endpoints
  @Post(':deviceId/actuators')
  @ApiOperation({ summary: 'Create an actuator' })
  async createActuator(
    @Param('deviceId') deviceId: string,
    @Body() body: any,
  ) {
    return this.deviceService.createActuator({
      deviceId,
      ...body,
    });
  }

  @Get(':deviceId/actuators')
  @ApiOperation({ summary: 'Get actuators for a device' })
  async getActuatorsByDeviceId(@Param('deviceId') deviceId: string) {
    return this.deviceService.getActuatorsByDeviceId(deviceId);
  }

  // Actuator Command endpoints
  @Post('actuators/:actuatorId/command')
  @ApiOperation({ summary: 'Issue an actuator command' })
  async issueCommand(
    @Param('actuatorId') actuatorId: string,
    @Body() body: {
      homeId: string;
      deviceId: string;
      commandName: string;
      commandParamsJson: any;
      issuedByUserId?: string;
    },
  ) {
    return this.deviceService.issueActuatorCommand({
      ...body,
      actuatorId,
    });
  }

  @Get('home/:homeId/commands')
  @ApiOperation({ summary: 'Get actuator commands for a home' })
  async getCommands(@Param('homeId') homeId: string) {
    return this.deviceService.getActuatorCommandsByHomeId(homeId);
  }
}
