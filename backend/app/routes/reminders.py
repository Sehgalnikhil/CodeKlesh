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
    notes = reminder_in.notes or f"Automated {reminder_in.channel} reminder triggered by clinic staff"

    # Attempt real carrier dispatch if Twilio credentials are configured
    import os
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    from_phone = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

    # 1. Check Local Baileys WhatsApp Gateway for automated delivery
    target_raw_phone = (reminder_in.phone or patient.phone or "+917027635901").strip()
    clean_to = target_raw_phone.replace(" ", "").replace("-", "")
    if not clean_to.startswith("+"):
        clean_to = f"+91{clean_to.lstrip('0')}"

    if reminder_in.channel == "WhatsApp":
        wa_body = (
            f"🏥 *SlotSure Clinic Appointment Confirmation*\n\n"
            f"Hello *{patient.first_name} {patient.last_name}*, you have an upcoming consultation:\n"
            f"👨‍⚕️ *Doctor:* {appointment.doctor_name} ({appointment.department})\n"
            f"📅 *Date:* {appointment.appointment_date}\n"
            f"⏰ *Time:* {appointment.appointment_time}\n\n"
            f"Please reply *1* to CONFIRM or *2* to RESCHEDULE.\n"
            f"_SlotSure Healthcare Engine_"
        )
        try:
            import requests
            gw_res = requests.post(
                "http://127.0.0.1:5005/send",
                json={"phone": clean_to, "message": wa_body},
                timeout=3
            )
            if gw_res.status_code == 200 and gw_res.json().get("success"):
                notes += " (Dispatched via Local WhatsApp Web Gateway)"
        except Exception:
            pass

    # 2. Check Twilio Carrier (SMS or WhatsApp Sandbox fallback)
    if account_sid and auth_token:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)

            if reminder_in.channel == "SMS" and from_phone:
                sms_body = (
                    f"SlotSure Clinic Reminder: Hello {patient.first_name}, you have an appointment with "
                    f"{appointment.doctor_name} on {appointment.appointment_date} at {appointment.appointment_time}. "
                    f"Reply 1 to Confirm or 2 to Cancel."
                )
                client.messages.create(to=clean_to, from_=from_phone, body=sms_body)
                notes += " (Dispatched via Twilio SMS carrier)"

            elif reminder_in.channel == "WhatsApp" and "Local WhatsApp" not in notes:
                try:
                    client.messages.create(to=f"whatsapp:{clean_to}", from_="whatsapp:+14155238886", body=wa_body)
                    notes += " (Dispatched via Twilio WhatsApp Gateway)"
                except Exception:
                    pass
        except Exception as err:
            print(f"Carrier notification notice: {err}")

    reminder = Reminder(
        appointment_id=reminder_in.appointment_id,
        patient_id=reminder_in.patient_id,
        channel=reminder_in.channel or "SMS",
        status="Sent",
        scheduled_for=reminder_in.scheduled_for or "24 hours before appointment",
        sent_at=now,
        notes=notes
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder
