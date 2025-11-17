import { PrismaClient, UserRole, CognitiveStatus, MobilityLevel, CarePlanStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (be careful in production!)
  await prisma.$transaction([
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

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📧 Demo Login Credentials:');
  console.log('   Admin:     admin@demo.com / Demo123!');
  console.log('   Elder:     elder@demo.com / Demo123!');
  console.log('   Family:    family@demo.com / Demo123!');
  console.log('   Caregiver: caregiver@demo.com / Demo123!');
  console.log('   Clinician: clinician@demo.com / Demo123!');
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
