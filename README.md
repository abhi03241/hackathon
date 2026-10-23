# NG Yoga Studio — Full-Stack Programme Routing & Membership Platform
**Location:** Prem Plaza, Near ICICI Bank, Ashok Nagar, Indore (MP 452001)  
**Founder & Lead Instructor:** Narayan Gothane (NG Gothane)

This repository contains the complete, production-ready **NG Yoga Studio Membership & Programme Routing System** built with:
1. **FastAPI (Python) Backend (`/backend`)** — SQLAlchemy 2.0 ORM, Pydantic v2 validation, JWT role-based authentication (`owner`, `staff`, `member`), concurrency-safe row locking (`with_for_update()`), deterministic `R1–R6` health routing engine, `B1–B4` booking & check-in rules, Level 2 retention triage + WhatsApp `wa.me` generator, and Level 3 automatic waitlist promotion.
2. **Next.js 15 (App Router) Frontend & Integrated API (`/app`, `/components`, `/lib`)** — Styled in the exact Warm Linen & Charcoal-Olive Neo-Brutalist Swiss Grid of `ngyoga.vercel.app`.

---

## Quick Start: Running Locally

### 1. Run the FastAPI Backend (Port 8000)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start FastAPI server with auto-reload (automatically seeds SQLite/PostgreSQL DB on startup)
uvicorn backend.main:app --reload --port 8000
```
- **Interactive Swagger UI Docs:** `http://localhost:8000/docs`
- **ReDoc API Spec:** `http://localhost:8000/redoc`

### 2. Run the Next.js Frontend (Port 3000)
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Demo Role Credentials (JWT Auth)
| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Studio Owner** | `owner@ngyoga.in` | `owner123` | Full access including Retention Triage, Conversion Analytics, Staff Check-in |
| **Front Desk Staff** | `staff@ngyoga.in` | `staff123` | 10-Digit Phone Check-in (`B4`), Batch Roster & Waitlist Cancellation |
| **Member** | `amit@ngyoga.in` | `member123` | Health Intake (`R1–R6`), Batch Booking (`B1–B2`), Plan Selection (`B3`) |

---

## Medical Disclaimer
*This system guides studio programme suitability only and does not provide medical diagnoses or clinical advice. "This is not medical advice. Consult a qualified health professional for medical concerns."*
