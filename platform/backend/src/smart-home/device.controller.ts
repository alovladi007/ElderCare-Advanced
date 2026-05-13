import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DeviceService } from './services/device.service';
import {
  CreateSmartDeviceTypeDto,
  CreateSmartDeviceDto,
  CreateSensorDto,
  CreateActuatorDto,
} from './dto/device.dto';

@ApiTags('smart-home/devices')
@Controller('smart-home/devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get('types')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all device types' })
  getDeviceTypes() {
    return this.deviceService.getDeviceTypes();
  }

  @Post('types')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create device type' })
  createDeviceType(@Body() dto: CreateSmartDeviceTypeDto) {
    return this.deviceService.createDeviceType(dto);
  }

  @Post('homes/:homeId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY)
  @ApiOperation({ summary: 'Add device to home' })
  createDevice(@Param('homeId') homeId: string, @Body() dto: CreateSmartDeviceDto) {
    return this.deviceService.createDevice(homeId, dto);
  }

  @Get('homes/:homeId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all devices in a home' })
  getDevices(@Param('homeId') homeId: string) {
    return this.deviceService.getDevices(homeId);
  }

  @Get(':deviceId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get device by ID' })
  getDeviceById(@Param('deviceId') deviceId: string) {
    return this.deviceService.getDeviceById(deviceId);
  }

  @Patch(':deviceId')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY)
  @ApiOperation({ summary: 'Update device' })
  updateDevice(@Param('deviceId') deviceId: string, @Body() dto: Partial<CreateSmartDeviceDto>) {
    return this.deviceService.updateDevice(deviceId, dto);
  }

  @Post(':deviceId/sensors')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Add sensor to device' })
  createSensor(@Param('deviceId') deviceId: string, @Body() dto: CreateSensorDto) {
    return this.deviceService.createSensor(deviceId, dto);
  }

  @Get(':deviceId/sensors')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get sensors for device' })
  getSensors(@Param('deviceId') deviceId: string) {
    return this.deviceService.getSensors(deviceId);
  }

  @Post(':deviceId/actuators')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: 'Add actuator to device' })
  createActuator(@Param('deviceId') deviceId: string, @Body() dto: CreateActuatorDto) {
    return this.deviceService.createActuator(deviceId, dto);
  }

  @Get(':deviceId/actuators')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get actuators for device' })
  getActuators(@Param('deviceId') deviceId: string) {
    return this.deviceService.getActuators(deviceId);
  }
}
