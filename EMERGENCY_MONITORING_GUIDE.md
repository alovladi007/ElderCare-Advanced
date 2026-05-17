# 24/7 Emergency Monitoring & Alert System

## Overview

A comprehensive emergency monitoring system that provides:
- **24/7 continuous health monitoring** with automated vital signs checking
- **Intelligent alert routing** to hospitals, clinics, police, and family
- **Comprehensive emergency reports** with complete patient data
- **Auto-escalation** for unacknowledged critical alerts
- **Real-time notifications** via email, SMS (with Twilio), and dispatch systems

---

## Features

### 1. Continuous Monitoring Service

**Runs 24/7** checking:
- ✅ Vital signs (heart rate, blood pressure, temperature, SpO2, glucose)
- ✅ Vital trends (detecting deteriorating health)
- ✅ Inactivity detection (via smart home sensors)
- ✅ Stale readings (alerts if no vitals recorded in 24 hours)
- ✅ Critical alert escalation (auto-escalates if not acknowledged)

**Configuration Options:**
```javascript
{
  enabled: true,
  vitalCheckInterval: 300,        // Check every 5 minutes (seconds)
  inactivityTimeout: 3600,         // Alert after 1 hour of no activity (seconds)
  quietHoursStart: "22:00",        // No non-critical alerts during quiet hours
  quietHoursEnd: "07:00",
  notifyFamily: true,              // Send alerts to family members
  notifyHealthcare: true,          // Send alerts to healthcare providers
  notifyEmergency: true,           // Send alerts to emergency services
  autoEscalateCritical: true,      // Auto-escalate unacknowledged critical alerts
  escalationDelay: 300             // Escalate after 5 minutes (seconds)
}
```

### 2. Emergency Alert Routing

**Automatic notification routing** based on:
- Alert severity (CRITICAL, HIGH, MEDIUM, LOW)
- Alert type (MEDICAL, FALL, VITAL_ABNORMAL, PANIC_BUTTON, ENVIRONMENTAL)
- Recipient type (HOSPITAL, CLINIC, POLICE, FAMILY)

**Notification Methods:**
- 📧 **Email** - HTML formatted reports with full patient data
- 📱 **SMS** - Critical alerts sent via Twilio (when configured)
- 🚨 **Dispatch System** - Emergency services get dispatch records
- 📞 **Phone Calls** - Future integration for critical situations

**Priority-based Routing:**
- Priority 1: Emergency services and primary contacts (immediate)
- Priority 2-5: Healthcare providers and secondary contacts (based on config)

### 3. Comprehensive Emergency Reports

**Auto-generated reports include:**
- 👤 Patient Information (name, DOB, gender, blood type, address)
- 💊 Current Medications (name, dosage, frequency, prescribed by)
- 🏥 Medical History (conditions, allergies, surgeries, chronic diseases)
- 📊 Recent Vital Signs (last 20 readings with trends)
- 🚨 Recent Alerts (last 10 alerts from past 7 days)
- 📞 Emergency Contacts (primary + all contacts with relationships)
- 📍 Location Data (full address with coordinates if available)
- 📝 Incident Details (alert type, severity, timestamp, description)

### 4. Healthcare Provider Management

**Register and manage:**
- Hospitals
- Clinics
- Primary care physicians
- Specialists
- Urgent care centers
- Emergency rooms

**Each provider has:**
- Contact information (email, phone, address)
- Priority level (1-5, determines notification order)
- Active/inactive status
- Notes

### 5. Emergency Services Integration

**Configure local emergency services:**
- Police departments
- Fire departments
- Ambulance services
- Emergency dispatch centers

**Features:**
- Direct contact phone numbers
- Email notifications
- Automatic dispatch record creation
- Status tracking (PENDING → DISPATCHED → EN_ROUTE → ON_SCENE → COMPLETED)

### 6. Emergency Contact Management

**Manage family and caregiver contacts:**
- Primary contact designation
- Relationship tracking
- Multiple contact methods (phone, email)
- Address information for in-person response
- Active/inactive status

---

## API Endpoints

### Emergency Alerts

