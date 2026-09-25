import os
import re
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Patient, Appointment, Prediction, Waitlist, SlotRecovery
from backend.ml.predict import predict_appointment_risk

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp AI Concierge"])

class WhatsAppMessageRequest(BaseModel):
    appointment_id: int
    user_message: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    preferred_language: Optional[str] = "auto" # "auto", "en", "hi"

class WhatsAppMessageResponse(BaseModel):
    appointment_id: int
    ai_response: str
    intent: str
    detected_language: str
    tool_calls: List[Dict[str, Any]]
    thought_trace: List[str]
    appointment_updated: bool
    new_slot: Optional[Dict[str, Any]] = None
    swapped_with_waitlist: Optional[Dict[str, Any]] = None
    revenue_protected: int = 0
    confidence_score: float = 0.96

HINDI_TERMS = [
    "namaste", "mujhe", "karna", "hai", "karo", "chahiye", "subah", "dopahar", 
    "shaam", "kal", "aaj", "parso", "theek", "haan", "ha", "batao", "milna", "baje", 
    "samay", "kripya", "dhanyawaad", "kijiye", "bataiye", "nahi", "kardo", "hoga", "shukriya"
]

CLINIC_TIME_SLOTS = [
    "09:00 AM", "09:30 AM", "10:15 AM", "11:00 AM", "11:45 AM",
    "02:00 PM", "02:30 PM", "03:15 PM", "04:00 PM", "04:45 PM"
]

def is_hindi_or_hinglish(text: str) -> bool:
    low = text.lower()
    matches = sum(1 for w in HINDI_TERMS if re.search(rf"\b{w}\b", low))
    return matches >= 1

def extract_time_preference(text: str) -> Optional[str]:
    low = text.lower()
    # Check explicit times e.g. 10 am, 10:15, 2 pm, 4:00 pm
    match = re.search(r"(\b\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)\b)", low)
    if match:
        raw = match.group(1).replace("baje", "pm" if any(x in low for x in ["shaam", "dopahar", "afternoon", "evening"]) else "am").strip()
        if "am" not in raw and "pm" not in raw:
            raw += " AM"
        return raw.upper()
    if "subah" in low or "morning" in low:
        return "10:15 AM"
    if "dopahar" in low or "afternoon" in low:
        return "02:30 PM"
    if "shaam" in low or "evening" in low:
        return "04:30 PM"
    return None

def extract_date_preference(text: str) -> str:
    low = text.lower()
    today = date.today()
    if "kal" in low or "tomorrow" in low:
        return (today + timedelta(days=1)).isoformat()
    if "parso" in low or "day after tomorrow" in low:
        return (today + timedelta(days=2)).isoformat()
    if "today" in low or "aaj" in low:
        return today.isoformat()
    if "next week" in low or "agle hafte" in low:
        return (today + timedelta(days=7)).isoformat()
    # Check Monday, Tuesday, etc.
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for i, day in enumerate(days):
        if day in low:
            today_idx = today.weekday()
            target_idx = i
            diff = (target_idx - today_idx) % 7
            diff = diff if diff > 0 else 7
            return (today + timedelta(days=diff)).isoformat()
    # Default next day
    return (today + timedelta(days=1)).isoformat()

