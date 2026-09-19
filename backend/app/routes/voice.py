import re
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Patient, Appointment, Prediction
from backend.ml.predict import predict_appointment_risk

router = APIRouter(prefix="/voice", tags=["Voice AI"])

class VoiceDialogueRequest(BaseModel):
    user_speech: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    pending_slot: Optional[Dict[str, Any]] = None
    patient_id: Optional[int] = None
    preferred_language: Optional[str] = "auto" # "auto", "hi", "en"

DOCTOR_SPECIALTY_MAP = {
    "Dr. Sharma": "Cardiology",
    "Dr. Verma": "General Medicine",
    "Dr. Kapoor": "Pediatrics",
    "Dr. Patel": "Orthopedics",
    "Dr. Iyer": "Neurology",
    "Dr. Nair": "Dermatology",
    "Dr. Reddy": "Oncology",
}

DEPARTMENT_DEFAULT_DOCTOR = {
    "cardiology": "Dr. Sharma",
    "pediatrics": "Dr. Kapoor",
    "general medicine": "Dr. Verma",
    "general": "Dr. Verma",
    "orthopedics": "Dr. Patel",
    "ortho": "Dr. Patel",
    "neurology": "Dr. Iyer",
    "dermatology": "Dr. Nair",
    "skin": "Dr. Nair",
    "oncology": "Dr. Reddy",
}

CONFIRMATION_KEYWORDS = [
    "yes", "confirm", "confirm it", "book it", "sure", "theek hai", "haan", "ha", 
    "please do", "okay", "ok", "proceed", "go ahead", "lock it", "do it", "yep", 
    "yeah", "definitely", "kardo", "kar do", "theek", "pakka"
]

CANCELLATION_KEYWORDS = [
    "cancel", "stop", "reset", "start over", "no", "nah", "change", "wait", 
    "nahi", "mat karo", "ruko", "badlo"
]

HINDI_TRIGGER_WORDS = [
    "namaste", "mujhe", "karna", "hai", "karo", "chahiye", "subah", "dopahar", 
    "shaam", "kal", "aaj", "parso", "theek", "haan", "batao", "milna", "baje", 
    "samay", "kripya", "dhanyawaad", "kijiye", "bataiye", "mein", "ka", "ki", 
    "ke", "se", "nahi", "kardo", "hoga", "shukriya"
]

def detect_language(text: str, pref: Optional[str] = "auto", pending_lang: Optional[str] = None) -> str:
    if pref and pref in ["hi", "en"]:
        return pref
    # Check Devanagari Unicode
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"
    # Clean punctuation and check words
    text_clean = re.sub(r'[^\w\s]', ' ', text.lower())
    words = set(text_clean.split())
    for trigger in HINDI_TRIGGER_WORDS:
        if trigger in words or trigger in text_clean:
            return "hi"
    if pending_lang:
        return pending_lang
    return "en"

def parse_date_expression(text: str) -> str:
    text_lower = text.lower()
    today = date.today()
    
    if "day after tomorrow" in text_lower or "parso" in text_lower:
        return (today + timedelta(days=2)).isoformat()
    if "tomorrow" in text_lower or "kal" in text_lower:
        return (today + timedelta(days=1)).isoformat()
    if "today" in text_lower or "aaj" in text_lower:
        return today.isoformat()
    
    # Weekday check
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for idx, day in enumerate(weekdays):
        if day in text_lower:
            days_ahead = idx - today.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            return (today + timedelta(days=days_ahead)).isoformat()
            
    # Default to tomorrow for bookings
    return (today + timedelta(days=1)).isoformat()

def parse_time_expression(text: str) -> str:
    text_lower = text.lower()
    
    # Check for explicit times like 10:30, 11:00 AM, 4 PM, etc.
    time_match = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', text_lower)
    if time_match:
        hour = int(time_match.group(1))
        minute = time_match.group(2) or "00"
        meridiem = time_match.group(3)
        
        if meridiem:
            meridiem = meridiem.upper()
        else:
            meridiem = "PM" if hour in [1, 2, 3, 4, 5, 6] else "AM"
            
        return f"{hour:02d}:{minute} {meridiem}"
        
    if "morning" in text_lower or "subah" in text_lower:
        return "10:30 AM"
    if "afternoon" in text_lower or "dopahar" in text_lower:
        return "02:30 PM"
    if "evening" in text_lower or "shaam" in text_lower:
        return "05:00 PM"
        
    return "10:30 AM"

