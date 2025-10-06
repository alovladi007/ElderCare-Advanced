# 🏥 Accessing the Health Monitoring System

## Quick Access Guide

### 📍 **Frontend Login Page**
**URL**: http://localhost:3002/#/monitoring/login

Or navigate from the website:
1. Go to **Elder Care** page
2. Click on **Remote Health Monitoring** service
3. Click **"Access Monitoring Dashboard"** button

---

## 🚀 Step-by-Step Setup

### 1. Start the Backend Server

```bash
# Navigate to monitoring backend
cd monitoring-backend

# Install dependencies (first time only)
npm install

# Start MongoDB (must be running)
mongod
# OR if using Homebrew:
brew services start mongodb-community

# Seed test data (first time only)
npm run seed

# Start the monitoring server
npm run dev
```

**Backend will run on**: http://localhost:5001

### 2. Start the Frontend

```bash
# Navigate to client folder
cd client

# Start React app (if not already running)
PORT=3002 npm start
```

**Frontend will run on**: http://localhost:3002

### 3. Access the Monitoring Dashboard

Open your browser and go to:
**http://localhost:3002/#/monitoring/login**

---

## 👥 Test Accounts

### 🩺 Doctor Account (Full Access)
- **Email**: `doctor@evergreen.com`
- **Password**: `password123`
- **Permissions**:
  - View all patients
  - Access all vital signs
  - View camera feeds
  - Acknowledge & resolve alerts
  - Modify patient settings
  - Emergency override

### 👩‍⚕️ Nurse Account
- **Email**: `nurse@evergreen.com`
- **Password**: `password123`
- **Permissions**:
  - View assigned patients
  - View vital signs
  - Acknowledge alerts
  - View camera feeds

### 👨‍👩‍👧 Family Accounts

**John Smith** (Son of Mary Smith):
- **Email**: `john.smith@email.com`
- **Password**: `password123`
- **Access**: Mary Smith's vitals and alerts

**Sarah Wilson** (Daughter of Robert Wilson):
- **Email**: `sarah.wilson@email.com`
- **Password**: `password123`
- **Access**: Robert Wilson's vitals and alerts

---

## 👴 Test Patients

### Mary Smith (MRN001)
- **Age**: 84 years old
- **Gender**: Female
- **Conditions**:
  - Hypertension
  - Type 2 Diabetes
- **Devices**:
  - Blood Pressure Monitor (BP-001)
  - Glucose Monitor (GL-001)
  - Heart Rate Monitor (HR-001)
  - Camera (CAM-001)

### Robert Wilson (MRN002)
- **Age**: 89 years old
- **Gender**: Male
- **Conditions**:
  - Congestive Heart Failure
  - Atrial Fibrillation
- **Devices**:
  - Blood Pressure Monitor (BP-002)
  - Heart Rate Monitor (HR-002)

---

## 🖥️ Dashboard Features

### Real-Time Monitoring
✅ **Live Vital Signs Display**
- Blood Pressure (Systolic/Diastolic)
- Heart Rate (BPM)
- Blood Glucose (mg/dL)
- Temperature (°F)
- Oxygen Saturation (SpO2%)
- Real-time WebSocket updates

✅ **Color-Coded Status**
- 🟢 **Green**: Normal range
- 🟡 **Yellow/Orange**: Warning - out of range
- 🔴 **Red**: Critical - immediate attention needed

✅ **Live Alerts**
- Instant notifications for abnormal vitals
- Fall detection alerts
- Inactivity warnings
- Device offline notifications
- Emergency button alerts

✅ **Historical Trends**
- 24-hour vital sign charts
- Blood pressure trend visualization
- Glucose level tracking
- Statistical analysis

✅ **Multi-Patient View**
- Patient list with quick switching
- Individual patient dashboards
- Medical record access
- Device status monitoring

### Alert Management
✅ **Alert Actions** (for authorized users):
- Acknowledge alerts
- Resolve alerts with notes
- Escalate to critical
- Contact emergency services

---

## 🔌 WebSocket Real-Time Updates

The dashboard automatically connects via WebSocket for:
- **Live vital sign updates** - See readings as they come in
- **Instant alert notifications** - Get notified immediately
- **Multi-user synchronization** - All users see updates in real-time
- **Connection status indicator** - See if connected/disconnected

