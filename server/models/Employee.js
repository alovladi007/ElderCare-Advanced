const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const timeEntrySchema = new mongoose.Schema({
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  notes: String
});

const employeeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
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
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['caregiver', 'nurse', 'technician', 'admin'],
    default: 'caregiver'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  timeEntries: [timeEntrySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Employee', employeeSchema);
