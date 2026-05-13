/**
 * Device Integration Service
 * Handles integration with various health monitoring devices and smart home systems
 */

const VitalReading = require('../models/VitalReading');
const Patient = require('../models/Patient');
const Alert = require('../models/Alert');

/**
 * Device types and their supported features
 */
const DEVICE_TYPES = {
  'blood-pressure': {
    name: 'Blood Pressure Monitor',
    measurements: ['systolic', 'diastolic'],
    frequency: 'scheduled'
  },
  'glucose': {
    name: 'Blood Glucose Monitor',
    measurements: ['glucose'],
    frequency: 'scheduled'
  },
  'heart-rate': {
    name: 'Heart Rate Monitor',
    measurements: ['heartRate', 'heartRateVariability'],
    frequency: 'continuous'
  },
  'temperature': {
    name: 'Temperature Sensor',
    measurements: ['temperature'],
    frequency: 'scheduled'
  },
  'spo2': {
    name: 'Pulse Oximeter',
    measurements: ['oxygenSaturation'],
    frequency: 'continuous'
  },
  'camera': {
    name: 'Smart Camera',
    features: ['fall-detection', 'privacy-blur', 'motion-detection'],
    frequency: 'continuous'
  },
  'motion-sensor': {
    name: 'Motion Sensor',
    features: ['room-tracking', 'inactivity-detection'],
    frequency: 'continuous'
  },
  'emergency-button': {
    name: 'Emergency Alert Button',
    features: ['panic-alert'],
    frequency: 'on-demand'
  },
  'door-sensor': {
    name: 'Door Sensor',
    features: ['wandering-detection', 'entry-exit-tracking'],
    frequency: 'continuous'
  }
};

/**
 * Process incoming data from a device
 */
async function processDeviceData(deviceId, deviceType, data, patientId) {
  try {
    // Validate device is registered
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const device = patient.devices.find(d => d.deviceId === deviceId);
    if (!device) {
      throw new Error('Device not registered for this patient');
    }

    if (device.status !== 'active') {
      throw new Error('Device is not active');
    }

    // Process based on device type
    let result;
    switch (deviceType) {
      case 'blood-pressure':
        result = await processBloodPressureData(patientId, deviceId, data);
        break;
      case 'glucose':
        result = await processGlucoseData(patientId, deviceId, data);
        break;
      case 'heart-rate':
        result = await processHeartRateData(patientId, deviceId, data);
        break;
      case 'temperature':
        result = await processTemperatureData(patientId, deviceId, data);
        break;
      case 'spo2':
        result = await processSpO2Data(patientId, deviceId, data);
        break;
      case 'motion-sensor':
        result = await processMotionData(patientId, deviceId, data);
        break;
      case 'camera':
        result = await processCameraData(patientId, deviceId, data);
        break;
      case 'emergency-button':
        result = await processEmergencyButton(patientId, deviceId, data);
        break;
      case 'door-sensor':
        result = await processDoorSensor(patientId, deviceId, data);
        break;
      default:
        throw new Error(`Unsupported device type: ${deviceType}`);
    }

    // Update device last seen timestamp
    device.lastSeen = new Date();
    await patient.save();

    return result;
  } catch (error) {
    console.error('Error processing device data:', error);
    throw error;
  }
}

/**
 * Process blood pressure data
 */
async function processBloodPressureData(patientId, deviceId, data) {
  const { systolic, diastolic, timestamp } = data;

  // Create vital reading (this will trigger alert creation via existing logic)
  const reading = await VitalReading.create({
    patient: patientId,
    deviceId,
    readingType: 'blood-pressure',
    values: { systolic, diastolic },
    timestamp: timestamp || new Date()
  });

  return {
    success: true,
    reading: reading._id,
    message: 'Blood pressure data processed'
  };
}

/**
 * Process glucose data
 */
async function processGlucoseData(patientId, deviceId, data) {
  const { glucose, glucoseUnit = 'mg/dL', timestamp } = data;

  const reading = await VitalReading.create({
    patient: patientId,
    deviceId,
    readingType: 'glucose',
    values: { glucose, glucoseUnit },
    timestamp: timestamp || new Date()
  });

  return {
    success: true,
    reading: reading._id,
    message: 'Glucose data processed'
  };
}

/**
 * Process heart rate data
 */
