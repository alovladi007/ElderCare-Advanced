from fastapi import APIRouter, Depends, HTTPException
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
