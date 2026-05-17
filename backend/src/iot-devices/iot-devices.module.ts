import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LoggerModule } from '../common/logging/logger.module';
import { IotDeviceService } from './services/iot-device.service';

@Module({
  imports: [ConfigModule, PrismaModule, LoggerModule],
  providers: [IotDeviceService],
  exports: [IotDeviceService],
})
export class IotDevicesModule {}
