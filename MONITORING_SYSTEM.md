# 🏥 Evergreen Health Monitoring System

## Complete Full-Stack Patient Monitoring Platform

A comprehensive real-time health monitoring system for doctors, nurses, and families to track patient vitals, receive alerts, and monitor patients 24/7.

---

## 🎯 System Overview

### Backend (Node.js + Express + Socket.io + MongoDB)
**Location**: `/monitoring-backend/`

Real-time monitoring server with WebSocket support for live patient data streaming.

### Key Features

#### 📊 Real-Time Vital Signs Monitoring
- **Blood Pressure**: Continuous monitoring with customizable thresholds
- **Blood Glucose**: CGM support with diabetic alert system
- **Heart Rate & ECG**: Arrhythmia detection, HRV analysis
- **Temperature**: Fever/hypothermia alerts
- **SpO2**: Oxygen saturation tracking
- **Respiratory Rate**: Breathing pattern monitoring

#### 🚨 Intelligent Alert System
- **Automatic Threshold Alerts**: Customizable per patient
- **Fall Detection**: AI-powered camera integration
- **Inactivity Monitoring**: Movement sensors
- **Emergency Button**: Panic button integration
- **Multi-Level Severity**: Low, Medium, High, Critical
- **Real-Time Notifications**: WebSocket + Email + SMS

#### 👥 Role-Based Access Control
- **Doctor**: Full access, emergency override, modify settings
- **Nurse**: View vitals, acknowledge alerts
- **Family**: View-only access to assigned patients
- **Caregiver**: Limited monitoring access
- **Admin**: System administration

#### 📹 Smart Monitoring
- **AI Video Monitoring**: Fall detection with privacy blur
- **Motion Sensors**: Room-by-room activity tracking
- **Smart Devices**: Medication dispensers, door sensors
- **GPS Tracking**: Wandering prevention

---

## 🚀 Quick Start

### Prerequisites
```bash
# Required
- Node.js 16+
- MongoDB 4.4+
- npm or yarn
```

### Backend Setup

1. **Navigate to backend folder**
```bash
cd monitoring-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env file with your settings
```

4. **Start MongoDB**
```bash
mongod
# Or if using MongoDB service:
brew services start mongodb-community
```

5. **Seed database with test data**
```bash
npm run seed
```

This creates:
- 4 test users (doctor, nurse, 2 family members)
- 2 test patients with complete medical records
- 24 hours of vital readings
- Sample alerts

6. **Start the monitoring server**
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Server runs on: **http://localhost:5001**

---

## 📋 Test Accounts

### 👨‍⚕️ Doctor Account
- **Email**: `doctor@evergreen.com`
- **Password**: `password123`
- **Access**: Full system access, all patients, emergency override

### 👩‍⚕️ Nurse Account
- **Email**: `nurse@evergreen.com`
- **Password**: `password123`
- **Access**: View vitals, acknowledge alerts

### 👨‍👩‍👧 Family Accounts
- **Email**: `john.smith@email.com` / `password123`
  - Son of Mary Smith (MRN001)
- **Email**: `sarah.wilson@email.com` / `password123`
  - Daughter of Robert Wilson (MRN002)
- **Access**: View vitals & alerts for assigned patient only

### 🏥 Test Patients
- **Mary Smith** (MRN001)
  - 84-year-old female
  - Conditions: Hypertension, Type 2 Diabetes
  - Devices: BP Monitor, Glucose Monitor, Heart Rate, Camera

- **Robert Wilson** (MRN002)
  - 89-year-old male
  - Conditions: CHF, Atrial Fibrillation
  - Devices: BP Monitor, Heart Rate Monitor

---

## 🔌 API Endpoints

### Authentication
```http
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/password
```

### Patients
```http
GET  /api/patients
GET  /api/patients/:patientId
POST /api/patients
PUT  /api/patients/:patientId
PUT  /api/patients/:patientId/monitoring-settings
GET  /api/patients/:patientId/stats
```

