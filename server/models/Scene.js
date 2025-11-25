const mongoose = require('mongoose');

const sceneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  icon: {
    type: String,
    default: 'star'
  },
  type: {
    type: String,
    enum: ['predefined', 'custom', 'ai_generated'],
    default: 'custom'
  },
  actions: [{
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartDevice',
      required: true
    },
    state: {
      on: Boolean,
      brightness: Number,
      color: {
        r: Number,
        g: Number,
        b: Number
      },
      colorTemp: Number,
      targetTemperature: Number,
      locked: Boolean,
      opened: Boolean
    },
    delay: {
      type: Number,
      default: 0 // Milliseconds delay before executing this action
    }
  }],
  favorite: {
    type: Boolean,
    default: false
  },
  executionCount: {
    type: Number,
    default: 0
  },
  lastExecuted: Date
}, {
  timestamps: true
});

// Index for faster queries
sceneSchema.index({ home: 1 });
sceneSchema.index({ home: 1, favorite: 1 });

module.exports = mongoose.model('Scene', sceneSchema);
