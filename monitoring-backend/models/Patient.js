const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  medicalRecordNumber: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  phoneNumber: String,
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  medicalConditions: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    prescribedBy: String
  }],
  allergies: [String],
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  familyMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  caregivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  devices: [{
    deviceId: String,
    deviceType: {
      type: String,
      enum: ['blood-pressure', 'glucose', 'heart-rate', 'temperature', 'spo2', 'camera', 'motion-sensor']
    },
    installDate: Date,
    lastCalibration: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active'
    }
  }],
  monitoringSettings: {
    bloodPressure: {
      enabled: { type: Boolean, default: true },
      frequency: { type: Number, default: 30 }, // minutes
      alertThresholds: {
        systolic: { min: { type: Number, default: 90 }, max: { type: Number, default: 140 } },
        diastolic: { min: { type: Number, default: 60 }, max: { type: Number, default: 90 } }
      }
    },
    glucose: {
      enabled: { type: Boolean, default: false },
      frequency: { type: Number, default: 60 },
      alertThresholds: {
        min: { type: Number, default: 70 },
        max: { type: Number, default: 180 }
      }
    },
    heartRate: {
      enabled: { type: Boolean, default: true },
      continuous: { type: Boolean, default: true },
      alertThresholds: {
        min: { type: Number, default: 50 },
        max: { type: Number, default: 100 }
      }
    },
    temperature: {
      enabled: { type: Boolean, default: true },
      frequency: { type: Number, default: 120 },
      alertThresholds: {
        min: { type: Number, default: 97.0 },
        max: { type: Number, default: 99.5 }
      }
    },
    fallDetection: {
      enabled: { type: Boolean, default: true }
    },
    motionTracking: {
      enabled: { type: Boolean, default: true },
      inactivityAlertMinutes: { type: Number, default: 120 }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'hospitalized', 'deceased'],
    default: 'active'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PatientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Patient', PatientSchema);