```bash
# Trigger emergency alert
POST /api/care-management/emergency/alert
{
  "elderId": "elder-123",
  "severity": "CRITICAL",
  "type": "MEDICAL",
  "title": "Heart Rate Critical",
  "message": "Heart rate exceeded critical threshold: 135 bpm",
  "vitalData": { /* vital reading data */ },
  "locationData": { /* GPS coordinates */ }
}

# Get alert history
GET /api/care-management/emergency/alert/history/:elderId?days=7

# Acknowledge alert
POST /api/care-management/emergency/alert/:alertId/acknowledge
{
  "userId": "user-123",
  "notes": "Family contacted, situation under control"
}

# Get emergency reports
GET /api/care-management/emergency/report/:elderId?limit=10
```

### 24/7 Monitoring

```bash
# Get monitoring status
GET /api/care-management/emergency/monitoring/status/:elderId

# Start monitoring
POST /api/care-management/emergency/monitoring/start/:elderId

# Stop monitoring
POST /api/care-management/emergency/monitoring/stop/:elderId

# Update monitoring configuration
PUT /api/care-management/emergency/monitoring/config/:elderId
{
  "enabled": true,
  "vitalCheckInterval": 300,
  "inactivityTimeout": 3600,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00",
  "notifyFamily": true,
  "notifyHealthcare": true,
  "notifyEmergency": true,
  "autoEscalateCritical": true,
  "escalationDelay": 300
}
```

### Healthcare Providers

```bash
# Add healthcare provider
POST /api/care-management/emergency/healthcare-provider
{
  "elderId": "elder-123",
  "type": "HOSPITAL",
  "name": "City General Hospital",
  "email": "emergency@cityhospital.com",
  "phone": "(555) 123-4567",
  "address": "123 Medical Center Dr",
  "city": "Boston",
  "state": "MA",
  "zipCode": "02101",
  "priority": 1
}

# Get healthcare providers
GET /api/care-management/emergency/healthcare-provider/:elderId

# Update healthcare provider
PUT /api/care-management/emergency/healthcare-provider/:providerId
{
  "phone": "(555) 999-8888",
  "priority": 2
}
```

### Emergency Services

```bash
# Add emergency service
POST /api/care-management/emergency/emergency-service
{
  "elderId": "elder-123",
  "type": "POLICE",
  "name": "City Police Department",
  "phone": "911",
  "email": "dispatch@citypd.gov",
  "address": "456 Police Plaza",
  "city": "Boston",
  "state": "MA",
  "zipCode": "02101"
}

# Get emergency services
GET /api/care-management/emergency/emergency-service/:elderId
```

### Emergency Contacts

```bash
# Add emergency contact
POST /api/care-management/emergency/emergency-contact
{
  "elderId": "elder-123",
  "name": "Jane Smith",
  "relationship": "Daughter",
  "phone": "(555) 123-4567",
  "email": "jane@example.com",
  "address": "789 Oak Street",
  "city": "Boston",
  "state": "MA",
  "zipCode": "02102",
  "isPrimary": true
}

# Get emergency contacts
GET /api/care-management/emergency/emergency-contact/:elderId

# Update emergency contact
PUT /api/care-management/emergency/emergency-contact/:contactId
{
  "phone": "(555) 999-8888",
  "isPrimary": false
}
```

### Medical History

```bash
# Create or update medical history
POST /api/care-management/emergency/medical-history
{
  "elderId": "elder-123",
  "conditions": ["Hypertension", "Type 2 Diabetes"],
  "allergies": ["Penicillin", "Shellfish"],
  "surgeries": ["Hip Replacement (2020)", "Cataract Surgery (2019)"],
  "chronicDiseases": ["COPD", "Arthritis"],
  "familyHistory": {
    "heartDisease": true,
    "diabetes": true,
    "cancer": false
  },
  "notes": "Patient requires assistance with mobility"
}

# Get medical history
GET /api/care-management/emergency/medical-history/:elderId
```

### Emergency Dispatch

```bash
# Get dispatches
GET /api/care-management/emergency/dispatch/:elderId

# Update dispatch status
PUT /api/care-management/emergency/dispatch/:dispatchId/status
{
  "status": "DISPATCHED",
  "notes": "Unit 42 responding, ETA 8 minutes"
}
```

---

## Frontend Dashboard

**Access:** `http://localhost:3000/emergency-monitoring/:elderId`

### Dashboard Features

