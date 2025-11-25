import random
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
