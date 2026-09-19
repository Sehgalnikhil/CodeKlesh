from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Waitlist, Patient, Appointment, SlotRecovery
from ..schemas import WaitlistCreate, WaitlistResponse

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])

@router.get("", response_model=List[WaitlistResponse])
def list_waitlist(
    doctor: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = "Waiting",
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Waitlist).options(joinedload(Waitlist.patient))
    if doctor:
        query = query.filter(Waitlist.doctor_name.ilike(f"%{doctor}%"))
    if department:
        query = query.filter(Waitlist.department.ilike(f"%{department}%"))
    if status and status != "All":
        query = query.filter(Waitlist.status == status)
    if priority:
        query = query.filter(Waitlist.priority == priority)

    return query.order_by(
        # Urgent first, then High, Medium, Low
        Waitlist.id.asc()
    ).all()

@router.post("", response_model=WaitlistResponse)
def create_waitlist_entry(
    entry_in: WaitlistCreate,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == entry_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    waitlist_item = Waitlist(
        patient_id=entry_in.patient_id,
        doctor_name=entry_in.doctor_name,
        department=entry_in.department,
        preferred_date=entry_in.preferred_date,
        preferred_time_range=entry_in.preferred_time_range,
        appointment_type=entry_in.appointment_type,
        priority=entry_in.priority,
        status="Waiting",
        contact_status="Ready",
        notes=entry_in.notes
    )
    db.add(waitlist_item)
    db.commit()
    db.refresh(waitlist_item)
    return waitlist_item

@router.post("/{waitlist_id}/offer")
def offer_slot_to_waitlist(
    waitlist_id: int,
    appointment_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    entry = db.query(Waitlist).options(joinedload(Waitlist.patient)).filter(Waitlist.id == waitlist_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    entry.status = "Booked"
    entry.contact_status = "Slot Confirmed"

    # If linked to an at-risk appointment slot, update that appointment or create a recovery record
    if appointment_id:
        app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if app:
            app.recovery_status = "Recovered"
            app.notes = (app.notes or "") + f" [Slot refilled from waitlist: {entry.patient.first_name} {entry.patient.last_name}]"
            
            # Check slot recovery record
            recovery = db.query(SlotRecovery).filter(SlotRecovery.appointment_id == appointment_id).first()
            if recovery:
                recovery.status = "Executed"
                recovery.candidate_waitlist_id = entry.id

    db.commit()
    return {
        "success": True,
        "message": f"Slot successfully offered and booked for {entry.patient.first_name} {entry.patient.last_name}",
        "waitlist_id": entry.id,
        "status": entry.status
    }
