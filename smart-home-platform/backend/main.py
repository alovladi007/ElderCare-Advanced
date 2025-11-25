from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, Base
import models
from routers import auth_router, devices_router, scenes_router, automations_router, events_router, alerts_router
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
app.include_router(alerts_router.router)

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
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