@router.post("/ai-dialogue")
def voice_ai_dialogue(req: VoiceDialogueRequest, db: Session = Depends(get_db)):
    speech = req.user_speech.strip()
    speech_lower = speech.lower()
    pending_lang = req.pending_slot.get("language") if req.pending_slot else None
    lang = detect_language(speech, req.preferred_language, pending_lang)
    
    # Get or default patient
    patient = None
    if req.patient_id:
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient and req.pending_slot and req.pending_slot.get("patient_id"):
        patient = db.query(Patient).filter(Patient.id == req.pending_slot["patient_id"]).first()
    if not patient:
        patient = db.query(Patient).first()
    if not patient:
        raise HTTPException(status_code=400, detail="No patients available in clinic database")

    # 1. Handle Cancellation / Reset
    if any(k in speech_lower for k in CANCELLATION_KEYWORDS) and not any(k in speech_lower for k in CONFIRMATION_KEYWORDS):
        if lang == "hi":
            cancel_msg = "Koi baat nahi, maine wah cancel kar diya hai. Aap kin doctor se milna chahte hain? Dr. Sharma ya Dr. Kapoor?"
        else:
            cancel_msg = "No problem, I have cancelled that request. Who would you like to see, or what medical department can I help you with?"
            
        return {
            "ai_response": cancel_msg,
            "status": "COLLECTING_INFO",
            "language": lang,
            "pending_slot": None,
            "booked_appointment": None
        }

    # 2. Check if we are confirming an existing pending slot
    if req.pending_slot and any(k in speech_lower for k in CONFIRMATION_KEYWORDS):
        slot = req.pending_slot
        booking_date = date.today().isoformat()
        
        # Calculate days in advance
        try:
            b_dt = date.today()
            a_dt = datetime.strptime(slot["appointment_date"], "%Y-%m-%d").date()
            days_advance = max(0, (a_dt - b_dt).days)
        except Exception:
            days_advance = 1

        appointment = Appointment(
            patient_id=patient.id,
            doctor_name=slot.get("doctor_name", "Dr. Sharma"),
            department=slot.get("department", "Cardiology"),
            appointment_date=slot.get("appointment_date", (date.today() + timedelta(days=1)).isoformat()),
            appointment_time=slot.get("appointment_time", "10:30 AM"),
            appointment_type="Consultation",
            booking_date=booking_date,
            days_in_advance=days_advance,
            status="Scheduled",
            confirmation_status="Confirmed",
            notes=f"Booked via Voice AI ({lang.upper()}) for {patient.first_name} {patient.last_name}"
        )
        db.add(appointment)
        db.flush()

        # Run real ML risk model
        pred_data = {
            "age": patient.age,
            "gender": patient.gender,
            "chronic_condition": patient.chronic_condition,
            "distance_km": patient.distance_km,
            "insurance_type": patient.insurance_type,
            "previous_no_shows": patient.missed_appointments,
            "previous_attendance_rate": patient.attendance_rate,
            "appointment_date": appointment.appointment_date,
            "appointment_time": appointment.appointment_time,
            "department": appointment.department,
            "doctor_name": appointment.doctor_name,
            "appointment_type": appointment.appointment_type,
            "days_in_advance": days_advance,
            "sms_reminder_sent": True,
            "email_reminder_sent": False
        }
        prediction_result = predict_appointment_risk(pred_data)

        prediction = Prediction(
            appointment_id=appointment.id,
            risk_probability=prediction_result["risk_probability"],
            risk_level=prediction_result["risk_level"],
            top_factors=prediction_result["top_factors"],
            recommended_action=prediction_result["recommended_action"],
            estimated_impact_prob=prediction_result["estimated_impact_prob"]
        )
        db.add(prediction)
        db.commit()
        db.refresh(appointment)

        readable_date = datetime.strptime(appointment.appointment_date, "%Y-%m-%d").strftime("%A, %B %d")
        
        if lang == "hi":
            response_text = (
                f"Bahut badhiya! {patient.first_name} ka appointment {appointment.doctor_name} ke sath "
                f"{appointment.department} mein {readable_date} ko {appointment.appointment_time} baje confirm ho gaya hai. "
                f"Aapka booking reference number {appointment.id} hai. "
                f"Aapke mobile par confirmation bhej diya gaya hai. Dhanyawaad!"
            )
        else:
            response_text = (
                f"Wonderful! Your appointment with {appointment.doctor_name} in {appointment.department} "
                f"for {readable_date} at {appointment.appointment_time} is now confirmed. "
                f"Your appointment reference is number {appointment.id}. "
                f"A confirmation has been sent to your registered mobile. Have a great day!"
            )

        return {
            "ai_response": response_text,
            "status": "CONFIRMED",
            "language": lang,
            "pending_slot": None,
            "booked_appointment": {
                "id": appointment.id,
                "doctor_name": appointment.doctor_name,
                "department": appointment.department,
                "appointment_date": appointment.appointment_date,
                "appointment_time": appointment.appointment_time,
                "patient_name": f"{patient.first_name} {patient.last_name}",
                "risk_level": prediction.risk_level,
                "risk_probability": prediction.risk_probability
            }
        }

    # 3. Extract Doctor
    extracted_doctor = None
    for doc in DOCTOR_SPECIALTY_MAP.keys():
        doc_simple = doc.lower().replace("dr. ", "")
        if doc.lower() in speech_lower or doc_simple in speech_lower:
            extracted_doctor = doc
            break

    # 4. Extract Department
    extracted_dept = None
    for dept_key, doc_val in DEPARTMENT_DEFAULT_DOCTOR.items():
        if dept_key in speech_lower:
            extracted_dept = dept_key.title()
            if not extracted_doctor:
                extracted_doctor = doc_val
            break

    # If doctor is known but not department, infer it
    if extracted_doctor and not extracted_dept:
        extracted_dept = DOCTOR_SPECIALTY_MAP.get(extracted_doctor, "General Medicine")

    # If department is known but not doctor, infer it
    if extracted_dept and not extracted_doctor:
        extracted_doctor = DEPARTMENT_DEFAULT_DOCTOR.get(extracted_dept.lower(), "Dr. Sharma")

    # Extract date & time
    extracted_date = parse_date_expression(speech)
    extracted_time = parse_time_expression(speech)

    # 5. If we have both doctor and department, propose slot and ask for confirmation
    if extracted_doctor and extracted_dept:
        readable_date = datetime.strptime(extracted_date, "%Y-%m-%d").strftime("%A, %B %d")
        slot = {
            "doctor_name": extracted_doctor,
            "department": extracted_dept,
            "appointment_date": extracted_date,
            "appointment_time": extracted_time,
            "patient_id": patient.id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "language": lang
        }
        
        if lang == "hi":
            reply = (
                f"Maine {readable_date} ko {extracted_time} baje {extracted_doctor} ke sath "
                f"{extracted_dept} mein aapka slot check kiya hai. "
                f"Kya main {patient.first_name} ke liye ise book kar doon?"
            )
        else:
            reply = (
                f"I found an open slot at {extracted_time} on {readable_date} "
                f"with {extracted_doctor} in {extracted_dept}. "
                f"Would you like me to confirm this booking for {patient.first_name}?"
            )

        return {
            "ai_response": reply,
            "status": "AWAITING_CONFIRMATION",
            "language": lang,
            "pending_slot": slot,
            "booked_appointment": None
        }

    # 6. Fallback inquiry if insufficient parameters
    if lang == "hi":
        fallback_msg = (
            "Namaste! Main SlotSure Clinic AI reception hoon. Main aapka appointment abhi schedule kar sakti hoon. "
            "Aap kin doctor se milna chahte hain? Jaise ki Cardiology mein Dr. Sharma, ya Pediatrics mein Dr. Kapoor?"
        )
    else:
        fallback_msg = (
            "Namaste! This is SlotSure Clinic AI. I can schedule your visit right now. "
            "Which doctor or department would you like to visit? For example, Dr. Sharma in Cardiology, "
            "Dr. Kapoor in Pediatrics, or Dr. Verma in General Medicine?"
        )

    return {
        "ai_response": fallback_msg,
        "status": "COLLECTING_INFO",
        "language": lang,
        "pending_slot": None,
        "booked_appointment": None
    }


