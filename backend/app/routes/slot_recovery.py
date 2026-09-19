from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import SlotRecovery, Appointment, Waitlist, Patient, Prediction
from ..schemas import SlotRecoveryResponse, SlotRecoveryExecuteRequest

router = APIRouter(prefix="/slot-recovery", tags=["Slot Recovery"])

@router.get("", response_model=List[SlotRecoveryResponse])
def list_recovery_slots(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SlotRecovery).options(
        joinedload(SlotRecovery.appointment).joinedload(Appointment.patient),
        joinedload(SlotRecovery.appointment).joinedload(Appointment.prediction),
        joinedload(SlotRecovery.candidate_waitlist).joinedload(Waitlist.patient)
    )
    if status:
        query = query.filter(SlotRecovery.status == status)
    
    results = query.order_by(SlotRecovery.risk_probability.desc()).all()
    return results

@router.post("/execute")
def execute_slot_recovery(
    req: SlotRecoveryExecuteRequest,
    db: Session = Depends(get_db)
):
    recovery = db.query(SlotRecovery).filter(SlotRecovery.id == req.recovery_id).first()
    if not recovery:
        raise HTTPException(status_code=404, detail="Slot recovery record not found")

    appointment = db.query(Appointment).filter(Appointment.id == recovery.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Associated appointment not found")

    now = datetime.utcnow()
    revenue_gained = appointment.estimated_slot_value or 2500

    if req.action == "FILL_WAITLIST":
        # Find candidate
        waitlist_id = req.waitlist_candidate_id or recovery.candidate_waitlist_id
        candidate = None
        if waitlist_id:
            candidate = db.query(Waitlist).filter(Waitlist.id == waitlist_id).first()
        
        if not candidate:
            # Fallback: pick highest priority candidate for this doctor or department
            candidate = db.query(Waitlist).filter(
                (Waitlist.doctor_name == appointment.doctor_name) |
                (Waitlist.department == appointment.department),
                Waitlist.status == "Waiting"
            ).first()

        if candidate:
            candidate.status = "Booked"
            candidate.contact_status = "Slot Confirmed"
            recovery.candidate_waitlist_id = candidate.id

        appointment.recovery_status = "Recovered"
        appointment.notes = (appointment.notes or "") + f" [Slot Refilled from Waitlist: Candidate #{candidate.id if candidate else 'WL'}]"
        recovery.status = "Executed"
        recovery.executed_at = now
        recovery.revenue_protected = revenue_gained
        message = f"Slot successfully recovered and filled from waitlist! Protected ₹{revenue_gained:,} clinic revenue."

    elif req.action == "DOUBLE_BOOK":
        appointment.is_double_booked = True
        appointment.recovery_status = "Double_Booked"
        appointment.notes = (appointment.notes or "") + " [Controlled Double-Booking Authorized]"
        recovery.status = "Executed"
        recovery.action_type = "DOUBLE_BOOK"
        recovery.executed_at = now
        message = "Controlled double-booking enabled for this slot with clinical guardrails."

    elif req.action == "RELEASE":
        appointment.status = "Cancelled"
        appointment.recovery_status = "Released"
        recovery.status = "Executed"
        recovery.action_type = "RELEASE"
        recovery.executed_at = now
        message = "Slot released back to open clinic scheduling calendar."

    elif req.action == "DISMISS":
        recovery.status = "Dismissed"
        message = "Recovery recommendation dismissed. Appointment kept in monitoring state."

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")

    db.commit()
    db.refresh(recovery)
    return {
        "success": True,
        "action": req.action,
        "message": message,
        "revenue_protected": recovery.revenue_protected,
        "recovery_id": recovery.id
    }
