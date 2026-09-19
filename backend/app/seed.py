import random
from datetime import date, timedelta
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import User, Patient, Appointment, Prediction, Reminder, Waitlist, SlotRecovery, ModelMetric
from .auth import get_password_hash
from backend.ml.predict import predict_appointment_risk

# Recreate tables to ensure schema matches latest models
Base.metadata.create_all(bind=engine)

DOCTORS = [
    ("Dr. Sharma", "Cardiology"),
    ("Dr. Singh", "Orthopedics"),
    ("Dr. Patel", "Neurology"),
    ("Dr. Iyer", "Pediatrics"),
    ("Dr. Das", "General Medicine"),
    ("Dr. Reddy", "Dermatology"),
    ("Dr. Mukherjee", "Cardiology"),
    ("Dr. Nair", "Orthopedics"),
    ("Dr. Joshi", "Neurology"),
    ("Dr. Kapoor", "Pediatrics"),
    ("Dr. Verma", "General Medicine")
]

DEPARTMENTS = ["Cardiology", "Orthopedics", "Neurology", "Pediatrics", "General Medicine", "Dermatology"]
APPOINTMENT_TYPES = ["Routine Follow-up", "Consultation", "Specialist Review", "Diagnostic Review", "Preventive Care"]
TIME_SLOTS = ["08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"]

FIRST_NAMES = [
    "Aarav", "Priya", "Rahul", "Ananya", "Rohan", "Sneha", "Vikram", "Neha", "Aditya", "Pooja",
    "Arjun", "Kavita", "Siddharth", "Meera", "Kabir", "Divya", "Karan", "Tanvi", "Nikhil", "Ritu",
    "Manish", "Deepika", "Sunil", "Ishita", "Varun", "Swati", "Rajesh", "Simran", "Amit", "Bhavna",
    "Gaurav", "Nisha", "Harsh", "Shruti", "Sanjay", "Preeti", "Alok", "Shreya", "Vivek", "Pallavi",
    "Ashish", "Anjali", "Sameer", "Geeta", "Abhishek", "Jyoti", "Kunal", "Sunita", "Tarun", "Payal",
    "Akash", "Monika", "Rakesh", "Sonia", "Mayank", "Isha", "Kailash", "Bina", "Ganesh", "Lata"
]

LAST_NAMES = [
    "Mehta", "Kapoor", "Verma", "Sharma", "Singh", "Patel", "Gupta", "Chopra", "Reddy", "Joshi",
    "Malhotra", "Nair", "Bose", "Bhatia", "Saxena", "Deshmukh", "Chawla", "Bansal", "Mishra", "Trivedi",
    "Kulkarni", "Choudhury", "Pillai", "Menon", "Rao", "Shetty", "Sengupta", "Dutta"
]

BEHAVIOR_PATTERNS = [
    "Usually confirms within 6 hours. Higher no-show rate for early morning appointments. Responds better to SMS than email.",
    "Fast responder via WhatsApp. High attendance rate (95%). Prefers afternoon consultations.",
    "Slow to confirm. Multiple past cancellations due to transit distance (>12km). Requires phone outreach.",
    "Chronic care patient. Adherent to medication and follow-ups. Rarely misses scheduled reviews.",
    "Frequent rescheduling history. Ignores automated email reminders; responds well to 2-way SMS.",
    "New patient. No historical baseline. First appointment scheduled 14 days in advance."
]

