const VitalReading = require('../models/VitalReading');
const Alert = require('../models/Alert');
const Patient = require('../models/Patient');

/**
 * Analytics Service - Generate insights and reports from health data
 */

/**
 * Calculate vital statistics for a patient over a time period
 */
async function calculateVitalStatistics(patientId, readingType, startDate, endDate) {
  const readings = await VitalReading.find({
    patient: patientId,
    readingType,
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ timestamp: 1 });

  if (readings.length === 0) {
    return null;
  }

  // Extract values based on reading type
  const values = readings.map(r => {
    switch (readingType) {
      case 'blood-pressure':
        return { systolic: r.values.systolic, diastolic: r.values.diastolic, timestamp: r.timestamp };
      case 'glucose':
        return { value: r.values.glucose, timestamp: r.timestamp };
      case 'heart-rate':
        return { value: r.values.heartRate, hrv: r.values.heartRateVariability, timestamp: r.timestamp };
      case 'temperature':
        return { value: r.values.temperature, timestamp: r.timestamp };
      case 'spo2':
        return { value: r.values.oxygenSaturation, timestamp: r.timestamp };
      default:
        return null;
    }
  }).filter(v => v !== null);

  // Calculate statistics
  if (readingType === 'blood-pressure') {
    const systolicValues = values.map(v => v.systolic);
    const diastolicValues = values.map(v => v.diastolic);

    return {
      readingType,
      count: values.length,
      systolic: {
        min: Math.min(...systolicValues),
        max: Math.max(...systolicValues),
        avg: average(systolicValues),
        median: median(systolicValues)
      },
      diastolic: {
        min: Math.min(...diastolicValues),
        max: Math.max(...diastolicValues),
        avg: average(diastolicValues),
        median: median(diastolicValues)
      },
      trend: calculateTrend(values.map(v => v.systolic)),
      abnormalReadings: readings.filter(r => !r.isNormal).length,
      abnormalPercentage: (readings.filter(r => !r.isNormal).length / readings.length) * 100
    };
  } else {
    const numericValues = values.map(v => v.value);

    return {
      readingType,
      count: values.length,
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      avg: average(numericValues),
      median: median(numericValues),
      stdDev: standardDeviation(numericValues),
      trend: calculateTrend(numericValues),
      abnormalReadings: readings.filter(r => !r.isNormal).length,
      abnormalPercentage: (readings.filter(r => !r.isNormal).length / readings.length) * 100,
      timeSeriesData: values.map(v => ({
        value: v.value,
        timestamp: v.timestamp
      }))
    };
  }
}

/**
 * Generate comprehensive patient health report
 */
async function generatePatientHealthReport(patientId, startDate, endDate) {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Get all readings in period
  const allReadings = await VitalReading.find({
    patient: patientId,
    timestamp: { $gte: start, $lte: end }
  });

  // Get all alerts in period
  const alerts = await Alert.find({
    patient: patientId,
    createdAt: { $gte: start, $lte: end }
  }).sort({ createdAt: -1 });

  // Calculate statistics for each vital type
  const vitalTypes = ['blood-pressure', 'glucose', 'heart-rate', 'temperature', 'spo2'];
  const vitalStatistics = {};

  for (const type of vitalTypes) {
    const stats = await calculateVitalStatistics(patientId, type, startDate, endDate);
    if (stats) {
      vitalStatistics[type] = stats;
    }
  }

  // Alert summary
  const alertSummary = {
    total: alerts.length,
    bySeverity: {
      low: alerts.filter(a => a.severity === 'low').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      high: alerts.filter(a => a.severity === 'high').length,
      critical: alerts.filter(a => a.severity === 'critical').length
    },
    byType: {},
    avgResponseTime: calculateAverageResponseTime(alerts),
    resolved: alerts.filter(a => a.status === 'resolved').length,
    active: alerts.filter(a => a.status === 'active').length
  };

  // Group alerts by type
  alerts.forEach(alert => {
    alertSummary.byType[alert.alertType] = (alertSummary.byType[alert.alertType] || 0) + 1;
  });

  // Health score calculation
  const healthScore = calculateHealthScore(vitalStatistics, alertSummary, daysInPeriod);

  // Risk assessment
  const riskFactors = identifyRiskFactors(patient, vitalStatistics, alerts);

  return {
    patient: {
      id: patient._id,
      name: `${patient.firstName} ${patient.lastName}`,
      mrn: patient.medicalRecordNumber,
      age: calculateAge(patient.dateOfBirth),
      medicalConditions: patient.medicalConditions
    },
    reportPeriod: {
      start: startDate,
      end: endDate,
      days: daysInPeriod
    },
    vitalStatistics,
    alertSummary,
    healthScore,
    riskFactors,
    recommendations: generateRecommendations(vitalStatistics, alertSummary, riskFactors),
    generatedAt: new Date()
  };
}

