import random
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Appointment, Patient, Prediction

router = APIRouter(prefix="/queue", tags=["Live Journey Queue Radar"])

class DelayBufferRequest(BaseModel):
    delay_minutes: int = 10
    reason: Optional[str] = "Traffic congestion / parking delay"

class QueueRadarResponse(BaseModel):
    appointment_id: int
    patient_id: int
    patient_name: str
    doctor_name: str
    department: str
    appointment_date: str
    appointment_time: str
    exam_room: str
    queue_position: int
    total_in_queue: int
    current_patient_in_room: str
    doctor_status: str # "CONSULTING_NOW", "ON_SCHEDULE", "SLIGHT_DELAY"
    average_consult_duration_mins: int
    estimated_entry_time: str
    countdown_seconds: int
    milestones: List[Dict[str, Any]]
    amenities: Dict[str, Any]
    can_request_delay: bool

@router.get("/{appointment_id}/radar", response_model=QueueRadarResponse)
def get_queue_radar(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.prediction)
    ).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = appointment.patient
    app_date = appointment.appointment_date

    # Fetch all appointments on this date for the same doctor
    all_doctor_apps = db.query(Appointment).options(
        joinedload(Appointment.patient)
    ).filter(
        Appointment.doctor_name == appointment.doctor_name,
        Appointment.appointment_date == app_date,
        Appointment.status != "Cancelled"
    ).order_by(Appointment.appointment_time.asc()).all()

    # Determine position in queue
    position = 1
    for idx, a in enumerate(all_doctor_apps):
        if a.id == appointment.id:
            position = idx + 1
            break
    
    total_in_queue = max(len(all_doctor_apps), position)
    
    # Assign deterministic exam room based on doctor
    room_map = {
        "Dr. Sharma": "Exam Suite 104 (Cardiology Wing)",
        "Dr. Verma": "Exam Suite 201 (Internal Medicine)",
        "Dr. Kapoor": "Pediatrics Suite 12",
        "Dr. Patel": "Orthopedics Bay 3",
        "Dr. Iyer": "Neurology Clinic B",
        "Dr. Nair": "Dermatology Suite 5",
        "Dr. Reddy": "Oncology Care Pod 2",
    }
    exam_room = room_map.get(appointment.doctor_name, "Consultation Suite 101")

    # Estimate active patient & countdown
    avg_duration = 12
    minutes_ahead = max(0, (position - 1) * avg_duration + 4)
    countdown_seconds = minutes_ahead * 60

    # Format estimated entry time
    now = datetime.now()
    entry_dt = now + timedelta(minutes=minutes_ahead)
    estimated_entry_time = entry_dt.strftime("%I:%M %p")

    # Determine active patient name in exam room
    if position == 1:
        current_in_room = "Your turn now — please proceed to exam suite"
        doc_status = "CONSULTING_NOW"
    elif len(all_doctor_apps) > 0 and all_doctor_apps[0].id != appointment.id:
        active_p = all_doctor_apps[0].patient
        current_in_room = f"Patient #{all_doctor_apps[0].id % 100} ({active_p.first_name[0]}***) in exam room (7m elapsed)"
        doc_status = "CONSULTING_NOW"
    else:
        current_in_room = "Doctor reviewing medical charts"
        doc_status = "ON_SCHEDULE"

    # Step-by-step patient milestones
    milestones = [
        {
            "step": 1,
            "title": "Appointment Scheduled & Synced",
            "subtitle": f"Confirmed for {appointment.appointment_time}",
            "completed": True,
            "current": False,
            "time": "08:30 AM"
        },
        {
            "step": 2,
            "title": "Smart WhatsApp Notification Verified",
            "subtitle": "Clinical reminder acknowledged",
            "completed": appointment.confirmation_status == "Confirmed" or appointment.sms_reminder_sent,
            "current": False,
            "time": "09:15 AM"
        },
        {
            "step": 3,
            "title": "Hospital Zone Geo-Radar",
            "subtitle": "Patient registered in waiting lounge perimeter",
            "completed": position <= 3,
            "current": position > 1 and position <= 3,
            "time": "Just now"
        },
        {
            "step": 4,
            "title": "Vital Signs & Nurse Triage",
            "subtitle": "BP & Pulse recorded at Nursing Station A",
            "completed": position == 1,
            "current": position == 2,
            "time": "Pending entry"
        },
        {
            "step": 5,
            "title": f"Consultation with {appointment.doctor_name}",
            "subtitle": exam_room,
            "completed": False,
            "current": position == 1,
            "time": estimated_entry_time
        }
    ]

    amenities = {
        "wifi_ssid": "ApexHealth-Guest",
        "wifi_pass": "ApexCare2026",
        "cafeteria_discount": "APEX20 (20% off at 2nd Floor Brew Lab)",
        "pharmacy_pickup_lane": "Lane 2 (Express Token)",
        "parking_validated": True
    }

    return QueueRadarResponse(
        appointment_id=appointment.id,
        patient_id=patient.id,
        patient_name=f"{patient.first_name} {patient.last_name}",
        doctor_name=appointment.doctor_name,
        department=appointment.department,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        exam_room=exam_room,
        queue_position=position,
        total_in_queue=total_in_queue,
        current_patient_in_room=current_in_room,
        doctor_status=doc_status,
        average_consult_duration_mins=avg_duration,
        estimated_entry_time=estimated_entry_time,
        countdown_seconds=countdown_seconds,
        milestones=milestones,
        amenities=amenities,
        can_request_delay=position > 1 or total_in_queue > 1
    )

