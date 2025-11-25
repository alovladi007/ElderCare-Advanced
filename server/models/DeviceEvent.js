const mongoose = require('mongoose');

const deviceEventSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartDevice',
    required: true
  },
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['state_change', 'offline', 'online', 'motion_detected', 'door_opened', 'door_closed', 'temperature_alert', 'battery_low', 'error']
  },
  previousState: mongoose.Schema.Types.Mixed,
  newState: mongoose.Schema.Types.Mixed,
  triggeredBy: {
    type: String,
    enum: ['user', 'automation', 'scene', 'manual', 'schedule', 'ai'],
    default: 'manual'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  automation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Automation'
  },
  scene: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scene'
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Index for faster queries and automatic cleanup
deviceEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
deviceEventSchema.index({ device: 1, createdAt: -1 });
deviceEventSchema.index({ home: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.model('DeviceEvent', deviceEventSchema);
