from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Prediction, Appointment
from ..schemas import PredictionCreate, PredictionResponse
from backend.ml.predict import predict_appointment_risk

router = APIRouter(prefix="/predict", tags=["Risk Prediction"])

@router.post("", response_model=PredictionResponse)
def predict_risk(data: PredictionCreate, db: Session = Depends(get_db)):
    result = predict_appointment_risk(data.dict())

    # If appointment_id provided, persist or update prediction in DB
    pred_obj = None
    if data.appointment_id:
        existing = db.query(Prediction).filter(Prediction.appointment_id == data.appointment_id).first()
        if existing:
            existing.risk_probability = result["risk_probability"]
            existing.risk_level = result["risk_level"]
            existing.top_factors = result["top_factors"]
            existing.recommended_action = result["recommended_action"]
            existing.estimated_impact_prob = result["estimated_impact_prob"]
            db.commit()
            db.refresh(existing)
            pred_obj = existing
        else:
            app = db.query(Appointment).filter(Appointment.id == data.appointment_id).first()
            if app:
                new_pred = Prediction(
                    appointment_id=app.id,
                    risk_probability=result["risk_probability"],
                    risk_level=result["risk_level"],
                    top_factors=result["top_factors"],
                    recommended_action=result["recommended_action"],
                    estimated_impact_prob=result["estimated_impact_prob"]
                )
                db.add(new_pred)
                db.commit()
                db.refresh(new_pred)
                pred_obj = new_pred

    return {
        "id": pred_obj.id if pred_obj else None,
        "appointment_id": data.appointment_id,
        "risk_probability": result["risk_probability"],
        "risk_level": result["risk_level"],
        "top_factors": result["top_factors"],
        "recommended_action": result["recommended_action"],
        "estimated_impact_prob": result["estimated_impact_prob"]
    }

@router.get("/{appointment_id}", response_model=PredictionResponse)
def get_prediction_by_appointment(appointment_id: int, db: Session = Depends(get_db)):
    pred = db.query(Prediction).filter(Prediction.appointment_id == appointment_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found for appointment")
    return pred