def seed_database():
    db: Session = SessionLocal()
    try:
        print("Clearing previous seed data...")
        db.query(SlotRecovery).delete()
        db.query(Waitlist).delete()
        db.query(Reminder).delete()
        db.query(Prediction).delete()
        db.query(Appointment).delete()
        db.query(Patient).delete()
        db.query(User).delete()
        db.commit()

        print("Seeding Users...")
        users = [
            User(
                email="dr.sharma@attendai.com",
                hashed_password=get_password_hash("password123"),
                full_name="Dr. Sharma",
                role="Doctor",
                clinic_name="Apex Health Specialists"
            ),
            User(
                email="reception@attendai.com",
                hashed_password=get_password_hash("password123"),
                full_name="Neha Gupta",
                role="Receptionist",
                clinic_name="Apex Health Specialists"
            ),
            User(
                email="admin@attendai.com",
                hashed_password=get_password_hash("password123"),
                full_name="Clinical Director",
                role="Admin",
                clinic_name="Apex Health Specialists"
            )
        ]
        db.add_all(users)
        db.commit()

        print("Seeding 105+ Patients...")
        patient_objs = []

        # 1. Aarav Mehta (PT-10482) - Primary Demo Case
        p_aarav = Patient(
            patient_code="PT-10482",
            first_name="Aarav",
            last_name="Mehta",
            age=42,
            gender="Male",
            phone="+91 98201 44582",
            email="aarav.mehta@gmail.com",
            chronic_condition=False,
            distance_km=14.5,
            insurance_type="Commercial",
            total_appointments=6,
            missed_appointments=2,
            attendance_rate=0.67,
            avg_confirm_hours=18.5,
            reminder_response_rate=0.33,
            behavior_pattern="Usually confirms within 18 hours or ignores. Higher no-show rate for morning appointments (+31%). Responds better to SMS than email.",
            preferred_channel="SMS"
        )
        patient_objs.append(p_aarav)

        # 2. Priya Kapoor (PT-10483) - Medium Risk / Waitlist Match Candidate
        p_priya = Patient(
            patient_code="PT-10483",
            first_name="Priya",
            last_name="Kapoor",
            age=34,
            gender="Female",
            phone="+91 98112 33491",
            email="priya.k@outlook.com",
            chronic_condition=False,
            distance_km=4.2,
            insurance_type="Commercial",
            total_appointments=5,
            missed_appointments=1,
            attendance_rate=0.80,
            avg_confirm_hours=3.5,
            reminder_response_rate=0.80,
            behavior_pattern="Fast responder via SMS and WhatsApp. Available today for urgent cardiology review.",
            preferred_channel="WhatsApp"
        )
        patient_objs.append(p_priya)

        # 3. Rahul Verma (PT-10484) - Low Risk
        p_rahul = Patient(
            patient_code="PT-10484",
            first_name="Rahul",
            last_name="Verma",
            age=58,
            gender="Male",
            phone="+91 99203 11847",
            email="rahul.v@gmail.com",
            chronic_condition=True,
            distance_km=3.1,
            insurance_type="Public",
            total_appointments=12,
            missed_appointments=0,
            attendance_rate=1.00,
            avg_confirm_hours=1.2,
            reminder_response_rate=1.00,
            behavior_pattern="Highly reliable attendance record (100%). Confirms immediately upon notification.",
            preferred_channel="SMS"
        )
        patient_objs.append(p_rahul)

        # Generate 102 more realistic fictional patients
        rng = random.Random(42)
        for i in range(1, 103):
            fname = FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]
            lname = LAST_NAMES[(i * 3) % len(LAST_NAMES)]
            code = f"PT-{10484 + i}"
            age = rng.randint(18, 82)
            gender = "Female" if rng.random() > 0.46 else "Male"
            chronic = True if age > 48 and rng.random() > 0.4 else False
            tot = rng.randint(2, 14)
            missed = rng.choices([0, 1, 2, 3], weights=[0.58, 0.26, 0.11, 0.05])[0]
            if missed > tot:
                tot = missed + 1
            att_rate = round(max(0.1, (tot - missed) / tot), 2)
            dist = round(rng.uniform(1.2, 24.0), 1)
            insurance = rng.choice(["Commercial", "Private", "Public", "Self-Pay"])
            pattern = rng.choice(BEHAVIOR_PATTERNS)

            p = Patient(
                patient_code=code,
                first_name=fname,
                last_name=lname,
                age=age,
                gender=gender,
                phone=f"+91 98{rng.randint(100, 999)} {rng.randint(10000, 99999)}",
                email=f"{fname.lower()}.{lname.lower()}@example.com",
                chronic_condition=chronic,
                distance_km=dist,
                insurance_type=insurance,
                total_appointments=tot,
                missed_appointments=missed,
                attendance_rate=att_rate,
                avg_confirm_hours=round(rng.uniform(1.0, 24.0), 1),
                reminder_response_rate=round(rng.uniform(0.4, 1.0), 2),
                behavior_pattern=pattern,
                preferred_channel=rng.choice(["SMS", "WhatsApp", "Phone Call"])
            )
            patient_objs.append(p)

        db.add_all(patient_objs)
        db.commit()
        for p in patient_objs:
            db.refresh(p)

        print("Seeding 210+ Appointments across 11 Doctors...")
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        appointments = []
        predictions = []

        # 1. Aarav Mehta (PT-10482) - Primary Demo Case: Tomorrow 10:30 AM
        # Aarav Mehta | 10:30 AM | Dr. Sharma | 87% | HIGH | Not confirmed | Send SMS
        app_aarav = Appointment(
            patient_id=p_aarav.id,
            doctor_name="Dr. Sharma",
            department="Cardiology",
            appointment_date=tomorrow.isoformat(),
            appointment_time="10:30 AM",
            appointment_type="Specialist Review",
            booking_date=(today - timedelta(days=16)).isoformat(),
            days_in_advance=17,
            sms_reminder_sent=True,
            confirmation_status="Not confirmed",
            recovery_status="At_Risk",
            estimated_slot_value=2500,
            status="Scheduled",
            notes="Follow-up after echocardiogram. High prior missed appointment pattern."
        )
        db.add(app_aarav)
        db.flush()

        pred_aarav = Prediction(
            appointment_id=app_aarav.id,
            risk_probability=0.87,
            risk_level="HIGH",
            top_factors=[
                {"factor": "previous_no_shows", "label": "Previous missed appointments", "impact_direction": "positive", "contribution": 0.35, "percentage": 31},
                {"factor": "booking_gap", "label": "Long booking-to-appointment gap (17d)", "impact_direction": "positive", "contribution": 0.25, "percentage": 22},
                {"factor": "reminder_history", "label": "No response to SMS reminder", "impact_direction": "positive", "contribution": 0.20, "percentage": 18},
                {"factor": "appointment_time", "label": "Appointment scheduled early morning", "impact_direction": "positive", "contribution": 0.15, "percentage": 11}
            ],
            recommended_action="Send SMS reminder 24 hours before appointment.",
            recommended_strategy="SMS + WhatsApp/call escalation",
            estimated_impact_prob=0.68
        )
        predictions.append(pred_aarav)

        # 2. Priya Kapoor (PT-10483): Today 11:00 AM | Dr. Singh | 61% | MEDIUM | Confirmed | Monitor
        app_priya = Appointment(
            patient_id=p_priya.id,
            doctor_name="Dr. Singh",
            department="Orthopedics",
            appointment_date=today.isoformat(),
            appointment_time="11:00 AM",
            appointment_type="Consultation",
            booking_date=(today - timedelta(days=6)).isoformat(),
            days_in_advance=6,
            sms_reminder_sent=True,
            confirmation_status="Confirmed",
            recovery_status="Normal",
            estimated_slot_value=2200,
            status="Scheduled",
            notes="Right knee evaluation. Confirmed attendance via WhatsApp."
        )
        db.add(app_priya)
        db.flush()

        pred_priya = Prediction(
            appointment_id=app_priya.id,
            risk_probability=0.61,
            risk_level="MEDIUM",
            top_factors=[
                {"factor": "previous_no_shows", "label": "1 previous missed appointment", "impact_direction": "positive", "contribution": 0.22, "percentage": 24},
                {"factor": "booking_gap", "label": "6-day scheduling window", "impact_direction": "positive", "contribution": 0.16, "percentage": 18},
                {"factor": "reminder_response", "label": "Confirmed via WhatsApp", "impact_direction": "negative", "contribution": -0.18, "percentage": 16}
            ],
            recommended_action="Monitor confirmed slot; standard clinical queue.",
            recommended_strategy="SMS + confirmation request",
            estimated_impact_prob=0.38
        )
        predictions.append(pred_priya)

        # 3. Rahul Verma (PT-10484): Today 11:30 AM | Dr. Sharma | 12% | LOW | Confirmed | No action
        app_rahul = Appointment(
            patient_id=p_rahul.id,
            doctor_name="Dr. Sharma",
            department="Cardiology",
            appointment_date=today.isoformat(),
            appointment_time="11:30 AM",
            appointment_type="Routine Follow-up",
            booking_date=(today - timedelta(days=2)).isoformat(),
            days_in_advance=2,
            sms_reminder_sent=True,
            confirmation_status="Confirmed",
            recovery_status="Normal",
            estimated_slot_value=1850,
            status="Scheduled",
            notes="Routine hypertension check-in."
        )
        db.add(app_rahul)
        db.flush()

        pred_rahul = Prediction(
            appointment_id=app_rahul.id,
            risk_probability=0.12,
            risk_level="LOW",
            top_factors=[
                {"factor": "consistent_attendance", "label": "Reliable attendance history (100%)", "impact_direction": "negative", "contribution": -0.30, "percentage": 28},
                {"factor": "booking_gap", "label": "Short booking lead time (2 days)", "impact_direction": "negative", "contribution": -0.18, "percentage": 18},
                {"factor": "reminder_history", "label": "Confirmed immediately", "impact_direction": "negative", "contribution": -0.15, "percentage": 15}
            ],
            recommended_action="No action; patient has high adherence track record.",
            recommended_strategy="Standard reminder",
            estimated_impact_prob=0.08
        )
        predictions.append(pred_rahul)

        # Generate 207 more appointments across today and next 10 days
        all_patients_list = patient_objs[3:]
        dates_pool = [
            today.isoformat(),
            tomorrow.isoformat(),
            (today + timedelta(days=2)).isoformat(),
            (today + timedelta(days=3)).isoformat(),
            (today + timedelta(days=4)).isoformat(),
            (today + timedelta(days=5)).isoformat(),
            (today + timedelta(days=7)).isoformat()
        ]

        at_risk_appointments = [app_aarav]

        for i in range(207):
            pat = rng.choice(all_patients_list)
            doc_name, dept = rng.choice(DOCTORS)
            app_date = rng.choice(dates_pool)
            app_time = rng.choice(TIME_SLOTS)
            app_type = rng.choice(APPOINTMENT_TYPES)
            days_adv = rng.choice([1, 2, 3, 5, 7, 10, 14, 21])
            b_date = (date.fromisoformat(app_date) - timedelta(days=days_adv)).isoformat()
            
            # Risk & confirmation distribution
            is_unconfirmed = rng.random() > 0.40
            conf_status = "Not confirmed" if is_unconfirmed else "Confirmed"
            
            app = Appointment(
                patient_id=pat.id,
                doctor_name=doc_name,
                department=dept,
                appointment_date=app_date,
                appointment_time=app_time,
                appointment_type=app_type,
                booking_date=b_date,
                days_in_advance=days_adv,
                sms_reminder_sent=rng.choice([True, False]),
                confirmation_status=conf_status,
                recovery_status="Normal",
                estimated_slot_value=rng.choice([1800, 2200, 2500, 3000, 3500]),
                status="Scheduled"
            )
            db.add(app)
            db.flush()

            # Predict risk
            pred_info = predict_appointment_risk({
                "age": pat.age,
                "gender": pat.gender,
                "chronic_condition": pat.chronic_condition,
                "distance_km": pat.distance_km,
                "insurance_type": pat.insurance_type,
                "previous_no_shows": pat.missed_appointments,
                "previous_attendance_rate": pat.attendance_rate,
                "appointment_date": app_date,
                "appointment_time": app_time,
                "department": dept,
                "doctor_name": doc_name,
                "appointment_type": app_type,
                "days_in_advance": days_adv,
                "sms_reminder_sent": app.sms_reminder_sent
            })

            strat = "Standard reminder"
            if pred_info["risk_level"] == "HIGH":
                strat = "SMS + WhatsApp/call escalation" if is_unconfirmed else "SMS + confirmation prompt"
                if is_unconfirmed and len(at_risk_appointments) < 11:
                    app.recovery_status = "At_Risk"
                    at_risk_appointments.append(app)
            elif pred_info["risk_level"] == "MEDIUM":
                strat = "SMS + confirmation request"

            pred = Prediction(
                appointment_id=app.id,
                risk_probability=pred_info["risk_probability"],
                risk_level=pred_info["risk_level"],
                top_factors=pred_info["top_factors"],
                recommended_action=pred_info["recommended_action"],
                recommended_strategy=strat,
                estimated_impact_prob=pred_info["estimated_impact_prob"]
            )
            predictions.append(pred)

        db.add_all(predictions)
        db.commit()

        print("Seeding 16 Waitlist Patients...")
        waitlist_entries = [
            Waitlist(
                patient_id=p_priya.id,
                doctor_name="Dr. Sharma",
                department="Cardiology",
                preferred_date=tomorrow.isoformat(),
                preferred_time_range="10:00 AM - 12:00 PM",
                appointment_type="Consultation",
                priority="Urgent",
                status="Waiting",
                contact_status="Ready",
                notes="Available today. Doctor: Dr. Sharma. Preferred time: 10 AM-12 PM."
            )
        ]

        # Additional waitlist candidates across specialties
        waitlist_candidates_pool = patient_objs[10:25]
        for idx, w_pat in enumerate(waitlist_candidates_pool):
            doc, dept = rng.choice(DOCTORS)
            prio = rng.choice(["Urgent", "High", "Medium"])
            waitlist_entries.append(
                Waitlist(
                    patient_id=w_pat.id,
                    doctor_name=doc,
                    department=dept,
                    preferred_date=(today + timedelta(days=rng.randint(0, 3))).isoformat(),
                    preferred_time_range=rng.choice(["09:00 AM - 12:00 PM", "02:00 PM - 05:00 PM", "Any"]),
                    appointment_type=rng.choice(["Consultation", "Specialist Review"]),
                    priority=prio,
                    status="Waiting",
                    contact_status="Ready",
                    notes=f"Waiting for cancellation opening with {doc} in {dept}."
                )
            )
        db.add_all(waitlist_entries)
        db.commit()
        for w in waitlist_entries:
            db.refresh(w)

        print("Seeding 11 Slot Recovery Records (At-Risk Slots)...")
        # Ensure exactly 11 active at-risk slots in Slot Recovery Center as required by prompt
        slot_recovery_records = []
        
        # 1. Aarav Mehta's slot recovery record
        rec_aarav = SlotRecovery(
            appointment_id=app_aarav.id,
            risk_probability=0.87,
            recommendation="Release slot and notify waitlist",
            reasoning="87% no-show probability. Patient has not confirmed. 3 patients are waiting for Dr. Sharma in Cardiology.",
            action_type="WAITLIST",
            status="Proposed",
            candidate_waitlist_id=waitlist_entries[0].id,
            revenue_protected=2500
        )
        slot_recovery_records.append(rec_aarav)

        # 10 other at-risk slots
        recommendations_cycle = [
            ("Release slot and notify waitlist", "84% no-show probability. Patient has not confirmed 18 hours prior. 2 high-priority patients waiting.", "WAITLIST"),
            ("Controlled double-booking recommended", "79% no-show risk with 85% double-book backfill probability. Routine review slot.", "DOUBLE_BOOK"),
            ("Release slot and notify waitlist", "82% no-show probability with unconfirmed phone outreach. Waitlist candidate available immediately.", "WAITLIST"),
            ("Controlled double-booking recommended", "76% risk. High slot demand in Orthopedics. Dual coverage advised.", "DOUBLE_BOOK"),
            ("Release slot and notify waitlist", "89% non-attendance risk. Patient uncontactable.", "WAITLIST"),
            ("Continue monitoring", "68% probability. Patient has historically confirmed 2h before. Monitor until 8:00 AM.", "MONITOR"),
            ("Release slot and notify waitlist", "85% no-show risk. Urgent waitlist patient ready for consultation.", "WAITLIST"),
            ("Controlled double-booking recommended", "74% probability. Doctor has 30-min buffer between sessions.", "DOUBLE_BOOK"),
            ("Release slot and notify waitlist", "81% risk with long commute lead time unconfirmed.", "WAITLIST"),
            ("Continue monitoring", "66% risk. Reminder sent 2 hours ago. Awaiting response.", "MONITOR")
        ]

        for idx, at_risk_app in enumerate(at_risk_appointments[1:11]):
            rec_text, reason, act_type = recommendations_cycle[idx % len(recommendations_cycle)]
            matched_wl = waitlist_entries[(idx + 1) % len(waitlist_entries)].id if act_type == "WAITLIST" else None
            
            rec = SlotRecovery(
                appointment_id=at_risk_app.id,
                risk_probability=at_risk_app.prediction.risk_probability if at_risk_app.prediction else 0.80,
                recommendation=rec_text,
                reasoning=reason,
                action_type=act_type,
                status="Proposed",
                candidate_waitlist_id=matched_wl,
                revenue_protected=at_risk_app.estimated_slot_value or 2500
            )
            slot_recovery_records.append(rec)

        db.add_all(slot_recovery_records)
        db.commit()

        print("Seeding Initial Reminders...")
        reminders = [
            Reminder(
                appointment_id=app_aarav.id,
                patient_id=p_aarav.id,
                channel="SMS",
                strategy="SMS + WhatsApp/call escalation",
                status="Sent",
                scheduled_for="24 hours before appointment",
                notes="Multi-channel reminder sent. Patient has not yet confirmed."
            ),
            Reminder(
                appointment_id=app_priya.id,
                patient_id=p_priya.id,
                channel="WhatsApp",
                strategy="SMS + confirmation request",
                status="Delivered",
                scheduled_for="48 hours before appointment",
                notes="Patient clicked 1-tap confirmation link."
            )
        ]
        db.add_all(reminders)
        db.commit()

        print(f"SlotSure database successfully seeded with:")
        print(f"• {len(patient_objs)} Patients")
        print(f"• {len(appointments) + 3} Appointments")
        print(f"• {len(waitlist_entries)} Waitlist Candidates")
        print(f"• {len(slot_recovery_records)} Active At-Risk Slots")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