### Vital Readings
```http
GET  /api/vitals/patient/:patientId
POST /api/vitals
POST /api/vitals/bulk
GET  /api/vitals/patient/:patientId/latest
```

### Alerts
```http
GET  /api/alerts
GET  /api/alerts/:alertId
POST /api/alerts
PUT  /api/alerts/:alertId/acknowledge
PUT  /api/alerts/:alertId/resolve
PUT  /api/alerts/:alertId/escalate
POST /api/alerts/:alertId/emergency
GET  /api/alerts/stats/summary
```

---

## 🌐 WebSocket Events

### Client → Server
```javascript
socket.emit('authenticate', token);
socket.emit('subscribe-patient', patientId);
socket.emit('unsubscribe-patient', patientId);
```

### Server → Client
```javascript
socket.on('authenticated', callback);
socket.on('vital-reading', callback);
socket.on('new-alert', callback);
socket.on('alert-acknowledged', callback);
socket.on('alert-resolved', callback);
socket.on('emergency-services-contacted', callback);
socket.on('monitoring-settings-updated', callback);
```

---

## 📊 Database Models

### User Schema
```javascript
{
  email, password, role,
  firstName, lastName, phoneNumber,
  licenseNumber, specialization,  // Doctor/Nurse
  relationshipToPatient,          // Family
  assignedPatients: [PatientId],
  permissions: {
    viewVitals, viewAlerts, viewCameraFeeds,
    acknowledgeAlerts, modifyPatientSettings, emergencyOverride
  },
  notificationPreferences: {
    email, sms, push,
    alertSeverityThreshold, quietHours
  }
}
```

### Patient Schema
```javascript
{
  firstName, lastName, dateOfBirth, gender,
  medicalRecordNumber,
  address, phoneNumber, emergencyContact,
  medicalConditions: [],
  medications: [],
  allergies: [],
  assignedDoctor, familyMembers: [], caregivers: [],
  devices: [{ deviceId, deviceType, status }],
  monitoringSettings: {
    bloodPressure: { enabled, frequency, alertThresholds },
    glucose: { enabled, frequency, alertThresholds },
    heartRate: { enabled, continuous, alertThresholds },
    temperature: { enabled, frequency, alertThresholds },
    fallDetection: { enabled },
    motionTracking: { enabled, inactivityAlertMinutes }
  }
}
```

### VitalReading Schema
```javascript
{
  patient, deviceId, readingType,
  values: {
    systolic, diastolic,          // Blood Pressure
    glucose, glucoseUnit,          // Glucose
    heartRate, heartRateVariability,  // Heart
    temperature, temperatureUnit,  // Temperature
    oxygenSaturation,             // SpO2
    respiratoryRate,              // Breathing
    ecgData, abnormalRhythm       // ECG
  },
  isNormal, alertTriggered, alertLevel, alertMessage,
  timestamp, reviewedBy
}
```

### Alert Schema
```javascript
{
  patient, alertType, severity, title, message,
  vitalReading, deviceId,
  location: { room, coordinates },
  videoFeed: { cameraId, snapshotUrl, streamUrl },
  status, // active, acknowledged, resolved, escalated
  acknowledgedBy, acknowledgedAt,
  resolvedBy, resolvedAt, resolution,
  notifications: [{ sentTo, method, sentAt, delivered, read }],
  emergencyServicesContacted: {
    contacted, contactedAt, service, incidentNumber
  }
}
```

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth with 30-day expiry
- **Password Hashing**: bcrypt with salt rounds
- **HTTP Security**: Helmet middleware for secure headers
- **CORS**: Configured allowed origins
- **Role-Based Access**: Granular permission system
- **Patient Data Protection**: Users only access assigned patients
- **HIPAA Compliance**: Secure data handling practices

---

## 🎨 Frontend Integration (Coming Next)

The frontend dashboard will include:

### Doctor Dashboard
- Multi-patient overview with live vitals
- Alert management center
- Patient medical records
- Vital trends and analytics
- Emergency response controls