### Connection Status
Look for the indicator in the top-right corner:
- 🟢 **Connected** - Receiving live updates
- 🔴 **Disconnected** - Check backend server

---

## 📊 API Testing (Optional)

### Test Login via API
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@evergreen.com","password":"password123"}'
```

### Get Patients (with token)
```bash
curl http://localhost:5001/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Submit Test Vital Reading
```bash
curl -X POST http://localhost:5001/api/vitals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "patient": "PATIENT_ID",
    "deviceId": "BP-001",
    "readingType": "blood-pressure",
    "values": {"systolic": 145, "diastolic": 92}
  }'
```

---

## 🚨 Triggering Test Alerts

### Method 1: Submit Abnormal Reading via API
```bash
# High blood pressure reading (will trigger alert)
curl -X POST http://localhost:5001/api/vitals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient": "PATIENT_ID",
    "deviceId": "BP-001",
    "readingType": "blood-pressure",
    "values": {"systolic": 165, "diastolic": 95}
  }'
```

### Method 2: Create Manual Alert
```bash
curl -X POST http://localhost:5001/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient": "PATIENT_ID",
    "alertType": "fall-detected",
    "severity": "critical",
    "title": "Fall Detected",
    "message": "Patient fall detected in bedroom"
  }'
```

---

## 🔧 Troubleshooting

### ❌ "Cannot connect to backend"
**Solution**:
1. Make sure MongoDB is running: `mongod`
2. Start backend server: `cd monitoring-backend && npm run dev`
3. Check backend is running on: http://localhost:5001/health

### ❌ "Authentication failed"
**Solution**:
1. Clear browser localStorage
2. Use correct test credentials (see above)
3. Make sure backend is running

### ❌ "No patients showing"
**Solution**:
1. Run seed script: `cd monitoring-backend && npm run seed`
2. Refresh the dashboard
3. Check browser console for errors

### ❌ "WebSocket not connecting"
**Solution**:
1. Check backend server is running
2. Look for CORS errors in console
3. Ensure backend URL is correct (http://localhost:5001)

### ❌ "No vitals data showing"
**Solution**:
1. Seed data includes 24 hours of readings
2. Select a patient from the list
3. Check network tab for API errors

---

## 🎯 Quick Test Workflow

### For Doctors/Nurses:
1. Login with doctor account
2. See list of 2 patients (Mary Smith, Robert Wilson)
3. Click on Mary Smith
4. View her live vitals (BP, glucose, heart rate, etc.)
5. See blood pressure trend chart
6. Check active alerts panel
7. Acknowledge any active alerts
8. Switch to Robert Wilson to see his data

### For Family Members:
1. Login with family account (john.smith@email.com)
2. See only assigned patient (Mary Smith)
3. View all vital signs in real-time
4. See alerts for their patient
5. Monitor 24-hour trends

---

## 📱 Mobile Access

The dashboard is **fully responsive** and works on:
- 📱 Mobile phones (iOS/Android)
- 📲 Tablets (iPad, Android tablets)
- 💻 Desktop browsers
- 🖥️ Large displays

Simply access the same URL on your mobile device!

---

## 🔐 Security Notes

- ✅ JWT token authentication (30-day expiry)
- ✅ Role-based access control
- ✅ Users only see assigned patients
- ✅ Encrypted passwords (bcrypt)
- ✅ CORS protection
- ✅ Secure WebSocket connections

---

## 📚 Additional Resources

- **Full API Documentation**: `/monitoring-backend/README.md`
- **System Architecture**: `/MONITORING_SYSTEM.md`
- **Backend Setup**: `/monitoring-backend/`
- **Seed Data Script**: `/monitoring-backend/seed.js`

---

## 🎉 Summary

**To access the monitoring system:**

1. **Start Backend**: `cd monitoring-backend && npm run dev`
2. **Start Frontend**: `cd client && PORT=3002 npm start`
3. **Open Browser**: http://localhost:3002/#/monitoring/login
4. **Login**: Use doctor@evergreen.com / password123
5. **Monitor**: View live patient vitals and alerts!

**That's it! You're now monitoring patients in real-time! 🏥**
