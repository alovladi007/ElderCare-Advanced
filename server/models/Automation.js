const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ['time', 'event', 'location', 'condition', 'ai_suggested'],
    required: true
  },
  trigger: {
    // Time-based triggers
    time: String, // "14:30" or "sunrise" or "sunset"
    days: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }],

    // Event-based triggers
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartDevice'
    },
    event: String, // "motion_detected", "door_opened", "temperature_above", "battery_low"
    value: mongoose.Schema.Types.Mixed, // Threshold value for condition triggers

    // Location-based triggers
    location: {
      type: String,
      enum: ['home', 'away', 'nearby']
    },

    // Condition operators
    operator: {
      type: String,
      enum: ['equals', 'above', 'below', 'between']
    }
  },
  conditions: [{
    // Additional conditions that must be met
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartDevice'
    },
    property: String, // "on", "temperature", "locked"
    operator: {
      type: String,
      enum: ['equals', 'above', 'below', 'between']
    },
    value: mongoose.Schema.Types.Mixed
  }],
  actions: [{
    type: {
      type: String,
      enum: ['device', 'scene', 'notification', 'delay'],
      required: true
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartDevice'
    },
    scene: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scene'
    },
    state: mongoose.Schema.Types.Mixed,
    notification: {
      title: String,
      message: String,
      priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal'
      }
    },
    delay: Number // Milliseconds
  }],
  executionCount: {
    type: Number,
    default: 0
  },
  lastExecuted: Date,
  source: {
    type: String,
    enum: ['user', 'ai_suggestion', 'learning'],
    default: 'user'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  } // For AI-suggested automations
}, {
  timestamps: true
});

// Index for faster queries
automationSchema.index({ home: 1, enabled: 1 });
automationSchema.index({ home: 1, type: 1 });

module.exports = mongoose.model('Automation', automationSchema);
