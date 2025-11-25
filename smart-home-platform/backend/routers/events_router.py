from fastapi import APIRouter, Depends
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
