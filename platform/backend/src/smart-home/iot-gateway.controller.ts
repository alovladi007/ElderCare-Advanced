import { Controller, Post, Get, Body, Param, Headers, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { IoTGatewayService } from './services/iot-gateway.service';
import { IngestIoTEventDto, AcknowledgeActuatorCommandDto, IssueActuatorCommandDto } from './dto/iot-event.dto';

@ApiTags('smart-home/iot')
@Controller('smart-home/iot')
export class IoTGatewayController {
  constructor(private readonly iotGateway: IoTGatewayService) {}

  @Post('events')
  @ApiOperation({ summary: 'Ingest IoT event from device (requires IoT token)' })
  @ApiHeader({ name: 'x-iot-token', required: true })
  async ingestEvent(@Headers('x-iot-token') token: string, @Body() dto: IngestIoTEventDto) {
    if (!token) {
      throw new UnauthorizedException('IoT token required');
    }

    const homeId = await this.iotGateway.validateIoTToken(token);
    return this.iotGateway.ingestEvent(homeId, dto);
  }

  @Get('commands/:deviceIdentifier')
  @ApiOperation({ summary: 'Get pending commands for device (requires IoT token)' })
  @ApiHeader({ name: 'x-iot-token', required: true })
  async getPendingCommands(
    @Headers('x-iot-token') token: string,
    @Param('deviceIdentifier') deviceIdentifier: string,
  ) {
    if (!token) {
      throw new UnauthorizedException('IoT token required');
    }

    await this.iotGateway.validateIoTToken(token);
    return this.iotGateway.getPendingCommands(deviceIdentifier);
  }

  @Post('commands/:commandId/ack')
  @ApiOperation({ summary: 'Acknowledge actuator command (requires IoT token)' })
  @ApiHeader({ name: 'x-iot-token', required: true })
  async acknowledgeCommand(
    @Headers('x-iot-token') token: string,
    @Param('commandId') commandId: string,
    @Body() dto: AcknowledgeActuatorCommandDto,
  ) {
    if (!token) {
      throw new UnauthorizedException('IoT token required');
    }

    await this.iotGateway.validateIoTToken(token);
    return this.iotGateway.acknowledgeCommand(commandId, dto);
  }

  @Post('homes/:homeId/commands')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN, UserRole.FAMILY, UserRole.CAREGIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue actuator command (user)' })
  async issueCommand(
    @Param('homeId') homeId: string,
    @Body() dto: IssueActuatorCommandDto,
    @Request() req,
  ) {
    return this.iotGateway.issueCommand(homeId, dto, req.user.userId);
  }

  @Post('homes/:homeId/tokens')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create IoT authentication token' })
  async createIoTToken(@Param('homeId') homeId: string, @Body() body: { label: string }) {
    return this.iotGateway.createIoTToken(homeId, body.label);
  }
}
