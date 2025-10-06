const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['doctor', 'nurse', 'family', 'caregiver', 'admin'],
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phoneNumber: String,

  // Doctor/Nurse specific
  licenseNumber: String,
  specialization: String,
  department: String,

  // Family member specific
  relationshipToPatient: String,
  isPrimaryContact: {
    type: Boolean,
    default: false
  },

  // Access control
  assignedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }],
  permissions: {
    viewVitals: { type: Boolean, default: true },
    viewAlerts: { type: Boolean, default: true },
    viewCameraFeeds: { type: Boolean, default: false },
    acknowledgeAlerts: { type: Boolean, default: false },
    modifyPatientSettings: { type: Boolean, default: false },
    emergencyOverride: { type: Boolean, default: false }
  },

  // Notification preferences
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    alertSeverityThreshold: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: String, // HH:MM format
      end: String
    }
  },

  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Set default permissions based on role
UserSchema.pre('save', function(next) {
  if (this.isNew) {
    switch(this.role) {
      case 'doctor':
        this.permissions = {
          viewVitals: true,
          viewAlerts: true,
          viewCameraFeeds: true,
          acknowledgeAlerts: true,
          modifyPatientSettings: true,
          emergencyOverride: true
        };
        break;
      case 'nurse':
        this.permissions = {
          viewVitals: true,
          viewAlerts: true,
          viewCameraFeeds: true,
          acknowledgeAlerts: true,
          modifyPatientSettings: false,
          emergencyOverride: false
        };
        break;
      case 'family':
        this.permissions = {
          viewVitals: true,
          viewAlerts: true,
          viewCameraFeeds: true,
          acknowledgeAlerts: false,
          modifyPatientSettings: false,
          emergencyOverride: false
        };
        break;
      case 'caregiver':
        this.permissions = {
          viewVitals: true,
          viewAlerts: true,
          viewCameraFeeds: false,
          acknowledgeAlerts: true,
          modifyPatientSettings: false,
          emergencyOverride: false
        };
        break;
      case 'admin':
        this.permissions = {
          viewVitals: true,
          viewAlerts: true,
          viewCameraFeeds: true,
          acknowledgeAlerts: true,
          modifyPatientSettings: true,
          emergencyOverride: true
        };
        break;
    }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
