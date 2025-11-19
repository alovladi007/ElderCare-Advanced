# Smart Home & Extreme Safety Module

## Overview

The Smart Home module transforms the ElderCare platform into an intelligent safety system for elders living alone or with minimal supervision. It provides real-time monitoring, emergency detection, and automated response protocols to ensure elder safety.

## Features

### Core Capabilities

- **IoT Device Management**: Support for sensors (motion, fall, smoke, gas, etc.) and actuators (lights, locks, speakers)
- **Emergency Detection**: Automatic detection of falls, fires, gas leaks, and panic button events
- **Stepwise Emergency Response**: Configurable escalation protocols with TTS announcements, family alerts, and emergency services
- **Automation Rules Engine**: Data-driven automation based on sensor events, time schedules, and inactivity
- **Inactivity Monitoring**: Cron-based detection of unusual inactivity patterns
- **Event Processing Pipeline**: Asynchronous processing of sensor events with real-time triggers
- **Testing Simulator**: Built-in endpoints to simulate emergency scenarios

### Supported Sensor Types

- `MOTION` - Motion detection
- `CONTACT_DOOR` / `CONTACT_WINDOW` - Door/window open/close
- `SMOKE` - Smoke and fire detection
- `CO2` - Carbon dioxide levels
- `GAS_LEAK` - Gas leak detection
- `WATER_LEAK` - Water leak detection
- `FALL_DETECTOR` - Wearable fall detection
- `PRESENCE_BED` / `PRESENCE_CHAIR` - Presence sensors
- `TEMPERATURE` / `HUMIDITY` - Environmental monitoring
- `NOISE_LEVEL` - Sound level monitoring
- `POWER_USAGE` - Power consumption monitoring
- `BUTTON_PANIC` - Manual panic button

### Supported Actuator Types

- `LIGHT` - Smart lights
- `LOCK_DOOR` - Smart door locks
- `SPEAKER_TTS` - Text-to-speech speakers
- `SIREN` - Emergency sirens
- `THERMOSTAT` - Temperature control
- `SWITCH` - Generic on/off switches
- `VALVE_WATER` / `VALVE_GAS` - Safety valves
- `CAMERA` - Security cameras

## Architecture

### Backend Structure

```
platform/backend/src/smart-home/
├── smart-home.module.ts                    # NestJS module definition
├── controllers/
│   ├── home.controller.ts                  # Home and zone management
│   ├── device.controller.ts                # Device CRUD operations
│   ├── iot-gateway.controller.ts           # IoT event ingestion
│   ├── automation.controller.ts            # Automation rules
│   ├── emergency.controller.ts             # Emergency scenarios
│   └── simulator.controller.ts             # Testing simulator
├── services/
│   ├── home.service.ts                     # Home/zone business logic
│   ├── device.service.ts                   # Device management
│   ├── iot-gateway.service.ts              # IoT token auth & event ingestion
│   ├── event-processor.service.ts          # Event processing pipeline
│   ├── automation-engine.service.ts        # Rules evaluation engine
│   ├── emergency-scenario.service.ts       # Emergency protocol execution
│   ├── inactivity-monitor.service.ts       # Cron-based inactivity detection
│   └── simulator.service.ts                # Test event generation
└── dto/
    ├── create-home.dto.ts
    ├── device.dto.ts
    ├── iot-event.dto.ts
    └── automation.dto.ts
```

### Frontend Structure

```
platform/frontend/app/dashboard/
├── smart-home/
│   ├── page.tsx                            # Smart Home overview
│   ├── devices/page.tsx                    # Device management
│   ├── emergencies/page.tsx                # Emergency scenarios
│   └── automations/page.tsx                # Automation rules (TODO)
└── elder/
    └── safe-home/page.tsx                  # Elder "Safe Home" screen with HELP button
```

### Database Schema

The Smart Home module adds 19+ new models to the Prisma schema:

- `Home` - Elder's home with address and timezone
- `HomeZone` - Rooms/areas within the home
- `SmartDeviceType` - Device type catalog
- `SmartDevice` - Physical device instances
- `Sensor` - Sensor components on devices
- `Actuator` - Actuator components on devices
- `SensorEvent` - Event records from sensors
- `ActuatorCommand` - Commands sent to actuators
- `AutomationRule` - Automation rule definitions
- `EmergencyScenario` - Emergency response protocols
- `EmergencyScenarioInstance` - Active emergency instances
- `InactivityProfile` - Inactivity monitoring configuration
- `HelpTrigger` - Elder help requests
- `IotToken` - IoT device authentication tokens

## API Endpoints

### Home Management
- `POST /api/v1/smart-home/homes` - Create home
- `GET /api/v1/smart-home/homes/:id` - Get home details
- `POST /api/v1/smart-home/homes/:id/zones` - Create zone

### Device Management
- `POST /api/v1/smart-home/devices` - Create device
- `GET /api/v1/smart-home/devices/:id` - Get device details
- `POST /api/v1/smart-home/devices/:id/sensors` - Create sensor
- `POST /api/v1/smart-home/devices/:id/actuators` - Create actuator

