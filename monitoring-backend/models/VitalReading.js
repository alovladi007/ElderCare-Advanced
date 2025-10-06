const mongoose = require('mongoose');

const VitalReadingSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  readingType: {
    type: String,
    enum: ['blood-pressure', 'glucose', 'heart-rate', 'temperature', 'spo2', 'ecg', 'respiratory-rate'],
    required: true
  },
  values: {
    // Blood Pressure
    systolic: Number,
    diastolic: Number,

    // Glucose
    glucose: Number,
    glucoseUnit: { type: String, enum: ['mg/dL', 'mmol/L'] },

    // Heart Rate
    heartRate: Number,
    heartRateVariability: Number,

    // Temperature
    temperature: Number,
    temperatureUnit: { type: String, enum: ['F', 'C'], default: 'F' },

    // SpO2
    oxygenSaturation: Number,

    // Respiratory Rate
    respiratoryRate: Number,

    // ECG Data
    ecgData: String, // Base64 encoded or reference to file
    abnormalRhythm: Boolean
  },
  isNormal: {
    type: Boolean,
    default: true
  },
  alertTriggered: {
    type: Boolean,
    default: false
  },
  alertLevel: {
    type: String,
    enum: ['normal', 'warning', 'critical', 'emergency'],
    default: 'normal'
  },
  alertMessage: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
});

// Index for efficient querying
VitalReadingSchema.index({ patient: 1, timestamp: -1 });
VitalReadingSchema.index({ patient: 1, readingType: 1, timestamp: -1 });
VitalReadingSchema.index({ alertTriggered: 1, timestamp: -1 });

module.exports = mongoose.model('VitalReading', VitalReadingSchema);
