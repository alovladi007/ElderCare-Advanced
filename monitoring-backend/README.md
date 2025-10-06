# Evergreen Health Monitoring System - Backend

Real-time patient health monitoring system with WebSocket support for live vitals tracking, alerts, and camera feeds.

## Features

### 🏥 Patient Health Monitoring
- **Real-time Vital Signs Tracking**
  - Blood Pressure (continuous monitoring)
  - Blood Glucose (CGM support)
  - Heart Rate & ECG
  - Temperature & SpO2
  - Respiratory Rate

### 🚨 Smart Alert System
- Automatic threshold-based alerts
- Fall detection integration
- Inactivity monitoring
- Emergency button support
- Multi-level severity (low, medium, high, critical)
- Real-time WebSocket notifications

### 👥 Role-Based Access Control
- **Doctor**: Full access, emergency override
- **Nurse**: View vitals, acknowledge alerts
- **Family**: View-only access to vitals and alerts
- **Caregiver**: Limited monitoring access
- **Admin**: System administration

### 📹 Camera & Sensor Integration
- AI-powered fall detection
- Privacy-focused video monitoring
- Motion sensor tracking
- Smart home device integration

### 📊 Real-Time Features
- WebSocket connections for live updates
- Instant alert notifications
- Live vital signs streaming
- Multi-user collaboration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Security**: Helmet, bcrypt
- **Notifications**: Nodemailer, Twilio (SMS)

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 4.4+

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start MongoDB**
```bash
# Make sure MongoDB is running
mongod
```

4. **Seed database with test data**
```bash
npm run seed
```

5. **Start server**
```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5001`

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "doctor|nurse|family|caregiver|admin",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Returns JWT token for authentication.

### Patients

#### Get All Patients
```http
GET /api/patients
Authorization: Bearer {token}
```

#### Get Patient Details
```http
GET /api/patients/:patientId
Authorization: Bearer {token}
```

#### Create Patient
```http
POST /api/patients
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Mary",
  "lastName": "Smith",
  "dateOfBirth": "1940-05-15",
  "gender": "female",
  "medicalRecordNumber": "MRN001",
  ...
}
```

#### Update Monitoring Settings
```http
PUT /api/patients/:patientId/monitoring-settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "bloodPressure": {
    "enabled": true,
    "frequency": 30,
    "alertThresholds": {
      "systolic": { "min": 90, "max": 140 },
      "diastolic": { "min": 60, "max": 90 }
    }
  }
}
```

### Vital Readings

#### Get Patient Vitals
```http
GET /api/vitals/patient/:patientId?type=blood-pressure&limit=100
Authorization: Bearer {token}
```

#### Submit Vital Reading
```http
POST /api/vitals
Authorization: Bearer {token}
Content-Type: application/json

{
  "patient": "patientId",
  "deviceId": "BP-001",
  "readingType": "blood-pressure",
  "values": {
    "systolic": 125,
    "diastolic": 78
  }
}
```

#### Get Latest Readings
```http
GET /api/vitals/patient/:patientId/latest
Authorization: Bearer {token}
```

### Alerts

#### Get Alerts
```http
GET /api/alerts?status=active&severity=high
Authorization: Bearer {token}
```

#### Acknowledge Alert
```http
PUT /api/alerts/:alertId/acknowledge
Authorization: Bearer {token}
```

#### Resolve Alert
```http
PUT /api/alerts/:alertId/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "resolution": "Patient stabilized, BP normalized"
}
```

#### Contact Emergency Services
```http
POST /api/alerts/:alertId/emergency
Authorization: Bearer {token}
Content-Type: application/json

{
  "service": "ambulance",
  "notes": "Patient unresponsive"
}
```

## WebSocket Events

### Client → Server

#### Authenticate
```javascript
socket.emit('authenticate', token);
```

#### Subscribe to Patient
```javascript
socket.emit('subscribe-patient', patientId);
```

#### Unsubscribe
```javascript
socket.emit('unsubscribe-patient', patientId);
```

### Server → Client

#### Authentication Result
```javascript
socket.on('authenticated', (data) => {
  // { success: true, user: {...} }
});
```

#### New Vital Reading
```javascript
socket.on('vital-reading', (data) => {
  // { patientId, reading: {...} }
});
```

#### New Alert
```javascript
socket.on('new-alert', (data) => {
  // { patientId, alert: {...} }
});
```

#### Alert Acknowledged
```javascript
socket.on('alert-acknowledged', (data) => {
  // { alertId, acknowledgedBy, acknowledgedAt }
});
```

#### Alert Resolved
```javascript
socket.on('alert-resolved', (data) => {
  // { alertId, resolvedBy, resolvedAt, resolution }
});
```

#### Emergency Services Contacted
```javascript
socket.on('emergency-services-contacted', (data) => {
  // { alertId, patientId, incidentNumber }
});
```

## Database Models

### User
- Authentication & authorization
- Role-based permissions
- Patient assignments
- Notification preferences

### Patient
- Demographics & medical history
- Medications & allergies
- Device assignments
- Monitoring settings with thresholds

### VitalReading
- Timestamped vital signs
- Multi-value support (BP, glucose, HR, etc.)
- Automatic alert triggering
- Review tracking

### Alert
- Multi-severity levels
- Status tracking (active, acknowledged, resolved)
- Notification history
- Emergency services integration

## Test Data

After running `npm run seed`, you can login with:

### Doctor Account
- **Email**: doctor@evergreen.com
- **Password**: password123
- **Access**: Full system access

### Nurse Account
- **Email**: nurse@evergreen.com
- **Password**: password123
- **Access**: View & acknowledge alerts

### Family Accounts
- **Email**: john.smith@email.com / password123 (Son of Mary Smith)
- **Email**: sarah.wilson@email.com / password123 (Daughter of Robert Wilson)
- **Access**: View vitals & alerts for assigned patient

### Test Patients
- **Mary Smith** (MRN001) - 84yo female, hypertension, diabetes
- **Robert Wilson** (MRN002) - 89yo male, CHF, AFib

## Development

### Project Structure
```
monitoring-backend/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User model
│   ├── Patient.js           # Patient model
│   ├── VitalReading.js      # Vitals model
│   └── Alert.js             # Alert model
├── routes/
│   ├── auth.js              # Auth routes
│   ├── patients.js          # Patient routes
│   ├── vitals.js            # Vitals routes
│   └── alerts.js            # Alert routes
├── controllers/
│   └── authController.js    # Auth logic
├── middleware/
│   └── auth.js              # Auth middleware
├── server.js                # Main server file
├── seed.js                  # Database seeder
└── package.json
```

### Environment Variables
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/evergreen-monitoring
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-password
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
```

## Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Helmet**: HTTP security headers
- **CORS**: Configured origins
- **Role-Based Access**: Granular permissions
- **Patient Access Control**: Users only see assigned patients

## Integration

### Device Integration
Devices should POST vital readings to `/api/vitals`:
```javascript
const reading = {
  patient: "patientId",
  deviceId: "BP-001",
  readingType: "blood-pressure",
  values: { systolic: 125, diastolic: 78 }
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

### Notification Services
- **Email**: Configured via Nodemailer
- **SMS**: Twilio integration
- **Push**: Ready for FCM/APNS integration

## License

Proprietary - Evergreen Home & Care

## Support

For support, contact: support@evergreenhomecare.com
