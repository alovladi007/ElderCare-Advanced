#!/usr/bin/env python3
"""
Complete Smart Home Platform File Generator
This script creates ALL files needed for the platform
"""
import os
from pathlib import Path

def create_file(path, content):
    """Create a file with given content"""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ Created: {path}")

# =============================================================================
# BACKEND FILES
# =============================================================================

BACKEND_HUB_CLIENT = '''import httpx
import os
from typing import Dict, Any, List

HUB_URL = os.getenv("HUB_URL", "http://hub:9001")

async def list_devices() -> List[Dict[str, Any]]:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{HUB_URL}/devices")
        response.raise_for_status()
        return response.json()

async def get_device_state(device_id: str) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{HUB_URL}/devices/{device_id}")
        response.raise_for_status()
        return response.json()

async def send_command(device_id: str, command: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HUB_URL}/devices/{device_id}/commands",
            json={"command": command}
        )
        response.raise_for_status()
        return response.json()
'''

BACKEND_AUTOMATION_ENGINE = '''from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from sqlalchemy.orm import Session
import models
import hub_client

class AutomationEngine:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    def start(self, db: Session):
        """Start the automation engine"""
        self.scheduler.start()
        self.scheduler.add_job(
            self.check_time_automations,
            'cron',
            minute='*',
            args=[db]
        )
        print("✓ Automation Engine started")

    async def check_time_automations(self, db: Session):
        """Check and execute time-based automations"""
        now = datetime.now()
        current_time = now.strftime("%H:%M")

        automations = db.query(models.Automation).filter(
            models.Automation.enabled == True
        ).all()

        for automation in automations:
            for trigger in automation.triggers:
                if trigger.trigger_type == "time":
                    trigger_time = trigger.config.get("time")
                    if trigger_time == current_time:
                        await self.execute_automation(automation, db)

    async def execute_automation(self, automation: models.Automation, db: Session):
        """Execute an automation"""
        try:
            for action in automation.actions:
                if action.action_type == "device_command":
                    device_id = action.config.get("device_id")
                    command = action.config.get("command")
                    await hub_client.send_command(device_id, command)

                elif action.action_type == "scene_activate":
                    scene_id = action.config.get("scene_id")
                    scene = db.query(models.Scene).get(scene_id)
                    if scene:
                        for device_state in scene.device_states:
                            await hub_client.send_command(
                                device_state.device.device_id,
                                device_state.state
                            )

            automation.execution_count += 1
            automation.last_executed = datetime.utcnow()
            db.commit()

        except Exception as e:
            print(f"Error executing automation: {e}")

automation_engine = AutomationEngine()
'''

BACKEND_AUTH_ROUTER = '''from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
import models
import auth
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = None

@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(request.password)
    new_user = models.User(
        email=request.email,
        hashed_password=hashed_password,
        full_name=request.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully", "user_id": new_user.id}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
'''

BACKEND_DEVICES_ROUTER = '''from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import hub_client
from pydantic import BaseModel

router = APIRouter(prefix="/devices", tags=["devices"])

@router.get("/")
async def list_devices(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    devices = db.query(models.Device).join(models.Room).join(models.Home).filter(
        models.Home.owner_id == current_user.id
    ).all()
    return devices

class DeviceStateUpdate(BaseModel):
    state: dict

@router.patch("/{device_id}/state")
async def update_device_state(
    device_id: int,
    update: DeviceStateUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    result = await hub_client.send_command(device.device_id, update.state)
    device.state = result["state"]
    db.commit()

    event = models.Event(
        event_type="device_state_change",
        device_id=device.id,
        data={"new_state": result["state"]},
        severity="info"
    )
    db.add(event)
    db.commit()

    return device
'''

BACKEND_MAIN_UPDATED = '''from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, Base
import models
from routers import auth_router, devices_router, scenes_router, automations_router, events_router
import automation_engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Home Backend API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(devices_router.router)
app.include_router(scenes_router.router)
app.include_router(automations_router.router)
app.include_router(events_router.router)

@app.on_event("startup")
async def startup():
    db = next(get_db())
    automation_engine.automation_engine.start(db)

@app.get("/")
def root():
    return {
        "message": "Smart Home Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
'''