**Real-time Status:**
- ✅ Monitoring on/off indicator (with pulse animation)
- ✅ Current health status (normal/warning/critical)
- ✅ Active alerts count
- ✅ Last check timestamp
- ✅ Check interval setting

**Latest Vital Signs:**
- Real-time vital readings with values and units
- Trend indicators (↑ increasing, ↓ decreasing, — stable)
- Timestamp for each reading
- Color-coded status

**Alert Management:**
- Recent alerts (last 5-10)
- Severity badges (CRITICAL, HIGH, MEDIUM, LOW)
- Status badges (ACTIVE, ACKNOWLEDGED, RESOLVED)
- One-click acknowledgment
- Detailed alert messages

**Emergency Contacts:**
- All contacts with primary designation
- Relationship labels
- Phone and email display
- Quick access for manual calling

**Healthcare Providers:**
- Provider type badges (HOSPITAL, CLINIC, etc.)
- Contact information
- Location details
- Priority indicators

**Emergency Services:**
- Service type (POLICE, FIRE, AMBULANCE)
- Direct contact numbers
- Alert when no services configured

**Quick Actions:**
- 🚨 Trigger Manual Alert button
- ⚙️ Configure Monitoring settings
- ▶️ Start/Stop Monitoring toggle

**Configuration Modal:**
- Enable/disable monitoring
- Set check interval
- Set inactivity timeout
- Configure quiet hours
- Toggle notification types
- Auto-escalation settings
- Escalation delay configuration

---

## Email Templates

### 1. Healthcare Provider Email

**For:** Hospitals, Clinics, Doctors

**Includes:**
- Red header with alert severity
- Patient demographics (name, DOB, gender, blood type, address)
- Alert details (type, severity, message, time)
- Current medications table
- Medical conditions and allergies
- Recent vital signs table (last 5 readings)
- Emergency contacts with phone numbers
- Professional formatting for medical staff

### 2. Emergency Services Email

**For:** Police, Fire, Ambulance

**Includes:**
- Critical red header "EMERGENCY DISPATCH REQUIRED"
- Incident details (type, severity, time)
- Location with full address and coordinates
- Patient basic info (name, age, gender, blood type)
- Primary emergency contact
- Emphasis on immediate response needed
- Simplified format for quick reading

### 3. Family Member Email

**For:** Family and Caregivers

**Includes:**
- Personalized greeting
- Clear explanation of alert
- Alert severity with appropriate styling
- What to do next (action steps)
- Patient location
- Indication of healthcare provider notification
- Reassuring tone while conveying urgency
- Link to monitoring dashboard (future)

---

## Database Schema

### New Tables

**`healthcare_providers`**
```sql
- id (UUID)
- elderId (FK to elder_profiles)
- type (HOSPITAL, CLINIC, PRIMARY_CARE, SPECIALIST, URGENT_CARE, EMERGENCY_ROOM)
- name
- email
- phone
- address, city, state, zipCode
- priority (1-5)
- active (boolean)
- notes
- createdAt, updatedAt
```

**`emergency_services`**
```sql
- id (UUID)
- elderId (FK to elder_profiles)
- type (POLICE, FIRE, AMBULANCE, EMERGENCY_DISPATCH)
- name
- email
- phone
- address, city, state, zipCode
- active (boolean)
- notes
- createdAt, updatedAt
```

**`emergency_notifications`**
```sql
- id (UUID)
- alertId (FK to alerts)
- recipientType (HOSPITAL, CLINIC, POLICE, FAMILY, CAREGIVER)
- recipientName
- recipientContact (email or phone)
- method (EMAIL, SMS, PHONE_CALL, PUSH, DISPATCH)
- status (PENDING, SENT, DELIVERED, FAILED, QUEUED)
- metadata (JSON)
- sentAt, deliveredAt
- failedReason
- createdAt
```

**`emergency_reports`**
```sql
- id (UUID)
- elderId (FK to elder_profiles)
- alertType (MEDICAL, FALL, VITAL_ABNORMAL, etc.)
- severity (CRITICAL, HIGH, WARNING, INFO)
- title
- summary
- reportData (JSON) - comprehensive patient data
- generatedAt
```

