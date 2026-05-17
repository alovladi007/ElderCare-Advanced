import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * IoT Device Types
 */
export enum DeviceProtocol {
  BLE = 'BLE',
  ZIGBEE = 'ZIGBEE',
  ZWAVE = 'ZWAVE',
  WIFI = 'WIFI',
  LORAWAN = 'LORAWAN',
  MQTT = 'MQTT',
  HTTP = 'HTTP',
}

export enum DeviceCategory {
  MEDICAL_WEARABLE = 'MEDICAL_WEARABLE',
  ENVIRONMENTAL_SENSOR = 'ENVIRONMENTAL_SENSOR',
  SAFETY_DEVICE = 'SAFETY_DEVICE',
  ACTIVITY_MONITOR = 'ACTIVITY_MONITOR',
}

export enum MedicalDeviceType {
  ECG_MONITOR = 'ECG_MONITOR',
  CONTINUOUS_GLUCOSE_MONITOR = 'CONTINUOUS_GLUCOSE_MONITOR',
  BLOOD_PRESSURE_MONITOR = 'BLOOD_PRESSURE_MONITOR',
  PULSE_OXIMETER = 'PULSE_OXIMETER',
  SMART_SCALE = 'SMART_SCALE',
  HEART_RATE_MONITOR = 'HEART_RATE_MONITOR',
  THERMOMETER = 'THERMOMETER',
  SLEEP_TRACKER = 'SLEEP_TRACKER',
}

export enum EnvironmentalSensorType {
  AIR_QUALITY = 'AIR_QUALITY',
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  CARBON_MONOXIDE = 'CARBON_MONOXIDE',
  SMOKE_DETECTOR = 'SMOKE_DETECTOR',
  WATER_LEAK = 'WATER_LEAK',
  LIGHT_LEVEL = 'LIGHT_LEVEL',
}

export enum SafetyDeviceType {
  BED_SENSOR = 'BED_SENSOR',
  DOOR_SENSOR = 'DOOR_SENSOR',
  MEDICATION_DISPENSER = 'MEDICATION_DISPENSER',
  STOVE_SHUTOFF = 'STOVE_SHUTOFF',
  FALL_DETECTOR = 'FALL_DETECTOR',
  EMERGENCY_BUTTON = 'EMERGENCY_BUTTON',
}

export enum ActivityMonitorType {
  CHAIR_SENSOR = 'CHAIR_SENSOR',
  TOILET_SENSOR = 'TOILET_SENSOR',
  REFRIGERATOR_SENSOR = 'REFRIGERATOR_SENSOR',
  MOTION_SENSOR = 'MOTION_SENSOR',
  SMART_WATCH = 'SMART_WATCH',
}

export interface DeviceRegistration {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  category: DeviceCategory;
  protocol: DeviceProtocol;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  macAddress?: string;
  ipAddress?: string;
  capabilities: string[];
  metadata?: Record<string, any>;
}

export interface DeviceReading {
  deviceId: string;
  timestamp: Date;
  readingType: string;
  value: number | string | boolean | Record<string, any>;
  unit?: string;
  quality: number; // 0-100, data quality score
  metadata?: Record<string, any>;
}

export interface DeviceStatus {
  deviceId: string;
  online: boolean;
  lastSeen: Date;
  batteryLevel?: number;
  signalStrength?: number;
  firmwareVersion: string;
  errors?: string[];
  warnings?: string[];
}

export interface DataQualityMetrics {
  deviceId: string;
  timestamp: Date;
  signalQuality: number;
  dataCompleteness: number;
  accuracy: number;
  reliability: number;
  issues: string[];
}

/**
 * IoT Devices Service
 * Manages 100+ medical devices, sensors, and IoT hardware
 */