async function processHeartRateData(patientId, deviceId, data) {
  const { heartRate, heartRateVariability, timestamp } = data;

  const reading = await VitalReading.create({
    patient: patientId,
    deviceId,
    readingType: 'heart-rate',
    values: { heartRate, heartRateVariability },
    timestamp: timestamp || new Date()
  });

  return {
    success: true,
    reading: reading._id,
    message: 'Heart rate data processed'
  };
}

/**
 * Process temperature data
 */
async function processTemperatureData(patientId, deviceId, data) {
  const { temperature, temperatureUnit = 'F', timestamp } = data;

  const reading = await VitalReading.create({
    patient: patientId,
    deviceId,
    readingType: 'temperature',
    values: { temperature, temperatureUnit },
    timestamp: timestamp || new Date()
  });

  return {
    success: true,
    reading: reading._id,
    message: 'Temperature data processed'
  };
}

/**
 * Process SpO2 data
 */
async function processSpO2Data(patientId, deviceId, data) {
  const { oxygenSaturation, timestamp } = data;

  const reading = await VitalReading.create({
    patient: patientId,
    deviceId,
    readingType: 'spo2',
    values: { oxygenSaturation },
    timestamp: timestamp || new Date()
  });

  return {
    success: true,
    reading: reading._id,
    message: 'SpO2 data processed'
  };
}

/**
 * Process motion sensor data
 */
async function processMotionData(patientId, deviceId, data) {
  const { motion, room, timestamp } = data;
  const patient = await Patient.findById(patientId);

  // Check for inactivity
  if (!motion && patient.monitoringSettings.motionTracking?.enabled) {
    const inactivityMinutes = patient.monitoringSettings.motionTracking.inactivityAlertMinutes || 60;
    const lastMotion = new Date(timestamp || Date.now());
    const timeSinceMotion = (Date.now() - lastMotion.getTime()) / 1000 / 60; // minutes

    if (timeSinceMotion >= inactivityMinutes) {
      // Create inactivity alert
      const alert = await Alert.create({
        patient: patientId,
        alertType: 'inactivity',
        severity: 'medium',
        title: 'Inactivity Detected',
        message: `No motion detected for ${Math.round(timeSinceMotion)} minutes in ${room || 'unknown room'}`,
        deviceId,
        location: { room }
      });

      // Broadcast via WebSocket
      if (global.io) {
        global.io.to(`patient-${patientId}`).emit('new-alert', {
          patientId,
          alert
        });
      }

      return {
        success: true,
        alert: alert._id,
        message: 'Inactivity alert created'
      };
    }
  }

  return {
    success: true,
    message: 'Motion data processed'
  };
}

/**
 * Process camera data (fall detection, etc.)
 */
async function processCameraData(patientId, deviceId, data) {
  const { eventType, confidence, snapshotUrl, room, timestamp } = data;

  if (eventType === 'fall-detected' && confidence > 0.7) {
    const alert = await Alert.create({
      patient: patientId,
      alertType: 'fall-detected',
      severity: 'critical',
      title: 'Fall Detected',
      message: `Potential fall detected in ${room || 'unknown location'} with ${Math.round(confidence * 100)}% confidence`,
      deviceId,
      location: { room },
      videoFeed: {
        cameraId: deviceId,
        snapshotUrl
      }
    });

    // Broadcast via WebSocket
    if (global.io) {
      global.io.to(`patient-${patientId}`).emit('new-alert', {
        patientId,
        alert
      });
    }

    return {
      success: true,
      alert: alert._id,
      message: 'Fall detection alert created'
    };
  }

  return {
    success: true,
    message: 'Camera data processed'
  };
}

/**
 * Process emergency button press
 */
async function processEmergencyButton(patientId, deviceId, data) {
  const { location, timestamp } = data;

  const alert = await Alert.create({
    patient: patientId,
    alertType: 'emergency-button',
    severity: 'critical',
    title: 'Emergency Alert',
    message: 'Emergency button pressed by patient',
    deviceId,
    location
  });

  // Broadcast via WebSocket
  if (global.io) {
    global.io.to(`patient-${patientId}`).emit('new-alert', {
      patientId,
      alert
    });
  }

  return {
    success: true,
    alert: alert._id,
    message: 'Emergency alert created'
  };
}

/**
 * Process door sensor data (wandering detection)
 */
