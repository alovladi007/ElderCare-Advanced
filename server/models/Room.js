const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['living_room', 'bedroom', 'kitchen', 'bathroom', 'dining_room', 'office', 'garage', 'hallway', 'outdoor', 'other'],
    default: 'other'
  },
  icon: {
    type: String,
    default: 'home'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
roomSchema.index({ home: 1 });

module.exports = mongoose.model('Room', roomSchema);
