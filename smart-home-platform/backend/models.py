from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class HomeMode(str, enum.Enum):
    HOME = "home"
    AWAY = "away"
    SLEEP = "sleep"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    homes = relationship("Home", back_populates="owner")

class Home(Base):
    __tablename__ = "homes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String)
    mode = Column(SQLEnum(HomeMode), default=HomeMode.HOME)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="homes")
    rooms = relationship("Room", back_populates="home", cascade="all, delete-orphan")
    scenes = relationship("Scene", back_populates="home", cascade="all, delete-orphan")
    automations = relationship("Automation", back_populates="home", cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    home_id = Column(Integer, ForeignKey("homes.id"))
    icon = Column(String)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    home = relationship("Home", back_populates="rooms")
    devices = relationship("Device", back_populates="room", cascade="all, delete-orphan")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    device_type = Column(String, nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    state = Column(JSON)
    capabilities = Column(JSON)
    online = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    room = relationship("Room", back_populates="devices")
    scene_states = relationship("SceneDeviceState", back_populates="device")
    events = relationship("Event", back_populates="device")

class Scene(Base):
    __tablename__ = "scenes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    icon = Column(String)
    home_id = Column(Integer, ForeignKey("homes.id"))
    favorite = Column(Boolean, default=False)
    execution_count = Column(Integer, default=0)
    last_executed = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    home = relationship("Home", back_populates="scenes")
    device_states = relationship("SceneDeviceState", back_populates="scene", cascade="all, delete-orphan")

class SceneDeviceState(Base):
    __tablename__ = "scene_device_states"

    id = Column(Integer, primary_key=True, index=True)
    scene_id = Column(Integer, ForeignKey("scenes.id"))
    device_id = Column(Integer, ForeignKey("devices.id"))
    state = Column(JSON, nullable=False)
    delay_ms = Column(Integer, default=0)

    scene = relationship("Scene", back_populates="device_states")
    device = relationship("Device", back_populates="scene_states")

class Automation(Base):
    __tablename__ = "automations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    home_id = Column(Integer, ForeignKey("homes.id"))
    execution_count = Column(Integer, default=0)
    last_executed = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    home = relationship("Home", back_populates="automations")
    triggers = relationship("AutomationTrigger", back_populates="automation", cascade="all, delete-orphan")
    conditions = relationship("AutomationCondition", back_populates="automation", cascade="all, delete-orphan")
    actions = relationship("AutomationAction", back_populates="automation", cascade="all, delete-orphan")

class AutomationTrigger(Base):
    __tablename__ = "automation_triggers"

    id = Column(Integer, primary_key=True, index=True)
    automation_id = Column(Integer, ForeignKey("automations.id"))
    trigger_type = Column(String, nullable=False)
    config = Column(JSON)

    automation = relationship("Automation", back_populates="triggers")

class AutomationCondition(Base):
    __tablename__ = "automation_conditions"

    id = Column(Integer, primary_key=True, index=True)
    automation_id = Column(Integer, ForeignKey("automations.id"))
    condition_type = Column(String, nullable=False)
    config = Column(JSON)

    automation = relationship("Automation", back_populates="conditions")

class AutomationAction(Base):
    __tablename__ = "automation_actions"

    id = Column(Integer, primary_key=True, index=True)
    automation_id = Column(Integer, ForeignKey("automations.id"))
    action_type = Column(String, nullable=False)
    config = Column(JSON)
    delay_ms = Column(Integer, default=0)

    automation = relationship("Automation", back_populates="actions")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    automation_id = Column(Integer, ForeignKey("automations.id"), nullable=True)
    scene_id = Column(Integer, ForeignKey("scenes.id"), nullable=True)
    data = Column(JSON)
    severity = Column(String, default="info")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    device = relationship("Device", back_populates="events")
