## Voice Recognition & Control System for Elderly Patients

## Overview

A comprehensive hands-free voice control system designed specifically for elderly patients, allowing them to control all electrical devices, request emergency assistance, and interact with the smart home using natural speech.

**Key Features:**
- 🎤 **Speech Recognition** - Browser-based Web Speech API (Chrome, Edge, Safari)
- 🗣️ **Natural Language** - Speak naturally, no rigid commands required
- 🏠 **Complete Home Control** - Lights, appliances, thermostat, locks, curtains
- 🚨 **Emergency Voice Commands** - "Help me", "Emergency", "I fell"
- 🔊 **Voice Responses** - System speaks back confirmations and status
- ♿ **Accessibility-First** - Large buttons, clear feedback, elderly-friendly
- 📊 **Command History** - Track what was said and executed

---

## Supported Devices

### ✅ Currently Controlled

| Device Type | Voice Commands | Examples |
|------------|---------------|----------|
| **Lights** | Turn on/off, by room | "Turn on the bedroom lights"<br>"Turn off all lights"<br>"Lights on" |
| **Thermostat** | Set temp, warmer/cooler | "Set temperature to 72"<br>"Make it warmer"<br>"Make it cooler" |
| **Door Locks** | Lock/unlock | "Lock the doors"<br>"Unlock the front door" |
| **Curtains/Blinds** | Open/close | "Open the curtains"<br>"Close the bedroom blinds" |
| **Appliances** | TV, fans, heaters, AC | "Turn on the TV"<br>"Turn off the fan"<br>"Switch on air conditioner" |
| **Emergency** | Help, medical | "Help me"<br>"Emergency"<br>"I need help"<br>"I fell"<br>"I can't breathe" |

### 📋 Supported Actuator Types (from Prisma Schema)

```typescript
enum ActuatorType {
  LIGHT              // Ceiling lights, lamps, LED strips
  DOOR_LOCK          // Smart door locks
  THERMOSTAT         // Temperature control
  SIREN              // Emergency sirens/alarms
  SPEAKER_TTS        // Text-to-speech speakers
  APPLIANCE_POWER    // TV, fan, heater, AC, etc.
  CURTAIN_BLINDS     // Motorized curtains and blinds
  NOTIFICATION_BRIDGE // Send notifications
  CUSTOM             // Custom device types
}
```

---

## Voice Commands Reference

### 🏠 Device Control

**Lights:**
- "Turn on the lights"
- "Turn off the bedroom lights"
- "Lights on" / "Lights off"
- "Switch on the lamp"
- "Turn on the kitchen light"

**Temperature:**
- "Set temperature to 72"
- "Make it warmer" / "Make it hotter"
- "Make it cooler" / "Make it colder"
- "Increase the temperature"
- "Lower the temperature"
- "What's the temperature?"

**Door Locks:**
- "Lock the doors"
- "Unlock the door"
- "Secure the doors"
- "Are the doors locked?"

**Curtains & Blinds:**
- "Open the curtains"
- "Close the blinds"
- "Raise the shades"
- "Lower the curtains"

**Appliances:**
- "Turn on the TV"
- "Turn off the fan"
- "Switch on the heater"
- "Turn off the air conditioner"

### 🚨 Emergency Commands

**Critical Emergency:**
- "Help me" → Triggers CRITICAL alert
- "Emergency" → Triggers CRITICAL alert
- "I need help" → Triggers CRITICAL alert
- "Call for help" → Triggers CRITICAL alert
- "I fell" → Triggers CRITICAL alert
- "I can't get up" → Triggers CRITICAL alert
- "I can't breathe" → Triggers CRITICAL alert

**Medical Assistance:**
- "I don't feel well" → Triggers HIGH priority alert
- "I need my medication" → Triggers HIGH priority alert
- "Call my doctor" → Triggers HIGH priority alert
- "Call the nurse" → Triggers HIGH priority alert

### 🌅 Scenes & Routines

**Morning Routine:**
- "Good morning"
- "Start my morning routine"
- Opens curtains, turns on lights, sets comfortable temp

**Night Routine:**
- "Good night"
- "Bedtime"
- "I'm going to sleep"
- Closes curtains, turns off lights, locks doors, lowers temp

**Leaving Home:**
- "I'm leaving"
- "Goodbye"
- "Secure the house"
- Locks doors, turns off lights, activates security

**Coming Home:**
- "I'm home"
- "I'm back"
- "Hello"
- Unlocks door, turns on lights, sets comfortable temp

### 📞 Assistance

**Reminders:**
- "Remind me to take my medication"
- "Medication reminder"

**Contact Family:**
- "Call my family"
- "Call my son"
- "Call my daughter"
- "Contact my spouse"

