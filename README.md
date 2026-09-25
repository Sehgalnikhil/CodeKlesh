# SlotSure — AI Missed Appointment Predictor & Smart Slot Recovery

> **"Predict the no-show. Recover the slot."**  
> An enterprise-grade clinical decision support & autonomous capacity recovery platform that bridges predictive machine learning with real healthcare revenue protection.

---

## 1. Product Overview

Medical appointment no-shows cost outpatient clinics billions in lost capacity while leaving patients on waitlists waiting weeks for open consultation slots. **SlotSure** solves both halves of the problem:

1. **Predicts** missed appointments before they occur using an explainable clinical machine learning ensemble.
2. **Intervenes** with tailored, multi-channel automated reminders across WhatsApp, Voice AI, and SMS.
3. **Recovers** unconfirmed, high-risk slots by intelligently backfilling with matching waitlist patients or controlled double-booking.
4. **Tracks** live patient journey telemetry via PWA radar and dynamically rebalances outpatient queues when doctors or patients face transit delays.
5. **Measures** recovered capacity and protected revenue in real time on an executive ROI dashboard.

```
PATIENT BOOKS APPOINTMENT
        ↓
1. AI PREDICTS NO-SHOW RISK (Low / Medium / High + Exact %)
        ↓
2. AI EXPLAINS WHY (Granular Factor Attribution & SHAP Weights)
        ↓
3. AUTONOMOUS INTERVENTIONS (WhatsApp AI Concierge / Interactive Voice AI / SMS)
        ↓
4. PATIENT CONFIRMATION TRACKER (Auto-timeout after 24h)
        ↓
5. IF HIGH-RISK + UNCONFIRMED
        ↓
6. SMART SLOT RECOVERY CENTER (Waitlist Matching / Controlled Double-Booking / Slot Release)
        ↓
7. MEASURE RECOVERED CAPACITY & REVENUE (₹42,800+ protected today)
```

---

## 2. Key Capabilities & Feature Modules

### 🩺 Executive Clinical Dashboard
- **5 Live KPIs**: Today's Appointments, High-Risk Appointments, Predicted No-Shows, Slots at Risk, Capacity Recovered (₹42,800+).
- **Risk Distribution Visuals**: Recharts interactive donut visualization (High / Medium / Low).
- **Today's Risk Queue**: Instant operational view of patients requiring immediate front-desk attention.
- **One-Click Demo Scenario**: Instantly launches the 2-minute clinical lifecycle demonstration.

### 🧠 Clinical Risk Ensemble ML & Explainable AI (XAI)
- **Model**: Scikit-Learn Random Forest Classifier evaluated on ROC-AUC, Precision, and Recall.
- **ROC-AUC**: `0.7928` | **Recall**: `78.75%` | **Accuracy**: `71.92%`
- **Granular Factor Attribution**: Horizontal factor bars detailing exact positive and negative drivers:
  - Historical Attendance Rate (`27.3%` weight)
  - Prior Missed Appointments (`25.4%` weight)
  - Booking Lead Time (`12.9%` weight)
  - Distance to Clinic (`10.3%` weight)
  - Patient Age Bracket (`9.9%` weight)
  - Prior Reminder Acknowledgement (`4.4%` weight)
- **Post-Intervention Projection**: Real-time recalculation of risk probability drop after reminder delivery (e.g. `87% → 68%`).

### 🔄 Smart Slot Recovery Center (`/recovery`)
- **Active Decision Engine**: Continuously scans for slots where `risk > 65%` and status remains `Unconfirmed` within 24 hours of consultation.
- **Intelligent Waitlist Backfill**: Instant match scoring based on department, doctor specialty, patient travel radius, and waitlist priority.
- **Controlled Double-Booking Guardrails**: Safety modal calculating overlap risk, doctor specialty throughput, and buffer minutes.
- **Urgent Triage Slot Release**: Instantly vacates the slot for urgent walk-in triage with automated SMS broadcasts.

### 💬 WhatsApp AI Concierge & Headless Gateway
- **Real WhatsApp Integration**: Powered by an independent Node.js Express service running `@whiskeysockets/baileys` with live QR code pairing.
- **Bilingual NLP**: Handles natural conversational replies in English, Hindi, and Hinglish (*"Mujhe kal subah 10 baje ka slot chahiye"*, *"Haan theek hai confirm kardo"*).
- **Automated Negotiation**: Reschedules appointments and coordinates waitlist slot reallocation automatically.

