# Phase 2 Services - Usage Examples

## IoT Devices Service

### 1. Discover and Register Devices

```typescript
import { IotDeviceService } from './iot-devices/services/iot-device.service';

// Discover all devices in a home
const discoveredDevices = await iotDeviceService.startDeviceDiscovery(homeId);

// Register a discovered device
const device = await iotDeviceService.registerDevice(
  homeId,
  elderId,
  {
    deviceId: 'ble-ecg-12345',
    deviceName: 'AliveCor KardiaMobile ECG',
    deviceType: 'ECG_MONITOR',
    category: 'MEDICAL_WEARABLE',
    protocol: 'BLE',
    manufacturer: 'AliveCor',
    model: 'KardiaMobile 6L',
    firmwareVersion: '2.1.3',
    macAddress: 'AA:BB:CC:DD:EE:01',
    capabilities: ['ecg_recording', 'heart_rate', 'afib_detection'],
    metadata: { batteryLevel: 85 }
  }
);
```

### 2. Collect Medical Device Readings

```typescript
// Collect ECG reading
await iotDeviceService.collectMedicalReading('ble-ecg-12345', {
  deviceId: 'ble-ecg-12345',
  timestamp: new Date(),
  readingType: 'ecg',
  value: {
    heartRate: 72,
    afibDetected: false,
    irregularRhythm: false
  },
  quality: 95,
  metadata: { duration: 30 }
});

// Collect glucose reading (CGM)
await iotDeviceService.collectMedicalReading('ble-cgm-12345', {
  deviceId: 'ble-cgm-12345',
  timestamp: new Date(),
  readingType: 'glucose',
  value: 110,
  unit: 'mg/dL',
  quality: 98,
  metadata: { trend: 'stable' }
});

// Collect blood pressure reading
await iotDeviceService.collectMedicalReading('ble-bp-12345', {
  deviceId: 'ble-bp-12345',
  timestamp: new Date(),
  readingType: 'blood_pressure',
  value: {
    systolic: 120,
    diastolic: 80,
    heartRate: 75
  },
  unit: 'mmHg',
  quality: 100
});
```

### 3. Collect Environmental Sensor Data

```typescript
// Air quality monitoring
await iotDeviceService.collectEnvironmentalReading('zigbee-air-12345', {
  deviceId: 'zigbee-air-12345',
  timestamp: new Date(),
  readingType: 'air_quality',
  value: {
    pm25: 12,
    co2: 450,
    voc: 100,
    temperature: 72,
    humidity: 45
  },
  quality: 100
});

// Water leak detection
await iotDeviceService.collectEnvironmentalReading('zigbee-leak-12345', {
  deviceId: 'zigbee-leak-12345',
  timestamp: new Date(),
  readingType: 'leak_detected',
  value: false,
  quality: 100
});
```

### 4. Handle Safety Events

```typescript
// Bed sensor event
await iotDeviceService.collectSafetyEvent('zwave-bed-12345', {
  deviceId: 'zwave-bed-12345',
  timestamp: new Date(),
  readingType: 'occupancy',
  value: false, // Elder exited bed
  quality: 100
});

// Door sensor event
await iotDeviceService.collectSafetyEvent('zwave-door-12345', {
  deviceId: 'zwave-door-12345',
  timestamp: new Date(),
  readingType: 'open',
  value: true,
  quality: 100,
  metadata: { location: 'front_door' }
});

// Medication dispenser event
await iotDeviceService.collectSafetyEvent('mqtt-dispenser-12345', {
  deviceId: 'mqtt-dispenser-12345',
  timestamp: new Date(),
  readingType: 'missed_dose',
  value: true,
  quality: 100,
  metadata: { scheduledTime: '09:00' }
});
```

### 5. Device Management

```typescript
// Get device status
const status = await iotDeviceService.getDeviceStatus('ble-ecg-12345');
console.log(status.online, status.batteryLevel, status.lastSeen);

// Get all devices for an elder
const devices = await iotDeviceService.getDevicesByElder(elderId);

// Check connection health
const health = await iotDeviceService.checkConnectionHealth('ble-ecg-12345');

// Monitor battery levels
const lowBatteryDevices = await iotDeviceService.monitorBatteryLevels(homeId);

// Update firmware
await iotDeviceService.updateDeviceFirmware('ble-ecg-12345', '2.2.0');

// Get data quality metrics
const qualityMetrics = await iotDeviceService.getDataQualityMetrics('ble-ecg-12345', 24);
```

