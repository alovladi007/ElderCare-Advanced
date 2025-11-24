import { Module } from '@nestjs/common';
import { HomeService } from './services/home.service';
import { DeviceService } from './services/device.service';
import { EventProcessorService } from './services/event-processor.service';
import { AutomationEngineService } from './services/automation-engine.service';
import { EmergencyScenarioService } from './services/emergency-scenario.service';
import { SimulatorService } from './services/simulator.service';
import { HomeController } from './controllers/home.controller';
import { DeviceController } from './controllers/device.controller';
import { IoTController } from './controllers/iot.controller';
import { AutomationController } from './controllers/automation.controller';
import { EmergencyController } from './controllers/emergency.controller';
import { SimulatorController } from './controllers/simulator.controller';

@Module({
  controllers: [
    HomeController,
    DeviceController,
    IoTController,
    AutomationController,
    EmergencyController,
    SimulatorController,
  ],
  providers: [
    HomeService,
    DeviceService,
    EventProcessorService,
    AutomationEngineService,
    EmergencyScenarioService,
    SimulatorService,
  ],
  exports: [
    HomeService,
    DeviceService,
    EventProcessorService,
    AutomationEngineService,
    EmergencyScenarioService,
  ],
})
export class SmartHomeModule {}
