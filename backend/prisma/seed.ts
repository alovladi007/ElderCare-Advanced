import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.sensorEvent.deleteMany();
  await prisma.actuatorCommand.deleteMany();
  await prisma.sensor.deleteMany();
  await prisma.actuator.deleteMany();
  await prisma.device.deleteMany();
  await prisma.deviceType.deleteMany();
  await prisma.homeZone.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.emergencyScenario.deleteMany();
  await prisma.emergencyScenarioInstance.deleteMany();
  await prisma.inactivityProfile.deleteMany();
  await prisma.helpTrigger.deleteMany();
  await prisma.iotToken.deleteMany();
  await prisma.home.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.vitalReading.deleteMany();
  await prisma.elderProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@eldercare.com',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      phone: '+1-555-0100',
    },
  });

  // Create Family User
  const familyUser = await prisma.user.create({
    data: {
      email: 'family@eldercare.com',
      password: await bcrypt.hash('family123', 10),
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'FAMILY',
      phone: '+1-555-0101',
    },
  });

  // Create Caregiver User
  const caregiverUser = await prisma.user.create({
    data: {
      email: 'caregiver@eldercare.com',
      password: await bcrypt.hash('caregiver123', 10),
      firstName: 'Maria',
      lastName: 'Garcia',
      role: 'CAREGIVER',
      phone: '+1-555-0102',
    },
  });

  // Create Elder User & Profile
  const elderUser = await prisma.user.create({
    data: {
      email: 'elder@eldercare.com',
      password: await bcrypt.hash('elder123', 10),
      firstName: 'Robert',
      lastName: 'Williams',
      role: 'ELDER',
      phone: '+1-555-0103',
    },
  });

  const elderProfile = await prisma.elderProfile.create({
    data: {
      userId: elderUser.id,
      dateOfBirth: new Date('1945-05-15'),
      gender: 'male',
      medicalRecordNo: 'MRN-001234',
      address: '123 Maple Street, Apt 4B, Springfield, IL 62701',
      emergencyContact: {
        name: 'Sarah Johnson',
        relationship: 'Daughter',
        phone: '+1-555-0101',
      },
      medicalConditions: [
        { condition: 'Hypertension', diagnosedDate: '2018-03-15', notes: 'Well controlled with medication' },
        { condition: 'Diabetes Type 2', diagnosedDate: '2019-06-20', notes: 'Diet and medication managed' },
      ],
      medications: [
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', prescribedBy: 'Dr. Smith' },
        { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', prescribedBy: 'Dr. Smith' },
      ],
      allergies: ['Penicillin', 'Shellfish'],
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created users and elder profile');

  // Create Home
  const home = await prisma.home.create({
    data: {
      elderId: elderProfile.id,
      name: "Robert's Home",
      address: '123 Maple Street, Apt 4B, Springfield, IL 62701',
      timezone: 'America/Chicago',
      notes: 'Ground floor apartment, elevator access available',
    },
  });

  // Create Home Zones
  const livingRoom = await prisma.homeZone.create({
    data: {
      homeId: home.id,
      name: 'Living Room',
      description: 'Main living area with TV and seating',
      floor: 'Ground',
      isCriticalArea: false,
    },
  });

  const bedroom = await prisma.homeZone.create({
    data: {
      homeId: home.id,
      name: 'Bedroom',
      description: 'Primary sleeping area',
      floor: 'Ground',
      isCriticalArea: true,
    },
  });

  const bathroom = await prisma.homeZone.create({
    data: {
      homeId: home.id,
      name: 'Bathroom',
      description: 'Full bathroom with shower',
      floor: 'Ground',
      isCriticalArea: true,
    },
  });

  const kitchen = await prisma.homeZone.create({
    data: {
      homeId: home.id,
      name: 'Kitchen',
      description: 'Kitchen with gas stove',
      floor: 'Ground',
      isCriticalArea: true,
    },
  });

  const entryway = await prisma.homeZone.create({
    data: {
      homeId: home.id,
      name: 'Entryway',
      description: 'Main entrance',
      floor: 'Ground',
      isCriticalArea: false,
    },
  });

  console.log('✅ Created home and zones');

  // Create Device Types
  const motionSensorType = await prisma.deviceType.create({
    data: {
      name: 'Ceiling Motion Sensor',
      category: 'SENSOR',
      capabilitiesJson: { sensors: ['MOTION'], range: '20ft', batteryLife: '2 years' },
      vendor: 'SafeHome',
      model: 'MS-100',
    },
  });

  const doorSensorType = await prisma.deviceType.create({
    data: {
      name: 'Door/Window Contact Sensor',
      category: 'SENSOR',
      capabilitiesJson: { sensors: ['CONTACT_DOOR', 'CONTACT_WINDOW'], batteryLife: '3 years' },
      vendor: 'SafeHome',
      model: 'DW-200',
    },
  });

  const smokeSensorType = await prisma.deviceType.create({
    data: {
      name: 'Smart Smoke Detector',
      category: 'HYBRID',
      capabilitiesJson: { sensors: ['SMOKE'], actuators: ['SIREN'], batteryBackup: true },
      vendor: 'SafeHome',
      model: 'SD-300',
    },
  });

  const fallDetectorType = await prisma.deviceType.create({
    data: {
      name: 'Wearable Fall Detector',
      category: 'SENSOR',
      capabilitiesJson: { sensors: ['FALL_DETECTOR', 'BUTTON_PANIC'], waterproof: true },
      vendor: 'LifeAlert',
      model: 'FD-500',
    },
  });

  const smartLightType = await prisma.deviceType.create({
    data: {
      name: 'Smart Light Bulb',
      category: 'ACTUATOR',
      capabilitiesJson: { actuators: ['LIGHT'], dimmable: true, colorTemp: true },
      vendor: 'SmartHome',
      model: 'SL-400',
    },
  });

  const smartSpeakerType = await prisma.deviceType.create({
    data: {
      name: 'Smart Speaker with TTS',
      category: 'ACTUATOR',
      capabilitiesJson: { actuators: ['SPEAKER_TTS'], voiceControl: true },
      vendor: 'SmartHome',
      model: 'SP-600',
    },
  });

  console.log('✅ Created device types');

  // Create Devices and Sensors

  // Living Room Motion Sensor
  const livingRoomMotion = await prisma.device.create({
    data: {
      homeId: home.id,
      zoneId: livingRoom.id,
      deviceTypeId: motionSensorType.id,
      name: 'Living Room Motion',
      identifier: 'LR-MOTION-001',
      status: 'ONLINE',
      batteryLevel: 85,
      lastSeenAt: new Date(),
      firmwareVersion: '2.1.3',
      installedAt: new Date('2024-01-15'),
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: livingRoomMotion.id,
      sensorType: 'MOTION',
      name: 'Living Room Motion Sensor',
      isCritical: false,
    },
  });

  // Bedroom Motion Sensor
  const bedroomMotion = await prisma.device.create({
    data: {
      homeId: home.id,
      zoneId: bedroom.id,
      deviceTypeId: motionSensorType.id,
      name: 'Bedroom Motion',
      identifier: 'BR-MOTION-001',
      status: 'ONLINE',
      batteryLevel: 92,
      lastSeenAt: new Date(),
      firmwareVersion: '2.1.3',
      installedAt: new Date('2024-01-15'),
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: bedroomMotion.id,
      sensorType: 'MOTION',
      name: 'Bedroom Motion Sensor',
      isCritical: false,
    },
  });

  // Front Door Sensor
  const frontDoor = await prisma.device.create({
    data: {
      homeId: home.id,
      zoneId: entryway.id,
      deviceTypeId: doorSensorType.id,
      name: 'Front Door',
      identifier: 'DOOR-FRONT-001',
      status: 'ONLINE',
      batteryLevel: 78,
      lastSeenAt: new Date(),
      firmwareVersion: '1.5.2',
      installedAt: new Date('2024-01-15'),
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: frontDoor.id,
      sensorType: 'CONTACT_DOOR',
      name: 'Front Door Sensor',
      isCritical: true,
    },
  });

  // Kitchen Smoke Detector
  const kitchenSmoke = await prisma.device.create({
    data: {
      homeId: home.id,
      zoneId: kitchen.id,
      deviceTypeId: smokeSensorType.id,
      name: 'Kitchen Smoke Detector',
      identifier: 'SMOKE-KITCHEN-001',
      status: 'ONLINE',
      batteryLevel: 100,
      lastSeenAt: new Date(),
      firmwareVersion: '3.2.1',
      installedAt: new Date('2024-01-15'),
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: kitchenSmoke.id,
      sensorType: 'SMOKE',
      name: 'Kitchen Smoke Sensor',
      isCritical: true,
    },
  });

  const kitchenSiren = await prisma.actuator.create({
    data: {
      deviceId: kitchenSmoke.id,
      actuatorType: 'SIREN',
      name: 'Kitchen Smoke Alarm Siren',
      stateSchemaJson: { on: 'boolean', pattern: 'CONTINUOUS|PULSE' },
      isCritical: true,
    },
  });

  // Fall Detector (wearable)
  const fallDetector = await prisma.device.create({
    data: {
      homeId: home.id,
      deviceTypeId: fallDetectorType.id,
      name: "Robert's Fall Detector",
      identifier: 'FALL-PENDANT-001',
      status: 'ONLINE',
      batteryLevel: 65,
      lastSeenAt: new Date(),
      firmwareVersion: '1.8.0',
      installedAt: new Date('2024-01-15'),
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: fallDetector.id,
      sensorType: 'FALL_DETECTOR',
      name: 'Fall Detection Sensor',
      isCritical: true,
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: fallDetector.id,
      sensorType: 'BUTTON_PANIC',
      name: 'Emergency Button',
      isCritical: true,
    },
  });

  // Smart Lights
  const livingRoomLight = await prisma.device.create({
    data: {
      homeId: home.id,
      zoneId: livingRoom.id,
      deviceTypeId: smartLightType.id,
      name: 'Living Room Light',
      identifier: 'LIGHT-LR-001',
      status: 'ONLINE',
      lastSeenAt: new Date(),
      firmwareVersion: '1.2.5',
      installedAt: new Date('2024-01-15'),
    },
  });

  await prisma.actuator.create({
    data: {
      deviceId: livingRoomLight.id,
      actuatorType: 'LIGHT',
      name: 'Living Room Light',
      stateSchemaJson: { on: 'boolean', brightness: '0-100', colorTemp: '2700-6500' },
      isCritical: false,
    },
  });

  // Smart Speaker
  const speaker = await prisma.device.create({
    data: {
      homeId: home.id,
      zoneId: livingRoom.id,
      deviceTypeId: smartSpeakerType.id,
      name: 'Living Room Speaker',
      identifier: 'SPEAKER-LR-001',
      status: 'ONLINE',
      lastSeenAt: new Date(),
      firmwareVersion: '4.1.0',
      installedAt: new Date('2024-01-15'),
    },
  });

  await prisma.actuator.create({
    data: {
      deviceId: speaker.id,
      actuatorType: 'SPEAKER_TTS',
      name: 'TTS Speaker',
      stateSchemaJson: { message: 'string', volume: '0-100', repeat: '1-5' },
      isCritical: false,
    },
  });

  console.log('✅ Created devices, sensors, and actuators');

  // Create Automation Rules

  // Rule 1: Turn on lights when motion detected at night
  await prisma.automationRule.create({
    data: {
      homeId: home.id,
      name: 'Night Motion Lighting',
      description: 'Turn on living room lights when motion detected between 10 PM and 6 AM',
      isEnabled: true,
      triggerType: 'SENSOR_EVENT',
      triggerConfigJson: {
        sensorType: 'MOTION',
        eventType: 'STATE_CHANGE',
        valueEquals: 'MOTION_DETECTED',
      },
      conditionConfigJson: {
        timeRange: {
          start: '22:00',
          end: '06:00',
        },
      },
      actionsConfigJson: [
        {
          type: 'TURN_ON_LIGHTS',
          zoneId: livingRoom.id,
          brightness: 50,
        },
      ],
      severity: 'INFO',
      createdByUserId: adminUser.id,
    },
  });

  // Rule 2: Alert on front door open at night
  await prisma.automationRule.create({
    data: {
      homeId: home.id,
      name: 'Night Door Alert',
      description: 'Create alert when front door opens between 10 PM and 6 AM',
      isEnabled: true,
      triggerType: 'SENSOR_EVENT',
      triggerConfigJson: {
        sensorType: 'CONTACT_DOOR',
        eventType: 'STATE_CHANGE',
        valueEquals: 'OPEN',
      },
      conditionConfigJson: {
        timeRange: {
          start: '22:00',
          end: '06:00',
        },
      },
      actionsConfigJson: [
        {
          type: 'CREATE_ALERT',
          alertType: 'SMART_HOME_DOOR_OPEN_NIGHT',
          severity: 'WARNING',
          title: 'Front Door Opened at Night',
          message: 'The front door was opened during nighttime hours',
        },
        {
          type: 'TURN_ON_LIGHTS',
          brightness: 100,
        },
      ],
      severity: 'WARNING',
      createdByUserId: adminUser.id,
    },
  });

  console.log('✅ Created automation rules');

  // Create Emergency Scenarios

  // Scenario 1: Fall + No Response
  await prisma.emergencyScenario.create({
    data: {
      homeId: home.id,
      name: 'Fall + No Response',
      description: 'Escalating response protocol for fall detection with no acknowledgment',
      isEnabled: true,
      triggerSignatureJson: {
        type: 'FALL_UNRESPONSIVE',
        conditions: ['FALL_DETECTOR'],
      },
      stepwiseActionsJson: [
        {
          delaySec: 0,
          action: 'ANNOUNCE',
          params: {
            message: 'We detected a possible fall. If you are okay, please press the button on your pendant or say "I\'m okay".',
            volume: 80,
            repeat: 2,
          },
        },
        {
          delaySec: 0,
          action: 'TURN_ON_LIGHTS',
          params: {},
        },
        {
          delaySec: 60,
          action: 'CALL_FAMILY_IF_NO_CANCEL',
          params: {
            message: 'Fall detected, no response from elder',
          },
        },
        {
          delaySec: 180,
          action: 'CALL_EMERGENCY_IF_NO_CANCEL',
          params: {
            message: 'Critical: Fall detected, no response for 3 minutes',
          },
        },
      ],
      notes: 'Critical emergency protocol - requires immediate attention',
    },
  });

  // Scenario 2: Smoke/Fire + No Response
  await prisma.emergencyScenario.create({
    data: {
      homeId: home.id,
      name: 'Smoke/Fire Detection',
      description: 'Fire emergency protocol with immediate escalation',
      isEnabled: true,
      triggerSignatureJson: {
        type: 'SMOKE_FIRE',
        conditions: ['SMOKE'],
      },
      stepwiseActionsJson: [
        {
          delaySec: 0,
          action: 'ACTIVATE_SIREN',
          params: {
            duration: 120,
            pattern: 'PULSE',
          },
        },
        {
          delaySec: 0,
          action: 'ANNOUNCE',
          params: {
            message: 'Smoke detected! Please evacuate immediately. Press the cancel button if this is a false alarm.',
            volume: 100,
            repeat: 3,
          },
        },
        {
          delaySec: 0,
          action: 'TURN_ON_LIGHTS',
          params: {},
        },
        {
          delaySec: 30,
          action: 'CALL_FAMILY_IF_NO_CANCEL',
          params: {
            message: 'FIRE ALERT: Smoke detected in home',
          },
        },
        {
          delaySec: 60,
          action: 'CALL_EMERGENCY_IF_NO_CANCEL',
          params: {
            message: 'FIRE EMERGENCY: Smoke alarm activated',
          },
        },
        {
          delaySec: 90,
          action: 'UNLOCK_DOORS',
          params: {
            reason: 'Fire emergency - access for responders',
          },
        },
      ],
      notes: 'Immediate response fire protocol',
    },
  });

  console.log('✅ Created emergency scenarios');

  // Create Inactivity Profile
  await prisma.inactivityProfile.create({
    data: {
      homeId: home.id,
      elderId: elderProfile.id,
      configJson: {
        wakeHours: {
          start: '07:00',
          end: '22:00',
        },
        maxNoMotionMinutes: 90,
        nightCheck: {
          enabled: true,
          expectedBedSensorFrom: '22:00',
          expectedBedSensorUntil: '07:00',
        },
      },
    },
  });

  console.log('✅ Created inactivity profile');

  // Create IoT Token
  await prisma.iotToken.create({
    data: {
      homeId: home.id,
      token: await bcrypt.hash('demo-iot-token-123', 10),
      label: 'Home Gateway Token',
    },
  });

  console.log('✅ Created IoT token');

  // Create some sample vital readings
  await prisma.vitalReading.createMany({
    data: [
      {
        elderId: elderProfile.id,
        vitalType: 'BLOOD_PRESSURE',
        value: 120,
        systolic: 120,
        diastolic: 75,
        unit: 'mmHg',
        recordedAt: new Date(),
      },
      {
        elderId: elderProfile.id,
        vitalType: 'HEART_RATE',
        value: 72,
        unit: 'bpm',
        recordedAt: new Date(),
      },
      {
        elderId: elderProfile.id,
        vitalType: 'TEMPERATURE',
        value: 98.2,
        unit: '°F',
        recordedAt: new Date(),
      },
    ],
  });

  console.log('✅ Created sample vital readings');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('━'.repeat(50));
  console.log('Admin:     admin@eldercare.com / admin123');
  console.log('Family:    family@eldercare.com / family123');
  console.log('Caregiver: caregiver@eldercare.com / caregiver123');
  console.log('Elder:     elder@eldercare.com / elder123');
  console.log('━'.repeat(50));
  console.log(`\n🏠 Home ID: ${home.id}`);
  console.log(`👴 Elder ID: ${elderProfile.id}`);
  console.log('\n💡 Test the simulator endpoints:');
  console.log(`   POST /api/sim/smart-home/fall/${home.id}`);
  console.log(`   POST /api/sim/smart-home/smoke/${home.id}`);
  console.log(`   POST /api/sim/smart-home/motion-pattern/${home.id}?duration=60`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
