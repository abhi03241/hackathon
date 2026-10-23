# 🧘 NG Yoga Studio — Full-Stack Clinical Routing & Membership Platform

**Location:** Prem Plaza, Near ICICI Bank, Ashok Nagar, Indore (MP 452001)  
**Founder & Lead Instructor:** Narayan Gothane (NG Gothane)

> A complete, production-ready platform for yoga studio client management — covering clinical health intake, AI programme routing, batch booking, membership management, retention triage, and AI-powered pose assessment.

---

## 📦 What's in This Repository

| Module | Tech | What it does |
|---|---|---|
| [`/backend`](#backend--fastapi) | FastAPI + SQLAlchemy + SQLite | REST API — auth, routing engine, bookings, memberships, retention |
| [`/app` `/components` `/lib`](#frontend--nextjs-15) | Next.js 15 + TypeScript | Client-facing web platform |
| [`/yoga-pose-assessment`](#yoga-pose-assessment-module) | Python + MediaPipe + Streamlit | AI yoga pose checker with skeleton overlay & scoring |

---

## 🔴 Live Demo — Yoga Pose Assessment in Action

Real people, real-time skeleton detection and angle-based corrections:

| Tree Pose ✅ — All joints correct | Warrior II ⚠️ — Corrections needed |
|:---:|:---:|
| ![Tree Pose Skeleton](yoga-pose-assessment/shr.jpg) | ![Warrior II Skeleton](yoga-pose-assessment/tej.jpg) |
| All joints **green** — 158°/157° arm raise, hip at 171° | **Red joints** = needs fixing. Shoulder 108°, hip 139° off-target |

| Streamlit App — **Warrior II: 93% accuracy** | Streamlit App — **Warrior I: 89% accuracy** |
|:---:|:---:|
| ![Warrior II App](yoga-pose-assessment/WhatsApp%20Image%202026-10-24%20at%2000.11.06.jpeg) | ![Warrior I App](yoga-pose-assessment/WhatsApp%20Image%202026-10-24%20at%2000.11.33.jpeg) |
| *"Bend right knee more (123°, aim ~90°)"* | *"Straighten right elbow (140°, aim ~180°)"* |
| *"Open left hip (139°, aim ~165°)"* | *"Bend left knee more (119°, aim ~90°)"* |

> 🟢 **Green dot** = joint within correct angle range &nbsp; 🔴 **Red dot** = needs correction &nbsp; Numbers = actual measured degrees



## 🖥️ Platform Screenshots

### Client Landing Page
The client-facing studio platform — clean Catppuccin Latte design, no admin UI exposed.

### Multi-Step Onboarding Wizard
New members fill a 7-step clinical intake form:
1. Personal Info (name, phone, age)
2. Experience Level
3. Health Conditions (back pain, PCOD, High BP, pregnancy, etc.)
4. Goal Selection (weight loss, flexibility, stress relief, fitness)
5. **Auto Programme Routing** (R1–R6 rules applied live)
6. Batch Selection
7. Membership Plan

### Member Portal
Shows routing result, active membership, booking history, and renewal options.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                           │
│   Next.js 15 App (localhost:3001)                           │
│   ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐    │
│   │  Landing     │ │ Onboarding  │ │  Member Portal   │    │
│   │  View        │ │ Wizard      │ │  (My Pass)       │    │
│   └──────────────┘ └─────────────┘ └──────────────────┘    │
│          │                │                  │              │
│          └────────────────┴──────────────────┘              │
│                           │                                 │
│                    Next.js API Routes (/api/*)              │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP
┌───────────────────────────▼─────────────────────────────────┐
│              FastAPI Backend (localhost:8000)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  auth.py │ │routing.py│ │schemas.py│ │  whatsapp.py  │  │
│  │ JWT+Hash │ │R1–R6 Rules│ │ Pydantic │ │  wa.me URLs   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              database.py (SQLAlchemy ORM)            │   │
│  │  Users · Members · HealthProfiles · Batches          │   │
│  │  Memberships · Bookings · Checkins · Waitlist         │   │
│  └──────────────────────────────────────────────────────┘   │
│                         SQLite DB                           │
└─────────────────────────────────────────────────────────────┘
                            
┌─────────────────────────────────────────────────────────────┐
│          Yoga Pose Assessment (Standalone Module)           │
│  Streamlit App · MediaPipe Pose · 15 Poses · Webcam/Upload  │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Backend — FastAPI

### Setup & Run

```powershell
# From project root
.\\backend\\venv\\Scripts\\pip install -r backend\\requirements.txt

# Start backend (auto-seeds DB on first startup)
.\\backend\\venv\\Scripts\\uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Backend Files

| File | Purpose |
|---|---|
| `main.py` | All API endpoints (1000+ lines) — auth, intake, bookings, retention |
| `database.py` | 8 SQLAlchemy ORM tables — Users, Members, HealthProfiles, Batches, Memberships, Bookings, Checkins, Waitlist |
| `auth.py` | SHA256 password hashing + JWT token generation + 3-level access guards |
| `schemas.py` | Pydantic v2 request validation — Indian phone regex, age bounds, consent enforcement |
| `routing.py` | Deterministic R1–R6 clinical programme routing engine |
| `whatsapp.py` | WhatsApp `wa.me` message generator — renewal, inactivity, trial follow-up, waitlist promotion |
| `seed.py` | Auto-seeded demo data on startup — 7 programmes, 15+ batches, sample members |

### Clinical Routing Engine (R1–R6)

| Rule | Trigger | Action |
|---|---|---|
| **R1** | Pregnancy | Hard block all classes — instructor consultation required |
| **R2** | Back Pain / Knee Pain | Block Power & Advanced → Route to Yoga Therapy |
| **R3** | High BP | Block Power & Advanced → Route to Traditional / Iyengar |
| **R4** | PCOD / PCOS | Route to PCOD programme |
| **R5** | No condition | Route by goal — Weight Loss / Flexibility / Stress / Fitness |
| **R6** | Beginner level | Block Advanced regardless of conditions |

### API Endpoints

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/auth/register` | POST | Public | Create new user account |
| `/auth/login` | POST | Public | Login → JWT token |
| `/api/studio` | GET | Public | Full studio snapshot |
| `/api/health-intake` | POST | Public | Register member + health profile + routing |
| `/api/batches` | GET | Public | All active batches |
| `/api/bookings` | POST | Member | Book a batch (trial / member) |
| `/api/memberships` | POST | Member | Purchase / renew plan |
| `/api/checkin` | POST | Staff/Owner | Mark attendance by phone |
| `/api/waitlist` | POST | Member | Join waitlist for full batch |
| `/api/retention-triage` | GET | Owner only | At-risk members + WhatsApp links |
| `/api/conversion-stats` | GET | Owner only | Trial → Paid conversion analytics |

---

## 🌐 Frontend — Next.js 15

### Setup & Run

```powershell
npm install
npm run dev
# Opens at http://localhost:3001
```

### Key Components

| Component | What it renders |
|---|---|
| `StudioAppShell.tsx` | Main shell — nav, auth state, tab routing |
| `StudioLandingView.tsx` | Hero landing page with programme cards |
| `ClientOnboardingWizard.tsx` | 7-step multi-form onboarding |
| `ClientAuthModal.tsx` | Login / Register modal |
| `BatchesPlansView.tsx` | Batch browser with booking + waitlist |
| `ClientMemberPortal.tsx` | Member pass — membership, routing, bookings |
| `OwnerRetentionDashboard.tsx` | Retention triage (component ready) |
| `StaffCheckinView.tsx` | Phone-based check-in (component ready) |

### Design System
- **Theme:** Catppuccin Latte (warm off-white, blue accents, clean typography)
- **Font:** JetBrains Mono
- **No gradients, no glow** — plain, crisp, professional

---

## 🧘 Yoga Pose Assessment Module

> **Standalone AI tool** — upload a photo or use webcam, get real-time skeleton overlay, joint angle measurements, accuracy score (0–100%), and plain-English corrections.

📁 Located in: `yoga-pose-assessment/`

### Run the Pose Checker

```powershell
cd yoga-pose-assessment

# Setup (one time)
py -3.12 -m venv venv
venv\Scripts\python -m pip install -r requirements.txt

# Web app (upload photo or use webcam)
venv\Scripts\python -m streamlit run app.py

# Live webcam mode
venv\Scripts\python live.py --pose tree

# Batch test all images in a folder
venv\Scripts\python check_images.py test_images
```

### How It Works

1. **MediaPipe Pose** extracts 33 body landmarks from the image
2. **Joint angles** measured between 3 landmarks (elbow, shoulder, hip, knee)
3. Each joint scored 0–100 based on deviation from target angle
4. **Overall pose score** = mean of all visible joints (visibility ≥ 0.5)
5. **Auto-detect** ranks all 15 poses — flags low confidence when runner-up is within 5 points

### Test Image Gallery — 15 Poses

#### Front-View Poses

| Mountain Pose | Tree Pose | Chair Pose |
|:---:|:---:|:---:|
| ![mountain_1](yoga-pose-assessment/test_images/mountain_1.jpg) | ![tree_1](yoga-pose-assessment/test_images/tree_1.jpg) | ![chair_1](yoga-pose-assessment/test_images/chair_1.jpg) |
| ![mountain_2](yoga-pose-assessment/test_images/mountain_2.jpg) | ![tree_2](yoga-pose-assessment/test_images/tree_2.jpg) | ![chair_2](yoga-pose-assessment/test_images/chair_2.jpg) |

| Goddess Pose | Warrior I | Warrior II |
|:---:|:---:|:---:|
| ![goddess_1](yoga-pose-assessment/test_images/goddess_1.jpg) | ![warrior1_1](yoga-pose-assessment/test_images/warrior1_1.jpg) | ![warrior2_1](yoga-pose-assessment/test_images/warrior2_1.jpg) |
| ![goddess_2](yoga-pose-assessment/test_images/goddess_2.jpg) | ![warrior1_2](yoga-pose-assessment/test_images/warrior1_2.jpg) | ![warrior2_2](yoga-pose-assessment/test_images/warrior2_2.jpg) |

| Triangle Pose | | |
|:---:|:---:|:---:|
| ![triangle_1](yoga-pose-assessment/test_images/triangle_1.jpg) | ![triangle_2](yoga-pose-assessment/test_images/triangle_2.jpg) | |

#### Side-View Poses

| Low Lunge | Downward Dog | Upward Dog |
|:---:|:---:|:---:|
| ![lunge_1](yoga-pose-assessment/test_images/lunge_1.jpg) | ![downdog_1](yoga-pose-assessment/test_images/downdog_1.jpg) | ![updog_1](yoga-pose-assessment/test_images/updog_1.jpg) |
| ![lunge_2](yoga-pose-assessment/test_images/lunge_2.jpg) | ![downdog_2](yoga-pose-assessment/test_images/downdog_2.jpg) | ![updog_2](yoga-pose-assessment/test_images/updog_2.jpg) |

| Cobra Pose | Plank | Bridge Pose |
|:---:|:---:|:---:|
| ![cobra_1](yoga-pose-assessment/test_images/cobra_1.jpg) | ![plank_1](yoga-pose-assessment/test_images/plank_1.jpg) | ![bridge_1](yoga-pose-assessment/test_images/bridge_1.jpg) |
| ![cobra_2](yoga-pose-assessment/test_images/cobra_2.jpg) | ![plank_2](yoga-pose-assessment/test_images/plank_2.jpg) | ![bridge_2](yoga-pose-assessment/test_images/bridge_2.jpg) |

| Boat Pose | Child's Pose | |
|:---:|:---:|:---:|
| ![boat_1](yoga-pose-assessment/test_images/boat_1.jpg) | ![child_1](yoga-pose-assessment/test_images/child_1.jpg) | |
| ![boat_2](yoga-pose-assessment/test_images/boat_2.jpg) | ![child_2](yoga-pose-assessment/test_images/child_2.jpg) | |

### All 15 Supported Poses

| # | Pose | Short Names | Camera |
|---|---|---|---|
| 1 | Mountain Pose | `mountain`, `tadasana` | Front |
| 2 | Tree Pose | `tree`, `vrikshasana` | Front |
| 3 | Chair Pose | `chair`, `utkatasana` | Front |
| 4 | Goddess Pose | `goddess` | Front |
| 5 | Warrior I | `warrior1` | Front |
| 6 | Warrior II | `warrior2`, `warrior` | Front |
| 7 | Triangle Pose | `triangle`, `trikonasana` | Front |
| 8 | Low Lunge | `lunge`, `anjaneyasana` | Side |
| 9 | Downward Dog | `downdog` | Side |
| 10 | Upward Dog | `updog` | Side |
| 11 | Cobra Pose | `cobra`, `bhujangasana` | Side |
| 12 | Plank | `plank` | Side |
| 13 | Bridge Pose | `bridge` | Side |
| 14 | Boat Pose | `boat`, `navasana` | Side |
| 15 | Child's Pose | `child`, `balasana` | Side |

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Studio Owner** | `owner@ngyoga.in` | `owner123` | Full — Retention Triage, Analytics, Check-in |
| **Front Desk Staff** | `staff@ngyoga.in` | `staff123` | Phone Check-in (B4), Batch Roster |
| **Member** | `amit@ngyoga.in` | `member123` | Health Intake, Booking, Membership |

### Register a New Client (Demo Flow)

1. Open `http://localhost:3001`
2. Click **"New Member Onboarding"** in the nav
3. Fill the 7-step wizard with any details:
   - Phone: any 10-digit Indian number (e.g. `9876543210`)
   - Condition: pick anything (Back Pain, PCOD, etc.)
4. System auto-routes to the right programme
5. Pick a batch → pick a plan → done ✅
6. **Sign Out** → **Sign In** with same phone to test auth

---

## 📁 Full Project Structure

```
hackathon/
│
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # All API endpoints (~1036 lines)
│   ├── database.py                 # SQLAlchemy ORM — 8 tables
│   ├── auth.py                     # JWT auth + access guards
│   ├── schemas.py                  # Pydantic request validation
│   ├── routing.py                  # R1–R6 clinical routing engine
│   ├── whatsapp.py                 # WhatsApp wa.me URL generator
│   ├── seed.py                     # Auto demo data on startup
│   └── requirements.txt
│
├── app/                            # Next.js App Router pages
│   ├── page.tsx                    # Root → StudioAppShell
│   ├── layout.tsx
│   ├── globals.css                 # Catppuccin Latte theme
│   ├── api/                        # Next.js API proxy routes
│   ├── batches/
│   ├── join/
│   ├── owner/dashboard/
│   └── staff/checkin/
│
├── components/                     # React components
│   ├── StudioAppShell.tsx          # Main shell + auth state
│   ├── StudioLandingView.tsx       # Hero landing page
│   ├── ClientOnboardingWizard.tsx  # 7-step onboarding form
│   ├── ClientAuthModal.tsx         # Login/Register modal
│   ├── BatchesPlansView.tsx        # Batch browser + booking
│   ├── ClientMemberPortal.tsx      # Member pass view
│   ├── OwnerRetentionDashboard.tsx # Owner analytics (component)
│   └── StaffCheckinView.tsx        # Staff check-in (component)
│
├── yoga-pose-assessment/           # AI Pose Assessment Module
│   ├── app.py                      # Streamlit web UI
│   ├── live.py                     # Real-time webcam mode
│   ├── check_images.py             # Batch image tester
│   ├── pose_utils.py               # MediaPipe engine + scoring
│   ├── requirements.txt
│   └── test_images/                # 30 reference photos (2 per pose)
│       ├── mountain_1.jpg ... child_2.jpg
│       └── CREDITS.txt
│
├── ng_yoga_studio.db               # SQLite database (auto-created)
├── next.config.ts
├── package.json
└── docker-compose.yml
```

---

## 🐳 Docker (Optional)

```bash
docker-compose up --build
```

- Backend on port **8000**
- Frontend on port **3000**

---

## ⚠️ Medical Disclaimer

*This system guides studio programme suitability only and does not provide medical diagnoses or clinical advice. All health routing is for class placement purposes only. Consult a qualified health professional for medical concerns.*

---

## 📄 Image Credits

Yoga test images are Creative Commons photos from Wikimedia Commons.  
Full sources and licences: [`yoga-pose-assessment/test_images/CREDITS.txt`](yoga-pose-assessment/test_images/CREDITS.txt)
