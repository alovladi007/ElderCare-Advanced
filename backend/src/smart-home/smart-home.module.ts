import { Module, forwardRef } from '@nestjs/common';
import { HomeService } from './services/home.service';
import { DeviceService } from './services/device.service';
import { EventProcessorService } from './services/event-processor.service';
import { AutomationEngineService } from './services/automation-engine.service';
import { EmergencyScenarioService } from './services/emergency-scenario.service';
import { SimulatorService } from './services/simulator.service';
import { VoiceControlService } from './services/voice-control.service';
import { HomeController } from './controllers/home.controller';
import { DeviceController } from './controllers/device.controller';
import { IoTController } from './controllers/iot.controller';
import { AutomationController } from './controllers/automation.controller';
import { EmergencyController } from './controllers/emergency.controller';
import { SimulatorController } from './controllers/simulator.controller';
import { VoiceControlController } from './controllers/voice-control.controller';
import { CareManagementModule } from '../care-management/care-management.module';

@Module({
  imports: [forwardRef(() => CareManagementModule)],
  controllers: [
    HomeController,
    DeviceController,
    IoTController,
    AutomationController,
    EmergencyController,
    SimulatorController,
    VoiceControlController,
  ],
  providers: [
    HomeService,
    DeviceService,
    EventProcessorService,
    AutomationEngineService,
    EmergencyScenarioService,
    SimulatorService,
    VoiceControlService,
  ],
  exports: [
    HomeService,
    DeviceService,
    EventProcessorService,
    AutomationEngineService,
    EmergencyScenarioService,
    VoiceControlService,
  ],
})
export class SmartHomeModule {}
