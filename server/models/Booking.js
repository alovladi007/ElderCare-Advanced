const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: [
      'Elder Care - Personal Care',
      'Elder Care - Memory Care',
      'Elder Care - 24/7 Care',
      'Home Care - Companionship',
      'Home Care - Meal Preparation',
      'Home Care - Light Housekeeping',
      'Repairs - General Handyman',
      'Repairs - Plumbing',
      'Repairs - Electrical',
      'Repairs - Safety Modifications',
      'Repairs - Emergency Service'
    ]
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    required: true,
    enum: ['morning', 'afternoon', 'evening', 'flexible']
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