### IoT Gateway
- `POST /api/v1/smart-home/iot/homes/:homeId/events` - Ingest sensor event
- `GET /api/v1/smart-home/iot/homes/:homeId/commands/pending` - Poll pending commands
- `POST /api/v1/smart-home/iot/homes/:homeId/commands/:commandId/ack` - Acknowledge command

### Automation
- `POST /api/v1/smart-home/automation/rules` - Create automation rule
- `GET /api/v1/smart-home/automation/rules/:homeId` - List rules
- `PATCH /api/v1/smart-home/automation/rules/:id` - Update rule

### Emergency Scenarios
- `POST /api/v1/smart-home/emergency/scenarios` - Create scenario
- `GET /api/v1/smart-home/emergency/scenarios/:homeId` - List scenarios
- `POST /api/v1/smart-home/emergency/scenarios/:id/cancel` - Cancel active scenario

### Simulator (Testing)
- `POST /api/v1/smart-home/simulator/fall/:homeId` - Simulate fall event
- `POST /api/v1/smart-home/simulator/smoke/:homeId` - Simulate smoke event
- `POST /api/v1/smart-home/simulator/gas/:homeId` - Simulate gas leak
- `POST /api/v1/smart-home/simulator/motion/:homeId` - Simulate motion pattern
- `POST /api/v1/smart-home/simulator/door/:homeId` - Simulate door opening
- `POST /api/v1/smart-home/simulator/panic/:homeId` - Simulate panic button

## Setup Instructions

### 1. Database Migration

After starting PostgreSQL, run the migration:

```bash
cd platform/backend
npx prisma migrate dev --name add-smart-home-module
```

### 2. Seed Demo Data

Seed the database with Smart Home demo data:

```bash
cd platform/backend
npm run seed
```

This creates:
- Margaret's Home with 4 zones (Bedroom, Bathroom, Kitchen, Living Room)
- 7 smart devices (motion sensors, fall detector, smoke detector, lights, speaker, panic button)
- 3 emergency scenarios (Fall Detection, Smoke/Fire, Panic Button)
- 2 automation rules (Nighttime bathroom light, Inactivity alert)
- IoT authentication token for testing

### 3. Start Backend

```bash
cd platform/backend
npm run start:dev
```

Backend runs on `http://localhost:4000`

### 4. Start Frontend

```bash
cd platform/frontend
npm run dev
```

Frontend runs on `http://localhost:8080`

## Testing the Smart Home Module

### Using the Simulator

1. **Get Home ID**: After seeding, note the home ID from the database or API
2. **Simulate a Fall Event**:

```bash
curl -X POST http://localhost:4000/api/v1/smart-home/simulator/fall/{homeId} \
  -H "Authorization: Bearer {your-jwt-token}"
```

3. **Expected Behavior**:
   - Fall sensor event is created
   - Event processor detects critical event
   - Emergency scenario "Fall Detected - No Response" is triggered
   - Step 1 (0s delay): TTS announcement created
   - Step 2 (30s delay): Family alert created
   - Step 3 (30s delay): Lights turn on
   - Step 4 (120s delay): Emergency alert escalated

4. **Check Alerts**:

```bash
curl http://localhost:4000/api/v1/alerts \
  -H "Authorization: Bearer {your-jwt-token}"
```

### Using IoT Token Authentication

1. **Get IoT Token**: After seeding, the IoT token is printed to console
2. **Send Event with Token**:

```bash
curl -X POST http://localhost:4000/api/v1/smart-home/iot/homes/{homeId}/events \
  -H "x-iot-token: {your-iot-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIdentifier": "FALL-DETECTOR-001",
    "eventType": "ALERT",
    "valueText": "DETECTED",
    "severity": "CRITICAL",
    "occurredAt": "2024-01-20T12:00:00Z"
  }'
```

## Emergency Scenario Examples

### Fall Detection with No Response

```json
{
  "name": "Fall Detected - No Response",
  "triggerSignatureJson": {
    "sensorType": "FALL_DETECTOR",
    "eventType": "ALERT"
  },
  "stepwiseActionsJson": [
    {
      "type": "ANNOUNCE",
      "delaySec": 0,
      "message": "Fall detected. Are you okay? Say HELP if you need assistance."
    },
    {
      "type": "ALERT_FAMILY",
      "delaySec": 30,
      "contacts": ["family"],
      "message": "Fall detected for Margaret. No response yet."
    },
    {
      "type": "TURN_ON_LIGHTS",
      "delaySec": 30,
      "zones": ["all"]
    },
    {
      "type": "ALERT_EMERGENCY",
      "delaySec": 120,
      "message": "Fall detected. No response after 2 minutes."
    }
  ]
}
```

### Smoke/Fire Detection

```json
{
  "name": "Smoke/Fire Detected",
  "triggerSignatureJson": {
    "sensorType": "SMOKE",
    "severity": "CRITICAL"
  },
  "stepwiseActionsJson": [
    {
      "type": "ANNOUNCE",
      "delaySec": 0,
      "message": "SMOKE DETECTED! Exit the home immediately!"
    },
    {
      "type": "ALERT_FAMILY",
      "delaySec": 0,
      "contacts": ["family"],
      "message": "EMERGENCY: Smoke detected at Margaret's home!"
    },
    {
      "type": "TURN_ON_LIGHTS",
      "delaySec": 0,
      "zones": ["all"]
    },
    {
      "type": "ALERT_EMERGENCY",
      "delaySec": 15,
      "message": "Fire emergency - calling 911"
    }
  ]
}
```