### 📞 Live Interactive Voice AI (`/voice`)
- **Dual Telephony Architecture**:
  - **Carrier Outbound Calling**: Twilio REST API with dynamic TwiML IVR scripts (`<Gather numDigits="1">`) for cellular voice prompts.
  - **WebRTC In-Browser Interactive AI**: Zero-cost, high-definition browser audio call with bilingual voice recognition and synthesis.
- **Natural Dialogue State Machine**: Handles bookings, doctor inquiries, schedule checks, and cancellations.

### 🧭 Patient Journey Radar & Queue Balancer (`/queue`)
- **PWA Commute Radar**: Real-time simulated GPS tracking of patient transit to the clinic.
- **Dynamic Traffic & Delay Detection**: Flags delays and recalculates estimated time of arrival (ETA).
- **Doctor Delay Broadcast**: Alerts queued patients when a doctor is running behind schedule and adjusts queue buffers.

### 📄 Azure Cognitive Services Document Scanner
- **Azure AI Document Intelligence**: Extracts patient names, dates, diagnoses, and lab results directly from uploaded prescription slips and referral letters into structured clinic records.

### 👓 Spatial 3D Design Experience
- **Apple Vision Pro Aesthetics**: Frosted glassmorphism (`backdrop-blur-md`), specular lighting, and fluid hover states.
- **Three.js Apple3DRiskGauge**: Interactive 3D WebGL radial gauge with particle physics showing dynamic risk arcs (Green / Amber / Red).
- **Three.js RecoveryConvergence3D**: Real-time 3D particle visualization showing waitlist patients flowing into vacated slots.

### ⏱️ Guided 2-Minute Interactive Demo Scenario
An 8-stage interactive stepper (`DemoScenarioModal.tsx`) built for presentations and hackathons:
1. **Detect**: Highlights Aarav Mehta (Cardiology, 87% High Risk, Unconfirmed).
2. **Explain**: Visualizes XAI factor breakdown.
3. **Intervene**: Dispatches personalized WhatsApp notification.
4. **Timeout**: Simulates 24-hour confirmation expiration.
5. **Recovery Engine**: Slot Recovery flags slot as an active capacity risk.
6. **Waitlist Match**: Matches prioritized outpatient candidate **Priya Kapoor** (Urgent, 94% match).
7. **Reallocate**: Reallocates slot to Priya and records the swap.
8. **Value Protected**: Demonstrates ₹2,500 protected revenue and updates the clinic's recovered capacity dashboard.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Apple Vision + Linear design tokens)
- **3D & Visuals**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Charts & Motion**: Recharts, Framer Motion, Lucide React
- **Voice / Audio**: Web Speech API, Web Audio API

### Backend API
- **Framework**: FastAPI (Python 3.10+)
- **Data Validation & ORM**: Pydantic v2, SQLAlchemy 2.0
- **Database**: SQLite (`attendai.db`) with zero-configuration fallback, compatible with PostgreSQL
- **Machine Learning**: Scikit-Learn, NumPy, Pandas, Joblib
- **Auth & Security**: PyJWT, Passlib (Bcrypt)

### Microservices & External Gateways
- **WhatsApp Gateway**: Node.js, Express, `@whiskeysockets/baileys` (Port `5005`)
- **Cloud Telephony**: Twilio Voice REST & TwiML IVR
- **Cognitive Cloud**: Azure AI Document Intelligence & Azure Speech Services

---

## 4. Directory Structure