# More routers
SCENES_ROUTER = '''from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import hub_client

router = APIRouter(prefix="/scenes", tags=["scenes"])

@router.get("/")
def list_scenes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scenes = db.query(models.Scene).join(models.Home).filter(
        models.Home.owner_id == current_user.id
    ).all()
    return scenes

@router.post("/{scene_id}/activate")
async def activate_scene(
    scene_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scene = db.query(models.Scene).filter(models.Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    for device_state in scene.device_states:
        await hub_client.send_command(device_state.device.device_id, device_state.state)

    scene.execution_count += 1
    scene.last_executed = datetime.utcnow()
    db.commit()

    return {"message": "Scene activated", "scene": scene}
'''

AUTOMATIONS_ROUTER = '''from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter(prefix="/automations", tags=["automations"])

@router.get("/")
def list_automations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    automations = db.query(models.Automation).join(models.Home).filter(
        models.Home.owner_id == current_user.id
    ).all()
    return automations

@router.patch("/{automation_id}/toggle")
def toggle_automation(
    automation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    automation = db.query(models.Automation).filter(models.Automation.id == automation_id).first()
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")

    automation.enabled = not automation.enabled
    db.commit()

    return automation
'''

EVENTS_ROUTER = '''from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/")
def list_events(
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    events = db.query(models.Event).order_by(models.Event.created_at.desc()).limit(limit).all()
    return events
'''

# =============================================================================
# HUB FILES
# =============================================================================

HUB_DEVICES = '''import random
from datetime import datetime
from typing import Dict, Any

class SimulatedDevice:
    def __init__(self, id: str, name: str, device_type: str, room: str):
        self.id = id
        self.name = name
        self.type = device_type
        self.room = room
        self.online = True
        self.state = self._init_state()

    def _init_state(self) -> Dict[str, Any]:
        if self.type == "light":
            return {"on": False, "brightness": 100, "color_temp": 3000}
        elif self.type == "thermostat":
            return {"temperature": 72, "target_temperature": 72, "mode": "auto"}
        elif self.type == "lock":
            return {"locked": True}
        elif self.type == "motion_sensor":
            return {"motion_detected": False, "last_motion": None}
        return {}

    def send_command(self, command: Dict[str, Any]):
        for key, value in command.items():
            if key in self.state:
                self.state[key] = value
        return self.state

    def simulate_random_change(self):
        if self.type == "motion_sensor":
            if random.random() < 0.1:
                self.state["motion_detected"] = True
                self.state["last_motion"] = datetime.now().isoformat()
                return True
        return False

SIMULATED_DEVICES = [
    SimulatedDevice("light_1", "Living Room Ceiling", "light", "living_room"),
    SimulatedDevice("light_2", "Bedroom Lamp", "light", "bedroom"),
    SimulatedDevice("light_3", "Kitchen Light", "light", "kitchen"),
    SimulatedDevice("thermostat_1", "Main Thermostat", "thermostat", "living_room"),
    SimulatedDevice("lock_1", "Front Door Lock", "lock", "entry"),
    SimulatedDevice("motion_1", "Hallway Motion", "motion_sensor", "hallway"),
]

DEVICES_DICT = {d.id: d for d in SIMULATED_DEVICES}
'''

