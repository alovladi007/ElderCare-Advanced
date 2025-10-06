const express = require('express');
const router = express.Router();
const { protect, authorize, checkPatientAccess } = require('../middleware/auth');
const Patient = require('../models/Patient');

// Get all patients (filtered by assigned)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Non-admin users only see assigned patients
    if (req.user.role !== 'admin') {
      query._id = { $in: req.user.assignedPatients };
    }

    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'firstName lastName email')
      .populate('familyMembers', 'firstName lastName email relationship ToPat')
      .populate('caregivers', 'firstName lastName email')
      .sort({ lastName: 1, firstName: 1 });

    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single patient
router.get('/:patientId', protect, checkPatientAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId)
      .populate('assignedDoctor', 'firstName lastName email specialization')
      .populate('familyMembers', 'firstName lastName email phoneNumber relationshipToPatient')
      .populate('caregivers', 'firstName lastName email phoneNumber');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create patient
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update patient
router.put('/:patientId', protect, authorize('doctor', 'admin'), checkPatientAccess, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.patientId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update monitoring settings
router.put('/:patientId/monitoring-settings', protect, authorize('doctor', 'admin'), checkPatientAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    patient.monitoringSettings = {
      ...patient.monitoringSettings,
      ...req.body
    };

    await patient.save();

    // Broadcast settings update via WebSocket
    req.io.to(`patient-${patient._id}`).emit('monitoring-settings-updated', {
      patientId: patient._id,
      settings: patient.monitoringSettings
    });

    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient vital statistics
router.get('/:patientId/stats', protect, checkPatientAccess, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const VitalReading = require('../models/VitalReading');
    const readings = await VitalReading.find({
      patient: req.params.patientId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    // Calculate statistics
    const stats = {
      bloodPressure: calculateStats(readings, 'blood-pressure', ['systolic', 'diastolic']),
      glucose: calculateStats(readings, 'glucose', ['glucose']),
      heartRate: calculateStats(readings, 'heart-rate', ['heartRate']),
      temperature: calculateStats(readings, 'temperature', ['temperature']),
      spo2: calculateStats(readings, 'spo2', ['oxygenSaturation'])
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate statistics
function calculateStats(readings, type, fields) {
  const filtered = readings.filter(r => r.readingType === type);

  if (filtered.length === 0) return null;

  const stats = {};

  fields.forEach(field => {
    const values = filtered.map(r => r.values[field]).filter(v => v !== undefined);

    if (values.length > 0) {
      stats[field] = {
        current: values[values.length - 1],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
  });

  return stats;
}

module.exports = router;
