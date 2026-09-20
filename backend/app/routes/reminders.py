import json
import os
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Response
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

    twilio_wa_content_sid = os.getenv("TWILIO_WHATSAPP_CONTENT_SID", "HXfe5ab5f00277942d4d4200328b4d403c").strip()
    twilio_wa_from = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+17372508034").strip()

    # 1. Dispatch WhatsApp (Twilio Official Content Template -> Local Gateway Fallback)
    if reminder_in.channel == "WhatsApp":
        dispatched_wa = False

        # Attempt Twilio WhatsApp Business Template first
        if account_sid and auth_token and twilio_wa_content_sid:
            try:
                from twilio.rest import Client
                client = Client(account_sid, auth_token)
                
                # Format friendly date/time for template variables
                # Template body: "Reminder: Appt {{1}}, {{2}}. Reply C to confirm or R to reschedule. Test message from Twilio."
                date_label = str(appointment.appointment_date)
                time_label = str(appointment.appointment_time)
                content_vars = json.dumps({"1": date_label, "2": time_label})

                msg = client.messages.create(
                    to=f"whatsapp:{clean_to}",
                    from_=twilio_wa_from,
                    content_sid=twilio_wa_content_sid,
                    content_variables=content_vars
                )
                notes += f" (Dispatched via Twilio WhatsApp: {msg.sid})"
                dispatched_wa = True
                print(f"✅ Twilio WhatsApp message queued! SID: {msg.sid} with variables ({date_label}, {time_label})")
            except Exception as tw_err:
                print(f"Twilio WhatsApp template notice: {tw_err}")

        # If Twilio not configured or encountered error, fallback to local Baileys Gateway
        if not dispatched_wa:
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
                    notes += " (Dispatched via Local WhatsApp Gateway)"
                    dispatched_wa = True
            except Exception:
                pass

    # 2. Dispatch Carrier SMS
    elif reminder_in.channel == "SMS" and account_sid and auth_token and from_phone:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            
            try:
                sms_body = (
                    f"SlotSure Clinic Reminder: Hello {patient.first_name}, you have an appointment with "
                    f"{appointment.doctor_name} on {appointment.appointment_date} at {appointment.appointment_time}. "
                    f"Reply 1 to Confirm or 2 to Cancel."
                )
                sms_msg = client.messages.create(to=clean_to, from_=from_phone, body=sms_body)
            except Exception as primary_err:
                # Fallback to Twilio Trial approved template keyword (avoids Error 572006)
                print(f"Twilio custom SMS notice: {primary_err}. Falling back to approved trial template...")
                sms_msg = client.messages.create(to=clean_to, from_=from_phone, body="sms_appointment_reminders")

            notes += f" (Dispatched via Twilio SMS: {sms_msg.sid})"
            print(f"✅ Twilio SMS queued! SID: {sms_msg.sid}")
        except Exception as err:
            print(f"Carrier SMS notification notice: {err}")


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

@router.post("/whatsapp/incoming")
async def incoming_whatsapp_reply(request: Request, db: Session = Depends(get_db)):
    """
    Twilio Webhook for incoming WhatsApp replies.
    When patient replies 'C' (Confirm) or 'R' (Reschedule),
    SlotSure updates the appointment in DB and returns an instant confirmation/cancellation response message!
    """
    form_data = await request.form()
    from_wa = form_data.get("From", "") # e.g. "whatsapp:+917027635901"
    body = (form_data.get("Body") or "").strip()

    print(f"📩 Incoming WhatsApp reply from {from_wa}: '{body}'")

    raw_digits = "".join(filter(str.isdigit, from_wa))
    last_10 = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits

    # Look up patient by phone
    patient = db.query(Patient).filter(
        (Patient.phone.contains(last_10)) | (Patient.phone == from_wa.replace("whatsapp:", ""))
    ).first()

    latest_appt = None
    if patient:
        latest_appt = db.query(Appointment).filter(
            Appointment.patient_id == patient.id
        ).order_by(Appointment.id.desc()).first()

    text_lower = body.lower().strip()
    is_confirm = text_lower in ["c", "1", "confirm", "yes", "confirmed", "y"] or "confirm" in text_lower
    is_reschedule = text_lower in ["r", "2", "reschedule", "cancel", "no", "cancelled", "n"] or "reschedule" in text_lower or "cancel" in text_lower

    patient_name = patient.first_name if patient else "Patient"
    doctor_name = latest_appt.doctor_name if latest_appt else "your doctor"
    appt_date = latest_appt.appointment_date if latest_appt else "your appointment date"
    appt_time = latest_appt.appointment_time if latest_appt else "scheduled time"

    if is_confirm:
        if latest_appt:
            latest_appt.confirmation_status = "Confirmed"
            if latest_appt.prediction:
                latest_appt.prediction.risk_level = "LOW"
                latest_appt.prediction.risk_probability = 0.12
            db.commit()

        reply_message = (
            f"🏥 *SlotSure Clinic* ✅\n\n"
            f"Thank you *{patient_name}*! Your appointment with *{doctor_name}* on *{appt_date}* at *{appt_time}* has been successfully *CONFIRMED*.\n\n"
            f"📍 *Location:* SlotSure Central Clinic\n"
            f"We look forward to seeing you!"
        )
    elif is_reschedule:
        if latest_appt:
            latest_appt.confirmation_status = "Cancelled"
            latest_appt.recovery_status = "Recovery Queued"
            db.commit()

        reply_message = (
            f"🏥 *SlotSure Clinic* 🗓️\n\n"
            f"Hello *{patient_name}*, your appointment with *{doctor_name}* has been *CANCELLED* and queued for rescheduling.\n\n"
            f"Our clinical coordinator will reach out shortly with upcoming openings."
        )
    else:
        reply_message = (
            f"🏥 *SlotSure Clinic*\n\n"
            f"Hello *{patient_name}*, please reply with:\n"
            f"1️⃣ Reply *C* (or *1*) to *CONFIRM*\n"
            f"2️⃣ Reply *R* (or *2*) to *RESCHEDULE*"
        )

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{reply_message}</Message>
</Response>"""
    return Response(content=twiml, media_type="application/xml")

