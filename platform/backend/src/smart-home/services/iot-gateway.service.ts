import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeviceService } from './device.service';
import { EventProcessorService } from './event-processor.service';
import { IngestIoTEventDto, AcknowledgeActuatorCommandDto, IssueActuatorCommandDto } from '../dto/iot-event.dto';
import * as crypto from 'crypto';

@Injectable()
export class IoTGatewayService {
  private readonly logger = new Logger(IoTGatewayService.name);

  constructor(
    private prisma: PrismaService,
    private deviceService: DeviceService,
    private eventProcessor: EventProcessorService,
  ) {}

  // IoT Token Management
  async createIoTToken(homeId: string, label: string): Promise<{ token: string; id: string }> {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(token);

    const iotToken = await this.prisma.iotToken.create({
      data: {
        homeId,
        token: hashedToken,
        label,
      },
    });

    return {
      id: iotToken.id,
      token, // Return the plain token only once
    };
  }

  async validateIoTToken(token: string): Promise<string> {
    const hashedToken = this.hashToken(token);

    const iotToken = await this.prisma.iotToken.findUnique({
      where: { token: hashedToken },
    });

    if (!iotToken || iotToken.revokedAt) {
      throw new UnauthorizedException('Invalid or revoked IoT token');
    }

    return iotToken.homeId;
  }

  async revokeIoTToken(tokenId: string) {
    return this.prisma.iotToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  // Event Ingestion
  async ingestEvent(homeId: string, dto: IngestIoTEventDto) {
    this.logger.log(`Ingesting event from device ${dto.deviceIdentifier}`);

    // Get device and its first sensor
    const device = await this.deviceService.getDeviceByIdentifier(dto.deviceIdentifier);

    if (device.homeId !== homeId) {
      throw new UnauthorizedException('Device does not belong to this home');
    }

    // Update device status to ONLINE
    await this.deviceService.updateDeviceStatus(device.id, 'ONLINE');

    // Get sensor (use first sensor for now, or we could add sensorId to the DTO)
    const sensors = await this.deviceService.getSensors(device.id);
    if (sensors.length === 0) {
      throw new NotFoundException('Device has no sensors configured');
    }

    const sensor = sensors[0]; // For now, use first sensor

    // Create sensor event
    const sensorEvent = await this.prisma.sensorEvent.create({
      data: {
        homeId,
        deviceId: device.id,
        sensorId: sensor.id,
        eventType: dto.eventType,
        valueNumeric: dto.valueNumeric,
        valueText: dto.valueText,
        severity: dto.severity || 'INFO',
        rawPayloadJson: dto.rawPayloadJson,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
      include: {
        sensor: true,
        device: {
          include: {
            zone: true,
          },
        },
      },
    });

    // Process event asynchronously
    setImmediate(() => {
      this.eventProcessor.processEvent(sensorEvent).catch(err => {
        this.logger.error(`Error processing event ${sensorEvent.id}:`, err);
      });
    });

    return {
      success: true,
      eventId: sensorEvent.id,
      occurredAt: sensorEvent.occurredAt,
    };
  }

  // Actuator Commands
  async issueCommand(homeId: string, dto: IssueActuatorCommandDto, userId?: string) {
    const actuator = await this.deviceService.getActuatorById(dto.actuatorId);

    if (actuator.device.homeId !== homeId) {
      throw new UnauthorizedException('Actuator does not belong to this home');
    }

    const command = await this.prisma.actuatorCommand.create({
      data: {
        homeId,
        deviceId: actuator.deviceId,
        actuatorId: dto.actuatorId,
        commandName: dto.commandName,
        commandParamsJson: dto.commandParamsJson,
        issuedByUserId: userId,
        status: 'PENDING',
      },
      include: {
        actuator: true,
        device: true,
      },
    });

    this.logger.log(
      `Issued command ${command.commandName} to actuator ${actuator.name} (${command.id})`
    );

    return command;
  }

  async getPendingCommands(deviceIdentifier: string) {
    const device = await this.deviceService.getDeviceByIdentifier(deviceIdentifier);

    return this.prisma.actuatorCommand.findMany({
      where: {
        deviceId: device.id,
        status: 'PENDING',
      },
      include: {
        actuator: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async acknowledgeCommand(commandId: string, dto: AcknowledgeActuatorCommandDto) {
    const status = dto.success ? 'ACKED' : 'FAILED';

    return this.prisma.actuatorCommand.update({
      where: { id: commandId },
      data: {
        status,
        ackedAt: new Date(),
        errorMessage: dto.errorMessage,
      },
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