HUB_MAIN = '''from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import asyncio
from devices import DEVICES_DICT, SIMULATED_DEVICES

app = FastAPI(title="Smart Home Hub", version="1.0.0")

class CommandRequest(BaseModel):
    command: Dict[str, Any]

@app.get("/")
def root():
    return {"message": "Smart Home Hub Service", "devices": len(DEVICES_DICT)}

@app.get("/devices")
def list_devices():
    return [{
        "id": d.id,
        "name": d.name,
        "type": d.type,
        "room": d.room,
        "online": d.online,
        "state": d.state
    } for d in SIMULATED_DEVICES]

@app.get("/devices/{device_id}")
def get_device(device_id: str):
    if device_id not in DEVICES_DICT:
        raise HTTPException(status_code=404, detail="Device not found")

    device = DEVICES_DICT[device_id]
    return {
        "id": device.id,
        "name": device.name,
        "type": device.type,
        "room": device.room,
        "online": device.online,
        "state": device.state
    }

@router.post("/devices/{device_id}/commands")
def send_command(device_id: str, request: CommandRequest):
    if device_id not in DEVICES_DICT:
        raise HTTPException(status_code=404, detail="Device not found")

    device = DEVICES_DICT[device_id]
    new_state = device.send_command(request.command)

    return {"success": True, "device_id": device_id, "state": new_state}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9001)
'''

# =============================================================================
# DOCKER FILES
# =============================================================================

DOCKER_COMPOSE = '''version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: smarthome
      POSTGRES_PASSWORD: smarthome123
      POSTGRES_DB: smarthome
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smarthome"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "9000:9000"
    environment:
      DATABASE_URL: postgresql://smarthome:smarthome123@postgres:5432/smarthome
      HUB_URL: http://hub:9001
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app

  hub:
    build: ./hub
    ports:
      - "9001:9001"
    volumes:
      - ./hub:/app

volumes:
  postgres_data:
'''

BACKEND_DOCKERFILE = '''FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000", "--reload"]
'''

HUB_DOCKERFILE = '''FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9001", "--reload"]
'''

HUB_REQUIREMENTS = '''fastapi==0.104.1
uvicorn[standard]==0.24.0
'''

README = '''# Smart Home Platform

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
curl -X POST http://localhost:9000/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "demo@example.com",
    "password": "demo123",
    "full_name": "Demo User"
  }'
```

4. Login:
```bash
curl -X POST http://localhost:9000/auth/login \\
  -d "username=demo@example.com&password=demo123"
```

## Test Commands

```bash
# List devices from hub
curl http://localhost:9001/devices

# Control a device
curl -X POST http://localhost:9001/devices/light_1/commands \\
  -H "Content-Type: application/json" \\
  -d '{"command": {"on": true, "brightness": 80}}'
```
'''

# =============================================================================
# CREATE ALL FILES
# =============================================================================

def main():
    print("Creating Smart Home Platform Files...")
    print("=" * 60)

    # Backend files
    create_file("backend/hub_client.py", BACKEND_HUB_CLIENT)
    create_file("backend/automation_engine.py", BACKEND_AUTOMATION_ENGINE)
    create_file("backend/main.py", BACKEND_MAIN_UPDATED)

    # Backend routers
    create_file("backend/routers/__init__.py", "")
    create_file("backend/routers/auth_router.py", BACKEND_AUTH_ROUTER)
    create_file("backend/routers/devices_router.py", BACKEND_DEVICES_ROUTER)
    create_file("backend/routers/scenes_router.py", SCENES_ROUTER)
    create_file("backend/routers/automations_router.py", AUTOMATIONS_ROUTER)
    create_file("backend/routers/events_router.py", EVENTS_ROUTER)

    # Backend Docker
    create_file("backend/Dockerfile", BACKEND_DOCKERFILE)

    # Hub files
    create_file("hub/devices.py", HUB_DEVICES)
    create_file("hub/main.py", HUB_MAIN)
    create_file("hub/requirements.txt", HUB_REQUIREMENTS)
    create_file("hub/Dockerfile", HUB_DOCKERFILE)

    # Docker compose
    create_file("docker-compose.yml", DOCKER_COMPOSE)

    # README
    create_file("README.md", README)

    print("=" * 60)
    print("✅ ALL FILES CREATED!")
    print()
    print("Next steps:")
    print("1. cd smart-home-platform")
    print("2. docker-compose up --build")
    print("3. Open http://localhost:9000/docs")

if __name__ == "__main__":
    main()
