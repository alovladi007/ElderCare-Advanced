const express = require('express');
const router = express.Router();
const { protect, checkPatientAccess, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/security');
const {
  calculateVitalStatistics,
  generatePatientHealthReport,
  getAlertTrends,
  predictHealthIssues,
  exportPatientData
} = require('../services/analyticsService');

/**
 * Get vital statistics for a patient
 * GET /api/analytics/patient/:patientId/vitals/:type/statistics
 */
router.get(
  '/patient/:patientId/vitals/:type/statistics',
  protect,
  checkPatientAccess,
  auditLogger('view_vital_statistics', 'analytics'),
  async (req, res) => {
    try {
      const { patientId, type } = req.params;
      const { startDate, endDate } = req.query;

      // Default to last 30 days if not specified
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      const statistics = await calculateVitalStatistics(
        patientId,
        type,
        start.toISOString(),
        end.toISOString()
      );

      if (!statistics) {
        return res.status(404).json({
          success: false,
          message: 'No data found for the specified period'
        });
      }

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error calculating vital statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Generate comprehensive health report for a patient
 * GET /api/analytics/patient/:patientId/health-report
 */
router.get(
  '/patient/:patientId/health-report',
  protect,
  checkPatientAccess,
  authorize('doctor', 'nurse', 'admin'),
  auditLogger('generate_health_report', 'analytics'),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { startDate, endDate } = req.query;

      // Default to last 30 days if not specified
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      const report = await generatePatientHealthReport(
        patientId,
        start.toISOString(),
        end.toISOString()
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error generating health report:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Get alert trends for a patient
 * GET /api/analytics/patient/:patientId/alert-trends
 */
router.get(
  '/patient/:patientId/alert-trends',
  protect,
  checkPatientAccess,
  auditLogger('view_alert_trends', 'analytics'),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { days } = req.query;

      const trends = await getAlertTrends(patientId, days ? parseInt(days) : 30);

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Error getting alert trends:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Get health predictions for a patient
 * GET /api/analytics/patient/:patientId/predictions
 */
router.get(
  '/patient/:patientId/predictions',
  protect,
  checkPatientAccess,
  authorize('doctor', 'admin'),
  auditLogger('view_health_predictions', 'analytics'),
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const predictions = await predictHealthIssues(patientId);

      res.json({
        success: true,
        data: predictions,
        count: predictions.length
      });
    } catch (error) {
      console.error('Error predicting health issues:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Export patient data
 * GET /api/analytics/patient/:patientId/export
 */
router.get(
  '/patient/:patientId/export',
  protect,
  checkPatientAccess,
  authorize('doctor', 'admin'),
  auditLogger('export_patient_data', 'analytics'),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { startDate, endDate, format } = req.query;

      // Default to last 90 days if not specified
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

      const data = await exportPatientData(
        patientId,
        start.toISOString(),
        end.toISOString(),
        format || 'json'
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="patient-data-${patientId}.csv"`);
        res.send(data);
      } else {
        res.json({
          success: true,
          data
        });
      }
    } catch (error) {
      console.error('Error exporting patient data:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Get system-wide analytics (admin only)
 * GET /api/analytics/system/overview
 */
router.get(
  '/system/overview',
  protect,
  authorize('admin'),
  auditLogger('view_system_analytics', 'analytics'),
  async (req, res) => {
    try {
      const Patient = require('../models/Patient');
      const VitalReading = require('../models/VitalReading');
      const Alert = require('../models/Alert');
      const User = require('../models/User');

      const { days } = req.query;
      const daysToAnalyze = days ? parseInt(days) : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToAnalyze);

      // System-wide metrics
      const [
        totalPatients,
        activePatients,
        totalUsers,
        totalReadings,
        totalAlerts,
        criticalAlerts,
        unresolvedAlerts
      ] = await Promise.all([
        Patient.countDocuments(),
        Patient.countDocuments({ status: 'active' }),
        User.countDocuments({ isActive: true }),
        VitalReading.countDocuments({ timestamp: { $gte: startDate } }),
        Alert.countDocuments({ createdAt: { $gte: startDate } }),
        Alert.countDocuments({ createdAt: { $gte: startDate }, severity: 'critical' }),
        Alert.countDocuments({ status: 'active' })
      ]);

      // Get alert distribution
      const alertsByType = await Alert.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$alertType', count: { $sum: 1 } } }
      ]);

      // Get readings by type
      const readingsByType = await VitalReading.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$readingType', count: { $sum: 1 } } }
      ]);

      res.json({
        success: true,
        data: {
          period: { days: daysToAnalyze, start: startDate, end: new Date() },
          patients: {
            total: totalPatients,
            active: activePatients,
            inactive: totalPatients - activePatients
          },
          users: { total: totalUsers },
          vitals: {
            total: totalReadings,
            byType: readingsByType.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {})
          },
          alerts: {
            total: totalAlerts,
            critical: criticalAlerts,
            unresolved: unresolvedAlerts,
            byType: alertsByType.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {})
          }
        }
      });
    } catch (error) {
      console.error('Error getting system overview:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
