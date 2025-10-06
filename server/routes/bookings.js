const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');

// Validation middleware
const bookingValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('preferredDate').isISO8601().withMessage('Valid date is required'),
  body('preferredTime').isIn(['morning', 'afternoon', 'evening', 'flexible']).withMessage('Valid time preference is required')
];

// Create a new booking
router.post('/', bookingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const booking = new Booking(req.body);
    await booking.save();

    res.status(201).json({
      status: 'success',
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({
      status: 'success',
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    res.json({
      status: 'success',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
});

// Update booking status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update booking',
      error: error.message
    });
  }
});

// Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    res.json({
      status: 'success',
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete booking',
      error: error.message
    });
  }
});

module.exports = router;