### Family Portal
- Single patient detailed view
- Real-time vital signs display
- Alert notifications
- Camera feed access (with patient consent)
- Communication with medical team

### Features
- React + TypeScript
- Socket.io client for real-time updates
- Charts for vital trends (Chart.js/Recharts)
- Mobile responsive design
- Push notifications

---

## 📡 Device Integration

### Posting Vital Readings
Devices should POST to `/api/vitals`:

```javascript
const reading = {
  patient: "patientId",
  deviceId: "BP-001",
  readingType: "blood-pressure",
  values: {
    systolic: 125,
    diastolic: 78
  }
};

fetch('http://localhost:5001/api/vitals', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${deviceToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(reading)
});
```

### Supported Device Types
- `blood-pressure` - BP monitors
- `glucose` - Glucometers/CGM
- `heart-rate` - HR monitors, ECG
- `temperature` - Thermometers
- `spo2` - Pulse oximeters
- `camera` - Video monitoring
- `motion-sensor` - Movement detection

---

## 🔔 Notification System

### Email Notifications
- Configured via Nodemailer
- Supports Gmail, SendGrid, custom SMTP

### SMS Notifications
- Twilio integration
- Configurable per-user preferences

### Push Notifications
- Ready for FCM (Firebase Cloud Messaging)
- Ready for APNS (Apple Push Notification Service)

---

## 📈 Alert Thresholds

### Blood Pressure
- **Warning**: Systolic > 140 or < 90
- **Critical**: Systolic > 160 or < 80
- **Emergency**: Systolic > 180 or < 70

### Blood Glucose
- **Warning**: < 70 or > 180 mg/dL
- **Critical**: < 60 or > 250 mg/dL
- **Emergency**: < 55 or > 300 mg/dL

### Heart Rate
- **Warning**: < 50 or > 100 bpm
- **Emergency**: < 40 or > 130 bpm

### Temperature
- **Warning**: < 97°F or > 99.5°F
- **Emergency**: < 95°F or > 103°F

### SpO2
- **Critical**: < 90%
- **Emergency**: < 85%

---

## 🛠 Development

### Project Structure
```
monitoring-backend/
├── config/
│   └── database.js
├── models/
│   ├── User.js
│   ├── Patient.js
│   ├── VitalReading.js
│   └── Alert.js
├── routes/
│   ├── auth.js
│   ├── patients.js
│   ├── vitals.js
│   └── alerts.js
├── controllers/
│   └── authController.js
├── middleware/
│   └── auth.js
├── server.js
├── seed.js
└── package.json
```

### Environment Variables
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/evergreen-monitoring
JWT_SECRET=your-secret-key-change-in-production
CLIENT_URL=http://localhost:3000
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🧪 Testing

### Test API with cURL

```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@evergreen.com","password":"password123"}'

# Get patients (use token from login)
curl http://localhost:5001/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get latest vitals
curl http://localhost:5001/api/vitals/patient/PATIENT_ID/latest \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

socket.on('connect', () => {
  socket.emit('authenticate', 'YOUR_JWT_TOKEN');
});

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
  socket.emit('subscribe-patient', 'PATIENT_ID');
});

socket.on('vital-reading', (data) => {
  console.log('New vital reading:', data);
});

socket.on('new-alert', (data) => {
  console.log('New alert:', data);
});
```

---

## 📝 Next Steps

1. ✅ **Backend Complete** - Full-stack monitoring API with WebSockets
2. 🔄 **Frontend Dashboard** - React UI for doctors and families (in progress)
3. ⏳ **Mobile App** - React Native app for on-the-go monitoring
4. ⏳ **Device SDK** - Libraries for medical device integration
5. ⏳ **Analytics Dashboard** - ML-powered predictive health insights

---

## 📞 Support

- **Documentation**: See `/monitoring-backend/README.md`
- **API Health Check**: `http://localhost:5001/health`
- **Email**: support@evergreenhomecare.com

---

## 📄 License

Proprietary - Evergreen Home & Care Services

---

**Built with ❤️ for better elderly care**