# ==========================================
# OUTBOUND AI PHONE CALL CONFIRMATION & IVR
# ==========================================

class OutboundCallRequest(BaseModel):
    appointment_id: int
    phone_number: str
    mode: Optional[str] = "simulator" # "simulator" or "twilio"
    language: Optional[str] = "en"    # "en" or "hi"
    twilio_sid: Optional[str] = None
    twilio_token: Optional[str] = None
    twilio_from: Optional[str] = None

class RecordCallResultRequest(BaseModel):
    appointment_id: int
    phone_number: str
    digits_pressed: str # "1" or "2"
    duration_seconds: int
    notes: Optional[str] = None

class TelephonyConfigRequest(BaseModel):
    twilio_sid: str
    twilio_token: str
    twilio_from: str

@router.post("/telephony-config")
def save_telephony_config(config: TelephonyConfigRequest):
    import os
    os.environ["TWILIO_ACCOUNT_SID"] = config.twilio_sid.strip()
    os.environ["TWILIO_AUTH_TOKEN"] = config.twilio_token.strip()
    os.environ["TWILIO_PHONE_NUMBER"] = config.twilio_from.strip()
    return {"success": True, "message": "Telephony credentials saved successfully"}

@router.get("/telephony-config")
def get_telephony_config():
    import os
    sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    has_token = bool(os.getenv("TWILIO_AUTH_TOKEN", ""))
    phone = os.getenv("TWILIO_PHONE_NUMBER", "")
    return {
        "is_configured": bool(sid and has_token and phone),
        "twilio_sid_masked": f"{sid[:6]}...{sid[-4:]}" if len(sid) > 10 else "",
        "twilio_from": phone
    }