### ℹ️ Status Queries

**Check Status:**
- "What's the temperature?"
- "Are the lights on?"
- "Which lights are on?"
- "Are the doors locked?"
- "Door status"

---

## Frontend Component

### VoiceControl Component

**Location:** `client/src/components/voice/VoiceControl.jsx`

**Features:**
- Large, accessible button for starting/stopping listening
- Real-time visual feedback (pulsing animation while listening)
- Speech-to-text transcription display
- Response message display
- Command history (last 10 commands)
- Toggle for voice responses (system speaking back)
- Help panel with all supported commands
- Error handling with user-friendly messages

**Usage:**
```jsx
import VoiceControl from './components/voice/VoiceControl';

<VoiceControl 
  elderId="elder-123" 
  homeId="home-456"
  className="w-full max-w-2xl mx-auto"
/>
```

**Props:**
- `elderId` (required) - Elder profile ID
- `homeId` (required) - Smart home ID
- `className` (optional) - Additional CSS classes

### Visual States

| State | Indicator | Color | Icon |
|-------|-----------|-------|------|
| Ready | Solid circle | Gray | MicOff |
| Listening | Pulsing circle | Red | Mic (animated) |
| Processing | Pulsing circle | Yellow | Loader (spinning) |
| Success | Solid circle | Green | CheckCircle |
| Error | Solid circle | Red | XCircle |

---

## Backend API

### Endpoints

**1. Process Voice Command**
```bash
POST /api/smart-home/voice/command

Body:
{
  "elderId": "elder-123",
  "homeId": "home-456",
  "transcript": "turn on the lights",
  "confidence": 0.95  # Optional: speech recognition confidence
}

Response:
{
  "success": true,
  "message": "Okay, I've turned on 3 devices.",
  "action": "TURN_ON",
  "data": {
    "devices": ["Living Room Light", "Kitchen Light", "Bedroom Light"]
  }
}
```

**2. Get Voice Command History**
```bash
GET /api/smart-home/voice/history/:elderId?limit=50

Response:
[
  {
    "id": "voice-cmd-123",
    "transcript": "turn on the lights",
    "confidence": 0.95,
    "timestamp": "2026-05-17T10:30:00Z"
  },
  ...
]
```

**3. Get Supported Commands**
```bash
GET /api/smart-home/voice/commands

Response:
{
  "deviceControl": {
    "category": "Device Control",
    "examples": [
      "Turn on the lights",
      "Turn off the bedroom lights",
      "Turn on the TV"
    ]
  },
  "emergency": {
    "category": "Emergency",
    "examples": [
      "Help me",
      "Emergency",
      "I need help"
    ]
  },
  ...
}
```

---

## Natural Language Processing

### Command Parsing

The system uses **regex pattern matching** with synonyms and variations:

**Example: Light Control**
```javascript
patterns: [
  /turn (on|up) (the )?(light|lights|lamp|lamps)/i,
  /switch (on|up) (the )?(light|lights|lamp|lamps)/i,
  /lights? on/i,
]
```

**Extracted Parameters:**
- Room/zone: "in the bedroom", "in the kitchen"
- Appliance name: "the TV", "the fan"
- Temperature value: "to 72", "to 68 degrees"
- Contact name: "my son", "my daughter"

### Intelligence Features

**1. Room/Zone Detection**
- "Turn on the bedroom lights" → Only bedroom lights
- "Turn on the lights" → All lights
- "Turn off the kitchen fan" → Only kitchen fan

**2. Appliance Matching**
- "Turn on the TV" → Finds TV device
- "Turn off the heater" → Finds heater device
- "Switch on air conditioner" → Finds AC device

**3. Temperature Adjustments**
- "Set temperature to 72" → Sets to specific value
- "Make it warmer" → Increases by 2 degrees
- "Make it cooler" → Decreases by 2 degrees

**4. Emergency Classification**
- "Help me" → CRITICAL severity
- "I fell" → CRITICAL severity
- "I don't feel well" → HIGH severity
- "I need my medication" → HIGH severity

---

## Database Schema

### VoiceCommand Table
```sql
id          UUID
elderId     UUID (FK)
homeId      UUID (FK)
transcript  TEXT        -- Speech-to-text result
confidence  FLOAT       -- Recognition confidence 0.0-1.0
timestamp   TIMESTAMP
```

### VoiceExecution Table
```sql
id          UUID
elderId     UUID (FK)
homeId      UUID (FK)
transcript  TEXT        -- Original command
action      STRING      -- TURN_ON, EMERGENCY_ALERT, etc.
status      STRING      -- SUCCESS, FAILED, PARTIAL
result      JSON        -- Execution details
executedAt  TIMESTAMP
```

