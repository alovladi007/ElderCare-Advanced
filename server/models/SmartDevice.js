const mongoose = require('mongoose');

const smartDeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['light', 'plug', 'thermostat', 'lock', 'camera', 'doorbell', 'sensor', 'garage_door', 'blind', 'fan']
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  capabilities: [{
    type: String,
    enum: ['on_off', 'brightness', 'color', 'color_temp', 'temperature', 'lock', 'unlock', 'open', 'close', 'video', 'motion', 'contact', 'power_monitoring']
  }],
  state: {
    on: { type: Boolean, default: false },
    brightness: { type: Number, min: 0, max: 100 },
    color: {
      r: { type: Number, min: 0, max: 255 },
      g: { type: Number, min: 0, max: 255 },
      b: { type: Number, min: 0, max: 255 }
    },
    colorTemp: { type: Number, min: 2000, max: 6500 }, // Kelvin
    temperature: { type: Number }, // Current temp for sensors
    targetTemperature: { type: Number }, // Target temp for thermostats
    locked: { type: Boolean },
    opened: { type: Boolean },
    motion: { type: Boolean },
    power: { type: Number }, // Watts
    energy: { type: Number }, // kWh
    battery: { type: Number, min: 0, max: 100 } // Battery percentage
  },
  manufacturer: String,
  model: String,
  firmware: String,
  protocol: {
    type: String,
    enum: ['wifi', 'zigbee', 'zwave', 'matter', 'thread', 'bluetooth'],
    default: 'wifi'
  },
  online: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  settings: {
    notifications: { type: Boolean, default: true },
    autoOff: { type: Number }, // Minutes
    energySaving: { type: Boolean, default: false }
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Index for faster queries
smartDeviceSchema.index({ home: 1, room: 1 });
smartDeviceSchema.index({ home: 1, type: 1 });

module.exports = mongoose.model('SmartDevice', smartDeviceSchema);
