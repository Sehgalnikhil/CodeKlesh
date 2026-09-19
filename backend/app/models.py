from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="Doctor")  # Admin, Doctor, Receptionist
    clinic_name = Column(String(255), default="Apex Health Specialists")
    created_at = Column(DateTime, default=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    chronic_condition = Column(Boolean, default=False)
    distance_km = Column(Float, default=5.0)
    insurance_type = Column(String(50), default="Commercial")
    total_appointments = Column(Integer, default=0)
    missed_appointments = Column(Integer, default=0)
    attendance_rate = Column(Float, default=1.0)
    
    # Behavioral Intelligence
    avg_confirm_hours = Column(Float, default=4.0)
    reminder_response_rate = Column(Float, default=0.75)
    behavior_pattern = Column(Text, default="Usually confirms within 6 hours. Responds well to SMS.")
    preferred_channel = Column(String(50), default="SMS")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="patient", cascade="all, delete-orphan")
    waitlist_entries = relationship("Waitlist", back_populates="patient", cascade="all, delete-orphan")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    appointment_date = Column(String(20), nullable=False) # YYYY-MM-DD
    appointment_time = Column(String(20), nullable=False) # e.g. "10:30 AM"
    appointment_type = Column(String(100), default="Follow-up")
    booking_date = Column(String(20), nullable=False)
    days_in_advance = Column(Integer, default=3)
    sms_reminder_sent = Column(Boolean, default=False)
    email_reminder_sent = Column(Boolean, default=False)
    
    # Status & Slot Recovery fields
    status = Column(String(50), default="Scheduled") # Scheduled, Completed, Cancelled, No-Show
    confirmation_status = Column(String(50), default="Not confirmed") # "Confirmed", "Not confirmed", "Pending_Reply"
    is_double_booked = Column(Boolean, default=False)
    recovery_status = Column(String(50), default="Normal") # "Normal", "At_Risk", "Recovered", "Double_Booked"
    estimated_slot_value = Column(Integer, default=2500) # In INR

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="appointments")
    prediction = relationship("Prediction", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="appointment", cascade="all, delete-orphan")
    slot_recovery = relationship("SlotRecovery", back_populates="appointment", uselist=False, cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False)
    risk_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH
    top_factors = Column(JSON, nullable=False)
    recommended_action = Column(String(255), nullable=False)
    recommended_strategy = Column(String(100), default="Standard SMS")
    estimated_impact_prob = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="prediction")

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    channel = Column(String(50), default="SMS")
    strategy = Column(String(100), default="Standard Reminder")
    status = Column(String(50), default="Scheduled")
    scheduled_for = Column(String(50), nullable=False)
    sent_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="reminders")
    patient = relationship("Patient", back_populates="reminders")

class Waitlist(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    preferred_date = Column(String(20), nullable=False) # YYYY-MM-DD or "Any"
    preferred_time_range = Column(String(50), default="10:00 AM - 01:00 PM")
    appointment_type = Column(String(100), default="Consultation")
    priority = Column(String(20), default="Medium") # Urgent, High, Medium, Low
    status = Column(String(50), default="Waiting") # Waiting, Offered, Booked, Expired
    contact_status = Column(String(50), default="Ready") # Ready, Contacted, Awaiting Reply
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="waitlist_entries")

class SlotRecovery(Base):
    __tablename__ = "slot_recovery"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False)
    risk_probability = Column(Float, nullable=False)
    recommendation = Column(String(255), nullable=False) # "Release slot and notify waitlist", "Controlled double-booking recommended", "Continue monitoring"
    reasoning = Column(Text, nullable=False)
    action_type = Column(String(50), default="WAITLIST") # WAITLIST, DOUBLE_BOOK, RELEASE, MONITOR
    status = Column(String(50), default="Proposed") # Proposed, Executed, Dismissed
    candidate_waitlist_id = Column(Integer, ForeignKey("waitlist.id"), nullable=True)
    revenue_protected = Column(Integer, default=2500)
    executed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="slot_recovery")
    candidate_waitlist = relationship("Waitlist")

class ModelMetric(Base):
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), default="Random Forest Clinical Risk Ensemble")
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    confusion_matrix = Column(JSON, nullable=False)
    feature_importances = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
