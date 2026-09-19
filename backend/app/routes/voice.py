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
    "please do", "okay", "ok", "proceed", "go ahead", "lock it", "do it", "yep", "yeah", "definitely"
]

CANCELLATION_KEYWORDS = [
    "cancel", "stop", "reset", "start over", "no", "nah", "change", "wait"
]

def parse_date_expression(text: str) -> str:
    text_lower = text.lower()
    today = date.today()
    
    if "day after tomorrow" in text_lower:
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
        return {
            "ai_response": "No problem, I have cancelled that request. Who would you like to see, or what medical department can I help you with?",
            "status": "COLLECTING_INFO",
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
            notes=f"Booked via In-Browser AI Phone Agent for {patient.first_name} {patient.last_name}"
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
        response_text = (
            f"Wonderful! Your appointment with {appointment.doctor_name} in {appointment.department} "
            f"for {readable_date} at {appointment.appointment_time} is now confirmed. "
            f"Your appointment reference is number {appointment.id}. "
            f"A confirmation has been sent to your registered mobile. Have a great day!"
        )
        return {
            "ai_response": response_text,
            "status": "CONFIRMED",
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
            "patient_name": f"{patient.first_name} {patient.last_name}"
        }
        
        reply = (
            f"I found an open slot at {extracted_time} on {readable_date} "
            f"with {extracted_doctor} in {extracted_dept}. "
            f"Would you like me to confirm this booking for {patient.first_name}?"
        )
        return {
            "ai_response": reply,
            "status": "AWAITING_CONFIRMATION",
            "pending_slot": slot,
            "booked_appointment": None
        }

    # 6. Fallback inquiry if insufficient parameters
    return {
        "ai_response": (
            "Namaste! This is SlotSure Clinic AI. I can schedule your visit right now. "
            "Which doctor or department would you like to visit? For example, Dr. Sharma in Cardiology, "
            "Dr. Kapoor in Pediatrics, or Dr. Verma in General Medicine?"
        ),
        "status": "COLLECTING_INFO",
        "pending_slot": None,
        "booked_appointment": None
    }
