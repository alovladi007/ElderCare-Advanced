from fastapi import FastAPI, HTTPException
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

@app.post("/devices/{device_id}/commands")
def send_command(device_id: str, request: CommandRequest):
    if device_id not in DEVICES_DICT:
        raise HTTPException(status_code=404, detail="Device not found")

    device = DEVICES_DICT[device_id]
    new_state = device.send_command(request.command)

    return {"success": True, "device_id": device_id, "state": new_state}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9001)
