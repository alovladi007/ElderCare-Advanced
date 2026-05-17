import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { LoggerService } from '../../common/logging/logger.service';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { EventProcessorService } from '../services/event-processor.service';
import { DeviceService } from '../services/device.service';

@ApiTags('iot')
@Controller('iot')
export class IoTController {
  constructor(
    private eventProcessor: EventProcessorService,
    private deviceService: DeviceService,
    private logger: LoggerService,
  ) {}

  @Post('events')
  @ApiOperation({ summary: 'IoT Gateway - Ingest sensor event' })
  @ApiHeader({ name: 'X-IoT-Token', required: true })
  async ingestEvent(
    @Headers('x-iot-token') token: string,
    @Body() body: {
      deviceIdentifier: string;
      homeId: string;
      sensorType: string;
      eventType: string;
      valueNumeric?: number;
      valueText?: string;
      severity?: string;
      occurredAt?: string;
      rawPayloadJson?: any;
    },
  ) {
    if (!token) {
      throw new UnauthorizedException('Missing X-IoT-Token header');
    }

    // In a real system, validate the token against IotToken table
    // For now, we'll accept any token for demo purposes
    this.logger.debug('IoT event received from device', 'IoTController', {
      deviceIdentifier: body.deviceIdentifier,
      homeId: body.homeId,
      sensorType: body.sensorType,
    });

    // Find device by identifier
    const device = await this.deviceService.getDeviceByIdentifier(
      body.homeId,
      body.deviceIdentifier,
    );

    if (!device) {
      throw new UnauthorizedException('Device not found');
    }

    // Find matching sensor
    const sensor = device.sensors.find(s => s.sensorType === body.sensorType);

    if (!sensor) {
      throw new UnauthorizedException(`Sensor type ${body.sensorType} not found on device`);
    }

    // Process the event
    const event = await this.eventProcessor.processSensorEvent({
      homeId: body.homeId,
      deviceId: device.id,
      sensorId: sensor.id,
      eventType: body.eventType as any,
      valueNumeric: body.valueNumeric,
      valueText: body.valueText,
      severity: (body.severity as any) || 'INFO',
      rawPayloadJson: body.rawPayloadJson || {},
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
    });

    return {
      success: true,
      eventId: event.id,
      message: 'Event processed',
    };
  }

  @Post('actuators/:commandId/ack')
  @ApiOperation({ summary: 'IoT Gateway - Acknowledge actuator command' })
  @ApiHeader({ name: 'X-IoT-Token', required: true })
  async acknowledgeCommand(
    @Headers('x-iot-token') token: string,
    @Body() body: {
      commandId: string;
      success: boolean;
      errorMessage?: string;
    },
  ) {
    if (!token) {
      throw new UnauthorizedException('Missing X-IoT-Token header');
    }

    await this.deviceService.acknowledgeActuatorCommand(
      body.commandId,
      body.success,
      body.errorMessage,
    );

    return {
      success: true,
      message: 'Command acknowledged',
    };
  }
}
