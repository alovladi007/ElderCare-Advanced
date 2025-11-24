# ElderCare Advanced - Smart Home & Extreme Safety Module

A comprehensive smart home monitoring and emergency response system designed specifically for elder care, featuring fall detection, smoke/fire alerts, inactivity monitoring, automation rules, and stepwise emergency escalation protocols.

## 🎯 Features

### Smart Home Monitoring
- **Multi-Zone Tracking**: Monitor different rooms (bedroom, bathroom, kitchen, etc.)
- **Device Management**: Support for sensors (motion, door/window, smoke, gas, fall detection) and actuators (lights, locks, speakers, sirens)
- **Real-time Status**: Live device status, battery levels, and connectivity monitoring
- **Event Timeline**: Complete history of sensor events and system actions

### Emergency Detection & Response
- **Fall Detection**: Automatic detection with stepwise escalation (announcement → family alert → emergency services)
- **Smoke/Fire Detection**: Immediate siren activation, evacuation announcements, and emergency contact
- **Gas Leak Detection**: Critical alerts with safety protocols
- **Inactivity Monitoring**: Detects prolonged periods without movement during wake hours
- **Night Wandering Detection**: Alerts when doors open during nighttime hours

### Automation Rules Engine
- **Event-Based Triggers**: Respond to sensor events (motion, door open/close, temperature, etc.)
- **Scheduled Actions**: Time-based automation (e.g., lock doors at 10 PM)
- **Conditional Logic**: Time ranges, day of week, zone-specific conditions
- **Actions**: Control lights, locks, create alerts, TTS announcements

### Emergency Scenarios
- **Stepwise Escalation**: Configurable multi-step emergency protocols
- **Cancel Tokens**: Elders can cancel false alarms with numeric codes
- **Family Notifications**: Progressive escalation to family then emergency services
- **Smart Actuation**: Automatic light activation, door unlocking for responders

### Elder-Friendly Interface
- **Big HELP Button**: Large, easy-to-use emergency button
- **Simple Status Display**: Clear visual indicators of home status
- **Voice Integration**: TTS announcements (simulated)
- **Emergency Contacts**: Quick access to family and emergency services

## 🏗️ Architecture

### Backend (NestJS + PostgreSQL + Prisma)
```
/backend
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── common/
│   │   └── prisma/                # Database client
│   └── smart-home/
│       ├── services/
│       │   ├── home.service.ts              # Home & zone management
│       │   ├── device.service.ts            # Device, sensor, actuator CRUD
│       │   ├── event-processor.service.ts   # Sensor event processing
│       │   ├── automation-engine.service.ts # Rules evaluation
│       │   ├── emergency-scenario.service.ts# Emergency protocols
│       │   └── simulator.service.ts         # Testing utilities
│       └── controllers/
│           ├── home.controller.ts
│           ├── device.controller.ts
│           ├── iot.controller.ts            # IoT gateway endpoints
│           ├── automation.controller.ts
│           ├── emergency.controller.ts
│           └── simulator.controller.ts
├── prisma/
│   ├── schema.prisma              # Complete database schema
│   └── seed.ts                    # Demo data seeding
└── package.json
```

### Frontend (Next.js 14 + React + Tailwind CSS)
```
/frontend
├── app/
│   ├── page.tsx                   # Landing page with portal links
│   ├── elders/[elderId]/home/     # Smart Home Dashboard (family/caregiver)
│   ├── elder/help/                # Elder Help Screen with big HELP button
│   └── admin/simulator/           # Simulation & testing interface
├── lib/
│   └── api.ts                     # API client
└── components/
    └── smart-home/                # Reusable UI components
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd ElderCare-Advanced
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and update DATABASE_URL with your PostgreSQL credentials

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed demo data
npm run seed
# ⚠️ IMPORTANT: Copy the Home ID from the seed output!

# Start backend server
npm run dev
# Backend will run on http://localhost:3001
# API docs available at http://localhost:3001/api/docs
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL should be http://localhost:3001/api

# Start frontend server
npm run dev
# Frontend will run on http://localhost:3000
```

### Demo Credentials (from seed)
```
Admin:     admin@eldercare.com / admin123
Family:    family@eldercare.com / family123
Caregiver: caregiver@eldercare.com / caregiver123
Elder:     elder@eldercare.com / elder123
```

## 📖 Usage Guide

### 1. Smart Home Dashboard (Family/Caregiver View)
**URL**: `http://localhost:3000/elders/{elderId}/home`

**Features**:
- Device status summary (total, online, offline, low battery)
- Room-by-room zone overview
- Recent alerts (24 hours)
- Critical sensor events timeline
- Quick access to automation rules and emergency scenarios

**Navigation**:
- Click "Automation Rules" to configure smart behaviors
- Click "Emergency Scenarios" to view/edit emergency protocols
- Click "Simulator" to test different scenarios

### 2. Elder Help Screen
**URL**: `http://localhost:3000/elder/help`

**Features**:
- Large HELP button for emergency assistance
- Home status indicators
- Emergency contact list
- Simple, elder-friendly design with large fonts