**`emergency_dispatches`**
```sql
- id (UUID)
- elderId (FK to elder_profiles)
- reportId (FK to emergency_reports)
- serviceType (POLICE, FIRE, AMBULANCE)
- serviceName
- serviceContact
- priority (IMMEDIATE, URGENT, ROUTINE)
- status (PENDING, DISPATCHED, EN_ROUTE, ON_SCENE, COMPLETED, CANCELLED)
- incidentType, incidentSeverity
- location (JSON)
- patientInfo (JSON)
- notes
- dispatchedAt, arrivedAt, completedAt
- createdAt, updatedAt
```

**`medical_history`**
```sql
- id (UUID)
- elderId (FK to elder_profiles) - unique
- conditions (JSON array)
- allergies (JSON array)
- surgeries (JSON array)
- chronicDiseases (JSON array)
- familyHistory (JSON)
- notes
- createdAt, updatedAt
```

**`emergency_contacts`**
```sql
- id (UUID)
- elderId (FK to elder_profiles)
- name
- relationship
- phone
- email
- address, city, state, zipCode
- isPrimary (boolean)
- active (boolean)
- notes
- createdAt, updatedAt
```

**`monitoring_configs`**
```sql
- id (UUID)
- elderId (FK to elder_profiles) - unique
- enabled (boolean)
- vitalThresholds (JSON)
- notifyFamily, notifyHealthcare, notifyEmergency (boolean)
- quietHoursStart, quietHoursEnd (string HH:MM)
- vitalCheckInterval (int seconds)
- inactivityTimeout (int seconds)
- autoEscalateCritical (boolean)
- escalationDelay (int seconds)
- createdAt, updatedAt
```

### Updated Tables

**`elder_profiles`** - Added fields:
```sql
- firstName
- lastName
- bloodType
- city
- state
- zipCode
```

**`alerts`** - Added relation:
```sql
- emergencyNotifications (relation to emergency_notifications)
```

---

## Setup Instructions

### 1. Database Migration

```bash
cd backend
npx prisma migrate dev --name add_emergency_monitoring
npx prisma generate
```

### 2. Environment Configuration

**Backend (.env):**
```bash
# SendGrid for emails
SENDGRID_API_KEY=SG.your_real_key_here
EMAIL_FROM=noreply@eldercare.com

# Twilio for SMS (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# Monitoring settings (optional overrides)
MONITORING_CHECK_INTERVAL=300
MONITORING_ESCALATION_DELAY=300
```

### 3. Module Registration

**In `backend/src/care-management/care-management.module.ts`:**

```typescript
import { EmergencyAlertService } from './services/emergency-alert.service';
import { ContinuousMonitoringService } from './services/continuous-monitoring.service';
import { EmergencyMonitoringController } from './controllers/emergency-monitoring.controller';

@Module({
  controllers: [
    HealthMonitoringController,
    EmergencyMonitoringController,
    // ... other controllers
  ],
  providers: [
    HealthMonitoringService,
    EmergencyAlertService,
    ContinuousMonitoringService,
    // ... other services
  ],
  exports: [
    HealthMonitoringService,
    EmergencyAlertService,
    ContinuousMonitoringService,
  ],
})
export class CareManagementModule {}
```

### 4. Test SendGrid Configuration

```bash
# Test email sending
curl -X POST http://localhost:3001/api/care-management/emergency/alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "elderId": "test-elder-id",
    "severity": "MEDIUM",
    "type": "MEDICAL",
    "title": "Test Alert",
    "message": "This is a test of the emergency alert system"
  }'
```

---

## Usage Examples

### Example 1: Basic Monitoring Setup

```javascript
// 1. Start monitoring for an elder
await api.post(`/care-management/emergency/monitoring/start/elder-123`);

// 2. Add healthcare provider
await api.post('/care-management/emergency/healthcare-provider', {
  elderId: 'elder-123',
  type: 'HOSPITAL',
  name: 'City Hospital',
  email: 'emergency@hospital.com',
  phone: '(555) 123-4567',
  priority: 1
});

// 3. Add emergency contact
await api.post('/care-management/emergency/emergency-contact', {
  elderId: 'elder-123',
  name: 'John Doe',
  relationship: 'Son',
  phone: '(555) 987-6543',
  email: 'john@example.com',
  isPrimary: true
});

// 4. Configure monitoring
await api.put('/care-management/emergency/monitoring/config/elder-123', {
  enabled: true,
  vitalCheckInterval: 300,
  notifyFamily: true,
  notifyHealthcare: true,
  autoEscalateCritical: true
});
```