### VoicePreference Table
```sql
id                  UUID
elderId             UUID (FK, unique)
enabled             BOOLEAN
language            STRING      -- "en-US", "es-ES", etc.
voiceSpeed          FLOAT       -- 0.5-2.0 (speech output speed)
voiceVolume         FLOAT       -- 0.0-1.0 (speech output volume)
confirmCommands     BOOLEAN     -- Ask before executing
enableEmergency     BOOLEAN     -- Allow emergency commands
enableDeviceControl BOOLEAN     -- Allow device control
wakeWord            STRING?     -- Custom wake word
```

---

## Browser Compatibility

### Supported Browsers

| Browser | Speech Recognition | Speech Synthesis | Status |
|---------|-------------------|------------------|--------|
| Chrome 25+ | ✅ Yes | ✅ Yes | **Recommended** |
| Edge 79+ | ✅ Yes | ✅ Yes | **Recommended** |
| Safari 14.1+ | ✅ Yes (limited) | ✅ Yes | Supported |
| Firefox | ❌ No | ✅ Yes | Not supported |
| Mobile Chrome | ✅ Yes | ✅ Yes | Supported |
| Mobile Safari | ✅ Yes | ✅ Yes | Supported |

**Note:** Chrome and Edge provide the best experience. Firefox does not support the Web Speech API for recognition.

### Microphone Permissions

**First Use:**
1. Browser will prompt for microphone permission
2. User must click "Allow"
3. Permission is remembered for future visits

**If Permission Denied:**
- Clear error message shown
- Instructions to enable in browser settings
- Fallback to manual device control

---

## Accessibility Features

### Elderly-Friendly Design

**1. Large Targets**
- Main listen button: 8rem padding
- Status indicator: 8rem × 8rem
- All buttons: Minimum 3rem touch target

**2. Clear Visual Feedback**
- Color-coded status (red listening, yellow processing, green success)
- Animated pulsing during listening
- Large, readable text (text-lg, text-2xl)
- High contrast colors

**3. Voice Feedback**
- System speaks responses back
- Confirmations for actions taken
- Error messages spoken aloud
- Adjustable voice speed and volume

**4. Simple Operation**
- Single button to start listening
- No typing required
- Natural language - no memorization needed
- Help always available

**5. Error Tolerance**
- Multiple phrasings accepted
- Synonyms recognized
- Typos in speech ignored

---

## Security & Privacy

### Voice Data Handling

**What's Stored:**
- ✅ Transcript text
- ✅ Command action taken
- ✅ Timestamp
- ✅ Success/failure status

**What's NOT Stored:**
- ❌ Audio recordings
- ❌ Voice prints
- ❌ Biometric data

### Emergency Override

**Emergency commands bypass all restrictions:**
- No confirmation required
- Immediate execution
- Highest priority routing
- All contacts notified

### Privacy Settings

- Voice history can be cleared
- Voice control can be disabled
- Per-elder configuration
- Audit trail for compliance

---

## Use Cases

### 1. Bedtime Routine (86-year-old woman)

**Patient says:** "Good night"

**System:**
1. Closes all curtains
2. Turns off all lights except bedroom
3. Locks all doors
4. Sets thermostat to 65°F
5. Speaks: "Good night! I've closed the curtains, turned off the lights, locked the doors, and lowered the temperature. Sleep well."

### 2. Fall Emergency (78-year-old man)

**Patient says:** "Help me! I fell!"

**System:**
1. Immediately triggers CRITICAL alert
2. Notifies family (primary contact)
3. Calls 911 if configured
4. Sends alert to healthcare provider
5. Turns on all lights for visibility
6. Unlocks door for responders
7. Speaks: "I've sent an emergency alert to your family and emergency contacts. Help is on the way. Stay calm."

### 3. Morning with Limited Mobility (92-year-old woman)

**Patient says:** "Good morning"

**System:**
1. Opens bedroom curtains
2. Turns on lights gradually
3. Sets thermostat to 70°F
4. Speaks: "Good morning! I'm opening the curtains, turning on lights, and setting a comfortable temperature."

**Patient says:** "Turn on the TV"

**System:**
1. Powers on TV
2. Speaks: "Okay, I've turned on the TV."

**Patient says:** "Remind me to take my medication"

**System:**
1. Sets medication reminder
2. Speaks: "Okay, I'll remind you when it's time to take your medication."

### 4. Temperature Control (81-year-old man)

**Patient says:** "I'm cold"

**System:**
1. Recognizes implied command
2. Increases temperature by 2°F
3. Speaks: "Okay, I'm making it warmer. Setting the temperature to 72 degrees."

