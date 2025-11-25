# Smart Home Platform

Complete smart home automation system with device control, scenes, and automations.

## Quick Start

1. Build and run:
```bash
docker-compose up --build
```

2. Access services:
   - Backend API: http://localhost:9000/docs
   - Hub API: http://localhost:9001/docs

3. Register a user:
```bash
curl -X POST http://localhost:9000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123",
    "full_name": "Demo User"
  }'
```

4. Login:
```bash
curl -X POST http://localhost:9000/auth/login \
  -d "username=demo@example.com&password=demo123"
```

## Test Commands

```bash
# List devices from hub
curl http://localhost:9001/devices

# Control a device
curl -X POST http://localhost:9001/devices/light_1/commands \
  -H "Content-Type: application/json" \
  -d '{"command": {"on": true, "brightness": 80}}'
```