## Edge Computing Service

### 1. Register Edge Gateway

```typescript
import { EdgeComputingService } from './edge-computing/services/edge-computing.service';

const gateway = await edgeComputingService.registerGateway({
  gatewayId: 'gateway-home-001',
  homeId,
  name: 'Living Room Gateway',
  ipAddress: '192.168.1.100',
  hardware: {
    cpu: 'Intel Core i5',
    memory: 8, // GB
    storage: 256, // GB
    accelerator: 'VPU',
    acceleratorModel: 'Intel Movidius'
  },
  capabilities: ['ml_inference', 'data_aggregation', 'privacy_filtering']
});
```

### 2. Deploy ML Models to Edge

```typescript
// Deploy fall detection model
await edgeComputingService.deployModel(
  'gateway-home-001',
  'FALL_DETECTION',
  { modelPath: '/models/fall-detection-v2.pb' }
);

// Deploy activity recognition model
await edgeComputingService.deployModel(
  'gateway-home-001',
  'ACTIVITY_RECOGNITION',
  { modelPath: '/models/activity-recognition-v1.pb' }
);
```

### 3. Request ML Inference at Edge

```typescript
// Fall detection inference
const fallResult = await edgeComputingService.requestInference({
  gatewayId: 'gateway-home-001',
  model: 'FALL_DETECTION',
  inputData: {
    frame: videoFrameBuffer,
    previousFrames: [frame1, frame2, frame3]
  },
  priority: 'CRITICAL'
});

console.log(fallResult.result.fallDetected, fallResult.confidence, fallResult.latency);

// Voice analysis inference
const voiceResult = await edgeComputingService.requestInference({
  gatewayId: 'gateway-home-001',
  model: 'VOICE_ANALYSIS',
  inputData: {
    audioSegment: audioBuffer,
    duration: 5
  },
  priority: 'NORMAL'
});

console.log(voiceResult.result.emotion, voiceResult.result.stress_level);
```

### 4. Data Aggregation

```typescript
// Aggregate 1000 sensor readings into summary
const rawData = [
  { type: 'temperature', value: 72, timestamp: new Date() },
  { type: 'temperature', value: 72.5, timestamp: new Date() },
  // ... 998 more readings
];

const aggregation = await edgeComputingService.aggregateDataAtEdge(
  'gateway-home-001',
  rawData,
  60 // 60 second window
);

console.log(
  `Reduced ${aggregation.dataPoints} points to ${Object.keys(aggregation.aggregatedData).length} aggregates`
);
console.log(`Saved ${aggregation.bandwidthSaved} MB (${aggregation.compression}% reduction)`);
```

### 5. Privacy Filtering

```typescript
// Apply privacy filters to video data
const filteredVideo = await edgeComputingService.applyPrivacyFilters(
  'gateway-home-001',
  {
    raw_frame: videoFrame,
    pose_landmarks: poseLandmarks,
    lighting: 'good',
    objects_detected: ['person', 'chair']
  },
  'VIDEO'
);

// Result: raw_frame removed, only pose landmarks retained

// Apply privacy filters to audio data
const filteredAudio = await edgeComputingService.applyPrivacyFilters(
  'gateway-home-001',
  {
    raw_audio: audioBuffer,
    emotional_tone: 'happy',
    volume_level: 0.7,
    transcript: 'Hello how are you'
  },
  'AUDIO'
);

// Result: raw_audio and transcript removed, only emotional tone retained
```

### 6. Offline Operation & Sync

```typescript
// Store data for offline operation
await edgeComputingService.storeForOfflineOperation('gateway-home-001', {
  type: 'vital_reading',
  data: { heartRate: 75, timestamp: new Date() }
});

// Sync queued data when connection restored
const syncStatus = await edgeComputingService.syncQueuedData('gateway-home-001');
console.log(`Synced data, ${syncStatus.pendingItems} items remaining`);

// Get sync status
const status = await edgeComputingService.getSyncStatus('gateway-home-001');
```