**Flow**:
1. Elder presses HELP button
2. System creates help trigger and alert
3. Family receives notification (simulated)
4. Elder can press "I'M OKAY" to cancel

### 3. Simulator & Testing
**URL**: `http://localhost:3000/admin/simulator?homeId={homeId}`

**Available Simulations**:
- **Fall Detection**: Tests fall + no response scenario
- **Smoke Detection**: Tests fire emergency protocol
- **Gas Leak**: Tests gas leak alert
- **Water Leak**: Tests water leak detection
- **Motion Pattern**: Simulates normal daily activity

**How to Use**:
1. Copy the Home ID from the seed script output
2. Paste it into the "Home ID" field
3. Click any simulation button
4. Check the Smart Home Dashboard to see results
5. Monitor backend console for detailed logs

## 🧪 Testing Emergency Scenarios

### Test Case 1: Fall Detection
```bash
# Using simulator UI or API call:
curl -X POST http://localhost:3001/api/sim/smart-home/fall/{homeId}
```

**Expected Behavior**:
1. Fall sensor event created with CRITICAL severity
2. Emergency scenario "Fall + No Response" triggered
3. **Step 0 (immediate)**: TTS announcement: "We detected a possible fall..."
4. **Step 0 (immediate)**: All lights turned on
5. **Step 60s**: Alert created + family notified (simulated)
6. **Step 180s**: Emergency services contacted (simulated, logged)

**How to Cancel**:
- Use the cancel token from the alert message
- Call `POST /api/emergency/cancel/{instanceId}` with cancel token

### Test Case 2: Smoke Detection
```bash
curl -X POST http://localhost:3001/api/sim/smart-home/smoke/{homeId}
```

**Expected Behavior**:
1. Smoke sensor event created with CRITICAL severity
2. Emergency scenario "Smoke/Fire Detection" triggered
3. **Step 0**: Siren activated (120s duration)
4. **Step 0**: TTS evacuation announcement
5. **Step 0**: All lights turned on
6. **Step 30s**: Family notified
7. **Step 60s**: Emergency services contacted
8. **Step 90s**: Doors unlocked for responders

### Test Case 3: Inactivity Detection
```bash
# Requires periodic job or manual trigger
# Check InactivityProfile configuration in seed data
```

**Expected Behavior**:
1. System checks for motion events in last 90 minutes (configurable)
2. If no motion during wake hours → creates WARNING alert
3. Alert: "Inactivity Detected - No movement for 90 minutes"

## 🔧 Configuration

### Creating Custom Automation Rules

**Example**: Turn on lights when motion detected at night
```json
{
  "homeId": "...",
  "name": "Night Motion Lighting",
  "triggerType": "SENSOR_EVENT",
  "triggerConfigJson": {
    "sensorType": "MOTION",
    "eventType": "STATE_CHANGE",
    "valueEquals": "MOTION_DETECTED"
  },
  "conditionConfigJson": {
    "timeRange": {
      "start": "22:00",
      "end": "06:00"
    }
  },
  "actionsConfigJson": [
    {
      "type": "TURN_ON_LIGHTS",
      "brightness": 50
    }
  ],
  "severity": "INFO"
}
```

**POST to**: `/api/automation/rules`

### Creating Custom Emergency Scenarios

**Example**: Custom night wandering scenario
```json
{
  "homeId": "...",
  "name": "Night Wandering Protocol",
  "triggerSignatureJson": {
    "type": "NIGHT_WANDERING",
    "conditions": ["CONTACT_DOOR"]
  },
  "stepwiseActionsJson": [
    {
      "delaySec": 0,
      "action": "TURN_ON_LIGHTS",
      "params": {}
    },
    {
      "delaySec": 0,
      "action": "ANNOUNCE",
      "params": {
        "message": "It's nighttime. Perhaps it's time to go back to bed?",
        "volume": 60
      }
    },
    {
      "delaySec": 120,
      "action": "CALL_FAMILY_IF_NO_CANCEL",
      "params": {}
    }
  ]
}
```

**POST to**: `/api/emergency/scenarios`

## 📊 Database Schema Highlights

### Key Entities
- **Home**: Elder's residence with zones
- **HomeZone**: Rooms (bedroom, bathroom, kitchen, etc.)
- **Device**: Physical IoT devices
- **Sensor**: Motion, door/window, smoke, fall detector, etc.
- **Actuator**: Lights, locks, speakers, sirens
- **SensorEvent**: All sensor readings and alerts
- **ActuatorCommand**: Commands sent to devices
- **AutomationRule**: User-defined automation logic
- **EmergencyScenario**: Pre-configured emergency protocols
- **EmergencyScenarioInstance**: Active emergency situations
- **InactivityProfile**: Inactivity detection configuration
- **HelpTrigger**: Elder help button presses

## 🔌 API Endpoints

### Smart Home
- `GET /api/homes/elder/:elderId` - Get home by elder
- `GET /api/homes/:id/status` - Get home status summary
- `POST /api/homes/:homeId/zones` - Create zone
- `GET /api/devices/home/:homeId` - Get all devices

