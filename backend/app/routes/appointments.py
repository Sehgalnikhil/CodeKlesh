from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Appointment, Patient, Prediction
from ..schemas import AppointmentCreate, AppointmentResponse
from backend.ml.predict import predict_appointment_risk

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    tab: Optional[str] = Query(None, description="All, Today, High Risk, Medium Risk, Low Risk"),
    date_filter: Optional[str] = None,
    doctor: Optional[str] = None,
    department: Optional[str] = None,
    risk_level: Optional[str] = None,
    appointment_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.prediction)
    )

    today_str = date.today().isoformat()

    # Tab shortcut filters
    if tab:
        t = tab.lower().strip()
        if t == "today":
            query = query.filter(Appointment.appointment_date == today_str)
        elif t in ["high", "high risk"]:
            query = query.join(Prediction).filter(Prediction.risk_level == "HIGH")
        elif t in ["medium", "medium risk"]:
            query = query.join(Prediction).filter(Prediction.risk_level == "MEDIUM")
        elif t in ["low", "low risk"]:
            query = query.join(Prediction).filter(Prediction.risk_level == "LOW")

    if date_filter:
        query = query.filter(Appointment.appointment_date == date_filter)

    if doctor:
        query = query.filter(Appointment.doctor_name.ilike(f"%{doctor}%"))

    if department:
        query = query.filter(Appointment.department.ilike(f"%{department}%"))

    if appointment_type:
        query = query.filter(Appointment.appointment_type.ilike(f"%{appointment_type}%"))

    if status:
        query = query.filter(Appointment.status.ilike(f"%{status}%"))

    if risk_level and not tab:
        query = query.join(Prediction).filter(Prediction.risk_level == risk_level.upper())

    if search:
        search_pattern = f"%{search}%"
        query = query.join(Patient).filter(
            (Patient.first_name.ilike(search_pattern)) |
            (Patient.last_name.ilike(search_pattern)) |
            (Patient.patient_code.ilike(search_pattern)) |
            (Appointment.doctor_name.ilike(search_pattern)) |
            (Appointment.department.ilike(search_pattern))
        )

    # Sort upcoming first, high risk prioritized
    return query.order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).offset(offset).limit(limit).all()

@router.post("", response_model=AppointmentResponse)
def create_appointment(
    app_in: AppointmentCreate,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == app_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    booking_date = app_in.booking_date or date.today().isoformat()
    
    # Calculate days in advance
    days_advance = app_in.days_in_advance
    if days_advance is None:
        try:
            b_dt = datetime.strptime(booking_date, "%Y-%m-%d").date()
            a_dt = datetime.strptime(app_in.appointment_date, "%Y-%m-%d").date()
            days_advance = max(0, (a_dt - b_dt).days)
        except Exception:
            days_advance = 3

    appointment = Appointment(
        patient_id=app_in.patient_id,
        doctor_name=app_in.doctor_name,
        department=app_in.department,
        appointment_date=app_in.appointment_date,
        appointment_time=app_in.appointment_time,
        appointment_type=app_in.appointment_type,
        booking_date=booking_date,
        days_in_advance=days_advance,
        sms_reminder_sent=app_in.sms_reminder_sent,
        email_reminder_sent=app_in.email_reminder_sent,
        status=app_in.status,
        notes=app_in.notes
    )
    db.add(appointment)
    db.flush()

    # Automatically predict risk for this appointment
    pred_data = {
        "age": patient.age,
        "gender": patient.gender,
        "chronic_condition": patient.chronic_condition,
        "distance_km": patient.distance_km,
        "insurance_type": patient.insurance_type,
        "previous_no_shows": patient.missed_appointments,
        "previous_attendance_rate": patient.attendance_rate,
        "appointment_date": app_in.appointment_date,
        "appointment_time": app_in.appointment_time,
        "department": app_in.department,
        "doctor_name": app_in.doctor_name,
        "appointment_type": app_in.appointment_type,
        "days_in_advance": days_advance,
        "sms_reminder_sent": app_in.sms_reminder_sent,
        "email_reminder_sent": app_in.email_reminder_sent
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
    return appointment

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    app = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.prediction)
    ).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return app

@router.patch("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    status: Optional[str] = None,
    sms_reminder_sent: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if status is not None:
        app.status = status
    if sms_reminder_sent is not None:
        app.sms_reminder_sent = sms_reminder_sent
    
    db.commit()
    db.refresh(app)
    return app
