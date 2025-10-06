const express = require('express');
const router = express.Router();
const { protect, checkPatientAccess } = require('../middleware/auth');
const VitalReading = require('../models/VitalReading');
const Patient = require('../models/Patient');
const Alert = require('../models/Alert');

// Get vital readings for a patient
router.get('/patient/:patientId', protect, checkPatientAccess, async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 100 } = req.query;

    let query = { patient: req.params.patientId };

    if (type) query.readingType = type;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const readings = await VitalReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: readings.length, data: readings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create vital reading (simulates device data)
router.post('/', protect, async (req, res) => {
  try {
    const { patient, deviceId, readingType, values } = req.body;

    // Get patient and monitoring settings
    const patientData = await Patient.findById(patient);
    if (!patientData) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if reading is abnormal based on settings
    const { isNormal, alertLevel, alertMessage } = checkVitalThresholds(
      readingType,
      values,
      patientData.monitoringSettings
    );

    // Create reading
    const reading = await VitalReading.create({
      patient,
      deviceId,
      readingType,
      values,
      isNormal,
      alertTriggered: !isNormal,
      alertLevel,
      alertMessage
    });

    // Broadcast via WebSocket
    req.io.to(`patient-${patient}`).emit('vital-reading', {
      patientId: patient,
      reading
    });

    // Create alert if abnormal
    if (!isNormal) {
      const alert = await Alert.create({
        patient,
        alertType: 'vital-abnormal',
        severity: alertLevel === 'critical' ? 'critical' : alertLevel === 'emergency' ? 'critical' : 'high',
        title: `${readingType} Alert`,
        message: alertMessage,
        vitalReading: reading._id,
        deviceId
      });

      // Broadcast alert
      req.io.to(`patient-${patient}`).emit('new-alert', {
        patientId: patient,
        alert
      });

      // Send notifications (would integrate with email/SMS service)
      await sendAlertNotifications(alert, patientData);
    }

    res.status(201).json({ success: true, data: reading });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk create vital readings (for testing/simulation)
router.post('/bulk', protect, async (req, res) => {
  try {
    const readings = await VitalReading.insertMany(req.body.readings);

    // Broadcast each reading
    readings.forEach(reading => {
      req.io.to(`patient-${reading.patient}`).emit('vital-reading', {
        patientId: reading.patient,
        reading
      });
    });

    res.status(201).json({ success: true, count: readings.length, data: readings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get latest reading for each vital type
router.get('/patient/:patientId/latest', protect, checkPatientAccess, async (req, res) => {
  try {
    const types = ['blood-pressure', 'glucose', 'heart-rate', 'temperature', 'spo2'];
    const latest = {};

    for (const type of types) {
      const reading = await VitalReading.findOne({
        patient: req.params.patientId,
        readingType: type
      }).sort({ timestamp: -1 });

      if (reading) {
        latest[type] = reading;
      }
    }

    res.json({ success: true, data: latest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to check thresholds
function checkVitalThresholds(readingType, values, settings) {
  let isNormal = true;
  let alertLevel = 'normal';
  let alertMessage = '';

  switch (readingType) {
    case 'blood-pressure':
      if (settings.bloodPressure.enabled) {
        const { systolic, diastolic } = values;
        const { min: sysMin, max: sysMax } = settings.bloodPressure.alertThresholds.systolic;
        const { min: diaMin, max: diaMax } = settings.bloodPressure.alertThresholds.diastolic;

        if (systolic < sysMin || systolic > sysMax || diastolic < diaMin || diastolic > diaMax) {
          isNormal = false;
          alertLevel = systolic > 180 || diastolic > 110 ? 'emergency' : systolic > 160 || diastolic > 100 ? 'critical' : 'warning';
          alertMessage = `Blood pressure ${systolic}/${diastolic} is outside normal range (${sysMin}-${sysMax}/${diaMin}-${diaMax})`;
        }
      }
      break;

    case 'glucose':
      if (settings.glucose.enabled) {
        const { glucose } = values;
        const { min, max } = settings.glucose.alertThresholds;

        if (glucose < min || glucose > max) {
          isNormal = false;
          alertLevel = glucose < 55 || glucose > 250 ? 'emergency' : glucose < min || glucose > max ? 'critical' : 'warning';
          alertMessage = `Blood glucose ${glucose} mg/dL is outside normal range (${min}-${max})`;
        }
      }
      break;

    case 'heart-rate':
      if (settings.heartRate.enabled) {
        const { heartRate } = values;
        const { min, max } = settings.heartRate.alertThresholds;

        if (heartRate < min || heartRate > max) {
          isNormal = false;
          alertLevel = heartRate < 40 || heartRate > 130 ? 'emergency' : 'warning';
          alertMessage = `Heart rate ${heartRate} bpm is outside normal range (${min}-${max})`;
        }
      }
      break;

    case 'temperature':
      if (settings.temperature.enabled) {
        const { temperature } = values;
        const { min, max } = settings.temperature.alertThresholds;

        if (temperature < min || temperature > max) {
          isNormal = false;
          alertLevel = temperature > 103 || temperature < 95 ? 'emergency' : 'warning';
          alertMessage = `Temperature ${temperature}°F is outside normal range (${min}-${max})`;
        }
      }
      break;

    case 'spo2':
      const { oxygenSaturation } = values;
      if (oxygenSaturation < 90) {
        isNormal = false;
        alertLevel = oxygenSaturation < 85 ? 'emergency' : 'critical';
        alertMessage = `Oxygen saturation ${oxygenSaturation}% is critically low`;
      }
      break;
  }

  return { isNormal, alertLevel, alertMessage };
}

// Helper function to send notifications (stub for now)
async function sendAlertNotifications(alert, patient) {
  // This would integrate with email/SMS/push notification services
  console.log(`Would send notifications for alert ${alert._id} to patient ${patient.medicalRecordNumber} contacts`);
}

module.exports = router;
