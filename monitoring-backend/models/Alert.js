const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  alertType: {
    type: String,
    enum: [
      'vital-abnormal',
      'fall-detected',
      'inactivity',
      'medication-missed',
      'device-offline',
      'wandering',
      'emergency-button',
      'critical-vital'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  vitalReading: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VitalReading'
  },
  deviceId: String,
  location: {
    room: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  videoFeed: {
    cameraId: String,
    snapshotUrl: String,
    streamUrl: String
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'escalated'],
    default: 'active'
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolution: String,
  notifications: [{
    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    method: {
      type: String,
      enum: ['email', 'sms', 'push', 'call']
    },
    sentAt: Date,
    delivered: Boolean,
    read: Boolean,
    readAt: Date
  }],
  emergencyServicesContacted: {
    contacted: { type: Boolean, default: false },
    contactedAt: Date,
    service: String,
    incidentNumber: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
AlertSchema.index({ patient: 1, createdAt: -1 });
AlertSchema.index({ status: 1, severity: -1, createdAt: -1 });
AlertSchema.index({ alertType: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', AlertSchema);
