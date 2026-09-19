# SlotSure — AI Missed Appointment Predictor & Smart Slot Recovery

> **"Predict the no-show. Recover the slot."**  
> An enterprise-grade clinical decision support & capacity recovery platform that bridges prediction and real revenue protection.

---

## 1. Product Overview

Medical appointment no-shows cost Indian healthcare clinics billions in lost capacity while leaving patients on waitlists waiting weeks for open slots. **SlotSure** solves both halves of the problem:

1. **Predicts** missed appointments using an explainable clinical machine learning ensemble.
2. **Intervenes** with tailored, multi-channel reminders before the visit.
3. **Recovers** unconfirmed, high-risk slots by intelligently backfilling with matching waitlist patients or controlled double-booking.
4. **Measures** recovered capacity and protected revenue in real time.

```
PATIENT BOOKS APPOINTMENT
        ↓
AI PREDICTS NO-SHOW RISK (Low / Medium / High + %)
        ↓
AI EXPLAINS WHY (Granular Factor Attribution)
        ↓
AI CHOOSES INTERVENTION (Personalized multi-channel reminder)
        ↓
PATIENT CONFIRMATION TRACKER (Auto-timeout after 24h)
        ↓
IF HIGH-RISK + UNCONFIRMED
        ↓
SMART SLOT RECOVERY CENTER (Waitlist Matching / Controlled Double-Booking / Release)
        ↓
MEASURE RECOVERED CAPACITY & REVENUE (₹42,800+ today)
```

---

## 2. Key Capabilities & Architecture

- **Executive Clinical Dashboard**:
  - 5 Real-Time KPIs: *Today's Appointments* (30), *High-Risk Appointments* (17), *Predicted No-Shows* (21), *Slots at Risk* (11), *Capacity Recovered* (₹42,800).
  - Risk Distribution Donut chart (`High`, `Medium`, `Low`).
  - **Today's Risk Queue**: Instant operational view of patients requiring attention.
  - One-click trigger for the **2-Minute Hackathon Demo Scenario**.

- **Smart Slot Recovery Center** (`/recovery`):
  - Active decision engine monitoring 11 at-risk slots (no-show risk > 65% + unconfirmed within 24h).
  - **Waitlist Backfill**: Instant matching against prioritized outpatient waitlist entries.
  - **Controlled Double-Booking**: Guardrail safety modal calculating overlap risk, doctor specialty capacity, and buffer duration.
  - **Slot Release**: Opens slot for urgent walk-in triage with instant SMS notification.

- **Waitlist Candidate Engine** (`/waitlist`):
  - 16 seeded outpatient waitlist entries across Cardiology, Orthopedics, General Medicine, Neurology, and Pediatrics.
  - Intelligent match scoring based on department, doctor availability, and patient travel radius.

- **Dedicated Operational Risk Queue** (`/risk-queue`):
  - High and Medium unconfirmed appointments filterable by status, department, and doctor.

- **Explainable AI (XAI)**:
  - Granular horizontal factor bars detailing why a patient is high-risk (e.g. prior missed visits `+31%`, lead time `+22%`, morning slot `+15%`).
  - Expected risk reduction projection before and after intervention (e.g. 87% → 68%).

- **Interactive 2-Minute Demo Scenario**:
  - 8-stage interactive stepper (`DemoScenarioModal.tsx`) walking through the complete life cycle of an at-risk appointment:
    1. Detect Aarav Mehta (Cardiology, 87% High Risk, Unconfirmed)
    2. Explain AI Risk Attribution
    3. Trigger Personalized Reminder
    4. Simulate 24-Hour Confirmation Timeout
    5. Trigger Slot Recovery Decision Engine
    6. Match Waitlist Candidate (Priya Kapoor, Urgent)
    7. Reallocate & Backfill Appointment Slot
    8. Measure Capacity Impact (+₹2,500 slot value, ₹42,800 total)