### IoT Gateway
- `POST /api/iot/events` - Ingest sensor event (requires X-IoT-Token)
- `POST /api/iot/actuators/:id/ack` - Acknowledge command

### Automation
- `GET /api/automation/rules/home/:homeId` - Get rules
- `POST /api/automation/rules` - Create rule
- `GET /api/automation/events/home/:homeId` - Get sensor events

### Emergency
- `GET /api/emergency/scenarios/home/:homeId` - Get scenarios
- `GET /api/emergency/active/home/:homeId` - Get active emergencies
- `POST /api/emergency/cancel/:instanceId` - Cancel scenario
- `POST /api/emergency/help-trigger` - Create help trigger

### Simulator
- `POST /api/sim/smart-home/fall/:homeId` - Simulate fall
- `POST /api/sim/smart-home/smoke/:homeId` - Simulate smoke
- `POST /api/sim/smart-home/gas-leak/:homeId` - Simulate gas leak
- `POST /api/sim/smart-home/motion-pattern/:homeId` - Simulate activity

**Swagger Docs**: `http://localhost:3001/api/docs`

## 🎭 Extreme Situation Protocols

### Fall + No Response
1. Immediate TTS announcement
2. Turn on all lights
3. Wait 60 seconds for acknowledgment
4. If no response → notify family
5. Wait additional 120 seconds
6. If still no response → contact emergency services
7. Log all actions for liability/documentation

### Smoke/Fire
1. Immediate siren activation
2. TTS evacuation instruction
3. Turn on all lights (visibility)
4. After 30s → notify family (fire emergency)
5. After 60s → contact emergency services
6. After 90s → unlock doors for first responders

### Gas Leak
1. Immediate critical alert
2. TTS warning announcement
3. Notify family immediately
4. Contact emergency services
5. Recommend evacuation

### Inactivity (Wake Hours)
1. Check for motion events in configured period (default: 90 min)
2. If no motion → create WARNING alert
3. Alert family members
4. Log event for pattern analysis

## 🔒 Security & Privacy

- IoT gateway requires authentication tokens
- All alerts logged with timestamps
- Emergency scenario instances tracked for accountability
- Cancel tokens prevent accidental escalations
- Device status includes last-seen tracking
- RBAC support (Admin, Clinician, Caregiver, Family, Elder roles)

## 🚧 Offline & Failsafe Behavior

**Design Principles** (for production implementation):
- Local gateway maintains minimal rule execution without cloud
- Critical device status cached locally
- Offline event buffering for later sync
- Battery backup for critical sensors
- Cellular backup for emergency notifications

**Current Implementation**:
- Device status tracking (ONLINE/OFFLINE/UNKNOWN)
- Heartbeat monitoring via lastSeenAt timestamps
- Graceful degradation logs in console

## 📝 Development Notes

### Adding New Sensor Types
1. Update `SensorType` enum in `schema.prisma`
2. Add handling in `event-processor.service.ts`
3. Create simulation in `simulator.service.ts`
4. Update frontend sensor type mappings

### Adding New Actuator Types
1. Update `ActuatorType` enum in `schema.prisma`
2. Add action handler in `automation-engine.service.ts`
3. Implement in `device.service.ts`
4. Update frontend UI components

### Adding New Emergency Scenarios
1. Create scenario via API or seed script
2. Define trigger signature (sensor types, conditions)
3. Configure stepwise actions with delays
4. Test with simulator
5. Document expected behavior

## 🧪 Testing

### Unit Tests (Backend)
```bash
cd backend
npm run test
```

**Key Test Files**:
- `automation-engine.service.spec.ts` - Rule evaluation tests
- `emergency-scenario.service.spec.ts` - Emergency logic tests
- `event-processor.service.spec.ts` - Event handling tests

### Manual Testing Checklist
- [ ] Fall detection triggers emergency scenario
- [ ] Smoke detection activates siren and TTS
- [ ] Automation rules trigger on sensor events
- [ ] Elder HELP button creates alert
- [ ] Emergency scenario can be cancelled
- [ ] Inactivity detection works during wake hours
- [ ] Night wandering alerts on door open
- [ ] Device status updates on heartbeat
- [ ] Low battery warnings appear
- [ ] All lights turn on during emergency

## 🤝 Contributing

When extending this system:
1. Follow existing patterns (service → controller → API)
2. Add comprehensive logging for debugging
3. Include error handling for all external calls
4. Update API documentation (Swagger decorators)
5. Add seed data for new entities
6. Create simulator endpoints for testing

## 📄 License

MIT License - See LICENSE file

## 🆘 Support

For issues, questions, or contributions:
- Check API docs: http://localhost:3001/api/docs
- Review backend logs for detailed error messages
- Use simulator to test scenarios before production
- Seed data provides complete working example

---

**Built with**:  Node.js • NestJS • PostgreSQL • Prisma • Next.js • React • Tailwind CSS • TypeScript
