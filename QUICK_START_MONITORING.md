# 🚀 Quick Start Guide - Health Monitoring System

## ✅ What's Been Built

You now have a **complete full-stack patient health monitoring system**:

### Backend (monitoring-backend/)
- ✅ Node.js + Express REST API
- ✅ MongoDB database with 4 models (User, Patient, VitalReading, Alert)
- ✅ WebSocket real-time server (Socket.io)
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Test data seeder

### Frontend (client/src/pages/)
- ✅ MonitoringLoginPage - Authentication UI
- ✅ MonitoringDashboard - Real-time monitoring interface
- ✅ Live WebSocket integration
- ✅ Charts and data visualization
- ✅ Alert management
- ✅ Multi-patient support

---

## 🎯 How to Access

### Step 1: Start MongoDB

**Option A - Using Homebrew (macOS):**
```bash
brew services start mongodb-community
```

**Option B - Manual start:**
```bash
mongod --config /usr/local/etc/mongod.conf
```

**Option C - Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

### Step 2: Start the Backend

```bash
# Navigate to monitoring backend
cd monitoring-backend

# Seed the database with test data (first time only)
npm run seed

# Start the backend server
npm run dev
```

✅ Backend running on: **http://localhost:5001**
✅ Health check: **http://localhost:5001/health**

### Step 3: Start the Frontend

```bash
# Navigate to client (in new terminal)
cd client

# Start React app
PORT=3002 npm start
```

✅ Frontend running on: **http://localhost:3002**

### Step 4: Access the Monitoring Dashboard

Open your browser and go to:
**http://localhost:3002/#/monitoring/login**

---

## 👥 Login Credentials

### 🩺 Doctor Account (Full Access)
```
Email: doctor@evergreen.com
Password: password123
```
**Can see:** All 2 patients, all vitals, all alerts

### 👩‍⚕️ Nurse Account
```
Email: nurse@evergreen.com
Password: password123
```
**Can see:** All assigned patients, acknowledge alerts

### 👨‍👩‍👧 Family Account #1
```
Email: john.smith@email.com
Password: password123
```
**Can see:** Mary Smith's vitals only

### 👨‍👩‍👧 Family Account #2
```
Email: sarah.wilson@email.com
Password: password123
```
**Can see:** Robert Wilson's vitals only

---

## 🏥 Test Patients

### Mary Smith (MRN001)
- 84-year-old female
- Conditions: Hypertension, Type 2 Diabetes
- Has 24 hours of sample vital readings
- Blood pressure, glucose, heart rate data

### Robert Wilson (MRN002)
- 89-year-old male
- Conditions: CHF, Atrial Fibrillation
- Has 24 hours of sample vital readings
- Blood pressure, heart rate data

---

## 🔴 What You'll See

### Live Dashboard Features:
1. **Patient List** - Click to select a patient
2. **Live Vital Signs**:
   - Blood Pressure (color-coded)
   - Heart Rate
   - Blood Glucose
   - Temperature
   - SpO2
3. **Real-Time Updates** - WebSocket connection (green dot = connected)
4. **Blood Pressure Chart** - 24-hour trend visualization
5. **Active Alerts** - See and acknowledge alerts
6. **Connection Status** - Top right corner

### Color Coding:
- 🟢 **Green** = Normal
- 🟡 **Yellow/Orange** = Warning
- 🔴 **Red** = Critical

---

## 🧪 Testing the System

### Test Real-Time Updates

1. Login to dashboard with doctor account
2. Keep dashboard open
3. In another terminal, submit a vital reading:

```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@evergreen.com","password":"password123"}' \
  | jq -r '.data.token')

# Get patient ID
PATIENT_ID=$(curl -s http://localhost:5001/api/patients \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[0]._id')

# Submit new BP reading (will show instantly in dashboard!)
curl -X POST http://localhost:5001/api/vitals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patient\": \"$PATIENT_ID\",
    \"deviceId\": \"BP-001\",
    \"readingType\": \"blood-pressure\",
    \"values\": {\"systolic\": 145, \"diastolic\": 92}
  }"
```

**Watch the dashboard update in real-time!** 🎉

### Create an Alert

```bash
# This will create a critical alert that appears instantly
curl -X POST http://localhost:5001/api/vitals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patient\": \"$PATIENT_ID\",
    \"deviceId\": \"BP-001\",
    \"readingType\": \"blood-pressure\",
    \"values\": {\"systolic\": 175, \"diastolic\": 105}
  }"
```

---

## 📱 Routes

### Frontend Pages:
- `/monitoring/login` - Login page
- `/monitoring/dashboard` - Main monitoring dashboard
- `/elder-care` - Elder care services
- `/remote-health-monitoring` - Info page (with "Access Dashboard" button)

### Backend API:
- `POST /api/auth/login` - Login
- `GET /api/patients` - Get patients
- `GET /api/vitals/patient/:id/latest` - Latest vitals
- `GET /api/alerts` - Get alerts
- `PUT /api/alerts/:id/acknowledge` - Acknowledge alert

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to MongoDB"
**Solution**: Start MongoDB first!
```bash
brew services start mongodb-community
# or
mongod
```

### ❌ "Connection disconnected" (red dot)
**Solution**:
1. Check backend is running: `curl http://localhost:5001/health`
2. Restart backend: `cd monitoring-backend && npm run dev`

### ❌ "No patients showing"
**Solution**: Run seed script
```bash
cd monitoring-backend
npm run seed
```

### ❌ Frontend not loading
**Solution**: Check port 3002 is free
```bash
lsof -ti:3002 | xargs kill  # Kill process on port
PORT=3002 npm start          # Restart
```

---

## 📊 System Architecture

```
┌─────────────┐     WebSocket      ┌──────────────┐
│   React     │◄──────────────────►│   Express    │
│  Dashboard  │    HTTP/REST       │   Backend    │
│ (Port 3002) │◄──────────────────►│ (Port 5001)  │
└─────────────┘                    └──────┬───────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │   MongoDB   │
                                   │ (Port 27017)│
                                   └─────────────┘
```

---

## 📚 Documentation

- **MONITORING_SYSTEM.md** - Complete system overview
- **MONITORING_ACCESS_GUIDE.md** - Detailed access guide
- **monitoring-backend/README.md** - API documentation
- **monitoring-backend/.env.example** - Environment config

---

## ✨ Features Summary

### ✅ Implemented:
- Real-time vital signs monitoring
- WebSocket live updates
- Blood pressure, glucose, heart rate, temperature, SpO2
- Alert system with severity levels
- Role-based access (doctor, nurse, family)
- Historical data charts
- Multi-patient support
- JWT authentication
- Responsive design

### 🎯 Next Steps (Optional):
- Video camera feed integration
- Push notifications
- SMS/Email alerts (Twilio/Nodemailer)
- Export reports
- Medication tracking
- Mobile app

---

## 🎉 Success Checklist

- [ ] MongoDB running
- [ ] Backend server running (port 5001)
- [ ] Frontend app running (port 3002)
- [ ] Test data seeded
- [ ] Can login at http://localhost:3002/#/monitoring/login
- [ ] Can see patients
- [ ] Can see live vitals
- [ ] WebSocket connected (green dot)
- [ ] Can view charts
- [ ] Can see alerts

**If all checked ✅ - YOU'RE READY TO MONITOR PATIENTS! 🏥**
