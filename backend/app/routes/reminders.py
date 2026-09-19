from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Reminder, Appointment, Patient, Prediction
from ..schemas import ReminderCreate, ReminderResponse

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.get("", response_model=List[ReminderResponse])
def list_reminders(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Reminder).options(
        joinedload(Reminder.patient)
    ).order_by(Reminder.id.desc()).limit(limit).all()

@router.post("", response_model=ReminderResponse)
def dispatch_reminder(
    reminder_in: ReminderCreate,
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == reminder_in.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = db.query(Patient).filter(Patient.id == reminder_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Mark appointment notification sent
    appointment.sms_reminder_sent = True

    # If prediction exists, apply intervention impact to reflect reduced probability
    if appointment.prediction:
        if appointment.prediction.estimated_impact_prob:
            appointment.prediction.risk_probability = appointment.prediction.estimated_impact_prob
            if appointment.prediction.risk_probability < 0.35:
                appointment.prediction.risk_level = "LOW"
            elif appointment.prediction.risk_probability < 0.65:
                appointment.prediction.risk_level = "MEDIUM"

    now = datetime.utcnow()
    reminder = Reminder(
        appointment_id=reminder_in.appointment_id,
        patient_id=reminder_in.patient_id,
        channel=reminder_in.channel or "SMS",
        status="Sent",
        scheduled_for=reminder_in.scheduled_for or "24 hours before appointment",
        sent_at=now,
        notes=reminder_in.notes or f"Automated {reminder_in.channel} reminder triggered by clinic staff"
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder
