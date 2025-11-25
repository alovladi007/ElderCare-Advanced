from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/")
def list_alerts(
    status: str = None,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Alert)

    if status:
        query = query.filter(models.Alert.status == status)

    alerts = query.order_by(models.Alert.created_at.desc()).limit(limit).all()
    return alerts