/**
 * Generate alert trend analysis
 */
async function getAlertTrends(patientId, days = 30) {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const alerts = await Alert.find({
    patient: patientId,
    createdAt: { $gte: startDate, $lte: endDate }
  }).sort({ createdAt: 1 });

  // Group by day
  const dailyAlerts = {};
  alerts.forEach(alert => {
    const day = alert.createdAt.toISOString().split('T')[0];
    if (!dailyAlerts[day]) {
      dailyAlerts[day] = { total: 0, bySeverity: {}, byType: {} };
    }
    dailyAlerts[day].total++;
    dailyAlerts[day].bySeverity[alert.severity] = (dailyAlerts[day].bySeverity[alert.severity] || 0) + 1;
    dailyAlerts[day].byType[alert.alertType] = (dailyAlerts[day].byType[alert.alertType] || 0) + 1;
  });

  return {
    period: { start: startDate, end: endDate, days },
    totalAlerts: alerts.length,
    dailyAlerts,
    trend: calculateTrend(Object.values(dailyAlerts).map(d => d.total)),
    mostCommonType: getMostCommon(alerts.map(a => a.alertType)),
    mostCommonSeverity: getMostCommon(alerts.map(a => a.severity)),
    peakHours: getAlertPeakHours(alerts)
  };
}

/**
 * Predict potential health issues based on trends
 */
async function predictHealthIssues(patientId) {
  const predictions = [];
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  // Analyze blood pressure trends
  const bpReadings = await VitalReading.find({
    patient: patientId,
    readingType: 'blood-pressure',
    timestamp: { $gte: last30Days }
  }).sort({ timestamp: 1 });

  if (bpReadings.length > 5) {
    const systolicValues = bpReadings.map(r => r.values.systolic);
    const trend = calculateTrend(systolicValues);

    if (trend > 0.5) {
      predictions.push({
        type: 'hypertension_risk',
        severity: 'medium',
        confidence: Math.min(trend * 50, 85),
        message: 'Blood pressure shows upward trend. Monitor closely and consider medication adjustment.',
        dataPoints: bpReadings.length,
        trend: 'increasing'
      });
    }
  }

  // Analyze glucose trends
  const glucoseReadings = await VitalReading.find({
    patient: patientId,
    readingType: 'glucose',
    timestamp: { $gte: last30Days }
  }).sort({ timestamp: 1 });

  if (glucoseReadings.length > 5) {
    const glucoseValues = glucoseReadings.map(r => r.values.glucose);
    const avgGlucose = average(glucoseValues);

    if (avgGlucose > 140) {
      predictions.push({
        type: 'diabetes_management',
        severity: 'high',
        confidence: 75,
        message: 'Average glucose levels elevated. Review diet and medication adherence.',
        avgValue: Math.round(avgGlucose),
        dataPoints: glucoseReadings.length
      });
    }
  }

  // Analyze alert patterns
  const recentAlerts = await Alert.find({
    patient: patientId,
    createdAt: { $gte: last30Days },
    alertType: 'fall-detected'
  });

  if (recentAlerts.length >= 3) {
    predictions.push({
      type: 'fall_risk',
      severity: 'high',
      confidence: 80,
      message: `Multiple fall incidents detected (${recentAlerts.length}). Recommend mobility assessment and home safety evaluation.`,
      incidents: recentAlerts.length
    });
  }

  // Check inactivity patterns
  const inactivityAlerts = await Alert.find({
    patient: patientId,
    createdAt: { $gte: last30Days },
    alertType: 'inactivity'
  });

  if (inactivityAlerts.length >= 5) {
    predictions.push({
      type: 'mobility_decline',
      severity: 'medium',
      confidence: 70,
      message: 'Increased inactivity detected. Consider physical therapy or activity programs.',
      incidents: inactivityAlerts.length
    });
  }

  return predictions;
}

/**
 * Export patient data in various formats
 */
