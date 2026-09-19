import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Patient
from ..schemas import PatientCreate, PatientResponse
from ..auth import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def list_patients(
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Patient.first_name.ilike(search_pattern)) |
            (Patient.last_name.ilike(search_pattern)) |
            (Patient.patient_code.ilike(search_pattern)) |
            (Patient.phone.ilike(search_pattern))
        )
    return query.order_by(Patient.id.desc()).offset(offset).limit(limit).all()

@router.post("", response_model=PatientResponse)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db)
):
    # Auto-generate patient code if not provided
    patient_code = patient_in.patient_code
    if not patient_code:
        rand_num = random.randint(10000, 99999)
        patient_code = f"PT-{rand_num}"

    # Calculate initial attendance rate
    att_rate = 1.0
    if patient_in.total_appointments > 0:
        attended = max(0, patient_in.total_appointments - patient_in.missed_appointments)
        att_rate = round(attended / patient_in.total_appointments, 2)

    patient = Patient(
        patient_code=patient_code,
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        age=patient_in.age,
        gender=patient_in.gender,
        phone=patient_in.phone,
        email=patient_in.email,
        chronic_condition=patient_in.chronic_condition,
        distance_km=patient_in.distance_km,
        insurance_type=patient_in.insurance_type,
        total_appointments=patient_in.total_appointments,
        missed_appointments=patient_in.missed_appointments,
        attendance_rate=att_rate
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
