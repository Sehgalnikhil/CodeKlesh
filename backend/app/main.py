import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, patients, appointments, predict, reminders, analytics, models_info, waitlist, slot_recovery

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SlotSure API",
    description="AI Missed Appointment Predictor & Smart Slot Recovery Platform",
    version="2.0.0"
)

# Enable CORS for local dev and production frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(predict.router)
app.include_router(reminders.router)
app.include_router(waitlist.router)
app.include_router(slot_recovery.router)
app.include_router(analytics.router)
app.include_router(models_info.router)

@app.get("/")
def root():
    return {
        "app": "AttendAI",
        "tagline": "Missed Appointment Predictor",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