```
├── run.sh                          # Single command startup script
├── attendai.db                     # Pre-seeded SQLite database
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application & router registration
│   │   ├── database.py             # SQLAlchemy engine & session management
│   │   ├── models.py               # ORM database schema models
│   │   ├── schemas.py              # Pydantic request/response schemas
│   │   ├── seed.py                 # Clinical cohort seed generator (105 patients, 210 appts)
│   │   ├── routes/
│   │   │   ├── analytics.py        # 5 core KPIs, distributions, ROI metrics
│   │   │   ├── appointments.py     # Appointment CRUD & automated risk inference
│   │   │   ├── azure.py            # Azure AI document & speech services
│   │   │   ├── events.py           # Real-time activity stream & notifications
│   │   │   ├── patients.py         # Patient directory & medical records
│   │   │   ├── predict.py          # ML risk prediction & XAI attribution
│   │   │   ├── queue.py            # Live Journey Radar & queue delays
│   │   │   ├── reminders.py        # Multi-channel reminder dispatch engine
│   │   │   ├── slot_recovery.py    # Active recovery center & waitlist backfill
│   │   │   ├── voice.py            # Interactive Voice AI (Twilio & WebRTC)
│   │   │   ├── waitlist.py         # Outpatient waitlist candidate engine
│   │   │   └── whatsapp.py         # WhatsApp bilingual NLP concierge
│   │   └── services/
│   │       └── azure_ai.py         # Azure Cognitive Services client wrapper
│   ├── ml/
│   │   ├── train.py                # ML ensemble model training pipeline
│   │   └── predict.py              # Risk inference & SHAP feature importance
│   └── models/
│       ├── no_show_model.pkl       # Trained Random Forest model binary
│       └── model_metrics.json      # Model evaluation benchmarks (ROC-AUC 0.793)
├── frontend/
│   ├── src/
│   │   ├── api/client.ts           # REST API client & Axios/fetch endpoints
│   │   ├── components/
│   │   │   ├── demo/               # 2-minute guided demo modal & stepper
│   │   │   ├── layout/             # Sidebar, SpatialHeader, SpatialNav
│   │   │   ├── modals/             # Voice, WhatsApp, Radar, Scanner, ROI modals
│   │   │   ├── spatial3d/          # Three.js 3D Risk Gauge & Recovery Convergence
│   │   │   └── ui/                 # AppleVision3DCard, ClinicLiveWire
│   │   ├── pages/                  # Dashboard, Recovery, Waitlist, RiskQueue, Analytics
│   │   └── types/                  # TypeScript interface definitions
│   └── package.json
└── services/
    └── whatsapp-gateway/           # Baileys WhatsApp Web headless gateway
        ├── server.js               # Express server & Baileys socket
        └── package.json
```

---

## 5. Quick Start (Single Command)

To run the entire platform (FastAPI backend + Vite frontend):

```bash
./run.sh
```

- **Frontend Application**: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Backend API & Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **WhatsApp Gateway Service**: [http://127.0.0.1:5005/status](http://127.0.0.1:5005/status)

### Manual Startup (Individual Services)

```bash
# 1. Backend API
cd backend
source venv/bin/activate
PYTHONPATH=.. uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# 2. Frontend Application
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173

# 3. WhatsApp Gateway (Optional)
cd services/whatsapp-gateway
npm install
node server.js
```

---

## 6. Pre-Seeded Clinical Cohort & Personas

The database comes pre-seeded with realistic Indian clinical personas:
- **105 Patients** with comprehensive histories (attendance rate, reminder response rate, average confirmation hours, commute distance).
- **210 Appointments** across 5 medical departments.
- **16 Outpatient Waitlist Entries** waiting for specialized openings.
- **11 Active At-Risk Slots** queued in the recovery engine.

### Clinical Staff Roles
| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Doctor** | `dr.sharma@attendai.com` | `password123` | Patient history, consultation queue, risk indicators |
| **Receptionist** | `reception@attendai.com` | `password123` | Operational risk queue, slot recovery actions, reminder dispatch |
| **Admin** | `admin@attendai.com` | `password123` | Executive ROI reports, ML model metrics, clinic-wide KPIs |

---

## 7. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `POST` | `/auth/login` | Staff authentication & JWT issuance |
| `GET` | `/analytics` | 5 core KPIs, distributions, and revenue metrics |
| `GET` | `/slot-recovery` | Active at-risk slots and automated recommendations |
| `POST` | `/slot-recovery/execute` | Execute recovery (`FILL_WAITLIST`, `DOUBLE_BOOK`, `RELEASE`, `DISMISS`) |
| `GET` | `/waitlist` | Prioritized clinic waitlist entries |
| `POST` | `/waitlist` | Register new waitlist candidate |
| `POST` | `/waitlist/{id}/offer` | Offer open slot to candidate with auto-expiry timer |
| `GET` | `/appointments` | Filterable appointments with risk scores and confirmation state |
| `POST` | `/appointments` | Create appointment with automated risk inference |
| `POST` | `/predict` | Real-time clinical risk prediction & XAI attributions |
| `POST` | `/reminders` | Dispatch multi-channel reminder (WhatsApp, SMS, Email) |
| `POST` | `/voice/dispatch-call` | Trigger outbound interactive AI phone call |
| `POST` | `/voice/ai-dialogue` | Two-way bilingual voice dialogue state machine |
| `POST` | `/whatsapp/message` | WhatsApp AI concierge natural language handler |
| `GET` | `/queue/radar` | Live patient commute telemetry & GPS ETA radar |
| `POST` | `/azure/analyze-document`| Azure AI OCR extraction on medical prescriptions |
| `GET` | `/models-info/metrics` | Model evaluation benchmarks (ROC-AUC, feature importances) |

---

## 8. License

Developed for healthcare providers, clinical decision support, and capacity optimization. All rights reserved.