@router.post("/outbound-call")
def initiate_outbound_call(req: OutboundCallRequest, db: Session = Depends(get_db)):
    app = db.query(Appointment).filter(Appointment.id == req.appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    patient = app.patient
    if not patient:
        patient = db.query(Patient).filter(Patient.id == app.patient_id).first()

    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"
    missed_count = patient.missed_appointments if patient else 0
    
    # Format readable appointment date
    try:
        readable_date = datetime.strptime(app.appointment_date, "%Y-%m-%d").strftime("%A, %B %d")
    except Exception:
        readable_date = app.appointment_date

    # Prepare professional clinical script incorporating previous missed appointments
    if req.language == "hi":
        if missed_count > 0:
            missed_clause = f"Hamare clinical records ke mutabiq aapka pichhla {missed_count} appointment miss hua tha. "
        else:
            missed_clause = ""
        script = (
            f"Namaste {patient.first_name if patient else ''} ji. Yeh SlotSure Clinic se ek automated priority confirmation call hai. "
            f"Aapka aane wala appointment {app.doctor_name} ke sath {app.department} mein {readable_date} ko {app.appointment_time} baje scheduled hai. "
            f"{missed_clause}"
            f"Apne reserved slot ko surakshit karne aur aane ki pushti ke liye, kripya 1 dabayein. "
            f"Yadi aap nahi aa sakte aur slot cancel karna chahte hain, toh kripya 2 dabayein."
        )
    else:
        if missed_count == 1:
            missed_clause = "Our clinic records note 1 previously missed visit. "
        elif missed_count > 1:
            missed_clause = f"Our clinic records note {missed_count} previously missed visits. "
        else:
            missed_clause = "To ensure proper clinical capacity and doctor availability, "
            
        script = (
            f"Hello {patient.first_name if patient else ''}, this is an automated priority confirmation call from SlotSure Healthcare "
            f"regarding your upcoming appointment with {app.doctor_name} in {app.department} on {readable_date} at {app.appointment_time}. "
            f"{missed_clause}"
            f"To protect your reserved slot and confirm your attendance, please press 1. "
            f"If you are unable to attend and need to release this slot for an urgent patient, please press 2."
        )

    import uuid
    import os
    call_sid = f"CA-{uuid.uuid4().hex[:12]}"
    twilio_dispatched = False
    twilio_error = None

    # Check if Twilio credentials exist from request or environment
    twilio_sid = (req.twilio_sid or os.getenv("TWILIO_ACCOUNT_SID", "")).strip()
    twilio_token = (req.twilio_token or os.getenv("TWILIO_AUTH_TOKEN", "")).strip()
    twilio_from = (req.twilio_from or os.getenv("TWILIO_PHONE_NUMBER", "")).strip()

    # Strict E.164 sanitization (Twilio rejects phone numbers with spaces or dashes for trial accounts)
    raw_to = re.sub(r"[^\d+]", "", req.phone_number.strip())
    if not raw_to.startswith("+"):
        if raw_to.startswith("91") and len(raw_to) == 12:
            to_number = "+" + raw_to
        elif len(raw_to) == 10:
            to_number = "+91" + raw_to
        else:
            to_number = "+" + raw_to
    else:
        to_number = raw_to

    if req.mode == "twilio":
        if not (twilio_sid and twilio_token and twilio_from):
            twilio_error = "Missing Twilio credentials. Please enter Account SID, Auth Token, and Twilio Phone Number in the settings panel."
        else:
            try:
                import urllib.parse
                from twilio.rest import Client
                twilio_client = Client(twilio_sid, twilio_token)
                
                ivr_xml = f"""<Response>
                    <Gather numDigits="1" timeout="10" action="https://twimlets.com/echo?Twiml=%3CResponse%3E%3CSay%20voice%3D%22Polly.Aditi%22%20language%3D%22en-IN%22%3EThank%20you.%20Your%20touchtone%20response%20has%20been%20registered%20on%20SlotSure.%20Goodbye.%3C%2FSay%3E%3C%2FResponse%3E">
                        <Say voice="Polly.Aditi" language="en-IN">{script}</Say>
                    </Gather>
                    <Say voice="Polly.Aditi" language="en-IN">We did not receive any keypress. Please call clinic reception back. Goodbye.</Say>
                </Response>"""
                echo_url = "https://twimlets.com/echo?Twiml=" + urllib.parse.quote(ivr_xml)

                # Create actual outbound Twilio call using url parameter (works on all Twilio trial & paid accounts)
                call = twilio_client.calls.create(
                    to=to_number,
                    from_=twilio_from,
                    url=echo_url
                )
                call_sid = call.sid
                twilio_dispatched = True
            except Exception as e:
                clean_err = re.sub(r'\x1b\[[0-9;]*m', '', str(e)).strip()
                twilio_error = clean_err

    return {
        "call_sid": call_sid,
        "status": "INITIATED",
        "appointment_id": app.id,
        "patient_name": patient_name,
        "doctor_name": app.doctor_name,
        "department": app.department,
        "appointment_date": app.appointment_date,
        "appointment_time": app.appointment_time,
        "phone_number": to_number if req.mode == "twilio" else req.phone_number,
        "missed_appointments_count": missed_count,
        "script": script,
        "twilio_dispatched": twilio_dispatched,
        "twilio_error": twilio_error,
        "mode": req.mode
    }

@router.post("/record-call-result")
def record_call_result(req: RecordCallResultRequest, db: Session = Depends(get_db)):
    app = db.query(Appointment).filter(Appointment.id == req.appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")

    from ..models import SlotRecovery
    patient = app.patient

    if req.digits_pressed == "1":
        # Confirmed Attendance
        app.confirmation_status = "Confirmed"
        app.recovery_status = "Normal"
        note_text = f" [AI Phone Call to {req.phone_number}: Confirmed via Key 1 ({req.duration_seconds}s)]"
        app.notes = (app.notes or "") + note_text
        
        # Dismiss any proposed recovery
        rec = db.query(SlotRecovery).filter(
            SlotRecovery.appointment_id == app.id,
            SlotRecovery.status == "Proposed"
        ).first()
        if rec:
            rec.status = "Dismissed"

        outcome = "CONFIRMED"
        outcome_label = "Attendance Confirmed (Key 1 Pressed)"
        spoken_response = f"Thank you! Your attendance with {app.doctor_name} has been confirmed. We look forward to seeing you. Goodbye."
        capacity_action = "Capacity Secured"
        revenue_protected = 3500

    elif req.digits_pressed == "2":
        # Cancelled & Slot Freed for Recovery
        app.confirmation_status = "Cancelled"
        app.recovery_status = "At_Risk"
        note_text = f" [AI Phone Call to {req.phone_number}: Cancelled via Key 2 ({req.duration_seconds}s)]"
        app.notes = (app.notes or "") + note_text

        # Create or update slot recovery item
        existing_rec = db.query(SlotRecovery).filter(SlotRecovery.appointment_id == app.id).first()
        if not existing_rec:
            new_rec = SlotRecovery(
                appointment_id=app.id,
                doctor_name=app.doctor_name,
                department=app.department,
                slot_time=f"{app.appointment_date} {app.appointment_time}",
                risk_level="HIGH",
                recommended_strategy="Backfill from Waitlist",
                revenue_at_risk=3500,
                status="Proposed"
            )
            db.add(new_rec)

        outcome = "CANCELLED_FREED"
        outcome_label = "Slot Released for Recovery (Key 2 Pressed)"
        spoken_response = "Your appointment has been cancelled and the slot has been released for an urgent patient. If you need to reschedule, please call clinic reception. Goodbye."
        capacity_action = "Slot Released to Recovery Queue"
        revenue_protected = 0

    else:
        outcome = "NO_RESPONSE"
        outcome_label = "No Valid Key Pressed"
        spoken_response = "We did not receive a valid touchtone response. Clinic staff will follow up."
        capacity_action = "Requires Manual Followup"
        revenue_protected = 0

    db.commit()
    db.refresh(app)

    return {
        "success": True,
        "outcome": outcome,
        "outcome_label": outcome_label,
        "spoken_response": spoken_response,
        "appointment_id": app.id,
        "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Patient",
        "doctor_name": app.doctor_name,
        "department": app.department,
        "confirmation_status": app.confirmation_status,
        "recovery_status": app.recovery_status,
        "phone_number": req.phone_number,
        "digits_pressed": req.digits_pressed,
        "duration_seconds": req.duration_seconds,
        "capacity_action": capacity_action,
        "revenue_protected": revenue_protected,
        "timestamp": datetime.now().strftime("%I:%M %p")
    }

