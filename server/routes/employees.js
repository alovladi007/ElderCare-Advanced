const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Employee = require('../models/Employee');

const JWT_SECRET = process.env.JWT_SECRET || 'eldercare-secret-key-change-in-production';

// Employee login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find employee
    const employee = await Employee.findOne({ email, isActive: true });
    if (!employee) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        employeeId: employee._id,
        email: employee.email,
        role: employee.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        employee: {
          id: employee._id,
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: employee.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
});

// Clock in
router.post('/clock-in', async (req, res) => {
  try {
    const { employeeId } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }

    // Add new time entry
    employee.timeEntries.push({
      clockIn: new Date()
    });

    await employee.save();

    res.json({
      status: 'success',
      message: 'Clocked in successfully',
      data: {
        clockIn: employee.timeEntries[employee.timeEntries.length - 1].clockIn
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Clock in failed',
      error: error.message
    });
  }
});

// Clock out
router.post('/clock-out', async (req, res) => {
  try {
    const { employeeId } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }

    // Find the latest unclosed time entry
    const latestEntry = employee.timeEntries[employee.timeEntries.length - 1];
    if (!latestEntry || latestEntry.clockOut) {
      return res.status(400).json({
        status: 'error',
        message: 'No active clock-in found'
      });
    }

    const clockOut = new Date();
    latestEntry.clockOut = clockOut;
    latestEntry.duration = Math.floor((clockOut - latestEntry.clockIn) / 1000); // seconds

    await employee.save();

    res.json({
      status: 'success',
      message: 'Clocked out successfully',
      data: {
        clockIn: latestEntry.clockIn,
        clockOut: latestEntry.clockOut,
        duration: latestEntry.duration
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Clock out failed',
      error: error.message
    });
  }
});

// Get employee time entries
router.get('/:employeeId/time-entries', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }

    res.json({
      status: 'success',
      data: employee.timeEntries
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch time entries',
      error: error.message
    });
  }
});

module.exports = router;