## Automation Rule Examples

### Nighttime Bathroom Safety Light

```json
{
  "name": "Nighttime Bathroom Light",
  "triggerType": "SENSOR_EVENT",
  "triggerConfigJson": {
    "sensorType": "MOTION",
    "zoneId": "{bathroom-zone-id}"
  },
  "conditionConfigJson": {
    "timeRange": { "start": "22:00", "end": "07:00" }
  },
  "actionsConfigJson": {
    "actions": [
      {
        "type": "ACTUATOR_COMMAND",
        "actuatorType": "LIGHT",
        "zoneId": "{bedroom-zone-id}",
        "command": "ON",
        "params": { "brightness": 50 }
      }
    ]
  }
}
```

### Extended Inactivity Alert

```json
{
  "name": "Extended Inactivity Alert",
  "triggerType": "INACTIVITY",
  "triggerConfigJson": {
    "maxNoMotionMinutes": 90,
    "wakeHoursOnly": true
  },
  "actionsConfigJson": {
    "actions": [
      {
        "type": "CREATE_ALERT",
        "alertType": "SMART_HOME_INACTIVITY",
        "severity": "WARNING",
        "message": "No motion detected at Margaret's home for 90 minutes",
        "notifyContacts": ["family"]
      }
    ]
  }
}
```

## Frontend Pages

### Family/Admin Dashboards

- **Smart Home Overview** (`/dashboard/smart-home`): Stats, recent events, quick actions
- **Devices & Zones** (`/dashboard/smart-home/devices`): Device management, zone configuration
- **Emergency Scenarios** (`/dashboard/smart-home/emergencies`): Configure emergency protocols
- **Automation Rules** (`/dashboard/smart-home/automations`): Automation configuration (TODO)

### Elder Dashboard

- **Safe Home** (`/dashboard/elder/safe-home`): Large HELP button, I'm OK button, home status

## Security

### IoT Token Authentication

- IoT devices authenticate using SHA-256 hashed tokens
- Tokens are created via `POST /api/v1/smart-home/iot/homes/:homeId/tokens`
- Tokens are passed via `x-iot-token` header
- Each token is scoped to a specific home

### Role-Based Access

- **FAMILY**: Full access to Smart Home features for associated elder
- **ADMIN**: Full access to all Smart Home features
- **CLINICIAN**: Read-only access to Smart Home data
- **ELDER**: Access to Safe Home screen only
- **CAREGIVER**: Read-only access (configurable)

## Event Processing Flow

1. **IoT Device** sends event via `POST /iot/homes/:homeId/events`
2. **IoT Gateway Service** validates token, creates `SensorEvent` record
3. **Event Processor Service** processes event asynchronously:
   - Checks if event is critical (fall, smoke, gas, panic)
   - Triggers emergency scenarios if conditions match
   - Evaluates automation rules
   - Creates alerts as needed
4. **Emergency Scenario Service** executes stepwise actions with timers
5. **Automation Engine Service** executes rule actions (actuator commands, alerts, TTS)

## Cron Jobs

### Inactivity Monitor

Runs every 5 minutes (`@Cron(CronExpression.EVERY_5_MINUTES)`):

- Checks all `InactivityProfile` records
- Verifies current time is within wake hours
- Queries for recent motion events
- Creates alerts if no motion detected within threshold

## Troubleshooting

### No events being processed

Check:
1. Device status is `ONLINE` in database
2. IoT token is valid and matches home
3. Backend logs show event ingestion
4. Event processor service is running

### Emergency scenario not triggering

Check:
1. Scenario `isEnabled` is `true`
2. `triggerSignatureJson` matches sensor event
3. Scenario is not already active for this home
4. Backend logs for emergency scenario service

### Automation rule not executing

Check:
1. Rule `isEnabled` is `true`
2. Trigger conditions match (sensor type, zone, time range)
3. Actuator devices exist and are online
4. Backend logs for automation engine service

## Future Enhancements

- [ ] Voice command integration ("Alexa, I need help")
- [ ] Video verification for critical events
- [ ] Machine learning for anomaly detection
- [ ] Integration with wearable health devices
- [ ] Geofencing for wandering detection
- [ ] Multi-home support for families
- [ ] Mobile app for family notifications
- [ ] Offline fallback behavior (conceptual - requires edge computing)

## Demo Credentials

After seeding:

- **Admin**: admin@demo.com / Demo123!
- **Elder**: elder@demo.com / Demo123!
- **Family**: family@demo.com / Demo123!
- **Caregiver**: caregiver@demo.com / Demo123!
- **Clinician**: clinician@demo.com / Demo123!

## Support

For issues or questions, please check:
- Backend logs: `platform/backend/logs/`
- Frontend console: Browser DevTools
- Database: Connect via `npx prisma studio`