### 5. Security Check (89-year-old woman with anxiety)

**Patient says:** "Are the doors locked?"

**System:**
1. Checks all door lock status
2. Speaks: "Yes, all 3 doors are locked. The house is secure."

---

## Integration Points

### 1. Emergency Alert System
- Voice commands "help me", "emergency" trigger emergency alerts
- Full integration with hospital/police notification
- Automatic emergency report generation

### 2. Care Management
- "Remind me to take medication" creates care task
- "Call my doctor" notifies healthcare provider
- Medication reminders via voice

### 3. Smart Home Devices
- Direct control of all actuators (lights, locks, thermostat, etc.)
- Scene activation (morning, night, away, home)
- Status queries for any device

### 4. Family Communication
- "Call my son/daughter" initiates contact
- Voice-triggered video calls (future feature)
- Voice messages to family (future feature)

---

## Configuration

### Per-Elder Settings

```javascript
{
  "enabled": true,
  "language": "en-US",
  "voiceSpeed": 0.9,          // Slower for clarity
  "voiceVolume": 0.9,         // Loud enough to hear
  "confirmCommands": false,    // No confirmation - immediate action
  "enableEmergency": true,     // Always allow emergency commands
  "enableDeviceControl": true, // Allow device control
  "wakeWord": null            // No wake word - button press to activate
}
```

### Admin Override

Administrators can:
- Disable voice control temporarily
- View complete voice history
- Configure restricted commands
- Set device access permissions

---

## Testing

### Test Commands

**Device Control:**
```bash
✅ "Turn on the lights"
✅ "Turn off the bedroom lights"
✅ "Set temperature to 72"
✅ "Lock the doors"
✅ "Open the curtains"
```

**Emergency:**
```bash
✅ "Help me"
✅ "Emergency"
✅ "I fell"
✅ "I need help"
```

**Scenes:**
```bash
✅ "Good morning"
✅ "Good night"
✅ "I'm leaving"
✅ "I'm home"
```

**Status:**
```bash
✅ "What's the temperature?"
✅ "Are the doors locked?"
✅ "Which lights are on?"
```

### Test Sequence

1. Click "Start Listening" button
2. Speak command clearly
3. Wait for transcript to appear
4. Verify command executed correctly
5. Listen to voice response
6. Check command history

---

## Troubleshooting

### "Microphone access denied"
**Solution:** Allow microphone in browser settings:
- Chrome: Settings → Privacy → Site Settings → Microphone
- Edge: Settings → Site permissions → Microphone
- Safari: Settings → Websites → Microphone

### "Voice recognition not supported"
**Solution:** Use Chrome, Edge, or Safari. Firefox does not support speech recognition.

### "I didn't hear anything"
**Solution:**
- Check microphone is connected
- Speak louder
- Reduce background noise
- Check browser microphone permissions

### Commands not working
**Solution:**
- Check if devices exist in system
- Verify elder has access to home
- Check device names match (e.g., "TV" vs "Television")
- Try rephrasing command (see help panel)

### Voice response too fast/slow
**Solution:** Adjust voice speed in preferences (0.5 = slow, 1.0 = normal, 2.0 = fast)

---

## Future Enhancements

**Planned Features:**
- 🎙️ Wake word detection ("Hey ElderCare, turn on lights")
- 🌍 Multi-language support (Spanish, French, Chinese, etc.)
- 🧠 AI learning from usage patterns
- 📞 Voice-initiated video calls
- 📝 Voice notes and reminders
- 🎵 Music control ("Play classical music")
- 📺 TV channel control ("Change to channel 5")
- 🔊 Volume control for all audio devices
- 📻 Radio station selection
- ⏰ Alarm and timer commands
- 📅 Appointment scheduling by voice
- 💊 Medication identification by name
- 🚪 Visitor announcement ("Who's at the door?")
- 🌡️ Health status queries ("How's my blood pressure?")

---

## Summary

The Voice Control System provides elderly patients with:

✅ **Complete hands-free control** of all home devices
✅ **Emergency assistance** with simple voice commands
✅ **Natural language** - no rigid commands to memorize
✅ **Voice feedback** - system speaks confirmations
✅ **Large, accessible interface** - elderly-friendly design
✅ **Privacy-focused** - no audio recording, only transcripts
✅ **Browser-based** - no apps to install
✅ **Integration** with emergency alerts and care management

**Perfect for patients with:**
- Limited mobility
- Arthritis or tremors
- Vision impairments
- Memory issues
- General difficulty with technology

**Access:** Add `<VoiceControl />` component to any page or integrate into Smart Home Hub.

---

**Last Updated:** May 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
