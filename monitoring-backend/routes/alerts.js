const express = require('express');
const router = express.Router();
const { protect, checkPatientAccess, checkPermission } = require('../middleware/auth');
const Alert = require('../models/Alert');
const Patient = require('../models/Patient');

// Get alerts
router.get('/', protect, async (req, res) => {
  try {
    const { status, severity, patientId, limit = 50 } = req.query;

    let query = {};

    // Filter by assigned patients for non-admin users
    if (req.user.role !== 'admin') {
      query.patient = { $in: req.user.assignedPatients };
    }

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (patientId) query.patient = patientId;

    const alerts = await Alert.find(query)
      .populate('patient', 'firstName lastName medicalRecordNumber')
      .populate('vitalReading')
      .populate('acknowledgedBy', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get alert by ID
router.get('/:alertId', protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId)
      .populate('patient')
      .populate('vitalReading')
      .populate('acknowledgedBy', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .populate('notifications.sentTo', 'firstName lastName email phoneNumber');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Check access
    const hasAccess = req.user.role === 'admin' ||
      req.user.assignedPatients.some(id => id.toString() === alert.patient._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create alert (manual)
router.post('/', protect, checkPermission('acknowledgeAlerts'), async (req, res) => {
  try {
    const alert = await Alert.create({
      ...req.body,
      createdBy: req.user.id
    });

    // Broadcast via WebSocket
    req.io.to(`patient-${alert.patient}`).emit('new-alert', {
      patientId: alert.patient,
      alert
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Acknowledge alert
router.put('/:alertId/acknowledge', protect, checkPermission('acknowledgeAlerts'), async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = req.user.id;
    alert.acknowledgedAt = new Date();

    await alert.save();

    // Broadcast update
    req.io.to(`patient-${alert.patient}`).emit('alert-acknowledged', {
      alertId: alert._id,
      acknowledgedBy: req.user.id,
      acknowledgedAt: alert.acknowledgedAt
    });

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resolve alert
router.put('/:alertId/resolve', protect, checkPermission('acknowledgeAlerts'), async (req, res) => {
  try {
    const { resolution } = req.body;
    const alert = await Alert.findById(req.params.alertId);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = 'resolved';
    alert.resolvedBy = req.user.id;
    alert.resolvedAt = new Date();
    alert.resolution = resolution;

    await alert.save();

    // Broadcast update
    req.io.to(`patient-${alert.patient}`).emit('alert-resolved', {
      alertId: alert._id,
      resolvedBy: req.user.id,
      resolvedAt: alert.resolvedAt,
      resolution
    });

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Escalate alert
router.put('/:alertId/escalate', protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = 'escalated';
    alert.severity = 'critical';

    await alert.save();

    // Broadcast escalation
    req.io.to(`patient-${alert.patient}`).emit('alert-escalated', {
      alertId: alert._id,
      escalatedBy: req.user.id,
      escalatedAt: new Date()
    });

    // TODO: Send high-priority notifications
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Contact emergency services
router.post('/:alertId/emergency', protect, checkPermission('emergencyOverride'), async (req, res) => {
  try {
    const { service, notes } = req.body;
    const alert = await Alert.findById(req.params.alertId).populate('patient');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Generate incident number
    const incidentNumber = `INC-${Date.now()}`;

    alert.emergencyServicesContacted = {
      contacted: true,
      contactedAt: new Date(),
      service: service || 'ambulance',
      incidentNumber
    };

    await alert.save();

    // Broadcast emergency contact
    req.io.to(`patient-${alert.patient._id}`).emit('emergency-services-contacted', {
      alertId: alert._id,
      patientId: alert.patient._id,
      incidentNumber,
      contactedBy: req.user.id
    });

    // TODO: Integrate with actual emergency services API
    console.log(`Emergency services contacted for patient ${alert.patient.medicalRecordNumber}: ${incidentNumber}`);

    res.json({
      success: true,
      message: 'Emergency services contacted',
      incidentNumber,
      data: alert
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get alert statistics
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let matchQuery = { createdAt: { $gte: startDate } };

    // Filter by assigned patients for non-admin users
    if (req.user.role !== 'admin') {
      matchQuery.patient = { $in: req.user.assignedPatients };
    }

    const stats = await Alert.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          activeAlerts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          criticalAlerts: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          acknowledgedAlerts: {
            $sum: { $cond: [{ $eq: ['$status', 'acknowledged'] }, 1, 0] }
          },
          resolvedAlerts: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    const typeBreakdown = await Alert.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$alertType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {},
        typeBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
