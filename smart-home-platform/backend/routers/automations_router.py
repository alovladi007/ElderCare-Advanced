from fastapi import APIRouter, Depends
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
