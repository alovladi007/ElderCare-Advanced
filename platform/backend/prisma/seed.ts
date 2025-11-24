import { PrismaClient, UserRole, CognitiveStatus, MobilityLevel, CarePlanStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (be careful in production!)
  await prisma.$transaction([
    // Smart Home cleanup
    prisma.helpTrigger.deleteMany(),
    prisma.iotToken.deleteMany(),
    prisma.inactivityProfile.deleteMany(),
    prisma.emergencyScenarioInstance.deleteMany(),
    prisma.emergencyScenario.deleteMany(),
    prisma.automationRule.deleteMany(),
    prisma.actuatorCommand.deleteMany(),
    prisma.sensorEvent.deleteMany(),
    prisma.actuator.deleteMany(),
    prisma.sensor.deleteMany(),
    prisma.smartDevice.deleteMany(),
    prisma.smartDeviceType.deleteMany(),
    prisma.homeZone.deleteMany(),
    prisma.home.deleteMany(),
    // Existing cleanup
    prisma.mealIntakeLog.deleteMany(),
    prisma.mealItem.deleteMany(),
    prisma.mealPlan.deleteMany(),
    prisma.nutritionProfile.deleteMany(),
    prisma.careNote.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.assessmentInstance.deleteMany(),
    prisma.assessmentTemplate.deleteMany(),
    prisma.wanderingEvent.deleteMany(),
    prisma.behaviorLog.deleteMany(),
    prisma.orientationCard.deleteMany(),
    prisma.memoryCareProfile.deleteMany(),
    prisma.alert.deleteMany(),
    prisma.vitalAlertRule.deleteMany(),
    prisma.vitalReading.deleteMany(),
    prisma.device.deleteMany(),
    prisma.vitalType.deleteMany(),
    prisma.medicationAdministrationLog.deleteMany(),
    prisma.medicationSchedule.deleteMany(),
    prisma.medication.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.careTaskInstance.deleteMany(),
    prisma.careTaskTemplate.deleteMany(),
    prisma.carePlan.deleteMany(),
    prisma.elderCareTeamMember.deleteMany(),
    prisma.familyProfile.deleteMany(),
    prisma.caregiverProfile.deleteMany(),
    prisma.clinicianProfile.deleteMany(),
    prisma.elderProfile.deleteMany(),
    prisma.notificationPreference.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('✅ Cleared existing data');

  // Create demo users
  const password = await bcrypt.hash('Demo123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash: password,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      role: UserRole.ADMIN,
    },
  });

  const elderUser = await prisma.user.create({
    data: {
      email: 'elder@demo.com',
      passwordHash: password,
      firstName: 'Margaret',
      lastName: 'Johnson',
      phone: '+1234567891',
      role: UserRole.ELDER,
    },
  });

  const familyUser = await prisma.user.create({
    data: {
      email: 'family@demo.com',
      passwordHash: password,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567892',
      role: UserRole.FAMILY,
    },
  });

  const caregiverUser = await prisma.user.create({
    data: {
      email: 'caregiver@demo.com',
      passwordHash: password,
      firstName: 'Emily',
      lastName: 'Rodriguez',
      phone: '+1234567893',
      role: UserRole.CAREGIVER,
    },
  });

  const clinicianUser = await prisma.user.create({
    data: {
      email: 'clinician@demo.com',
      passwordHash: password,
      firstName: 'Dr. Michael',
      lastName: 'Chen',
      phone: '+1234567894',
      role: UserRole.CLINICIAN,
    },
  });

  console.log('✅ Created demo users');

  // Create Elder Profile
  const elderProfile = await prisma.elderProfile.create({
    data: {
      userId: elderUser.id,
      dateOfBirth: new Date('1945-06-15'),
      gender: 'Female',
      primaryDiagnosis: 'Alzheimer\'s Disease (Early Stage), Type 2 Diabetes, Hypertension',
      cognitiveStatus: CognitiveStatus.MILD_IMPAIRMENT,
      mobilityLevel: MobilityLevel.NEEDS_ASSISTANCE,
      address: '123 Elm Street, Springfield, IL 62701',
      emergencyContactName: 'Sarah Johnson',
      emergencyContactPhone: '+1234567892',
      notes: 'Prefers morning activities. Sundowning occurs around 6 PM. Loves classical music.',
    },
  });

  console.log('✅ Created elder profile');

  // Create Family Profile
  await prisma.familyProfile.create({
    data: {
      userId: familyUser.id,
      relationshipToElder: 'Daughter',
      associatedElderId: elderProfile.id,
    },
  });

  // Create Caregiver Profile
  await prisma.caregiverProfile.create({
    data: {
      userId: caregiverUser.id,
      credentials: 'Certified Nursing Assistant (CNA), CPR Certified',
      agencyName: 'Evergreen Home Care',
    },
  });

  // Create Clinician Profile
  await prisma.clinicianProfile.create({
    data: {
      userId: clinicianUser.id,
      specialty: 'Geriatrics',
      licenseNumber: 'MD123456',
      organization: 'Springfield Medical Center',
    },
  });

  console.log('✅ Created role-specific profiles');

  // Create Vital Types
  const vitalTypes = await prisma.$transaction([
    prisma.vitalType.create({
      data: { name: 'Blood Pressure Systolic', code: 'BP_SYS', unit: 'mmHg' },
    }),
    prisma.vitalType.create({
      data: { name: 'Blood Pressure Diastolic', code: 'BP_DIA', unit: 'mmHg' },
    }),
    prisma.vitalType.create({
      data: { name: 'Heart Rate', code: 'HR', unit: 'bpm' },
    }),
    prisma.vitalType.create({
      data: { name: 'Blood Glucose', code: 'GLUCOSE', unit: 'mg/dL' },
    }),
    prisma.vitalType.create({
      data: { name: 'Oxygen Saturation', code: 'SPO2', unit: '%' },
    }),
    prisma.vitalType.create({
      data: { name: 'Weight', code: 'WEIGHT', unit: 'lbs' },
    }),
    prisma.vitalType.create({
      data: { name: 'Temperature', code: 'TEMP', unit: '°F' },
    }),
  ]);

  console.log('✅ Created vital types');

  // Create Memory Care Profile
  await prisma.memoryCareProfile.create({
    data: {
      elderId: elderProfile.id,
      preferredName: 'Maggie',
      orientationNotes: 'Responds well to photos of family. Enjoys talking about her teaching career.',
      routineDescription: 'Morning walk at 9 AM, lunch at noon, afternoon rest, dinner at 5 PM',
      sundowningRisk: 'HIGH',
      favoriteMusic: 'Classical music, especially Mozart and Beethoven',
      orientationCards: {
        create: [
          {
            type: 'DATE_TIME',
            title: 'Today is',
            content: 'Check the calendar',
            displayOrder: 1,
            active: true,
          },
          {
            type: 'DAILY_PLAN',
            title: 'Today\'s Schedule',
            content: 'Morning walk, Lunch, Afternoon rest, Dinner with Sarah',
            displayOrder: 2,
            active: true,
          },
          {
            type: 'AFFIRMATION',
            title: 'Remember',
            content: 'You are loved. Your family visits every week. You are safe and cared for.',
            displayOrder: 3,
            active: true,
          },
        ],
      },
    },
  });

  console.log('✅ Created memory care profile');

  // Create Nutrition Profile
  await prisma.nutritionProfile.create({
    data: {
      elderId: elderProfile.id,
      dietaryRestrictions: 'Low sodium, Diabetic diet (carb-controlled)',
      allergies: 'Shellfish',
      preferredCuisines: 'American comfort food, Italian',
      textureLevel: 'REGULAR',
      dailyCalorieTarget: 1800,
      notes: 'Small frequent meals work better. Ensure adequate protein intake.',
    },
  });

  console.log('✅ Created nutrition profile');

  // Create Assessment Template
  await prisma.assessmentTemplate.create({
    data: {
      name: 'Weekly Health Check',
      description: 'Basic weekly health and wellness assessment',
      type: 'GENERAL',
      schemaJson: {
        questions: [
          {
            id: 'q1',
            text: 'How is the patient\'s overall mood?',
            type: 'scale',
            scale: { min: 1, max: 5, labels: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
          },
          {
            id: 'q2',
            text: 'How well did the patient sleep?',
            type: 'scale',
            scale: { min: 1, max: 5, labels: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
          },
          {
            id: 'q3',
            text: 'Any concerns or changes noted?',
            type: 'text',
          },
        ],
      },
    },
  });

  console.log('✅ Created assessment template');

  // ============================================
  // SMART HOME & EXTREME SAFETY SETUP
  // ============================================

  // Create Home for Margaret
  const margaretHome = await prisma.home.create({
    data: {
      elderId: elderProfile.id,
      name: 'Margaret\'s Home',
      address: '123 Elm Street, Springfield, IL 62701',
      timezone: 'America/Chicago',
      notes: 'Single-story home, 3 bedrooms, 2 bathrooms',
    },
  });

  console.log('✅ Created home for Margaret');

  // Create Home Zones
  const bedroomZone = await prisma.homeZone.create({
    data: {
      homeId: margaretHome.id,
      name: 'Bedroom',
      description: 'Master bedroom where Margaret sleeps',
      floor: '1st Floor',
      isCriticalArea: true,
    },
  });

  const bathroomZone = await prisma.homeZone.create({
    data: {
      homeId: margaretHome.id,
      name: 'Bathroom',
      description: 'Master bathroom - highest fall risk',
      floor: '1st Floor',
      isCriticalArea: true,
    },
  });

  const kitchenZone = await prisma.homeZone.create({
    data: {
      homeId: margaretHome.id,
      name: 'Kitchen',
      description: 'Kitchen area - monitor stove usage',
      floor: '1st Floor',
      isCriticalArea: true,
    },
  });

  const livingRoomZone = await prisma.homeZone.create({
    data: {
      homeId: margaretHome.id,
      name: 'Living Room',
      description: 'Main living area',
      floor: '1st Floor',
      isCriticalArea: false,
    },
  });

  console.log('✅ Created home zones');

  // Create Smart Device Types
  const motionSensorType = await prisma.smartDeviceType.create({
    data: {
      name: 'Motion Sensor',
      category: 'SENSOR',
      capabilitiesJson: {
        sensors: ['MOTION'],
        batteryPowered: true,
        wireless: true,
      },
      vendor: 'SmartSafety',
      model: 'MS-100',
    },
  });

  const fallDetectorType = await prisma.smartDeviceType.create({
    data: {
      name: 'Wearable Fall Detector',
      category: 'SENSOR',
      capabilitiesJson: {
        sensors: ['FALL_DETECTOR'],
        wearable: true,
        batteryPowered: true,
      },
      vendor: 'LifeAlert Pro',
      model: 'FD-500',
    },
  });

  const smokeSensorType = await prisma.smartDeviceType.create({
    data: {
      name: 'Smart Smoke Detector',
      category: 'SENSOR',
      capabilitiesJson: {
        sensors: ['SMOKE'],
        batteryPowered: true,
        wireless: true,
      },
      vendor: 'SmartSafety',
      model: 'SD-200',
    },
  });

  const smartSpeakerType = await prisma.smartDeviceType.create({
    data: {
      name: 'Smart Speaker with TTS',
      category: 'ACTUATOR',
      capabilitiesJson: {
        actuators: ['SPEAKER_TTS'],
        powerSource: 'AC',
      },
      vendor: 'EchoHome',
      model: 'ES-300',
    },
  });

  const smartLightType = await prisma.smartDeviceType.create({
    data: {
      name: 'Smart Light Bulb',
      category: 'ACTUATOR',
      capabilitiesJson: {
        actuators: ['LIGHT'],
        dimmable: true,
        colorChangeable: false,
      },
      vendor: 'BrightHome',
      model: 'BL-100',
    },
  });

  const panicButtonType = await prisma.smartDeviceType.create({
    data: {
      name: 'Panic Button',
      category: 'SENSOR',
      capabilitiesJson: {
        sensors: ['BUTTON_PANIC'],
        batteryPowered: true,
        portable: true,
      },
      vendor: 'LifeAlert Pro',
      model: 'PB-100',
    },
  });

  console.log('✅ Created smart device types');

  // Create Smart Devices
  const bedroomMotionSensor = await prisma.smartDevice.create({
    data: {
      homeId: margaretHome.id,
      zoneId: bedroomZone.id,
      deviceTypeId: motionSensorType.id,
      name: 'Bedroom Motion Sensor',
      identifier: 'MOTION-BEDROOM-001',
      status: 'ONLINE',
      batteryLevel: 95,
      lastSeenAt: new Date(),
      installedAt: new Date('2024-01-15'),
      settingsJson: { sensitivity: 'medium', petImmune: false },
    },
  });

  const bathroomMotionSensor = await prisma.smartDevice.create({
    data: {
      homeId: margaretHome.id,
      zoneId: bathroomZone.id,
      deviceTypeId: motionSensorType.id,
      name: 'Bathroom Motion Sensor',
      identifier: 'MOTION-BATHROOM-001',
      status: 'ONLINE',
      batteryLevel: 87,
      lastSeenAt: new Date(),
      installedAt: new Date('2024-01-15'),
      settingsJson: { sensitivity: 'high', petImmune: false },
    },
  });

  const fallDetector = await prisma.smartDevice.create({
    data: {
      homeId: margaretHome.id,
      deviceTypeId: fallDetectorType.id,
      name: 'Margaret\'s Fall Detector Pendant',
      identifier: 'FALL-DETECTOR-001',
      status: 'ONLINE',
      batteryLevel: 78,
      lastSeenAt: new Date(),
      installedAt: new Date('2024-01-20'),
      notes: 'Worn around neck at all times',
    },
  });

  const kitchenSmokeSensor = await prisma.smartDevice.create({
    data: {
      homeId: margaretHome.id,
      zoneId: kitchenZone.id,
      deviceTypeId: smokeSensorType.id,
      name: 'Kitchen Smoke Detector',
      identifier: 'SMOKE-KITCHEN-001',
      status: 'ONLINE',
      batteryLevel: 92,
      lastSeenAt: new Date(),
      installedAt: new Date('2024-01-15'),
    },
  });

  const livingRoomSpeaker = await prisma.smartDevice.create({
    data: {
      homeId: margaretHome.id,
      zoneId: livingRoomZone.id,
      deviceTypeId: smartSpeakerType.id,
      name: 'Living Room Speaker',
      identifier: 'SPEAKER-LIVING-001',
      status: 'ONLINE',
      lastSeenAt: new Date(),
      installedAt: new Date('2024-01-15'),
      settingsJson: { volume: 70, language: 'en-US' },
    },
  });

  const bedroomLight = await prisma.smartDevice.create({
    data: {
      homeId: margaretHome.id,
      zoneId: bedroomZone.id,
      deviceTypeId: smartLightType.id,
      name: 'Bedroom Light',
      identifier: 'LIGHT-BEDROOM-001',
      status: 'ONLINE',
      lastSeenAt: new Date(),
      installedAt: new Date('2024-01-15'),
    },
  });

  const panicButton = await prisma.smartDevice.create({
    data: {
      homeId: margaretHome.id,
      deviceTypeId: panicButtonType.id,
      name: 'Bedside Panic Button',
      identifier: 'PANIC-BEDSIDE-001',
      status: 'ONLINE',
      batteryLevel: 100,
      lastSeenAt: new Date(),
      installedAt: new Date('2024-01-20'),
      notes: 'Keep on nightstand',
    },
  });

  console.log('✅ Created smart devices');

  // Create Sensors
  await prisma.sensor.create({
    data: {
      deviceId: bedroomMotionSensor.id,
      sensorType: 'MOTION',
      name: 'Bedroom Motion Detector',
      isCritical: false,
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: bathroomMotionSensor.id,
      sensorType: 'MOTION',
      name: 'Bathroom Motion Detector',
      isCritical: true,
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: fallDetector.id,
      sensorType: 'FALL_DETECTOR',
      name: 'Fall Detection Accelerometer',
      isCritical: true,
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: kitchenSmokeSensor.id,
      sensorType: 'SMOKE',
      name: 'Smoke Detector Sensor',
      isCritical: true,
    },
  });

  await prisma.sensor.create({
    data: {
      deviceId: panicButton.id,
      sensorType: 'BUTTON_PANIC',
      name: 'Panic Button',
      isCritical: true,
    },
  });

  console.log('✅ Created sensors');

  // Create Actuators
  await prisma.actuator.create({
    data: {
      deviceId: livingRoomSpeaker.id,
      actuatorType: 'SPEAKER_TTS',
      name: 'Living Room TTS Speaker',
      stateSchemaJson: {
        commands: ['SPEAK', 'VOLUME'],
        parameters: {
          message: 'string',
          volume: 'number (0-100)',
        },
      },
      isCritical: false,
    },
  });

  await prisma.actuator.create({
    data: {
      deviceId: bedroomLight.id,
      actuatorType: 'LIGHT',
      name: 'Bedroom Light Control',
      stateSchemaJson: {
        commands: ['ON', 'OFF', 'DIM'],
        parameters: {
          brightness: 'number (0-100)',
        },
      },
      isCritical: false,
    },
  });

  console.log('✅ Created actuators');

  // Create IoT Token for testing
  const crypto = await import('crypto');
  const randomToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(randomToken).digest('hex');

  await prisma.iotToken.create({
    data: {
      homeId: margaretHome.id,
      token: tokenHash,
      label: 'Demo IoT Gateway Token',
    },
  });

  console.log('✅ Created IoT token');
  console.log(`   Token (save this!): ${randomToken}`);

  // Create Inactivity Profile
  await prisma.inactivityProfile.create({
    data: {
      homeId: margaretHome.id,
      elderId: elderProfile.id,
      configJson: {
        maxNoMotionMinutes: 90,
        wakeHoursStart: 7,
        wakeHoursEnd: 22,
        criticalZones: [bathroomZone.id],
        notifyContacts: [familyUser.id],
      },
    },
  });

  console.log('✅ Created inactivity profile');

  // Create Emergency Scenarios
  await prisma.emergencyScenario.create({
    data: {
      homeId: margaretHome.id,
      name: 'Fall Detected - No Response',
      description: 'Stepwise escalation when fall is detected and elder doesn\'t respond',
      isEnabled: true,
      triggerSignatureJson: {
        sensorType: 'FALL_DETECTOR',
        eventType: 'ALERT',
      },
      stepwiseActionsJson: [
        {
          type: 'ANNOUNCE',
          delaySec: 0,
          message: 'Fall detected. Are you okay? Say HELP if you need assistance.',
        },
        {
          type: 'ALERT_FAMILY',
          delaySec: 30,
          contacts: ['family'],
          message: 'Fall detected for Margaret. No response yet.',
        },
        {
          type: 'TURN_ON_LIGHTS',
          delaySec: 30,
          zones: ['all'],
        },
        {
          type: 'ALERT_EMERGENCY',
          delaySec: 120,
          message: 'Fall detected. No response after 2 minutes. Emergency services may be needed.',
        },
      ],
    },
  });

  await prisma.emergencyScenario.create({
    data: {
      homeId: margaretHome.id,
      name: 'Smoke/Fire Detected',
      description: 'Immediate action for fire emergency',
      isEnabled: true,
      triggerSignatureJson: {
        sensorType: 'SMOKE',
        severity: 'CRITICAL',
      },
      stepwiseActionsJson: [
        {
          type: 'ANNOUNCE',
          delaySec: 0,
          message: 'SMOKE DETECTED! Exit the home immediately!',
        },
        {
          type: 'ALERT_FAMILY',
          delaySec: 0,
          contacts: ['family'],
          message: 'EMERGENCY: Smoke detected at Margaret\'s home!',
        },
        {
          type: 'TURN_ON_LIGHTS',
          delaySec: 0,
          zones: ['all'],
        },
        {
          type: 'ALERT_EMERGENCY',
          delaySec: 15,
          message: 'Fire emergency - calling 911',
        },
      ],
    },
  });

  await prisma.emergencyScenario.create({
    data: {
      homeId: margaretHome.id,
      name: 'Panic Button Pressed',
      description: 'Elder pressed panic button for help',
      isEnabled: true,
      triggerSignatureJson: {
        sensorType: 'BUTTON_PANIC',
        eventType: 'ALERT',
      },
      stepwiseActionsJson: [
        {
          type: 'ANNOUNCE',
          delaySec: 0,
          message: 'Help is on the way, Margaret. Stay calm.',
        },
        {
          type: 'ALERT_FAMILY',
          delaySec: 0,
          contacts: ['family'],
          message: 'Margaret pressed her panic button. Immediate attention needed!',
        },
        {
          type: 'TURN_ON_LIGHTS',
          delaySec: 0,
          zones: ['all'],
        },
      ],
    },
  });

  console.log('✅ Created emergency scenarios');

  // Create Automation Rules
  await prisma.automationRule.create({
    data: {
      homeId: margaretHome.id,
      name: 'Nighttime Bathroom Light',
      description: 'Turn on bedroom light when bathroom motion detected at night',
      isEnabled: true,
      triggerType: 'SENSOR_EVENT',
      triggerConfigJson: {
        sensorType: 'MOTION',
        zoneId: bathroomZone.id,
      },
      conditionConfigJson: {
        timeRange: { start: '22:00', end: '07:00' },
      },
      actionsConfigJson: {
        actions: [
          {
            type: 'ACTUATOR_COMMAND',
            actuatorType: 'LIGHT',
            zoneId: bedroomZone.id,
            command: 'ON',
            params: { brightness: 50 },
          },
        ],
      },
      severity: 'INFO',
      createdByUserId: familyUser.id,
    },
  });

  await prisma.automationRule.create({
    data: {
      homeId: margaretHome.id,
      name: 'Extended Inactivity Alert',
      description: 'Alert family if no motion detected for 90 minutes during wake hours',
      isEnabled: true,
      triggerType: 'INACTIVITY',
      triggerConfigJson: {
        maxNoMotionMinutes: 90,
        wakeHoursOnly: true,
      },
      conditionConfigJson: {},
      actionsConfigJson: {
        actions: [
          {
            type: 'CREATE_ALERT',
            alertType: 'SMART_HOME_INACTIVITY',
            severity: 'WARNING',
            message: 'No motion detected at Margaret\'s home for 90 minutes',
            notifyContacts: ['family'],
          },
        ],
      },
      severity: 'WARNING',
      createdByUserId: familyUser.id,
    },
  });

  console.log('✅ Created automation rules');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📧 Demo Login Credentials:');
  console.log('   Admin:     admin@demo.com / Demo123!');
  console.log('   Elder:     elder@demo.com / Demo123!');
  console.log('   Family:    family@demo.com / Demo123!');
  console.log('   Caregiver: caregiver@demo.com / Demo123!');
  console.log('   Clinician: clinician@demo.com / Demo123!');
  console.log('\n🏠 Smart Home Setup:');
  console.log('   Home:      Margaret\'s Home (123 Elm Street)');
  console.log('   Zones:     Bedroom, Bathroom, Kitchen, Living Room');
  console.log('   Devices:   7 smart devices (sensors, lights, speakers)');
  console.log('   Scenarios: 3 emergency scenarios configured');
  console.log('   Rules:     2 automation rules active');
  console.log('\n💡 Test Smart Home with simulator endpoints:');
  console.log('   POST /api/v1/smart-home/simulator/fall/:homeId');
  console.log('   POST /api/v1/smart-home/simulator/smoke/:homeId');
  console.log('   POST /api/v1/smart-home/simulator/panic/:homeId');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
