-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLINICIAN', 'CAREGIVER', 'FAMILY', 'ELDER');

-- CreateEnum
CREATE TYPE "VitalType" AS ENUM ('BLOOD_PRESSURE', 'HEART_RATE', 'TEMPERATURE', 'GLUCOSE', 'SPO2', 'WEIGHT', 'RESPIRATORY_RATE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('VITAL_ABNORMAL', 'MEDICATION_MISSED', 'APPOINTMENT_REMINDER', 'FALL_DETECTED', 'SMART_HOME_SMOKE', 'SMART_HOME_GAS', 'SMART_HOME_WATER_LEAK', 'SMART_HOME_FALL_UNRESPONSIVE', 'SMART_HOME_DOOR_OPEN_NIGHT', 'SMART_HOME_INACTIVITY', 'SMART_HOME_TEMPERATURE_EXTREME', 'SMART_HOME_CUSTOM');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DeviceCategory" AS ENUM ('SENSOR', 'ACTUATOR', 'HYBRID');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'UNKNOWN', 'MAINTENANCE', 'ERROR');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('MOTION', 'CONTACT_DOOR', 'CONTACT_WINDOW', 'SMOKE', 'CO2', 'GAS_LEAK', 'WATER_LEAK', 'FALL_DETECTOR', 'PRESENCE_BED', 'PRESENCE_CHAIR', 'TEMPERATURE', 'HUMIDITY', 'NOISE_LEVEL', 'POWER_USAGE', 'BUTTON_PANIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActuatorType" AS ENUM ('LIGHT', 'DOOR_LOCK', 'THERMOSTAT', 'SIREN', 'SPEAKER_TTS', 'APPLIANCE_POWER', 'CURTAIN_BLINDS', 'NOTIFICATION_BRIDGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SensorEventType" AS ENUM ('VALUE_READING', 'STATE_CHANGE', 'ALERT', 'HEARTBEAT', 'ERROR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActuatorCommandStatus" AS ENUM ('PENDING', 'SENT', 'ACKED', 'FAILED');

-- CreateEnum
CREATE TYPE "AutomationRuleTriggerType" AS ENUM ('SENSOR_EVENT', 'SCHEDULED', 'INACTIVITY', 'COMPOSITE');

-- CreateEnum
CREATE TYPE "EmergencyScenarioInstanceStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'ESCALATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HelpTriggerType" AS ENUM ('BUTTON_PRESS', 'VOICE_KEYWORD', 'DEVICE_EVENT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('ELDER_CARE', 'HOME_CARE', 'REPAIR_SERVICES');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('PERSONAL_CARE', 'COMPANIONSHIP', 'MEAL_PREPARATION', 'LIGHT_HOUSEKEEPING', 'SAFETY_SUPERVISION', 'TWENTY_FOUR_SEVEN_CARE', 'MEDICATION_MANAGEMENT', 'MEMORY_CARE', 'HEALTH_MONITORING', 'NUTRITION_MEAL_PREP', 'ELDER_COMPANIONSHIP', 'GENERAL_REPAIRS', 'ELECTRICAL_WORK', 'PLUMBING_SERVICES', 'SAFETY_MODIFICATIONS', 'SECURITY_UPGRADES', 'HANDYMAN_SERVICES');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PreferredTime" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "CareTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CareTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('MEDICAL_CHECKUP', 'THERAPY', 'SOCIAL_VISIT', 'HOME_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MedicationFrequency" AS ENUM ('ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'AS_NEEDED', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DoseStatus" AS ENUM ('PENDING', 'TAKEN', 'MISSED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('GENERAL', 'MEDICAL', 'CARE_PLAN', 'INCIDENT', 'PROGRESS', 'FAMILY_COMMUNICATION');

-- CreateEnum
CREATE TYPE "HealthcareProviderType" AS ENUM ('HOSPITAL', 'CLINIC', 'PRIMARY_CARE', 'SPECIALIST', 'URGENT_CARE', 'EMERGENCY_ROOM');

-- CreateEnum
CREATE TYPE "EmergencyServiceType" AS ENUM ('POLICE', 'FIRE', 'AMBULANCE', 'EMERGENCY_DISPATCH');

-- CreateEnum
CREATE TYPE "NotificationMethod" AS ENUM ('EMAIL', 'SMS', 'PHONE_CALL', 'PUSH', 'DISPATCH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'QUEUED');

-- CreateEnum
CREATE TYPE "DispatchPriority" AS ENUM ('IMMEDIATE', 'URGENT', 'ROUTINE');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeviceProtocol" AS ENUM ('BLE', 'ZIGBEE', 'ZWAVE', 'WIFI', 'LORAWAN', 'ETHERNET');

-- CreateEnum
CREATE TYPE "RobotType" AS ENUM ('COMPANION', 'TELEPRESENCE', 'ASSISTANT', 'THERAPEUTIC');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elder_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "medicalRecordNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "bloodType" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "emergencyContact" JSONB,
    "medicalConditions" JSONB,
    "allergies" JSONB,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elder_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vital_readings" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "vitalType" "VitalType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "systolic" DOUBLE PRECISION,
    "diastolic" DOUBLE PRECISION,
    "deviceId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vital_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "sourceSensorEventId" TEXT,
    "sourceEmergencyScenarioId" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homes" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_zones" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "floor" TEXT,
    "isCriticalArea" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DeviceCategory" NOT NULL,
    "capabilitiesJson" JSONB NOT NULL,
    "vendor" TEXT,
    "model" TEXT,
    "notes" TEXT,
    "isDefaultSupported" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "zoneId" TEXT,
    "deviceTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "batteryLevel" INTEGER,
    "lastSeenAt" TIMESTAMP(3),
    "firmwareVersion" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settingsJson" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensors" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sensorType" "SensorType" NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "calibrationJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actuators" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "actuatorType" "ActuatorType" NOT NULL,
    "name" TEXT NOT NULL,
    "stateSchemaJson" JSONB NOT NULL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actuators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_events" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "eventType" "SensorEventType" NOT NULL,
    "valueNumeric" DOUBLE PRECISION,
    "valueText" TEXT,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
    "rawPayloadJson" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actuator_commands" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "actuatorId" TEXT NOT NULL,
    "commandName" TEXT NOT NULL,
    "commandParamsJson" JSONB NOT NULL,
    "issuedByUserId" TEXT,
    "issuedByRuleId" TEXT,
    "status" "ActuatorCommandStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "ackedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actuator_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" "AutomationRuleTriggerType" NOT NULL,
    "triggerConfigJson" JSONB NOT NULL,
    "conditionConfigJson" JSONB,
    "actionsConfigJson" JSONB NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_scenarios" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "triggerSignatureJson" JSONB NOT NULL,
    "stepwiseActionsJson" JSONB NOT NULL,
    "lastTriggeredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_scenario_instances" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "status" "EmergencyScenarioInstanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "relatedSensorEventId" TEXT,
    "cancelToken" TEXT,
    "lastActionAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_scenario_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inactivity_profiles" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inactivity_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_triggers" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "triggerType" "HelpTriggerType" NOT NULL,
    "sourceDeviceId" TEXT,
    "rawPayloadJson" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAlertId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_tokens" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iot_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "type" "ServiceType" NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceType" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" "PreferredTime" NOT NULL,
    "address" TEXT,
    "specialNeeds" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plans" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goals" JSONB,
    "services" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_tasks" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "priority" "CareTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "CareTaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AppointmentType" NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "attendees" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" "MedicationFrequency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "instructions" TEXT,
    "sideEffects" TEXT,
    "prescribedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_doses" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "takenAt" TIMESTAMP(3),
    "status" "DoseStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_doses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "NoteType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_providers" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "type" "HealthcareProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_services" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "type" "EmergencyServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_notifications" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientContact" TEXT NOT NULL,
    "method" "NotificationMethod" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_reports" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reportData" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_dispatches" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceContact" TEXT,
    "priority" "DispatchPriority" NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'PENDING',
    "incidentType" TEXT NOT NULL,
    "incidentSeverity" "AlertSeverity" NOT NULL,
    "location" JSONB NOT NULL,
    "patientInfo" JSONB NOT NULL,
    "notes" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_history" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "allergies" JSONB NOT NULL DEFAULT '[]',
    "surgeries" JSONB NOT NULL DEFAULT '[]',
    "chronicDiseases" JSONB NOT NULL DEFAULT '[]',
    "familyHistory" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_configs" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "vitalThresholds" JSONB,
    "notifyFamily" BOOLEAN NOT NULL DEFAULT true,
    "notifyHealthcare" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmergency" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "vitalCheckInterval" INTEGER NOT NULL DEFAULT 300,
    "inactivityTimeout" INTEGER NOT NULL DEFAULT 3600,
    "autoEscalateCritical" BOOLEAN NOT NULL DEFAULT true,
    "escalationDelay" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_commands" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_executions" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" JSONB,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_preferences" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "voiceSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "voiceVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "confirmCommands" BOOLEAN NOT NULL DEFAULT false,
    "enableEmergency" BOOLEAN NOT NULL DEFAULT true,
    "enableDeviceControl" BOOLEAN NOT NULL DEFAULT true,
    "wakeWord" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_settings" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "personalityName" TEXT NOT NULL DEFAULT 'Emma',
    "personalityTraits" JSONB NOT NULL DEFAULT '[]',
    "personalityGender" TEXT DEFAULT 'female',
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "proactiveReminders" BOOLEAN NOT NULL DEFAULT true,
    "emotionalSupport" BOOLEAN NOT NULL DEFAULT true,
    "conversationHistory" BOOLEAN NOT NULL DEFAULT true,
    "medicationReminders" BOOLEAN NOT NULL DEFAULT true,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "exerciseReminders" BOOLEAN NOT NULL DEFAULT true,
    "checkInFrequency" TEXT DEFAULT 'daily',
    "responseLength" TEXT NOT NULL DEFAULT 'medium',
    "formality" TEXT NOT NULL DEFAULT 'friendly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_conversations" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "companionResponse" TEXT NOT NULL,
    "sentiment" TEXT,
    "actionTriggered" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_reminders" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_activities" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mood" TEXT,
    "duration" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_predictions" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "predictions" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "ml_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gait_analysis" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "gaitSpeed" DOUBLE PRECISION NOT NULL,
    "stepLength" DOUBLE PRECISION NOT NULL,
    "cadence" DOUBLE PRECISION NOT NULL,
    "symmetry" DOUBLE PRECISION NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL,
    "abnormalities" JSONB NOT NULL DEFAULT '[]',
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gait_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_tracking" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "address" TEXT,
    "activity" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_logs" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT,
    "elderId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DoseStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "medication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sensorType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motion_sensors" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "intensity" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "motion_sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cameras" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "privacyMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edge_gateways" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "lastHeartbeat" TIMESTAMP(3),
    "capabilities" JSONB,
    "resources" JSONB,
    "version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edge_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "robots" (
    "id" TEXT NOT NULL,
    "homeId" TEXT,
    "type" "RobotType" NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "modelNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "batteryLevel" DOUBLE PRECISION,
    "location" TEXT,
    "capabilities" JSONB,
    "configuration" JSONB,
    "lastCommand" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "robots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_consultations" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "doctorId" TEXT,
    "doctorName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "roomId" TEXT,
    "recordingUrl" TEXT,
    "notes" TEXT,
    "diagnosis" TEXT,
    "prescriptions" JSONB,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rpm_sessions" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "minutesLogged" INTEGER NOT NULL DEFAULT 0,
    "cptCode99453" BOOLEAN NOT NULL DEFAULT false,
    "cptCode99454" BOOLEAN NOT NULL DEFAULT false,
    "cptCode99457" BOOLEAN NOT NULL DEFAULT false,
    "cptCode99458Count" INTEGER NOT NULL DEFAULT 0,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "billedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rpm_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_records" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "dataHash" TEXT NOT NULL,
    "ipfsHash" TEXT,
    "blockchainTxHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "smartContractAddr" TEXT,
    "encryptionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_access_logs" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "accessorUserId" TEXT NOT NULL,
    "accessorType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "action" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "location" JSONB,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "ipAddress" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failReason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encryption_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT,
    "algorithm" TEXT NOT NULL DEFAULT 'rsa-4096',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),

    CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_metrics" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nlu_analysis" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "intents" JSONB NOT NULL,
    "entities" JSONB NOT NULL,
    "emotions" JSONB NOT NULL,
    "suggestions" JSONB,
    "urgency" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nlu_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_health_metrics" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "pitchMean" DOUBLE PRECISION,
    "pitchVariability" DOUBLE PRECISION,
    "speakingRate" DOUBLE PRECISION,
    "hesitationScore" DOUBLE PRECISION,
    "clarityScore" DOUBLE PRECISION,
    "respiratoryScore" DOUBLE PRECISION,
    "cognitiveScore" DOUBLE PRECISION,
    "emotionalScore" DOUBLE PRECISION,
    "parkinsonsScore" DOUBLE PRECISION,
    "strokeRiskScore" DOUBLE PRECISION,
    "overallRiskLevel" TEXT,
    "concerns" JSONB,
    "recommendations" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_baselines" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "baselineMetrics" JSONB NOT NULL,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "elder_profiles_userId_key" ON "elder_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "elder_profiles_medicalRecordNo_key" ON "elder_profiles"("medicalRecordNo");

-- CreateIndex
CREATE UNIQUE INDEX "homes_elderId_key" ON "homes"("elderId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_homeId_identifier_key" ON "devices"("homeId", "identifier");

-- CreateIndex
CREATE INDEX "sensor_events_homeId_occurredAt_idx" ON "sensor_events"("homeId", "occurredAt");

-- CreateIndex
CREATE INDEX "sensor_events_deviceId_occurredAt_idx" ON "sensor_events"("deviceId", "occurredAt");

-- CreateIndex
CREATE INDEX "sensor_events_sensorId_occurredAt_idx" ON "sensor_events"("sensorId", "occurredAt");

-- CreateIndex
CREATE INDEX "sensor_events_processed_idx" ON "sensor_events"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "inactivity_profiles_homeId_elderId_key" ON "inactivity_profiles"("homeId", "elderId");

-- CreateIndex
CREATE UNIQUE INDEX "iot_tokens_token_key" ON "iot_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "care_plans_elderId_key" ON "care_plans"("elderId");

-- CreateIndex
CREATE UNIQUE INDEX "medical_history_elderId_key" ON "medical_history"("elderId");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_configs_elderId_key" ON "monitoring_configs"("elderId");

-- CreateIndex
CREATE INDEX "voice_commands_elderId_timestamp_idx" ON "voice_commands"("elderId", "timestamp");

-- CreateIndex
CREATE INDEX "voice_executions_elderId_executedAt_idx" ON "voice_executions"("elderId", "executedAt");

-- CreateIndex
CREATE UNIQUE INDEX "voice_preferences_elderId_key" ON "voice_preferences"("elderId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_settings_elderId_key" ON "companion_settings"("elderId");

-- CreateIndex
CREATE INDEX "companion_conversations_elderId_timestamp_idx" ON "companion_conversations"("elderId", "timestamp");

-- CreateIndex
CREATE INDEX "companion_reminders_elderId_scheduledFor_idx" ON "companion_reminders"("elderId", "scheduledFor");

-- CreateIndex
CREATE INDEX "companion_activities_elderId_timestamp_idx" ON "companion_activities"("elderId", "timestamp");

-- CreateIndex
CREATE INDEX "ml_predictions_elderId_generatedAt_idx" ON "ml_predictions"("elderId", "generatedAt");

-- CreateIndex
CREATE INDEX "gait_analysis_elderId_analyzedAt_idx" ON "gait_analysis"("elderId", "analyzedAt");

-- CreateIndex
CREATE INDEX "location_tracking_elderId_timestamp_idx" ON "location_tracking"("elderId", "timestamp");

-- CreateIndex
CREATE INDEX "medication_logs_scheduledAt_idx" ON "medication_logs"("scheduledAt");

-- CreateIndex
CREATE INDEX "sensor_readings_deviceId_timestamp_idx" ON "sensor_readings"("deviceId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "rpm_sessions_elderId_monthYear_key" ON "rpm_sessions"("elderId", "monthYear");

-- CreateIndex
CREATE INDEX "blockchain_records_elderId_idx" ON "blockchain_records"("elderId");

-- CreateIndex
CREATE INDEX "data_access_logs_elderId_timestamp_idx" ON "data_access_logs"("elderId", "timestamp");

-- CreateIndex
CREATE INDEX "access_logs_userId_timestamp_idx" ON "access_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "auth_attempts_ipAddress_timestamp_idx" ON "auth_attempts"("ipAddress", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "encryption_keys_userId_key" ON "encryption_keys"("userId");

-- CreateIndex
CREATE INDEX "platform_metrics_metricType_timestamp_idx" ON "platform_metrics"("metricType", "timestamp");

-- CreateIndex
CREATE INDEX "nlu_analysis_elderId_timestamp_idx" ON "nlu_analysis"("elderId", "timestamp");

-- CreateIndex
CREATE INDEX "voice_health_metrics_elderId_timestamp_idx" ON "voice_health_metrics"("elderId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "voice_baselines_elderId_key" ON "voice_baselines"("elderId");

-- AddForeignKey
ALTER TABLE "elder_profiles" ADD CONSTRAINT "elder_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_readings" ADD CONSTRAINT "vital_readings_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_sourceSensorEventId_fkey" FOREIGN KEY ("sourceSensorEventId") REFERENCES "sensor_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_sourceEmergencyScenarioId_fkey" FOREIGN KEY ("sourceEmergencyScenarioId") REFERENCES "emergency_scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homes" ADD CONSTRAINT "homes_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_zones" ADD CONSTRAINT "home_zones_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "home_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_deviceTypeId_fkey" FOREIGN KEY ("deviceTypeId") REFERENCES "device_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuators" ADD CONSTRAINT "actuators_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_events" ADD CONSTRAINT "sensor_events_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_events" ADD CONSTRAINT "sensor_events_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_events" ADD CONSTRAINT "sensor_events_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuator_commands" ADD CONSTRAINT "actuator_commands_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuator_commands" ADD CONSTRAINT "actuator_commands_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuator_commands" ADD CONSTRAINT "actuator_commands_actuatorId_fkey" FOREIGN KEY ("actuatorId") REFERENCES "actuators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuator_commands" ADD CONSTRAINT "actuator_commands_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuator_commands" ADD CONSTRAINT "actuator_commands_issuedByRuleId_fkey" FOREIGN KEY ("issuedByRuleId") REFERENCES "automation_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_scenarios" ADD CONSTRAINT "emergency_scenarios_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_scenario_instances" ADD CONSTRAINT "emergency_scenario_instances_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "emergency_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_scenario_instances" ADD CONSTRAINT "emergency_scenario_instances_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inactivity_profiles" ADD CONSTRAINT "inactivity_profiles_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inactivity_profiles" ADD CONSTRAINT "inactivity_profiles_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_triggers" ADD CONSTRAINT "help_triggers_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_triggers" ADD CONSTRAINT "help_triggers_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_triggers" ADD CONSTRAINT "help_triggers_sourceDeviceId_fkey" FOREIGN KEY ("sourceDeviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_tokens" ADD CONSTRAINT "iot_tokens_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_tasks" ADD CONSTRAINT "care_tasks_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "care_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_doses" ADD CONSTRAINT "medication_doses_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healthcare_providers" ADD CONSTRAINT "healthcare_providers_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_services" ADD CONSTRAINT "emergency_services_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_notifications" ADD CONSTRAINT "emergency_notifications_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_reports" ADD CONSTRAINT "emergency_reports_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_dispatches" ADD CONSTRAINT "emergency_dispatches_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_dispatches" ADD CONSTRAINT "emergency_dispatches_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "emergency_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_configs" ADD CONSTRAINT "monitoring_configs_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_commands" ADD CONSTRAINT "voice_commands_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_commands" ADD CONSTRAINT "voice_commands_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_executions" ADD CONSTRAINT "voice_executions_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_executions" ADD CONSTRAINT "voice_executions_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_preferences" ADD CONSTRAINT "voice_preferences_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_settings" ADD CONSTRAINT "companion_settings_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_conversations" ADD CONSTRAINT "companion_conversations_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_reminders" ADD CONSTRAINT "companion_reminders_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_activities" ADD CONSTRAINT "companion_activities_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_predictions" ADD CONSTRAINT "ml_predictions_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gait_analysis" ADD CONSTRAINT "gait_analysis_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_tracking" ADD CONSTRAINT "location_tracking_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