### 7. Processing Coordination

```typescript
// Edge-first processing (try edge, fallback to cloud)
const result = await edgeComputingService.coordinateProcessing(
  'gateway-home-001',
  'EDGE_FIRST',
  { type: 'gait_analysis', videoSegment: buffer }
);

// Hybrid processing (process on both, combine results)
const hybridResult = await edgeComputingService.coordinateProcessing(
  'gateway-home-001',
  'HYBRID',
  { type: 'anomaly_detection', data: sensorReadings }
);
```

### 8. Gateway Health Monitoring

```typescript
// Update gateway heartbeat with metrics
await edgeComputingService.updateGatewayHeartbeat('gateway-home-001', {
  cpuUsage: 45,
  memoryUsage: 60,
  storageUsage: 30,
  networkBandwidth: 50,
  inferenceLatency: 25,
  throughput: 20,
  temperature: 55
});

// Get gateway health
const health = await edgeComputingService.getGatewayHealth('gateway-home-001');
console.log(health.status, health.metrics, health.issues);
```

## Robotics Service

### 1. Register Robot

```typescript
import { RoboticsService } from './robotics/services/robotics.service';

const robot = await roboticsService.registerRobot({
  robotId: 'elliq-001',
  elderId,
  homeId,
  robotName: 'ElliQ Companion',
  robotType: 'COMPANION',
  robotModel: 'ELLIQ',
  capabilities: [
    'SPEAK',
    'LISTEN',
    'DISPLAY_EMOTION',
    'DISPLAY_CONTENT',
    'VIDEO_CALL',
    'MEDICATION_REMINDER',
    'MUSIC_PLAYBACK',
    'GAMES'
  ]
});
```

### 2. Communication

```typescript
// Make robot speak
await roboticsService.speak(
  'elliq-001',
  'Good morning! How are you feeling today?',
  'HAPPY'
);

// Listen for elder response
const response = await roboticsService.listen('elliq-001', 15);
console.log(response.result.transcript);

// Display emotion
await roboticsService.displayEmotion('elliq-001', 'ENCOURAGING');

// Have a conversation
const conversation = await roboticsService.haveConversation(
  'elliq-001',
  'gardening',
  300 // 5 minute conversation
);
```

### 3. Physical Assistance

```typescript
// Fetch item for elder
await roboticsService.provideAssistance({
  robotId: 'pepper-001',
  assistanceType: 'FETCH_ITEM',
  parameters: {
    item: 'water bottle',
    location: 'kitchen',
    deliveryLocation: 'living_room'
  }
});

// Medication reminder
await roboticsService.provideAssistance({
  robotId: 'elliq-001',
  assistanceType: 'MEDICATION_REMINDER',
  parameters: {
    medication: 'blood pressure medication',
    dosage: '10mg'
  }
});

// Exercise guidance
await roboticsService.provideAssistance({
  robotId: 'pepper-001',
  assistanceType: 'EXERCISE_GUIDANCE',
  parameters: {
    exerciseType: 'chair yoga',
    duration: 15,
    difficulty: 'easy'
  }
});

// Emergency call
await roboticsService.provideAssistance({
  robotId: 'elliq-001',
  assistanceType: 'EMERGENCY_CALL',
  parameters: {
    reason: 'Elder reported feeling dizzy',
    contacts: ['family', 'caregiver']
  },
  urgent: true
});
```

### 4. Monitoring

```typescript
// Process fall detection from robot
await roboticsService.processMonitoringData({
  robotId: 'pepper-001',
  timestamp: new Date(),
  dataType: 'FALL_DETECTION',
  data: {
    fallDetected: true,
    location: 'living_room',
    confidence: 0.95
  },
  confidence: 0.95,
  requiresAction: true
});

// Process mood assessment
await roboticsService.processMonitoringData({
  robotId: 'elliq-001',
  timestamp: new Date(),
  dataType: 'MOOD_ASSESSMENT',
  data: {
    mood: 'sad',
    score: 35,
    indicators: ['low_energy', 'quiet_speech']
  },
  confidence: 0.87,
  requiresAction: true
});

// Process activity tracking
await roboticsService.processMonitoringData({
  robotId: 'pepper-001',
  timestamp: new Date(),
  dataType: 'ACTIVITY_TRACKING',
  data: {
    activity: 'SEDENTARY',
    duration: 180,
    location: 'living_room'
  },
  confidence: 0.92,
  requiresAction: false
});
```