@Injectable()
export class IotDeviceService {
  private readonly logger = new Logger(IotDeviceService.name);
  private deviceCache: Map<string, any> = new Map();
  private connectionPools: Map<DeviceProtocol, any> = new Map();
  private discoveryEnabled: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.discoveryEnabled = this.config.get<boolean>('IOT_DISCOVERY_ENABLED') !== false;
    this.initializeProtocolAdapters();
  }

  // ============================================================================
  // INITIALIZATION & PROTOCOL ADAPTERS
  // ============================================================================

  private initializeProtocolAdapters() {
    this.logger.log('Initializing IoT protocol adapters...');

    // Initialize BLE adapter
    this.connectionPools.set(DeviceProtocol.BLE, {
      maxConnections: 20,
      activeConnections: 0,
      scanInterval: 5000,
    });

    // Initialize Zigbee adapter
    this.connectionPools.set(DeviceProtocol.ZIGBEE, {
      coordinatorPort: this.config.get<string>('ZIGBEE_PORT') || '/dev/ttyUSB0',
      panId: this.config.get<string>('ZIGBEE_PAN_ID'),
      channel: 15,
    });

    // Initialize Z-Wave adapter
    this.connectionPools.set(DeviceProtocol.ZWAVE, {
      controllerPort: this.config.get<string>('ZWAVE_PORT') || '/dev/ttyACM0',
      networkKey: this.config.get<string>('ZWAVE_NETWORK_KEY'),
    });

    // Initialize WiFi/MQTT adapter
    this.connectionPools.set(DeviceProtocol.MQTT, {
      broker: this.config.get<string>('MQTT_BROKER') || 'mqtt://localhost:1883',
      username: this.config.get<string>('MQTT_USERNAME'),
      password: this.config.get<string>('MQTT_PASSWORD'),
    });

    // Initialize LoRaWAN adapter
    this.connectionPools.set(DeviceProtocol.LORAWAN, {
      gatewayEui: this.config.get<string>('LORAWAN_GATEWAY_EUI'),
      networkServer: this.config.get<string>('LORAWAN_NETWORK_SERVER'),
    });

    this.logger.log('Protocol adapters initialized successfully');
  }

  // ============================================================================
  // DEVICE DISCOVERY & REGISTRATION
  // ============================================================================

  /**
   * Start device discovery on all protocols
   */
  async startDeviceDiscovery(homeId: string, protocols?: DeviceProtocol[]): Promise<DeviceRegistration[]> {
    this.logger.log(`Starting device discovery for home: ${homeId}`);
    const discovered: DeviceRegistration[] = [];

    const protocolsToScan = protocols || Object.values(DeviceProtocol);

    for (const protocol of protocolsToScan) {
      try {
        const devices = await this.discoverDevicesByProtocol(protocol, homeId);
        discovered.push(...devices);
      } catch (error) {
        this.logger.error(`Error discovering ${protocol} devices: ${error.message}`);
      }
    }

    this.logger.log(`Discovered ${discovered.length} devices`);
    return discovered;
  }

  /**
   * Discover devices by specific protocol
   */
  private async discoverDevicesByProtocol(
    protocol: DeviceProtocol,
    homeId: string,
  ): Promise<DeviceRegistration[]> {
    switch (protocol) {
      case DeviceProtocol.BLE:
        return this.discoverBLEDevices(homeId);
      case DeviceProtocol.ZIGBEE:
        return this.discoverZigbeeDevices(homeId);
      case DeviceProtocol.ZWAVE:
        return this.discoverZWaveDevices(homeId);
      case DeviceProtocol.MQTT:
        return this.discoverMQTTDevices(homeId);
      default:
        this.logger.warn(`Discovery not implemented for protocol: ${protocol}`);
        return [];
    }
  }

  /**
   * Discover BLE medical devices (wearables, sensors)
   */
  private async discoverBLEDevices(homeId: string): Promise<DeviceRegistration[]> {
    this.logger.log('Scanning for BLE devices...');

    // Simulated BLE discovery - in production, use noble or @abandonware/noble
    const mockDevices: DeviceRegistration[] = [
      {
        deviceId: `ble-ecg-${Date.now()}`,
        deviceName: 'AliveCor KardiaMobile ECG',
        deviceType: MedicalDeviceType.ECG_MONITOR,
        category: DeviceCategory.MEDICAL_WEARABLE,
        protocol: DeviceProtocol.BLE,
        manufacturer: 'AliveCor',
        model: 'KardiaMobile 6L',
        firmwareVersion: '2.1.3',
        macAddress: 'AA:BB:CC:DD:EE:01',
        capabilities: ['ecg_recording', 'heart_rate', 'afib_detection'],
        metadata: { batteryLevel: 85, lastCalibration: new Date() },
      },
      {
        deviceId: `ble-cgm-${Date.now()}`,
        deviceName: 'Dexcom G6 CGM',
        deviceType: MedicalDeviceType.CONTINUOUS_GLUCOSE_MONITOR,
        category: DeviceCategory.MEDICAL_WEARABLE,
        protocol: DeviceProtocol.BLE,
        manufacturer: 'Dexcom',
        model: 'G6',
        firmwareVersion: '1.8.2',
        macAddress: 'AA:BB:CC:DD:EE:02',
        capabilities: ['glucose_monitoring', 'trend_alerts', 'calibration'],
        metadata: { sensorExpiry: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
      },
      {
        deviceId: `ble-bp-${Date.now()}`,
        deviceName: 'Omron Evolv BP Monitor',
        deviceType: MedicalDeviceType.BLOOD_PRESSURE_MONITOR,
        category: DeviceCategory.MEDICAL_WEARABLE,
        protocol: DeviceProtocol.BLE,
        manufacturer: 'Omron',
        model: 'Evolv',
        firmwareVersion: '3.2.1',
        macAddress: 'AA:BB:CC:DD:EE:03',
        capabilities: ['blood_pressure', 'heart_rate', 'irregular_heartbeat_detection'],
        metadata: { lastCuffCheck: new Date() },
      },
    ];

    return mockDevices;
  }

  /**
   * Discover Zigbee devices (environmental sensors, safety devices)
   */
  private async discoverZigbeeDevices(homeId: string): Promise<DeviceRegistration[]> {
    this.logger.log('Scanning for Zigbee devices...');

    const mockDevices: DeviceRegistration[] = [
      {
        deviceId: `zigbee-air-${Date.now()}`,
        deviceName: 'Air Quality Monitor',
        deviceType: EnvironmentalSensorType.AIR_QUALITY,
        category: DeviceCategory.ENVIRONMENTAL_SENSOR,
        protocol: DeviceProtocol.ZIGBEE,
        manufacturer: 'Awair',
        model: 'Element',
        firmwareVersion: '1.5.0',
        capabilities: ['pm25', 'co2', 'voc', 'temperature', 'humidity'],
        metadata: { calibrationDate: new Date() },
      },
      {
        deviceId: `zigbee-leak-${Date.now()}`,
        deviceName: 'Water Leak Detector',
        deviceType: EnvironmentalSensorType.WATER_LEAK,
        category: DeviceCategory.ENVIRONMENTAL_SENSOR,
        protocol: DeviceProtocol.ZIGBEE,
        manufacturer: 'Aqara',
        model: 'SJCGQ11LM',
        firmwareVersion: '2.0.1',
        capabilities: ['leak_detection', 'temperature'],
        metadata: { batteryLevel: 100 },
      },
    ];

    return mockDevices;
  }

  /**
   * Discover Z-Wave devices (safety devices, smart home)
   */
  private async discoverZWaveDevices(homeId: string): Promise<DeviceRegistration[]> {
    this.logger.log('Scanning for Z-Wave devices...');

    const mockDevices: DeviceRegistration[] = [
      {
        deviceId: `zwave-bed-${Date.now()}`,
        deviceName: 'Bed Occupancy Sensor',
        deviceType: SafetyDeviceType.BED_SENSOR,
        category: DeviceCategory.SAFETY_DEVICE,
        protocol: DeviceProtocol.ZWAVE,
        manufacturer: 'EarlySense',
        model: 'Live',
        firmwareVersion: '4.1.2',
        capabilities: ['occupancy', 'heart_rate', 'respiratory_rate', 'movement'],
        metadata: { zone: 'bedroom' },
      },
      {
        deviceId: `zwave-door-${Date.now()}`,
        deviceName: 'Smart Door Sensor',
        deviceType: SafetyDeviceType.DOOR_SENSOR,
        category: DeviceCategory.SAFETY_DEVICE,
        protocol: DeviceProtocol.ZWAVE,
        manufacturer: 'Aeotec',
        model: 'Door/Window Sensor 7',
        firmwareVersion: '1.3.0',
        capabilities: ['open_close', 'tamper', 'battery'],
        metadata: { location: 'front_door' },
      },
    ];

    return mockDevices;
  }

  /**
   * Discover MQTT devices (WiFi-connected devices)
   */
  private async discoverMQTTDevices(homeId: string): Promise<DeviceRegistration[]> {
    this.logger.log('Discovering MQTT/WiFi devices...');

    const mockDevices: DeviceRegistration[] = [
      {
        deviceId: `mqtt-scale-${Date.now()}`,
        deviceName: 'Withings Body+ Scale',
        deviceType: MedicalDeviceType.SMART_SCALE,
        category: DeviceCategory.MEDICAL_WEARABLE,
        protocol: DeviceProtocol.MQTT,
        manufacturer: 'Withings',
        model: 'Body+',
        firmwareVersion: '6.2.4',
        ipAddress: '192.168.1.150',
        capabilities: ['weight', 'body_fat', 'muscle_mass', 'water_percentage', 'bone_mass'],
        metadata: { users: 4 },
      },
      {
        deviceId: `mqtt-dispenser-${Date.now()}`,
        deviceName: 'Smart Medication Dispenser',
        deviceType: SafetyDeviceType.MEDICATION_DISPENSER,
        category: DeviceCategory.SAFETY_DEVICE,
        protocol: DeviceProtocol.MQTT,
        manufacturer: 'Hero Health',
        model: 'Hero',
        firmwareVersion: '2.5.1',
        ipAddress: '192.168.1.151',
        capabilities: ['dispense', 'reminder', 'adherence_tracking', 'refill_alert'],
        metadata: { capacity: 10 },
      },
    ];

    return mockDevices;
  }

  /**
   * Register a discovered device
   */
  async registerDevice(
    homeId: string,
    elderId: string,
    registration: DeviceRegistration,
  ): Promise<any> {
    this.logger.log(`Registering device: ${registration.deviceName} (${registration.deviceId})`);

    try {
      const device = await this.prisma.iotDevice.create({
        data: {
          homeId,
          elderId,
          deviceId: registration.deviceId,
          deviceName: registration.deviceName,
          deviceType: registration.deviceType,
          category: registration.category,
          protocol: registration.protocol,
          manufacturer: registration.manufacturer,
          model: registration.model,
          firmwareVersion: registration.firmwareVersion,
          macAddress: registration.macAddress,
          ipAddress: registration.ipAddress,
          capabilities: registration.capabilities,
          metadata: registration.metadata || {},
          status: 'ONLINE',
          registeredAt: new Date(),
          lastSeen: new Date(),
        },
      });

      // Cache device info
      this.deviceCache.set(registration.deviceId, device);

      this.logger.log(`Device registered successfully: ${device.id}`);
      return device;
    } catch (error) {
      this.logger.error(`Error registering device: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // REAL-TIME DATA COLLECTION
  // ============================================================================

  /**
   * Collect reading from medical wearable
   */
  async collectMedicalReading(deviceId: string, reading: DeviceReading): Promise<any> {
    this.logger.debug(`Collecting medical reading from device: ${deviceId}`);

    try {
      const device = await this.getDeviceByDeviceId(deviceId);

      if (!device) {
        throw new NotFoundException(`Device ${deviceId} not found`);
      }

      // Validate data quality
      const qualityMetrics = this.assessDataQuality(reading);

      if (qualityMetrics.reliability < 50) {
        this.logger.warn(`Low quality reading from ${deviceId}: ${qualityMetrics.reliability}%`);
      }

      // Store reading
      const storedReading = await this.prisma.iotReading.create({
        data: {
          deviceId: device.id,
          timestamp: reading.timestamp,
          readingType: reading.readingType,
          value: reading.value,
          unit: reading.unit,
          quality: reading.quality,
          metadata: reading.metadata || {},
        },
      });

      // Process based on device type
      await this.processMedicalReading(device, storedReading);

      // Update device last seen
      await this.updateDeviceLastSeen(device.id);

      return storedReading;
    } catch (error) {
      this.logger.error(`Error collecting medical reading: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process medical device reading and create health records
   */
  private async processMedicalReading(device: any, reading: any): Promise<void> {
    const { deviceType, elderId } = device;

    try {
      switch (deviceType) {
        case MedicalDeviceType.ECG_MONITOR:
          await this.processECGReading(elderId, reading);
          break;
        case MedicalDeviceType.CONTINUOUS_GLUCOSE_MONITOR:
          await this.processGlucoseReading(elderId, reading);
          break;
        case MedicalDeviceType.BLOOD_PRESSURE_MONITOR:
          await this.processBloodPressureReading(elderId, reading);
          break;
        case MedicalDeviceType.PULSE_OXIMETER:
          await this.processPulseOxReading(elderId, reading);
          break;
        case MedicalDeviceType.SMART_SCALE:
          await this.processWeightReading(elderId, reading);
          break;
        default:
          this.logger.debug(`No specific processing for device type: ${deviceType}`);
      }
    } catch (error) {
      this.logger.error(`Error processing medical reading: ${error.message}`);
    }
  }

  private async processECGReading(elderId: string, reading: any): Promise<void> {
    const value = typeof reading.value === 'object' ? reading.value : { heartRate: reading.value };

    // Create heart rate vital if available
    if (value.heartRate) {
      await this.prisma.vitalReading.create({
        data: {
          elderId,
          vitalType: 'HEART_RATE',
          value: value.heartRate,
          unit: 'bpm',
          deviceId: reading.deviceId,
          recordedAt: reading.timestamp,
        },
      });
    }

    // Check for abnormalities (AFib, arrhythmia)
    if (value.afibDetected || value.irregularRhythm) {
      await this.createHealthAlert(elderId, {
        type: 'VITAL_ABNORMAL',
        severity: 'WARNING',
        title: 'Irregular Heart Rhythm Detected',
        message: `ECG monitor detected ${value.afibDetected ? 'atrial fibrillation' : 'irregular rhythm'}`,
        metadata: { ecgReading: value },
      });
    }
  }

  private async processGlucoseReading(elderId: string, reading: any): Promise<void> {
    const glucose = typeof reading.value === 'number' ? reading.value : reading.value.glucose;

    await this.prisma.vitalReading.create({
      data: {
        elderId,
        vitalType: 'GLUCOSE',
        value: glucose,
        unit: 'mg/dL',
        deviceId: reading.deviceId,
        recordedAt: reading.timestamp,
      },
    });

    // Check for hypo/hyperglycemia
    if (glucose < 70) {
      await this.createHealthAlert(elderId, {
        type: 'VITAL_ABNORMAL',
        severity: 'CRITICAL',
        title: 'Low Blood Sugar',
        message: `Blood glucose critically low: ${glucose} mg/dL`,
        metadata: { glucose, trend: reading.value.trend },
      });
    } else if (glucose > 250) {
      await this.createHealthAlert(elderId, {
        type: 'VITAL_ABNORMAL',
        severity: 'CRITICAL',
        title: 'High Blood Sugar',
        message: `Blood glucose critically high: ${glucose} mg/dL`,
        metadata: { glucose, trend: reading.value.trend },
      });
    }
  }

  private async processBloodPressureReading(elderId: string, reading: any): Promise<void> {
    const value = typeof reading.value === 'object' ? reading.value : { systolic: reading.value };

    await this.prisma.vitalReading.create({
      data: {
        elderId,
        vitalType: 'BLOOD_PRESSURE',
        value: value.systolic,
        systolic: value.systolic,
        diastolic: value.diastolic,
        unit: 'mmHg',
        deviceId: reading.deviceId,
        recordedAt: reading.timestamp,
      },
    });
  }

  private async processPulseOxReading(elderId: string, reading: any): Promise<void> {
    const value = typeof reading.value === 'object' ? reading.value : { spo2: reading.value };

    await this.prisma.vitalReading.create({
      data: {
        elderId,
        vitalType: 'SPO2',
        value: value.spo2,
        unit: '%',
        deviceId: reading.deviceId,
        recordedAt: reading.timestamp,
      },
    });

    // Alert on low oxygen
    if (value.spo2 < 92) {
      await this.createHealthAlert(elderId, {
        type: 'VITAL_ABNORMAL',
        severity: value.spo2 < 88 ? 'CRITICAL' : 'WARNING',
        title: 'Low Blood Oxygen',
        message: `SpO2 level low: ${value.spo2}%`,
        metadata: { spo2: value.spo2 },
      });
    }
  }

  private async processWeightReading(elderId: string, reading: any): Promise<void> {
    const value = typeof reading.value === 'object' ? reading.value : { weight: reading.value };

    await this.prisma.vitalReading.create({
      data: {
        elderId,
        vitalType: 'WEIGHT',
        value: value.weight,
        unit: 'lbs',
        deviceId: reading.deviceId,
        recordedAt: reading.timestamp,
        notes: value.bodyFat ? `Body Fat: ${value.bodyFat}%` : undefined,
      },
    });
  }

  /**
   * Collect environmental sensor data
   */
  async collectEnvironmentalReading(deviceId: string, reading: DeviceReading): Promise<any> {
    this.logger.debug(`Collecting environmental reading from device: ${deviceId}`);

    const device = await this.getDeviceByDeviceId(deviceId);

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const storedReading = await this.prisma.iotReading.create({
      data: {
        deviceId: device.id,
        timestamp: reading.timestamp,
        readingType: reading.readingType,
        value: reading.value,
        unit: reading.unit,
        quality: reading.quality,
        metadata: reading.metadata || {},
      },
    });

    // Check environmental thresholds
    await this.checkEnvironmentalThresholds(device, storedReading);

    await this.updateDeviceLastSeen(device.id);

    return storedReading;
  }

  /**
   * Collect safety device event
   */
  async collectSafetyEvent(deviceId: string, event: DeviceReading): Promise<any> {
    this.logger.log(`Safety event from device: ${deviceId} - ${event.readingType}`);

    const device = await this.getDeviceByDeviceId(deviceId);

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const storedEvent = await this.prisma.iotReading.create({
      data: {
        deviceId: device.id,
        timestamp: event.timestamp,
        readingType: event.readingType,
        value: event.value,
        unit: event.unit,
        quality: event.quality,
        metadata: event.metadata || {},
      },
    });

    // Process safety events immediately
    await this.processSafetyEvent(device, storedEvent);

    await this.updateDeviceLastSeen(device.id);

    return storedEvent;
  }

  private async processSafetyEvent(device: any, event: any): Promise<void> {
    const { deviceType, elderId } = device;

    switch (deviceType) {
      case SafetyDeviceType.BED_SENSOR:
        if (event.readingType === 'occupancy' && event.value === false) {
          // Elder left bed - monitor for fall risk
          this.logger.log(`Elder ${elderId} exited bed at ${event.timestamp}`);
        }
        break;

      case SafetyDeviceType.DOOR_SENSOR:
        if (event.readingType === 'open' && this.isNighttime()) {
          // Door opened at night - potential wandering
          await this.createHealthAlert(elderId, {
            type: 'SAFETY',
            severity: 'WARNING',
            title: 'Door Opened at Night',
            message: 'Front door was opened during nighttime hours',
            metadata: { deviceId: device.deviceId, timestamp: event.timestamp },
          });
        }
        break;

      case SafetyDeviceType.FALL_DETECTOR:
        if (event.readingType === 'fall_detected') {
          await this.createHealthAlert(elderId, {
            type: 'FALL_DETECTED',
            severity: 'CRITICAL',
            title: 'Fall Detected',
            message: 'Fall detector triggered - immediate assistance may be needed',
            metadata: { deviceId: device.deviceId, timestamp: event.timestamp },
          });
        }
        break;

      case SafetyDeviceType.MEDICATION_DISPENSER:
        if (event.readingType === 'missed_dose') {
          await this.createHealthAlert(elderId, {
            type: 'MEDICATION_MISSED',
            severity: 'WARNING',
            title: 'Medication Missed',
            message: 'Scheduled medication dose was not taken',
            metadata: { deviceId: device.deviceId, timestamp: event.timestamp },
          });
        }
        break;
    }
  }

  /**
   * Collect activity monitor data
   */
  async collectActivityReading(deviceId: string, reading: DeviceReading): Promise<any> {
    this.logger.debug(`Collecting activity reading from device: ${deviceId}`);

    const device = await this.getDeviceByDeviceId(deviceId);

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const storedReading = await this.prisma.iotReading.create({
      data: {
        deviceId: device.id,
        timestamp: reading.timestamp,
        readingType: reading.readingType,
        value: reading.value,
        unit: reading.unit,
        quality: reading.quality,
        metadata: reading.metadata || {},
      },
    });

    // Analyze activity patterns
    await this.analyzeActivityPattern(device, storedReading);

    await this.updateDeviceLastSeen(device.id);

    return storedReading;
  }

  // ============================================================================
  // DEVICE MANAGEMENT
  // ============================================================================

  /**
   * Get device by database ID
   */
  async getDeviceById(id: string): Promise<any> {
    const device = await this.prisma.iotDevice.findUnique({
      where: { id },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }

    return device;
  }

  /**
   * Get device by device ID (manufacturer ID)
   */
  async getDeviceByDeviceId(deviceId: string): Promise<any> {
    // Check cache first
    if (this.deviceCache.has(deviceId)) {
      return this.deviceCache.get(deviceId);
    }

    const device = await this.prisma.iotDevice.findUnique({
      where: { deviceId },
    });

    if (device) {
      this.deviceCache.set(deviceId, device);
    }

    return device;
  }

  /**
   * Get all devices for an elder
   */
  async getDevicesByElder(elderId: string): Promise<any[]> {
    return this.prisma.iotDevice.findMany({
      where: { elderId },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
      orderBy: { deviceName: 'asc' },
    });
  }

  /**
   * Get all devices for a home
   */
  async getDevicesByHome(homeId: string): Promise<any[]> {
    return this.prisma.iotDevice.findMany({
      where: { homeId },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
      orderBy: { deviceName: 'asc' },
    });
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus> {
    const device = await this.getDeviceByDeviceId(deviceId);

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const now = Date.now();
    const lastSeenTime = new Date(device.lastSeen).getTime();
    const minutesSinceLastSeen = (now - lastSeenTime) / (1000 * 60);

    // Device considered offline if not seen in 10 minutes
    const online = minutesSinceLastSeen < 10;

    const status: DeviceStatus = {
      deviceId: device.deviceId,
      online,
      lastSeen: device.lastSeen,
      batteryLevel: device.metadata?.batteryLevel,
      signalStrength: device.metadata?.signalStrength,
      firmwareVersion: device.firmwareVersion,
      errors: device.metadata?.errors || [],
      warnings: device.metadata?.warnings || [],
    };

    return status;
  }

  /**
   * Update device firmware
   */
  async updateDeviceFirmware(deviceId: string, newVersion: string): Promise<void> {
    this.logger.log(`Updating firmware for device ${deviceId} to version ${newVersion}`);

    const device = await this.getDeviceByDeviceId(deviceId);

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    // In production: send OTA update command to device
    // For now, just update the database
    await this.prisma.iotDevice.update({
      where: { id: device.id },
      data: { firmwareVersion: newVersion },
    });

    this.logger.log(`Firmware updated successfully for device ${deviceId}`);
  }

  /**
   * Monitor device battery level
   */
  async monitorBatteryLevels(homeId: string): Promise<any[]> {
    const devices = await this.getDevicesByHome(homeId);
    const lowBatteryDevices = [];

    for (const device of devices) {
      const batteryLevel = device.metadata?.batteryLevel;

      if (batteryLevel !== undefined && batteryLevel < 20) {
        lowBatteryDevices.push({
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          batteryLevel,
          lastSeen: device.lastSeen,
        });

        // Create alert for very low battery
        if (batteryLevel < 10) {
          await this.createHealthAlert(device.elderId, {
            type: 'DEVICE_MAINTENANCE',
            severity: 'WARNING',
            title: 'Device Battery Critical',
            message: `${device.deviceName} battery at ${batteryLevel}%`,
            metadata: { deviceId: device.deviceId, batteryLevel },
          });
        }
      }
    }

    return lowBatteryDevices;
  }

  /**
   * Check device connection health
   */
  async checkConnectionHealth(deviceId: string): Promise<any> {
    const device = await this.getDeviceByDeviceId(deviceId);

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const status = await this.getDeviceStatus(deviceId);

    // Get recent readings to check data quality
    const recentReadings = await this.prisma.iotReading.findMany({
      where: { deviceId: device.id },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const avgQuality = recentReadings.length > 0
      ? recentReadings.reduce((sum, r) => sum + r.quality, 0) / recentReadings.length
      : 0;

    return {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      status: status.online ? 'HEALTHY' : 'OFFLINE',
      batteryLevel: status.batteryLevel,
      signalStrength: status.signalStrength,
      dataQuality: Math.round(avgQuality),
      lastSeen: status.lastSeen,
      readingsLast24h: recentReadings.length,
      issues: [...status.errors, ...status.warnings],
    };
  }

  // ============================================================================
  // DATA QUALITY ASSESSMENT
  // ============================================================================

  /**
   * Assess data quality for a reading
   */
  private assessDataQuality(reading: DeviceReading): DataQualityMetrics {
    const metrics: DataQualityMetrics = {
      deviceId: reading.deviceId,
      timestamp: reading.timestamp,
      signalQuality: reading.quality || 100,
      dataCompleteness: 100,
      accuracy: 100,
      reliability: 100,
      issues: [],
    };

    // Check if reading has expected fields
    if (reading.value === null || reading.value === undefined) {
      metrics.dataCompleteness -= 50;
      metrics.issues.push('Missing value');
    }

    // Check timestamp freshness
    const age = Date.now() - reading.timestamp.getTime();
    if (age > 60000) {
      // Older than 1 minute
      metrics.reliability -= 20;
      metrics.issues.push('Stale data');
    }

    // Check signal quality
    if (reading.quality < 70) {
      metrics.reliability -= 30;
      metrics.issues.push('Low signal quality');
    }

    // Calculate overall reliability
    metrics.reliability = Math.max(0, Math.min(100,
      (metrics.signalQuality + metrics.dataCompleteness + metrics.accuracy) / 3
    ));

    return metrics;
  }

  /**
   * Get data quality metrics for device
   */
  async getDataQualityMetrics(deviceId: string, hours = 24): Promise<DataQualityMetrics> {
    const device = await this.getDeviceByDeviceId(deviceId);

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await this.prisma.iotReading.findMany({
      where: {
        deviceId: device.id,
        timestamp: { gte: startTime },
      },
    });

    if (readings.length === 0) {
      return {
        deviceId: device.deviceId,
        timestamp: new Date(),
        signalQuality: 0,
        dataCompleteness: 0,
        accuracy: 0,
        reliability: 0,
        issues: ['No data in time period'],
      };
    }

    const avgQuality = readings.reduce((sum, r) => sum + r.quality, 0) / readings.length;
    const completeness = (readings.length / (hours * 60)) * 100; // Assume 1 reading per minute ideal

    return {
      deviceId: device.deviceId,
      timestamp: new Date(),
      signalQuality: Math.round(avgQuality),
      dataCompleteness: Math.min(100, Math.round(completeness)),
      accuracy: 95, // Would need calibration data to determine
      reliability: Math.round((avgQuality + Math.min(100, completeness)) / 2),
      issues: [],
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async updateDeviceLastSeen(deviceId: string): Promise<void> {
    await this.prisma.iotDevice.update({
      where: { id: deviceId },
      data: { lastSeen: new Date() },
    });
  }

  private async checkEnvironmentalThresholds(device: any, reading: any): Promise<void> {
    const { elderId, deviceType } = device;
    const value = typeof reading.value === 'number' ? reading.value : reading.value[reading.readingType];

    switch (deviceType) {
      case EnvironmentalSensorType.AIR_QUALITY:
        if (reading.readingType === 'pm25' && value > 35) {
          await this.createHealthAlert(elderId, {
            type: 'ENVIRONMENTAL',
            severity: 'WARNING',
            title: 'Poor Air Quality',
            message: `PM2.5 level high: ${value} µg/m³`,
            metadata: { deviceId: device.deviceId, pm25: value },
          });
        }
        break;

      case EnvironmentalSensorType.CARBON_MONOXIDE:
        if (value > 9) {
          // CO > 9 ppm is dangerous
          await this.createHealthAlert(elderId, {
            type: 'ENVIRONMENTAL',
            severity: 'CRITICAL',
            title: 'Carbon Monoxide Detected',
            message: `Dangerous CO level: ${value} ppm`,
            metadata: { deviceId: device.deviceId, co: value },
          });
        }
        break;

      case EnvironmentalSensorType.WATER_LEAK:
        if (reading.readingType === 'leak_detected' && value === true) {
          await this.createHealthAlert(elderId, {
            type: 'ENVIRONMENTAL',
            severity: 'WARNING',
            title: 'Water Leak Detected',
            message: 'Water leak sensor triggered',
            metadata: { deviceId: device.deviceId, location: device.metadata?.location },
          });
        }
        break;
    }
  }

  private async analyzeActivityPattern(device: any, reading: any): Promise<void> {
    // Activity pattern analysis would be more sophisticated in production
    // For now, just log unusual patterns

    if (reading.readingType === 'toilet_use') {
      // Check frequency
      const recentUses = await this.prisma.iotReading.findMany({
        where: {
          deviceId: device.id,
          readingType: 'toilet_use',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (recentUses.length > 12) {
        // More than 12 times in 24 hours - possible UTI
        this.logger.warn(`High toilet usage frequency for elder ${device.elderId}: ${recentUses.length} times`);
      }
    }
  }

  private async createHealthAlert(elderId: string, alertData: any): Promise<void> {
    try {
      await this.prisma.alert.create({
        data: {
          elderId,
          type: alertData.type,
          severity: alertData.severity,
          status: 'ACTIVE',
          title: alertData.title,
          message: alertData.message,
          metadata: alertData.metadata || {},
          triggeredAt: new Date(),
        },
      });

      this.logger.log(`Alert created: ${alertData.type} for elder ${elderId}`);
    } catch (error) {
      this.logger.error(`Error creating health alert: ${error.message}`);
    }
  }

  private isNighttime(): boolean {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 6; // 10 PM to 6 AM
  }
}