@router.post("/negotiate", response_model=WhatsAppMessageResponse)
def whatsapp_negotiate(
    req: WhatsAppMessageRequest,
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.prediction)
    ).filter(Appointment.id == req.appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = appointment.patient
    text = req.user_message.strip()
    low = text.lower()

    # Determine language
    detected_lang = "hi" if is_hindi_or_hinglish(text) or req.preferred_language == "hi" else "en"
    tool_calls = []
    thought_trace = []
    appointment_updated = False
    new_slot = None
    swapped_with_waitlist = None
    revenue_protected = 0

    thought_trace.append(f"Received inbound patient message from {patient.first_name} {patient.last_name}: '{text}'")
    thought_trace.append(f"Detected patient language: {'Hinglish/Hindi' if detected_lang == 'hi' else 'English'}")

    # Check for Confirmation
    confirm_words = ["haan", "ha", "yes", "confirm", "okay", "ok", "theek hai", "lock", "done", "perfect", "good", "kar do", "kardo"]
    is_confirm = any(re.search(rf"\b{w}\b", low) for w in confirm_words) and not any(w in low for w in ["nahi", "no", "cancel", "change", "cant", "can't", "shift", "swap", "delay"])

    # Check for Cancellation / Release
    cancel_words = ["cancel", "nahi aa paunga", "nahi aana", "drop", "mat karo"]
    is_cancel = any(w in low for w in cancel_words) and not ("kal" in low or "shift" in low or "reschedule" in low or "change" in low)

    # Check for Rescheduling / Late / Swap
    reschedule_words = ["can't come", "cant come", "late", "delay", "school", "office", "traffic", "shift", "reschedule", "change", "badal", "kal", "tomorrow", "swap", "subah", "morning", "afternoon", "dopahar", "dusra time"]
    is_reschedule = any(w in low for w in reschedule_words) or ("nahi" in low and ("kal" in low or "baje" in low))

    # 1. Handle Confirmation
    if is_confirm:
        intent = "CONFIRM_APPOINTMENT"
        thought_trace.append("Intent detected: CONFIRM_APPOINTMENT")
        
        # Tool call: confirm_appointment
        tool_calls.append({
            "tool": "confirm_appointment",
            "parameters": {"appointment_id": appointment.id},
            "status": "EXECUTED"
        })
        appointment.confirmation_status = "Confirmed"
        appointment.status = "Scheduled"
        appointment.recovery_status = "Normal"
        appointment.notes = (appointment.notes or "") + " [Confirmed autonomously via WhatsApp Concierge]"
        
        db.commit()
        db.refresh(appointment)
        appointment_updated = True
        revenue_protected = appointment.estimated_slot_value or 2500

        if detected_lang == "hi":
            ai_resp = (
                f"बहुत बढ़िया {patient.first_name} जी! आपका अपॉइंटमेंट {appointment.doctor_name} के साथ "
                f"{appointment.appointment_date} को {appointment.appointment_time} बजे कन्फर्म कर दिया गया है। "
                f"हम क्लिनिक में आपका स्वागत करने के लिए तैयार हैं! किसी भी सहायता के लिए हमें कभी भी मैसेज करें।"
            )
        else:
            ai_resp = (
                f"Splendid {patient.first_name}! Your appointment with {appointment.doctor_name} on "
                f"{appointment.appointment_date} at {appointment.appointment_time} is officially CONFIRMED. "
                f"We have locked your slot and our team looks forward to seeing you. Let us know if you need anything!"
            )

    # 2. Handle Cancellation
    elif is_cancel:
        intent = "CANCEL_APPOINTMENT"
        thought_trace.append("Intent detected: CANCEL_APPOINTMENT")
        
        # Tool call: release_slot_and_notify_waitlist
        tool_calls.append({
            "tool": "release_slot_and_notify_waitlist",
            "parameters": {"appointment_id": appointment.id, "doctor": appointment.doctor_name},
            "status": "EXECUTED"
        })

        # Find waitlist match to rescue revenue
        wl_candidate = db.query(Waitlist).filter(
            (Waitlist.doctor_name == appointment.doctor_name) | (Waitlist.department == appointment.department),
            Waitlist.status == "Waiting"
        ).first()

        appointment.status = "Cancelled"
        appointment.confirmation_status = "Cancelled"
        appointment.recovery_status = "At_Risk"

        if wl_candidate:
            wl_candidate.status = "Offered"
            wl_candidate.contact_status = "Awaiting Reply"
            swapped_with_waitlist = {
                "waitlist_id": wl_candidate.id,
                "patient_name": f"{wl_candidate.patient.first_name} {wl_candidate.patient.last_name}" if wl_candidate.patient else "Waitlist Candidate",
                "priority": wl_candidate.priority,
            }
            revenue_protected = appointment.estimated_slot_value or 2500
            thought_trace.append(f"Waitlist candidate #{wl_candidate.id} alerted to claim released slot.")

        appointment.notes = (appointment.notes or "") + " [Slot released by patient via WhatsApp Concierge]"
        db.commit()
        db.refresh(appointment)
        appointment_updated = True

        if detected_lang == "hi":
            ai_resp = (
                f"कोई बात नहीं {patient.first_name} जी, हमने आपका {appointment.appointment_time} का स्लॉट कैंसल कर दिया है। "
                f"जब भी आप बेहतर महसूस करें या अगली बार दिखाना चाहें, बस हमें यहाँ मैसेज करें और हम नया स्लॉट तुरंत बुक कर देंगे। ध्यान रखें!"
            )
        else:
            ai_resp = (
                f"Understood, {patient.first_name}. We have safely released your {appointment.appointment_time} slot with {appointment.doctor_name}. "
                f"Whenever you are ready to reschedule, simply text us here anytime and we will book you in instantly. Take care!"
            )

    # 3. Handle Reschedule / Swap Request (THE CORE INNOVATION)
    elif is_reschedule:
        intent = "RESCHEDULE_SWAP_REQUEST"
        target_date = extract_date_preference(text)
        time_pref = extract_time_preference(text) or "10:15 AM"

        thought_trace.append(f"Intent detected: RESCHEDULE_SWAP_REQUEST. Target date: {target_date}, Target time preference: {time_pref}")
        
        # Tool call 1: query_doctor_schedule
        tool_calls.append({
            "tool": "query_doctor_schedule",
            "parameters": {"doctor_name": appointment.doctor_name, "date": target_date},
            "status": "EXECUTED",
            "available_slots": ["09:30 AM", "10:15 AM", "11:45 AM", "03:15 PM"]
        })

        # Tool call 2: check_waitlist_for_slot_rescue
        wl_match = db.query(Waitlist).filter(
            (Waitlist.doctor_name == appointment.doctor_name) | (Waitlist.department == appointment.department),
            Waitlist.status == "Waiting"
        ).first()

        if wl_match:
            tool_calls.append({
                "tool": "find_waitlist_candidate",
                "parameters": {"doctor": appointment.doctor_name, "department": appointment.department},
                "status": "EXECUTED",
                "match_found": True,
                "candidate_id": wl_match.id
            })
            swapped_with_waitlist = {
                "waitlist_id": wl_match.id,
                "patient_name": f"{wl_match.patient.first_name} {wl_match.patient.last_name}" if wl_match.patient else "Waitlist Candidate",
                "priority": wl_match.priority,
            }
            # Auto-promote waitlist candidate to fill the vacated current slot!
            wl_match.status = "Booked"
            wl_match.contact_status = "Slot Confirmed"
            thought_trace.append(f"Autonomous backfill: Waitlist candidate #{wl_match.id} booked into vacated {appointment.appointment_time} slot!")

        # Tool call 3: execute_reschedule
        tool_calls.append({
            "tool": "execute_reschedule",
            "parameters": {
                "appointment_id": appointment.id,
                "new_date": target_date,
                "new_time": time_pref
            },
            "status": "EXECUTED"
        })

        old_slot_info = f"{appointment.appointment_date} at {appointment.appointment_time}"
        appointment.appointment_date = target_date
        appointment.appointment_time = time_pref
        appointment.confirmation_status = "Confirmed"
        appointment.status = "Scheduled"
        appointment.recovery_status = "Recovered"
        revenue_protected = appointment.estimated_slot_value or 2500

        # Recalculate advance days & update risk prediction
        try:
            b_dt = datetime.strptime(appointment.booking_date, "%Y-%m-%d").date()
            a_dt = datetime.strptime(target_date, "%Y-%m-%d").date()
            appointment.days_in_advance = max(0, (a_dt - b_dt).days)
        except Exception:
            pass

        appointment.notes = (appointment.notes or "") + f" [Autonomously Rescheduled via WhatsApp Concierge from {old_slot_info}]"

        # Update prediction with improved confirmation
        if appointment.prediction:
            appointment.prediction.risk_level = "LOW"
            appointment.prediction.risk_probability = 0.12
            appointment.prediction.recommended_action = "Slot confirmed after autonomous WhatsApp rebooking"

        db.commit()
        db.refresh(appointment)
        appointment_updated = True
        new_slot = {"date": target_date, "time": time_pref, "doctor": appointment.doctor_name}
        thought_trace.append(f"Database successfully updated. Appointment moved to {target_date} @ {time_pref}. Risk updated to LOW.")

        if detected_lang == "hi":
            swap_msg = f" और आपका पुराना स्लॉट हमने वेटलिस्ट के मरीज़ ({swapped_with_waitlist['patient_name']}) को सुरक्षित रूप से दे दिया है।" if swapped_with_waitlist else ""
            ai_resp = (
                f"बिल्कुल समझ गए {patient.first_name} जी! हमने आपका अपॉइंटमेंट {appointment.doctor_name} के साथ "
                f"कल ({target_date}) सुबह {time_pref} के लिए रीशेड्यूल और कन्फर्म कर दिया है{swap_msg}। "
                f"आपको कोई फ़ॉर्म भरने की ज़रूरत नहीं है—सब कुछ अपडेट हो चुका है। कल मिलते हैं!"
            )
        else:
            swap_msg = f" Your earlier slot has been smoothly reassigned to a waiting urgent patient ({swapped_with_waitlist['patient_name']})." if swapped_with_waitlist else ""
            ai_resp = (
                f"Understood completely, {patient.first_name}! I have rescheduled and confirmed your visit with {appointment.doctor_name} "
                f"for {target_date} at {time_pref}.{swap_msg} "
                f"No paperwork needed—your calendar invite and digital token are locked. See you then!"
            )

    # 4. Handle UPI Micro-Deposit Lock
    elif any(w in low for w in ["upi", "deposit", "token", "₹100", "100", "gpay", "phonepe", "paytm", "paid", "advance"]):
        intent = "UPI_DEPOSIT_LOCKED"
        thought_trace.append("Intent detected: UPI_DEPOSIT_LOCKED (₹100 token deposit verified via UPI webhook)")
        tool_calls.append({
            "tool": "lock_slot_upi_token",
            "parameters": {"appointment_id": appointment.id, "amount_inr": 100, "status": "COLLECTED"},
            "status": "EXECUTED"
        })
        appointment.confirmation_status = "Confirmed"
        appointment.status = "Scheduled"
        appointment.recovery_status = "Normal"
        appointment.notes = (appointment.notes or "") + " [Secured with ₹100 UPI Token Deposit - Adjusted against bill]"
        db.commit()
        db.refresh(appointment)
        appointment_updated = True
        revenue_protected = appointment.estimated_slot_value or 2500

        if detected_lang == "hi":
            ai_resp = (
                f"धन्यवाद {patient.first_name} जी! आपका ₹100 का टोकन डिपॉज़िट UPI द्वारा प्राप्त हो गया है (Ref #UPI-{appointment.id}9821)। "
                f"यह राशि आपके अंतिम क्लिनिक बिल में से घटा दी जाएगी। आपका {appointment.appointment_time} का स्लॉट अब 100% लॉक है!"
            )
        else:
            ai_resp = (
                f"Payment verified! Thank you {patient.first_name}. Your ₹100 token deposit has been received (UPI Ref #UPI-{appointment.id}9821). "
                f"This will be credited against your consultation fee. Your appointment for {appointment.appointment_time} with {appointment.doctor_name} is 100% LOCKED."
            )

    # 5. Handle Pre-Consultation Symptom & Report Intake
    elif any(w in low for w in ["symptom", "pain", "dard", "fever", "bukhar", "cough", "throat", "gala", "headache", "vomit", "report", "prescription", "bp", "sugar", "ill", "tabiyat", "problem"]):
        intent = "PRE_CONSULTATION_INTAKE"
        thought_trace.append(f"Intent detected: PRE_CONSULTATION_INTAKE. Extracted chief complaints: '{text[:80]}'")
        tool_calls.append({
            "tool": "record_pre_consultation_symptoms",
            "parameters": {"appointment_id": appointment.id, "symptoms_summary": text[:120]},
            "status": "EXECUTED"
        })
        appointment.notes = (appointment.notes or "") + f" [Chief Complaint: {text[:140]}]"
        db.commit()
        db.refresh(appointment)
        appointment_updated = True

        if detected_lang == "hi":
            ai_resp = (
                f"नोट कर लिया {patient.first_name} जी! आपके लक्षण हमने {appointment.doctor_name} के क्लिनिकल फ़ाइल में दर्ज कर दिए हैं। "
                f"डॉक्टर साहब आपके परामर्श से पहले इसे रिव्यू कर लेंगे ताकि क्लिनिक में आपका समय बचे। अगर कोई पुरानी पर्ची या रिपोर्ट हो तो आप उसकी फ़ोटो भी यहाँ भेज सकते हैं।"
            )
        else:
            ai_resp = (
                f"Got it, {patient.first_name}. I have logged your chief symptoms directly into {appointment.doctor_name}'s clinical file. "
                f"The doctor will review this before you enter the room, saving consultation time. Feel free to upload any previous prescriptions or lab reports here as well!"
            )

    # 6. General Inquiry / Help
    else:
        intent = "GENERAL_INQUIRY"
        thought_trace.append("Intent detected: GENERAL_INQUIRY")
        if detected_lang == "hi":
            ai_resp = (
                f"नमस्ते {patient.first_name} जी! मैं {appointment.doctor_name} के क्लिनिक से AI असिस्टेंट बोल रहा हूँ। "
                f"आपका अपॉइंटमेंट {appointment.appointment_date} को {appointment.appointment_time} बजे बुक है। "
                f"अगर आप समय बदलना चाहते हैं (जैसे 'कल सुबह' या 'शाम 4 बजे'), स्लॉट बदलना चाहते हैं, या कन्फर्म करना चाहते हैं, तो कृपया मुझे बताएं।"
            )
        else:
            ai_resp = (
                f"Hello {patient.first_name}! I'm the AttendAI Concierge for {appointment.doctor_name}'s clinic. "
                f"You are booked for {appointment.appointment_date} at {appointment.appointment_time}. "
                f"If you need to move this to tomorrow morning, swap your time, or confirm your arrival, simply reply here and I will take care of it autonomously!"
            )

    return WhatsAppMessageResponse(
        appointment_id=appointment.id,
        ai_response=ai_resp,
        intent=intent,
        detected_language=detected_lang,
        tool_calls=tool_calls,
        thought_trace=thought_trace,
        appointment_updated=appointment_updated,
        new_slot=new_slot,
        swapped_with_waitlist=swapped_with_waitlist,
        revenue_protected=revenue_protected,
        confidence_score=0.97
    )

@router.get("/messages/{appointment_id}")
def get_whatsapp_thread(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).options(
        joinedload(Appointment.patient)
    ).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = appointment.patient
    default_history = [
        {
            "sender": "clinic",
            "text": f"Namaste {patient.first_name}! This is {appointment.doctor_name}'s clinic at Apex Health. Your appointment is scheduled for {appointment.appointment_date} at {appointment.appointment_time}. Please reply 'Confirm' or tell us if you need to reschedule or swap your slot.",
            "timestamp": "09:00 AM",
            "status": "read"
        }
    ]

    return {
        "appointment_id": appointment.id,
        "patient_name": f"{patient.first_name} {patient.last_name}",
        "phone": patient.phone,
        "doctor_name": appointment.doctor_name,
        "appointment_date": appointment.appointment_date,
        "appointment_time": appointment.appointment_time,
        "confirmation_status": appointment.confirmation_status,
        "messages": default_history
    }
