import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HomeService } from './services/home.service';
import { DeviceService } from './services/device.service';
import { IoTGatewayService } from './services/iot-gateway.service';
import { EventProcessorService } from './services/event-processor.service';
import { AutomationEngineService } from './services/automation-engine.service';
import { EmergencyScenarioService } from './services/emergency-scenario.service';
import { InactivityMonitorService } from './services/inactivity-monitor.service';
import { SimulatorService } from './services/simulator.service';
import { HomeController } from './home.controller';
import { DeviceController } from './device.controller';
import { IoTGatewayController } from './iot-gateway.controller';
import { AutomationController } from './automation.controller';
import { EmergencyController } from './emergency.controller';
import { SimulatorController } from './simulator.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    HomeController,
    DeviceController,
    IoTGatewayController,
    AutomationController,
    EmergencyController,
    SimulatorController,
  ],
  providers: [
    HomeService,
    DeviceService,
    IoTGatewayService,
    EventProcessorService,
    AutomationEngineService,
    EmergencyScenarioService,
    InactivityMonitorService,
    SimulatorService,
  ],
  exports: [
    HomeService,
    DeviceService,
    IoTGatewayService,
    EventProcessorService,
    AutomationEngineService,
    EmergencyScenarioService,
  ],
})
export class SmartHomeModule {}