### 5. Robot Configuration

```typescript
// Update robot preferences
await roboticsService.updateRobotPreferences('elliq-001', {
  voiceGender: 'FEMALE',
  voiceSpeed: 0.9,
  volume: 75,
  proactivityLevel: 80,
  personalityTraits: {
    warmth: 90,
    humor: 70,
    formality: 30,
    patience: 95
  },
  elderName: 'Margaret',
  elderPreferences: {
    musicGenres: ['classical', 'jazz', 'broadway'],
    topics: ['gardening', 'grandchildren', 'cooking'],
    activityLevel: 'MEDIUM'
  }
});

// Get robot configuration
const config = await roboticsService.getRobot('elliq-001');

// Get all robots for an elder
const robots = await roboticsService.getRobotsByElder(elderId);
```

## Integration Example

### Complete Elder Monitoring Flow

```typescript
// 1. Register devices
const ecgDevice = await iotDeviceService.registerDevice(homeId, elderId, ecgDeviceConfig);
const edgeGateway = await edgeComputingService.registerGateway(gatewayConfig);
const robot = await roboticsService.registerRobot(robotConfig);

// 2. Deploy models to edge
await edgeComputingService.deployModel(gatewayId, 'FALL_DETECTION', modelData);

// 3. Collect vital signs from wearable
await iotDeviceService.collectMedicalReading(ecgDevice.deviceId, {
  deviceId: ecgDevice.deviceId,
  timestamp: new Date(),
  readingType: 'ecg',
  value: { heartRate: 75, afibDetected: false },
  quality: 95
});

// 4. Process video for fall detection at edge (privacy-preserved)
const fallResult = await edgeComputingService.requestInference({
  gatewayId,
  model: 'FALL_DETECTION',
  inputData: videoFrame,
  priority: 'CRITICAL'
});

// 5. Robot provides proactive check-in
if (fallResult.result.fallDetected) {
  await roboticsService.speak(
    robot.robotId,
    'I detected you may have fallen. Are you okay? Please respond.',
    'CONCERNED'
  );
  
  const response = await roboticsService.listen(robot.robotId, 15);
  
  if (!response.success) {
    await roboticsService.provideAssistance({
      robotId: robot.robotId,
      assistanceType: 'EMERGENCY_CALL',
      parameters: { reason: 'Fall detected with no response' },
      urgent: true
    });
  }
}

// 6. Aggregate sensor data at edge (95% bandwidth reduction)
const aggregation = await edgeComputingService.aggregateDataAtEdge(
  gatewayId,
  sensorReadings,
  60
);

// 7. Sync data when connection available
await edgeComputingService.syncQueuedData(gatewayId);
```

## Best Practices

1. **Always handle errors gracefully**
   ```typescript
   try {
     await iotDeviceService.collectMedicalReading(deviceId, reading);
   } catch (error) {
     logger.error('Failed to collect reading', error);
     // Retry or store for later
   }
   ```

2. **Monitor device health regularly**
   ```typescript
   setInterval(async () => {
     const health = await iotDeviceService.checkConnectionHealth(deviceId);
     if (health.status !== 'HEALTHY') {
       // Alert maintenance team
     }
   }, 60000); // Every minute
   ```

3. **Use priority for critical operations**
   ```typescript
   // High priority for fall detection
   await edgeComputingService.requestInference({
     gatewayId,
     model: 'FALL_DETECTION',
     inputData: frame,
     priority: 'CRITICAL'
   });
   ```

4. **Leverage offline capabilities**
   ```typescript
   if (!isOnline) {
     await edgeComputingService.storeForOfflineOperation(gatewayId, data);
   }
   ```

5. **Personalize robot interactions**
   ```typescript
   const elder = await getElderProfile(elderId);
   await roboticsService.updateRobotPreferences(robotId, {
     elderName: elder.firstName,
     elderPreferences: {
       musicGenres: elder.preferences.musicGenres,
       topics: elder.interests
     }
   });
   ```
