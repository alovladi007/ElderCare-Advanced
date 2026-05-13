from fastapi import APIRouter, Depends
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