async function exportPatientData(patientId, startDate, endDate, format = 'json') {
  const patient = await Patient.findById(patientId);
  const vitals = await VitalReading.find({
    patient: patientId,
    timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).sort({ timestamp: 1 });

  const alerts = await Alert.find({
    patient: patientId,
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).sort({ createdAt: 1 });

  const data = {
    patient: {
      name: `${patient.firstName} ${patient.lastName}`,
      mrn: patient.medicalRecordNumber,
      dateOfBirth: patient.dateOfBirth,
      medicalConditions: patient.medicalConditions,
      medications: patient.medications,
      allergies: patient.allergies
    },
    exportDate: new Date(),
    period: { start: startDate, end: endDate },
    vitals: vitals.map(v => ({
      type: v.readingType,
      timestamp: v.timestamp,
      values: v.values,
      isNormal: v.isNormal,
      alertLevel: v.alertLevel
    })),
    alerts: alerts.map(a => ({
      type: a.alertType,
      severity: a.severity,
      title: a.title,
      message: a.message,
      timestamp: a.createdAt,
      status: a.status,
      resolvedAt: a.resolvedAt
    }))
  };

  if (format === 'csv') {
    return convertToCSV(data);
  }

  return data;
}

// Helper functions

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function standardDeviation(arr) {
  const avg = average(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

function calculateTrend(values) {
  if (values.length < 2) return 0;

  // Simple linear regression slope
  const n = values.length;
  const sumX = values.reduce((a, b, i) => a + i, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((a, b, i) => a + (i * b), 0);
  const sumX2 = values.reduce((a, b, i) => a + (i * i), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

function calculateAverageResponseTime(alerts) {
  const acknowledgedAlerts = alerts.filter(a => a.acknowledgedAt && a.createdAt);
  if (acknowledgedAlerts.length === 0) return null;

  const responseTimes = acknowledgedAlerts.map(a =>
    (new Date(a.acknowledgedAt) - new Date(a.createdAt)) / 1000 / 60 // minutes
  );

  return Math.round(average(responseTimes));
}

function calculateHealthScore(vitalStats, alertSummary, daysInPeriod) {
  let score = 100;

  // Deduct points for abnormal readings
  Object.values(vitalStats).forEach(stat => {
    if (stat.abnormalPercentage > 50) score -= 20;
    else if (stat.abnormalPercentage > 25) score -= 10;
    else if (stat.abnormalPercentage > 10) score -= 5;
  });

  // Deduct points for alerts
  score -= alertSummary.bySeverity.critical * 5;
  score -= alertSummary.bySeverity.high * 3;
  score -= alertSummary.bySeverity.medium * 1;

  // Deduct for unresolved alerts
  score -= (alertSummary.active * 2);

  return Math.max(0, Math.min(100, score));
}

function identifyRiskFactors(patient, vitalStats, alerts) {
  const risks = [];

  // Check medical conditions
  if (patient.medicalConditions && patient.medicalConditions.length > 0) {
    patient.medicalConditions.forEach(condition => {
      risks.push({
        type: 'pre_existing_condition',
        severity: 'medium',
        description: condition.condition,
        diagnosedDate: condition.diagnosedDate
      });
    });
  }

  // Check vital statistics for concerning trends
  if (vitalStats['blood-pressure'] && vitalStats['blood-pressure'].abnormalPercentage > 30) {
    risks.push({
      type: 'cardiovascular_risk',
      severity: 'high',
      description: 'Frequent abnormal blood pressure readings detected'
    });
  }

  // Check for fall history
  const fallAlerts = alerts.filter(a => a.alertType === 'fall-detected');
  if (fallAlerts.length > 0) {
    risks.push({
      type: 'fall_risk',
      severity: fallAlerts.length > 2 ? 'high' : 'medium',
      description: `${fallAlerts.length} fall incident(s) in reporting period`
    });
  }

  return risks;
}

function generateRecommendations(vitalStats, alertSummary, riskFactors) {
  const recommendations = [];

  // Based on vital statistics
  if (vitalStats['blood-pressure'] && vitalStats['blood-pressure'].abnormalPercentage > 20) {
    recommendations.push({
      category: 'monitoring',
      priority: 'high',
      recommendation: 'Increase blood pressure monitoring frequency to 3x daily'
    });
  }

  // Based on alerts
  if (alertSummary.bySeverity.critical > 0) {
    recommendations.push({
      category: 'care_plan',
      priority: 'high',
      recommendation: 'Schedule urgent care review and medication assessment'
    });
  }

  // Based on risk factors
  riskFactors.forEach(risk => {
    if (risk.type === 'fall_risk') {
      recommendations.push({
        category: 'safety',
        priority: 'high',
        recommendation: 'Conduct home safety assessment and consider mobility aids'
      });
    }
  });

  return recommendations;
}

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getMostCommon(arr) {
  const counts = {};
  arr.forEach(item => counts[item] = (counts[item] || 0) + 1);
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

function getAlertPeakHours(alerts) {
  const hourCounts = {};
  alerts.forEach(alert => {
    const hour = new Date(alert.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  return hourCounts;
}

function convertToCSV(data) {
  // Simple CSV conversion for vitals
  let csv = 'Timestamp,Type,Values\n';
  data.vitals.forEach(v => {
    csv += `${v.timestamp},"${v.type}","${JSON.stringify(v.values)}"\n`;
  });
  return csv;
}

module.exports = {
  calculateVitalStatistics,
  generatePatientHealthReport,
  getAlertTrends,
  predictHealthIssues,
  exportPatientData
};
