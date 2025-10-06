const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Patient = require('./models/Patient');
const VitalReading = require('./models/VitalReading');
const Alert = require('./models/Alert');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evergreen-monitoring', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await VitalReading.deleteMany({});
    await Alert.deleteMany({});

    console.log('Existing data cleared');

    // Create users
    const doctor = await User.create({
      email: 'doctor@evergreen.com',
      password: 'password123',
      role: 'doctor',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phoneNumber: '+1234567890',
      licenseNumber: 'MD12345',
      specialization: 'Geriatric Medicine'
    });

    const nurse = await User.create({
      email: 'nurse@evergreen.com',
      password: 'password123',
      role: 'nurse',
      firstName: 'Michael',
      lastName: 'Chen',
      phoneNumber: '+1234567891'
    });

    const family1 = await User.create({
      email: 'john.smith@email.com',
      password: 'password123',
      role: 'family',
      firstName: 'John',
      lastName: 'Smith',
      phoneNumber: '+1234567892',
      relationshipToPatient: 'Son',
      isPrimaryContact: true
    });

    const family2 = await User.create({
      email: 'sarah.wilson@email.com',
      password: 'password123',
      role: 'family',
      firstName: 'Sarah',
      lastName: 'Wilson',
      phoneNumber: '+1234567893',
      relationshipToPatient: 'Daughter',
      isPrimaryContact: true
    });

    console.log('Users created');

    // Create patients
    const patient1 = await Patient.create({
      firstName: 'Mary',
      lastName: 'Smith',
      dateOfBirth: new Date('1940-05-15'),
      gender: 'female',
      medicalRecordNumber: 'MRN001',
      address: {
        street: '123 Oak Street',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      },
      phoneNumber: '+1234567894',
      emergencyContact: {
        name: 'John Smith',
        relationship: 'Son',
        phoneNumber: '+1234567892'
      },
      medicalConditions: [
        {
          condition: 'Hypertension',
          diagnosedDate: new Date('2015-03-10'),
          notes: 'Well controlled with medication'
        },
        {
          condition: 'Type 2 Diabetes',
          diagnosedDate: new Date('2018-07-22'),
          notes: 'Requires blood glucose monitoring'
        }
      ],
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          prescribedBy: 'Dr. Johnson'
        },
        {
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          prescribedBy: 'Dr. Johnson'
        }
      ],
      allergies: ['Penicillin'],
      assignedDoctor: doctor._id,
      familyMembers: [family1._id],
      caregivers: [nurse._id],
      devices: [
        {
          deviceId: 'BP-001',
          deviceType: 'blood-pressure',
          installDate: new Date(),
          status: 'active'
        },
        {
          deviceId: 'GL-001',
          deviceType: 'glucose',
          installDate: new Date(),
          status: 'active'
        },
        {
          deviceId: 'HR-001',
          deviceType: 'heart-rate',
          installDate: new Date(),
          status: 'active'
        },
        {
          deviceId: 'CAM-001',
          deviceType: 'camera',
          installDate: new Date(),
          status: 'active'
        }
      ],
      status: 'active'
    });

    const patient2 = await Patient.create({
      firstName: 'Robert',
      lastName: 'Wilson',
      dateOfBirth: new Date('1935-11-20'),
      gender: 'male',
      medicalRecordNumber: 'MRN002',
      address: {
        street: '456 Maple Avenue',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702'
      },
      phoneNumber: '+1234567895',
      emergencyContact: {
        name: 'Sarah Wilson',
        relationship: 'Daughter',
        phoneNumber: '+1234567893'
      },
      medicalConditions: [
        {
          condition: 'Congestive Heart Failure',
          diagnosedDate: new Date('2019-02-14'),
          notes: 'Stage II CHF'
        },
        {
          condition: 'Atrial Fibrillation',
          diagnosedDate: new Date('2020-08-05'),
          notes: 'On anticoagulation therapy'
        }
      ],
      medications: [
        {
          name: 'Furosemide',
          dosage: '40mg',
          frequency: 'Once daily',
          prescribedBy: 'Dr. Johnson'
        },
        {
          name: 'Warfarin',
          dosage: '5mg',
          frequency: 'Once daily',
          prescribedBy: 'Dr. Johnson'
        }
      ],
      allergies: ['Sulfa drugs'],
      assignedDoctor: doctor._id,
      familyMembers: [family2._id],
      caregivers: [nurse._id],
      devices: [
        {
          deviceId: 'BP-002',
          deviceType: 'blood-pressure',
          installDate: new Date(),
          status: 'active'
        },
        {
          deviceId: 'HR-002',
          deviceType: 'heart-rate',
          installDate: new Date(),
          status: 'active'
        }
      ],
      status: 'active'
    });

    console.log('Patients created');

    // Update users with assigned patients
    doctor.assignedPatients = [patient1._id, patient2._id];
    nurse.assignedPatients = [patient1._id, patient2._id];
    family1.assignedPatients = [patient1._id];
    family2.assignedPatients = [patient2._id];

    await Promise.all([
      doctor.save(),
      nurse.save(),
      family1.save(),
      family2.save()
    ]);

    console.log('User-patient assignments updated');

    // Create sample vital readings
    const now = new Date();

    // Last 24 hours of readings for patient 1
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now - i * 60 * 60 * 1000); // Every hour

      // Blood pressure
      await VitalReading.create({
        patient: patient1._id,
        deviceId: 'BP-001',
        readingType: 'blood-pressure',
        values: {
          systolic: 125 + Math.floor(Math.random() * 20) - 10,
          diastolic: 75 + Math.floor(Math.random() * 15) - 7
        },
        timestamp
      });

      // Glucose (every 3 hours)
      if (i % 3 === 0) {
        await VitalReading.create({
          patient: patient1._id,
          deviceId: 'GL-001',
          readingType: 'glucose',
          values: {
            glucose: 110 + Math.floor(Math.random() * 40) - 20,
            glucoseUnit: 'mg/dL'
          },
          timestamp
        });
      }

      // Heart rate (continuous)
      await VitalReading.create({
        patient: patient1._id,
        deviceId: 'HR-001',
        readingType: 'heart-rate',
        values: {
          heartRate: 72 + Math.floor(Math.random() * 16) - 8
        },
        timestamp
      });
    }

    console.log('Sample vital readings created');

    // Create sample alerts
    await Alert.create({
      patient: patient1._id,
      alertType: 'vital-abnormal',
      severity: 'high',
      title: 'High Blood Pressure',
      message: 'Blood pressure reading of 165/95 detected',
      status: 'active'
    });

    await Alert.create({
      patient: patient2._id,
      alertType: 'fall-detected',
      severity: 'critical',
      title: 'Fall Detected',
      message: 'Fall detected in bedroom at 2:30 AM',
      status: 'acknowledged',
      acknowledgedBy: nurse._id,
      acknowledgedAt: new Date(now - 30 * 60 * 1000)
    });

    console.log('Sample alerts created');

    console.log('\n=== SEED DATA COMPLETED ===');
    console.log('\nLogin credentials:');
    console.log('Doctor: doctor@evergreen.com / password123');
    console.log('Nurse: nurse@evergreen.com / password123');
    console.log('Family 1: john.smith@email.com / password123');
    console.log('Family 2: sarah.wilson@email.com / password123');
    console.log('\nPatients:');
    console.log('- Mary Smith (MRN001)');
    console.log('- Robert Wilson (MRN002)');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

connectDB().then(seedData);
