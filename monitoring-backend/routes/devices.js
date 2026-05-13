const express = require('express');
const router = express.Router();
const { protect, checkPatientAccess, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/security');
const {
  processDeviceData,
  registerDevice,
  updateDeviceStatus,
  getDeviceInfo,
  getSupportedDevices,
  generateMockDeviceData
} = require('../services/deviceService');

/**
 * Get all supported device types
 * GET /api/devices/supported
 */
router.get('/supported', protect, async (req, res) => {
  try {
    const devices = getSupportedDevices();
    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get device information by type
 * GET /api/devices/info/:deviceType
 */
router.get('/info/:deviceType', protect, async (req, res) => {
  try {
    const { deviceType } = req.params;
    const info = getDeviceInfo(deviceType);

    if (!info) {
      return res.status(404).json({
        success: false,
        message: 'Device type not found'
      });
    }

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Register a new device for a patient
 * POST /api/devices/register
 */
router.post(
  '/register',
  protect,
  authorize('doctor', 'admin'),
  auditLogger('register_device', 'device'),
  async (req, res) => {
    try {
      const { patientId, deviceId, deviceType, installLocation, calibrationDate } = req.body;

      if (!patientId || !deviceId || !deviceType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: patientId, deviceId, deviceType'
        });
      }

      const result = await registerDevice(patientId, {
        deviceId,
        deviceType,
        installLocation,
        calibrationDate
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Update device status
 * PATCH /api/devices/:deviceId/status
 */
router.patch(
  '/:deviceId/status',
  protect,
  authorize('doctor', 'admin'),
  auditLogger('update_device_status', 'device'),
  async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { patientId, status } = req.body;

      if (!patientId || !status) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: patientId, status'
        });
      }

      if (!['active', 'inactive', 'maintenance'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: active, inactive, or maintenance'
        });
      }

      const result = await updateDeviceStatus(patientId, deviceId, status);

      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Process incoming device data
 * POST /api/devices/data
 */
router.post(
  '/data',
  protect,
  auditLogger('submit_device_data', 'device'),
  async (req, res) => {
    try {
      const { deviceId, deviceType, patientId, data } = req.body;

      if (!deviceId || !deviceType || !patientId || !data) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: deviceId, deviceType, patientId, data'
        });
      }

      const result = await processDeviceData(deviceId, deviceType, data, patientId);

      res.status(201).json(result);
    } catch (error) {
      console.error('Error processing device data:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Generate mock device data for testing
 * POST /api/devices/mock/:deviceType
 */
router.post(
  '/mock/:deviceType',
  protect,
  authorize('doctor', 'admin'),
  async (req, res) => {
    try {
      const { deviceType } = req.params;
      const { patientId } = req.body;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: patientId'
        });
      }

      const mockData = generateMockDeviceData(deviceType, patientId);

      res.json({
        success: true,
        data: mockData,
        message: 'Mock data generated. Use POST /api/devices/data to submit this data.'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Get patient's registered devices
 * GET /api/devices/patient/:patientId
 */
router.get(
  '/patient/:patientId',
  protect,
  checkPatientAccess,
  async (req, res) => {
    try {
      const Patient = require('../models/Patient');
      const patient = await Patient.findById(req.params.patientId);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.json({
        success: true,
        data: patient.devices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