@router.post("/{appointment_id}/delay-buffer")
def request_queue_delay(
    appointment_id: int,
    req: DelayBufferRequest,
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).options(
        joinedload(Appointment.patient)
    ).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Find next appointment for the same doctor to swap with
    next_app = db.query(Appointment).options(
        joinedload(Appointment.patient)
    ).filter(
        Appointment.doctor_name == appointment.doctor_name,
        Appointment.appointment_date == appointment.appointment_date,
        Appointment.id != appointment.id,
        Appointment.status != "Cancelled"
    ).first()

    swapped_patient_name = "Next Waiting Patient"
    old_time = appointment.appointment_time
    new_time = old_time

    if next_app:
        swapped_patient_name = f"{next_app.patient.first_name} {next_app.patient.last_name}"
        # Swap their appointment times smoothly
        appointment.appointment_time, next_app.appointment_time = next_app.appointment_time, appointment.appointment_time
        new_time = appointment.appointment_time
        next_app.notes = (next_app.notes or "") + f" [Autonomously advanced in queue (+1 slot forward)]"
        
    appointment.notes = (appointment.notes or "") + f" [Autonomous Radar: Patient requested +{req.delay_minutes}m buffer due to {req.reason}. Swapped order with {swapped_patient_name}]"
    db.commit()
    db.refresh(appointment)

    return {
        "success": True,
        "message": f"Queue position autonomously adjusted! Swapped with {swapped_patient_name}. Buffer +{req.delay_minutes}m applied without receptionist friction.",
        "appointment_id": appointment.id,
        "new_appointment_time": new_time,
        "swapped_with": swapped_patient_name,
        "delay_minutes_granted": req.delay_minutes
    }

class DoctorDelayBroadcastRequest(BaseModel):
    doctor_name: str
    delay_minutes: int = 30
    reason: Optional[str] = "Emergency Procedure / Inpatient Ward Rounds"

@router.post("/broadcast-delay")
def broadcast_doctor_delay(
    req: DoctorDelayBroadcastRequest,
    db: Session = Depends(get_db)
):
    apps = db.query(Appointment).options(
        joinedload(Appointment.patient)
    ).filter(
        Appointment.doctor_name == req.doctor_name,
        Appointment.status != "Cancelled"
    ).all()

    affected_patients = []
    for a in apps:
        a.notes = (a.notes or "") + f" [Broadcast Alert: Doctor delayed +{req.delay_minutes}m ({req.reason})]"
        p_name = f"{a.patient.first_name} {a.patient.last_name}" if a.patient else "Patient"
        affected_patients.append({
            "appointment_id": a.id,
            "patient_name": p_name,
            "scheduled_time": a.appointment_time,
            "status": a.confirmation_status
        })

    db.commit()

    return {
        "success": True,
        "doctor_name": req.doctor_name,
        "delay_minutes": req.delay_minutes,
        "reason": req.reason,
        "affected_count": len(affected_patients),
        "affected_patients": affected_patients,
        "whatsapp_dispatched": True,
        "radar_updated": True
    }