async function processDoorSensor(patientId, deviceId, data) {
  const { doorOpen, doorLocation, timestamp } = data;
  const patient = await Patient.findById(patientId);

  // Check if it's a restricted time (e.g., nighttime)
  const hour = new Date(timestamp || Date.now()).getHours();
  const isNighttime = hour >= 22 || hour <= 6;

  if (doorOpen && isNighttime) {
    const alert = await Alert.create({
      patient: patientId,
      alertType: 'wandering',
      severity: 'high',
      title: 'Potential Wandering',
      message: `${doorLocation || 'Door'} opened during nighttime hours`,
      deviceId,
      location: { room: doorLocation }
    });

    // Broadcast via WebSocket
    if (global.io) {
      global.io.to(`patient-${patientId}`).emit('new-alert', {
        patientId,
        alert
      });
    }

    return {
      success: true,
      alert: alert._id,
      message: 'Wandering alert created'
    };
  }

  return {
    success: true,
    message: 'Door sensor data processed'
  };
}

/**
 * Register a new device for a patient
 */
async function registerDevice(patientId, deviceData) {
  const { deviceId, deviceType, installLocation, calibrationDate } = deviceData;

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  // Check if device already exists
  const existingDevice = patient.devices.find(d => d.deviceId === deviceId);
  if (existingDevice) {
    throw new Error('Device already registered');
  }

  // Add device to patient
  patient.devices.push({
    deviceId,
    deviceType,
    installDate: new Date(),
    lastCalibration: calibrationDate || new Date(),
    status: 'active'
  });

  await patient.save();

  return {
    success: true,
    message: 'Device registered successfully',
    device: patient.devices[patient.devices.length - 1]
  };
}

/**
 * Update device status
 */
async function updateDeviceStatus(patientId, deviceId, status) {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const device = patient.devices.find(d => d.deviceId === deviceId);
  if (!device) {
    throw new Error('Device not found');
  }

  device.status = status;
  await patient.save();

  // If device goes offline, create alert
  if (status === 'inactive') {
    const alert = await Alert.create({
      patient: patientId,
      alertType: 'device-offline',
      severity: 'medium',
      title: 'Device Offline',
      message: `Device ${deviceId} (${DEVICE_TYPES[device.deviceType]?.name || device.deviceType}) is offline`,
      deviceId
    });

    if (global.io) {
      global.io.to(`patient-${patientId}`).emit('new-alert', {
        patientId,
        alert
      });
    }
  }

  return {
    success: true,
    message: `Device status updated to ${status}`
  };
}

/**
 * Get device information
 */
function getDeviceInfo(deviceType) {
  return DEVICE_TYPES[deviceType] || null;
}

/**
 * Get all supported device types
 */
function getSupportedDevices() {
  return Object.entries(DEVICE_TYPES).map(([type, info]) => ({
    type,
    ...info
  }));
}

/**
 * Simulate device data for testing
 */
function generateMockDeviceData(deviceType, patientId) {
  const mockData = { patientId, timestamp: new Date() };

  switch (deviceType) {
    case 'blood-pressure':
      mockData.systolic = Math.floor(Math.random() * 40) + 110; // 110-150
      mockData.diastolic = Math.floor(Math.random() * 30) + 70; // 70-100
      break;
    case 'glucose':
      mockData.glucose = Math.floor(Math.random() * 80) + 80; // 80-160
      mockData.glucoseUnit = 'mg/dL';
      break;
    case 'heart-rate':
      mockData.heartRate = Math.floor(Math.random() * 40) + 60; // 60-100
      mockData.heartRateVariability = Math.floor(Math.random() * 50) + 20; // 20-70
      break;
    case 'temperature':
      mockData.temperature = (Math.random() * 2 + 97.5).toFixed(1); // 97.5-99.5
      mockData.temperatureUnit = 'F';
      break;
    case 'spo2':
      mockData.oxygenSaturation = Math.floor(Math.random() * 5) + 95; // 95-100
      break;
    case 'motion-sensor':
      mockData.motion = Math.random() > 0.3;
      mockData.room = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom'][Math.floor(Math.random() * 4)];
      break;
    case 'camera':
      mockData.eventType = Math.random() > 0.9 ? 'fall-detected' : 'normal';
      mockData.confidence = Math.random();
      mockData.room = 'Living Room';
      break;
    default:
      break;
  }

  return mockData;
}

module.exports = {
  processDeviceData,
  registerDevice,
  updateDeviceStatus,
  getDeviceInfo,
  getSupportedDevices,
  generateMockDeviceData,
  DEVICE_TYPES
};