- **Landing Page & SaaS Economics**:
  - Modern marketing page featuring 5-stage lifecycle graphic, business impact metrics (1,284 appointments analyzed, 183 high-risk detected, 48 slots refilled, ₹1,42,000 protected), and 3-tier SaaS pricing (Starter ₹2,999/mo, Pro ₹7,999/mo, Enterprise Custom).

---

## 3. Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Apple + Linear + Stripe design system), Lucide React, Recharts, Framer Motion.
- **Backend**: FastAPI (Python 3.10+), Pydantic v2, SQLAlchemy 2.0 ORM, PyJWT, Passlib/Bcrypt.
- **Database**: PostgreSQL support via `DATABASE_URL` with automatic zero-configuration SQLite fallback (`backend/attendai.db`).
- **Machine Learning**: Scikit-Learn Random Forest Clinical Ensemble (`backend/models/no_show_model.pkl`), calibrated feature importance, and ROC-AUC metrics.

---

## 4. Quick Start (Single Command)

```bash
./run.sh
```

- **Frontend Application**: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Backend API & Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 5. Running the 2-Minute Demo Scenario

1. Open [http://127.0.0.1:5173](http://127.0.0.1:5173).
2. Click the glowing **"Run Demo Scenario"** button in the left sidebar or the top banner on the Dashboard.
3. Use the **"Auto-Play Demo"** button or step through stages 1 to 8:
   - **Stage 1**: View Aarav Mehta flagged at **87% High Risk**.
   - **Stage 2**: Inspect XAI factor breakdown.
   - **Stage 3**: Send personalized WhatsApp reminder.
   - **Stage 4**: Simulate patient not confirming.
   - **Stage 5**: Slot Recovery engine flags slot as at-risk.
   - **Stage 6**: Algorithm matches waitlist candidate **Priya Kapoor**.
   - **Stage 7**: Reallocate slot and confirm Priya.
   - **Stage 8**: See ₹2,500 protected and capacity restored.
4. Click **"Complete & View Live System"** to return to the live dashboard with updated stats!

---

## 6. Seed Cohort & Personas

The database is pre-seeded with:
- **105 Patients** with comprehensive clinical and behavioral histories (attendance rate, reminder response rate, average confirmation hours, commute distance).
- **210 Appointments** across 5 medical departments.
- **16 Outpatient Waitlist Entries** waiting for openings.
- **11 Active At-Risk Slots** in the Slot Recovery Center.

### Clinical Personas:
| Role | Email | Password | Name |
| :--- | :--- | :--- | :--- |
| **Doctor** | `dr.sharma@attendai.com` | `password123` | Dr. Sharma (Cardiology) |
| **Receptionist** | `reception@attendai.com` | `password123` | Neha Gupta (Front Desk) |
| **Admin** | `admin@attendai.com` | `password123` | Clinical Director |

*(You can also quickly switch roles anytime using the selector at the bottom of the sidebar).*

---

## 7. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `POST` | `/auth/login` | Staff authentication |
| `GET` | `/analytics` | 5 core KPIs, distribution charts, and business metrics |
| `GET` | `/slot-recovery` | Active at-risk slots and automated recommendations |
| `POST` | `/slot-recovery/execute` | Execute recovery action (`FILL_WAITLIST`, `DOUBLE_BOOK`, `RELEASE`, `DISMISS`) |
| `GET` | `/waitlist` | Prioritized clinic waitlist entries |
| `POST` | `/waitlist` | Add patient to waitlist |
| `POST` | `/waitlist/{id}/offer` | Offer open slot to candidate with automated expiry |
| `GET` | `/appointments` | Filterable appointments with risk scores and confirmation state |
| `POST` | `/appointments` | Create appointment with automated risk inference |
| `POST` | `/predict` | Real-time clinical risk prediction & XAI attributions |
| `POST` | `/reminders` | Dispatch multi-channel reminder simulation |
| `GET` | `/patients` | Patient directory with behavioral history |
| `POST` | `/patients` | Register new clinical patient |
| `GET` | `/model/metrics` | Model evaluation (ROC-AUC, feature importances, confusion matrix) |