### Example 2: Manual Alert Trigger

```javascript
// Trigger a panic button alert
await api.post('/care-management/emergency/alert', {
  elderId: 'elder-123',
  severity: 'CRITICAL',
  type: 'PANIC_BUTTON',
  title: 'Panic Button Activated',
  message: 'Patient activated panic button. Immediate assistance required.',
  locationData: {
    latitude: 42.3601,
    longitude: -71.0589,
    room: 'Bedroom'
  }
});
```

### Example 3: Fall Detection Integration

```javascript
// When smart home detects a fall
await api.post('/care-management/emergency/alert', {
  elderId: 'elder-123',
  severity: 'CRITICAL',
  type: 'FALL',
  title: 'Fall Detected',
  message: 'Fall detected in bathroom. Patient may be unresponsive.',
  locationData: {
    zone: 'Bathroom',
    device: 'Motion Sensor 3',
    timestamp: new Date()
  },
  metadata: {
    deviceId: 'sensor-123',
    sensorType: 'FALL_DETECTOR',
    impactForce: 'HIGH'
  }
});
```

---

## Monitoring Best Practices

### 1. Initial Setup

✅ **Do:**
- Register at least one primary emergency contact
- Add local hospital and emergency services
- Configure quiet hours based on patient's sleep schedule
- Test alerts with family members before full deployment
- Set appropriate check intervals (5-15 minutes typical)

❌ **Don't:**
- Leave emergency services unconfigured
- Set check intervals too short (<60 seconds)
- Skip quiet hours configuration
- Ignore escalation settings

### 2. Alert Management

✅ **Do:**
- Acknowledge alerts promptly
- Add notes when acknowledging
- Follow up on critical alerts
- Review alert history regularly
- Adjust thresholds if getting too many false positives

❌ **Don't:**
- Ignore CRITICAL alerts
- Disable monitoring without notification
- Set overly aggressive thresholds
- Forget to update emergency contacts

### 3. Maintenance

✅ **Regular Tasks:**
- Weekly: Review alert patterns
- Monthly: Verify emergency contact information
- Monthly: Test alert system
- Quarterly: Review and adjust monitoring configuration
- As needed: Update medical history and medications

---

## Troubleshooting

### Emails Not Sending

**Check:**
1. SENDGRID_API_KEY is set correctly in .env
2. Key is not the test placeholder
3. Check SendGrid dashboard for bounces/blocks
4. Verify recipient email is valid
5. Check backend logs for errors

### Monitoring Not Running

**Check:**
1. Monitoring is enabled in config
2. ContinuousMonitoringService started (check logs)
3. No errors in service initialization
4. Database connection is working
5. Elder has active status

### Alerts Not Escalating

**Check:**
1. autoEscalateCritical is true
2. escalationDelay is set appropriately
3. Alerts are actually CRITICAL severity
4. System time is correct
5. Continuous monitoring service is running

### No Vital Readings

**Check:**
1. Devices are connected and recording
2. API endpoints are being called
3. Database has vitals table
4. elderId is correct
5. Check device logs for errors

---

## Future Enhancements

**Planned Features:**
- 📱 SMS notifications via Twilio
- 📞 Automated phone calls for critical alerts
- 🗺️ GPS tracking integration
- 📊 Predictive analytics for health deterioration
- 🤖 AI-powered alert prioritization
- 📹 Video call integration for remote assessment
- 🏥 Direct EHR integration
- 📈 Advanced trend analysis and prediction
- 🔔 Mobile app push notifications
- 🌐 Multi-language support for international deployment

---

## Support

**Documentation:**
- API Documentation: `http://localhost:3001/api/docs`
- Database Schema: `backend/prisma/schema.prisma`
- Service Layer: `backend/src/care-management/services/`

**Logs:**
```bash
# View monitoring service logs
tail -f backend/logs/combined.log | grep "ContinuousMonitoring"

# View emergency alert logs
tail -f backend/logs/combined.log | grep "EmergencyAlert"
```

**Testing:**
```bash
# Test monitoring endpoints
cd backend
npm test -- emergency-monitoring

# Test alert routing
npm test -- emergency-alert
```

---

**Last Updated:** May 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
