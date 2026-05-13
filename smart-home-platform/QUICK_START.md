# Smart Home Platform - Quick Start Guide

## ✅ System Status

All files have been created and the system is ready to run!

## 📁 Project Structure

```
smart-home-platform/
├── backend/                     # FastAPI Backend
│   ├── main.py                 # Main application
│   ├── database.py             # Database connection
│   ├── models.py               # SQLAlchemy models
│   ├── auth.py                 # Authentication
│   ├── hub_client.py           # Hub communication
│   ├── automation_engine.py    # Automation logic
│   ├── requirements.txt
│   ├── Dockerfile
│   └── routers/               # API routers
│       ├── auth_router.py
│       ├── devices_router.py
│       ├── scenes_router.py
│       ├── automations_router.py
│       └── events_router.py
├── hub/                        # Device Hub Simulator
│   ├── main.py                # Hub API
│   ├── devices.py             # Simulated devices
│   ├── requirements.txt
│   └── Dockerfile
└── docker-compose.yml          # Docker orchestration

```

## 🚀 Running the Platform

The system is currently running. Services are available at:

- **Backend API**: http://localhost:18000
- **API Documentation**: http://localhost:18000/docs  ← START HERE
- **Hub API**: http://localhost:8001
- **Hub Documentation**: http://localhost:8001/docs
- **PostgreSQL**: localhost:5433

## 📝 Quick Test Commands

### 1. Check Services Status
```bash
curl http://localhost:18000/health
curl http://localhost:8001/devices
```

### 2. Register a User
```bash
curl -X POST http://localhost:18000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123",
    "full_name": "Demo User"
  }'
```

### 3. Login (Get Token)
```bash
curl -X POST 'http://localhost:18000/auth/login' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=demo@example.com&password=demo123'
```

Save the `access_token` from the response!

### 4. List Devices from Hub
```bash
curl http://localhost:8001/devices
```

### 5. Control a Device
```bash
curl -X POST http://localhost:8001/devices/light_1/commands \
  -H "Content-Type: application/json" \
  -d '{
    "command": {
      "on": true,
      "brightness": 80,
      "color_temp": 4000
    }
  }'
```

## 🎮 Using the Interactive API Docs

1. Open http://localhost:18000/docs
2. Click "Authorize" button
3. Enter your token in format: `Bearer YOUR_TOKEN_HERE`
4. Try the endpoints interactively!

## 🔧 Available Simulated Devices

The hub includes 6 pre-configured devices:

1. **light_1** - Living Room Ceiling Light
   - Controls: on/off, brightness, color_temp

2. **light_2** - Bedroom Lamp
   - Controls: on/off, brightness

3. **light_3** - Kitchen Light
   - Controls: on/off, brightness, color_temp

4. **thermostat_1** - Main Thermostat
   - Controls: temperature, target_temperature, mode

5. **lock_1** - Front Door Lock
   - Controls: locked

6. **motion_1** - Hallway Motion Sensor
   - Reads: motion_detected, last_motion

## 🏗️ Architecture

### Backend (Port 9000)
- FastAPI REST API
- PostgreSQL database
- JWT authentication
- Automation engine with APScheduler
- Device state management

### Hub (Port 9001)
- Device simulator
- REST API for device control
- Simulated state changes
- Event generation

## 📊 Database Models

- **User**: Authentication and user management
- **Home**: User's home with mode (home/away/sleep)
- **Room**: Rooms within a home
- **Device**: Smart devices linked to rooms
- **Scene**: Multi-device automation presets
- **Automation**: Rule-based automations (triggers, conditions, actions)
- **Event**: Activity log

## 🔄 Automation Engine

The automation engine runs in the background and:
- Checks time-based triggers every minute
- Evaluates conditions
- Executes actions (device commands, scenes)
- Logs all activity

Example automation:
```json
{
  "name": "Morning Routine",
  "enabled": true,
  "triggers": [{
    "trigger_type": "time",
    "config": {"time": "07:00"}
  }],
  "actions": [{
    "action_type": "device_command",
    "config": {
      "device_id": "light_1",
      "command": {"on": true, "brightness": 100}
    }
  }]
}
```

## 🛠️ Useful Commands

### View Logs
```bash
# Backend logs
docker logs smart-home-platform-backend-1 -f

# Hub logs
docker logs smart-home-platform-hub-1 -f

# All logs
docker compose logs -f
```

### Restart Services
```bash
cd smart-home-platform
docker compose restart
```

### Stop Everything
```bash
docker compose down
```

### Rebuild from Scratch
```bash
docker compose down -v  # Remove volumes too
docker compose up --build
```

### Access Database
```bash
docker exec -it smart-home-platform-postgres-1 psql -U smarthome -d smarthome
```

## 🎯 Next Steps

1. ✅ System is running
2. ✅ Register a user
3. ✅ Get authentication token
4. Try creating a home with rooms
5. Link devices from the hub to your home
6. Create scenes for multi-device control
7. Set up automations
8. View the event timeline

## 🐛 Troubleshooting

### Services not starting?
```bash
docker compose ps  # Check status
docker compose logs  # Check logs
```

### Port already in use?
Edit `docker-compose.yml` to change ports:
```yaml
ports:
  - "9000:9000"  # Change first number
```

### Database issues?
```bash
docker compose down -v  # Remove volumes
docker compose up --build  # Rebuild
```

## 📚 API Endpoints Summary

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get token

### Devices
- `GET /devices` - List all devices
- `PATCH /devices/{id}/state` - Update device state

### Scenes
- `GET /scenes` - List scenes
- `POST /scenes/{id}/activate` - Activate a scene

### Automations
- `GET /automations` - List automations
- `PATCH /automations/{id}/toggle` - Enable/disable automation

### Events
- `GET /events?limit=50` - Get activity log

## 🎨 Frontend (Coming Soon)

React frontend will be added in the next phase with:
- Dashboard with mode control
- Device control cards
- Scene management
- Automation builder
- Event timeline
- Real-time WebSocket updates

## 💡 Tips

- Use the interactive docs at `/docs` for easy testing
- The automation engine checks every minute
- Events are logged for all actions
- Devices maintain state between commands
- The hub simulates random motion sensor events

## 🔐 Security Notes

- Change `SECRET_KEY` in `backend/auth.py` for production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting for APIs

---

**System Status**: ✅ Running and ready!
**Access Documentation**: http://localhost:8000/docs
