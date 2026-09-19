from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr
from datetime import datetime

# --- Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "Doctor"
    clinic_name: str = "Apex Health Specialists"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Patient Schemas ---
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    age: int
    gender: str
    phone: str
    email: Optional[str] = None
    chronic_condition: bool = False
    distance_km: float = 5.0
    insurance_type: str = "Commercial"
    total_appointments: int = 0
    missed_appointments: int = 0
    attendance_rate: float = 1.0
    avg_confirm_hours: float = 4.0
    reminder_response_rate: float = 0.75
    behavior_pattern: str = "Usually confirms within 6 hours. Responds well to SMS."
    preferred_channel: str = "SMS"

class PatientCreate(PatientBase):
    patient_code: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    patient_code: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Factor and Prediction Schemas ---
class FactorDetail(BaseModel):
    factor: str
    label: str
    impact_direction: str
    contribution: float
    percentage: int

class PredictionCreate(BaseModel):
    appointment_id: Optional[int] = None
    patient_id: Optional[int] = None
    age: int = 40
    gender: str = "Male"
    chronic_condition: bool = False
    distance_km: float = 5.0
    insurance_type: str = "Commercial"
    total_appointments: int = 4
    previous_no_shows: int = 1
    previous_attendance_rate: float = 0.75
    appointment_date: str = "2026-09-21"
    appointment_time: str = "10:30 AM"
    department: str = "Cardiology"
    doctor_name: str = "Dr. Sharma"
    appointment_type: str = "Follow-up"
    booking_date: str = "2026-09-14"
    days_in_advance: int = 7
    sms_reminder_sent: bool = False
    email_reminder_sent: bool = False
    previous_reminder_response: str = "Ignored"

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    appointment_id: Optional[int] = None
    risk_probability: float
    risk_level: str
    top_factors: List[FactorDetail]
    recommended_action: str
    recommended_strategy: Optional[str] = "Standard Reminder"
    estimated_impact_prob: float
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- Waitlist Schemas ---
class WaitlistBase(BaseModel):
    patient_id: int
    doctor_name: str
    department: str
    preferred_date: str = "Any"
    preferred_time_range: str = "10:00 AM - 01:00 PM"
    appointment_type: str = "Consultation"
    priority: str = "High"
    status: str = "Waiting"
    contact_status: str = "Ready"
    notes: Optional[str] = None

class WaitlistCreate(WaitlistBase):
    pass

class WaitlistResponse(WaitlistBase):
    id: int
    created_at: datetime
    patient: Optional[PatientResponse] = None
    class Config:
        from_attributes = True

# --- Slot Recovery Schemas ---
class SlotRecoveryBase(BaseModel):
    appointment_id: int
    risk_probability: float
    recommendation: str
    reasoning: str
    action_type: str = "WAITLIST" # WAITLIST, DOUBLE_BOOK, RELEASE, MONITOR
    status: str = "Proposed"
    candidate_waitlist_id: Optional[int] = None
    revenue_protected: int = 2500

class SlotRecoveryExecuteRequest(BaseModel):
    recovery_id: int
    action: str # "FILL_WAITLIST", "DOUBLE_BOOK", "RELEASE", "DISMISS"
    waitlist_candidate_id: Optional[int] = None
    notes: Optional[str] = None

class SlotRecoveryResponse(SlotRecoveryBase):
    id: int
    executed_at: Optional[datetime] = None
    created_at: datetime
    candidate_waitlist: Optional[WaitlistResponse] = None
    class Config:
        from_attributes = True

# --- Appointment Schemas ---
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_name: str
    department: str
    appointment_date: str
    appointment_time: str
    appointment_type: str = "Follow-up"
    booking_date: Optional[str] = None
    days_in_advance: Optional[int] = None
    sms_reminder_sent: bool = False
    email_reminder_sent: bool = False
    confirmation_status: str = "Not confirmed"
    status: str = "Scheduled"
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_name: str
    department: str
    appointment_date: str
    appointment_time: str
    appointment_type: str
    booking_date: str
    days_in_advance: int
    sms_reminder_sent: bool
    email_reminder_sent: bool
    status: str
    confirmation_status: str
    is_double_booked: bool
    recovery_status: str
    estimated_slot_value: int
    notes: Optional[str]
    created_at: datetime
    patient: Optional[PatientResponse] = None
    prediction: Optional[PredictionResponse] = None
    slot_recovery: Optional[SlotRecoveryResponse] = None

    class Config:
        from_attributes = True

# --- Reminder Schemas ---
class ReminderCreate(BaseModel):
    appointment_id: int
    patient_id: int
    channel: str = "SMS"
    strategy: Optional[str] = "Standard Reminder"
    scheduled_for: str = "24 hours before appointment"
    notes: Optional[str] = None

class ReminderResponse(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    channel: str
    strategy: Optional[str] = "Standard Reminder"
    status: str
    scheduled_for: str
    sent_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True

# --- Business Impact & Analytics Schemas ---
class KPIData(BaseModel):
    today_appointments: int
    high_risk_appointments: int
    predicted_no_shows: int
    slots_at_risk: int
    capacity_recovered_inr: int
    revenue_protected_inr: int
    today_appointments_change: str
    high_risk_change: str
    predicted_no_shows_change: str
    slots_at_risk_change: str
    capacity_recovered_change: str

class BusinessImpactData(BaseModel):
    appointments_analyzed: int
    high_risk_appointments: int
    no_shows_prevented: int
    slots_recovered: int
    waitlist_matches: int
    additional_appointments_filled: int
    estimated_capacity_value_protected_inr: int
    recovery_success_rate_pct: float

class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int
    total: int

class SeriesPoint(BaseModel):
    date: str
    no_show_rate: float
    total_appointments: int
    attended: int
    missed: int

class CategoryMetric(BaseModel):
    name: str
    no_show_rate: float
    total: int

class AnalyticsDashboardResponse(BaseModel):
    kpis: KPIData
    business_impact: BusinessImpactData
    risk_distribution: RiskDistribution
    no_show_rate_over_time: List[SeriesPoint]
    by_department: List[CategoryMetric]
    by_appointment_type: List[CategoryMetric]
    by_day_of_week: List[CategoryMetric]
    time_heatmap: List[Dict[str, Any]]
    model_metrics: Dict[str, Any]
