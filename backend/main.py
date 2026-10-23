import uuid
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import (
    get_db,
    SessionLocal,
    UserORM,
    MemberORM,
    HealthProfileORM,
    ProgrammeORM,
    BatchORM,
    MembershipORM,
    BookingORM,
    CheckinORM,
    WaitlistORM,
)
from .schemas import (
    LoginRequest,
    RegisterRequest,
    HealthIntakeRequest,
    CreateBookingRequest,
    CreateBatchRequest,
    CreateMembershipRequest,
    CheckinRequest,
    JoinWaitlistRequest,
)
from .routing import route_member
from .whatsapp import (
    PLAN_DETAILS,
    build_renewal_whatsapp,
    build_inactivity_whatsapp,
    build_unconverted_trial_whatsapp,
    build_waitlist_promotion_whatsapp,
)
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_optional,
    require_staff_or_owner,
    require_owner,
)
from .seed import seed_database

app = FastAPI(
    title="NG Yoga Studio — Programme Routing & Membership FastAPI Backend",
    version="2.0.0",
    description=(
        "Complete Production FastAPI Backend implementing Level 1 (Health Intake R1-R6, Batch Booking B1-B2, "
        "Memberships B3, Check-in B4), Level 2 (Retention Triage & WhatsApp Generator), Level 3 (Waitlist "
        "Auto-Promotion), and Crisis Adaptation Addendum."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    with SessionLocal() as db:
        seed_database(db, force_reset=False)


# ---------------------------------------------------------------------------
# Helper Serializers & Retention Engine
# ---------------------------------------------------------------------------
def build_retention_triage(db: Session, use_crisis_template: bool = True):
    today = date.today()
    now = datetime.utcnow()
    members = db.query(MemberORM).all()
    items = []

    for m in members:
        hp = m.health_profile
        conds = hp.conditions if hp else ["none"]
        goal = hp.main_goal if hp else "fitness"
        routing = route_member(conds, goal, m.experience_level)

        active_ms = (
            db.query(MembershipORM)
            .filter(MembershipORM.member_id == m.id, MembershipORM.status == "active")
            .order_by(MembershipORM.expiry_date.desc())
            .first()
        )

        last_chk = (
            db.query(CheckinORM)
            .filter(CheckinORM.member_id == m.id)
            .order_by(CheckinORM.checkin_time.desc())
            .first()
        )
        days_inactive = (now - last_chk.checkin_time).days if last_chk else 999

        trial_bk = (
            db.query(BookingORM)
            .filter(BookingORM.member_id == m.id, BookingORM.booking_type == "trial")
            .first()
        )

        days_to_expiry = (active_ms.expiry_date - today).days if active_ms else None
        any_paid = db.query(MembershipORM).filter(MembershipORM.member_id == m.id).count() > 0

        # Priority 1: Expiring within 7 days
        if active_ms and days_to_expiry is not None and 0 <= days_to_expiry <= 7:
            plan_spec = PLAN_DETAILS.get(active_ms.plan_type, PLAN_DETAILS["1month"])
            wa = build_renewal_whatsapp(
                m.name, m.phone, str(active_ms.expiry_date), active_ms.plan_type, use_crisis_template
            )
            items.append(
                {
                    "member_id": m.id,
                    "name": m.name,
                    "phone": m.phone,
                    "experience_level": m.experience_level,
                    "conditions": conds,
                    "main_goal": goal,
                    "recommended_programme": routing.recommended,
                    "plan_type": active_ms.plan_type,
                    "plan_label": plan_spec["label"],
                    "original_price": plan_spec["price"],
                    "capped_renewal_price": plan_spec["capped_renewal_price"],
                    "expiry_date": str(active_ms.expiry_date),
                    "days_to_expiry": days_to_expiry,
                    "last_checkin": last_chk.checkin_time.isoformat() if last_chk else None,
                    "days_inactive": days_inactive,
                    "trial_date": str(today - timedelta(days=5)),
                    "risk_category": "EXPIRING_SOON",
                    "triage_priority": 1,
                    "whatsapp_url": wa["url"],
                    "whatsapp_message": wa["message"],
                }
            )
            continue

        # Priority 2: Active but inactive for 7+ days
        if active_ms and days_to_expiry is not None and days_to_expiry > 0 and days_inactive >= 7:
            plan_spec = PLAN_DETAILS.get(active_ms.plan_type, PLAN_DETAILS["1month"])
            wa = build_inactivity_whatsapp(
                m.name, m.phone, 14 if days_inactive == 999 else days_inactive, use_crisis_template
            )
            items.append(
                {
                    "member_id": m.id,
                    "name": m.name,
                    "phone": m.phone,
                    "experience_level": m.experience_level,
                    "conditions": conds,
                    "main_goal": goal,
                    "recommended_programme": routing.recommended,
                    "plan_type": active_ms.plan_type,
                    "plan_label": plan_spec["label"],
                    "original_price": plan_spec["price"],
                    "capped_renewal_price": plan_spec["capped_renewal_price"],
                    "expiry_date": str(active_ms.expiry_date),
                    "days_to_expiry": days_to_expiry,
                    "last_checkin": last_chk.checkin_time.isoformat() if last_chk else None,
                    "days_inactive": days_inactive,
                    "trial_date": None,
                    "risk_category": "INACTIVE_ACTIVE_MEMBER",
                    "triage_priority": 2,
                    "whatsapp_url": wa["url"],
                    "whatsapp_message": wa["message"],
                }
            )
            continue

        # Priority 3: Unconverted Trial
        if not any_paid and trial_bk:
            wa = build_unconverted_trial_whatsapp(m.name, m.phone, conds, routing.recommended)
            items.append(
                {
                    "member_id": m.id,
                    "name": m.name,
                    "phone": m.phone,
                    "experience_level": m.experience_level,
                    "conditions": conds,
                    "main_goal": goal,
                    "recommended_programme": routing.recommended,
                    "plan_type": None,
                    "plan_label": None,
                    "original_price": None,
                    "capped_renewal_price": None,
                    "expiry_date": None,
                    "days_to_expiry": None,
                    "last_checkin": None,
                    "days_inactive": days_inactive,
                    "trial_date": str(today - timedelta(days=4)),
                    "risk_category": "UNCONVERTED_TRIAL",
                    "triage_priority": 3,
                    "whatsapp_url": wa["url"],
                    "whatsapp_message": wa["message"],
                }
            )

    items.sort(key=lambda x: (x["triage_priority"], x["days_to_expiry"] or 99))
    return items


def build_conversion_stats(db: Session):
    trial_members = {
        b.member_id
        for b in db.query(BookingORM)
        .filter(BookingORM.booking_type == "trial", BookingORM.status != "cancelled")
        .all()
    }
    paid_members = {m.member_id for m in db.query(MembershipORM).all()}
    converted = len(trial_members.intersection(paid_members))
    total_trials = len(trial_members)
    rate = round((converted / total_trials) * 100) if total_trials > 0 else 0

    triage = build_retention_triage(db, True)
    expiring_soon_count = len([t for t in triage if t["risk_category"] == "EXPIRING_SOON"])
    inactive_7d_count = len([t for t in triage if t["risk_category"] == "INACTIVE_ACTIVE_MEMBER"])
    active_ms_count = (
        db.query(MembershipORM)
        .filter(MembershipORM.status == "active", MembershipORM.expiry_date >= date.today())
        .count()
    )
    waitlist_count = db.query(WaitlistORM).filter(WaitlistORM.notified == False).count()

    return {
        "total_trials": total_trials,
        "converted_members": converted,
        "unconverted_trials": max(0, total_trials - converted),
        "conversion_rate": rate,
        "active_memberships_count": active_ms_count,
        "expiring_soon_count": expiring_soon_count,
        "inactive_7d_count": inactive_7d_count,
        "waitlist_active_count": waitlist_count,
    }


def serialize_full_snapshot(db: Session):
    programmes = [
        {
            "id": p.id,
            "name": p.name,
            "type": p.type,
            "description": p.description,
            "focusAreas": p.focus_areas,
            "propsUsed": p.props_used,
            "instructor": p.instructor,
            "instructorCredentials": p.instructor_credentials,
            "is_active": p.is_active,
        }
        for p in db.query(ProgrammeORM).all()
    ]
    members = [
        {
            "id": m.id,
            "tenant_id": m.tenant_id,
            "name": m.name,
            "phone": m.phone,
            "age": m.age,
            "experience_level": m.experience_level,
            "created_at": m.created_at.isoformat() if m.created_at else "",
            "updated_at": m.updated_at.isoformat() if m.updated_at else "",
        }
        for m in db.query(MemberORM).order_by(MemberORM.created_at.desc()).all()
    ]
    health_profiles = [
        {
            "id": h.id,
            "member_id": h.member_id,
            "conditions": h.conditions,
            "main_goal": h.main_goal,
            "consent_given": h.consent_given,
            "created_at": h.created_at.isoformat() if h.created_at else "",
            "updated_at": h.updated_at.isoformat() if h.updated_at else "",
        }
        for h in db.query(HealthProfileORM).all()
    ]
    batches = [
        {
            "id": b.id,
            "programme_id": b.programme_id,
            "programme_type": b.programme_type,
            "programme_name": b.programme_name,
            "tenant_id": b.tenant_id,
            "time_slot": b.time_slot,
            "timing_label": b.timing_label,
            "batch_date": str(b.batch_date),
            "capacity": b.capacity,
            "booked_count": b.booked_count,
            "instructor": b.instructor,
            "is_micro_group": b.is_micro_group,
            "is_active": b.is_active,
            "created_at": b.created_at.isoformat() if b.created_at else "",
        }
        for b in db.query(BatchORM).all()
    ]
    memberships = [
        {
            "id": ms.id,
            "member_id": ms.member_id,
            "plan_type": ms.plan_type,
            "plan_label": ms.plan_label,
            "price": ms.price,
            "start_date": str(ms.start_date),
            "expiry_date": str(ms.expiry_date),
            "status": ms.status,
            "created_at": ms.created_at.isoformat() if ms.created_at else "",
        }
        for ms in db.query(MembershipORM).order_by(MembershipORM.expiry_date.desc()).all()
    ]

    member_map = {m["id"]: m for m in members}
    batch_map = {b["id"]: b for b in batches}

    bookings = []
    for bk in db.query(BookingORM).order_by(BookingORM.created_at.desc()).all():
        m_info = member_map.get(bk.member_id, {})
        b_info = batch_map.get(bk.batch_id, {})
        bookings.append(
            {
                "id": bk.id,
                "member_id": bk.member_id,
                "member_name": m_info.get("name", "Member"),
                "member_phone": m_info.get("phone", ""),
                "batch_id": bk.batch_id,
                "programme_type": b_info.get("programme_type", "Traditional"),
                "batch_date": b_info.get("batch_date", ""),
                "time_slot": b_info.get("time_slot", "morning"),
                "timing_label": b_info.get("timing_label", ""),
                "booking_type": bk.booking_type,
                "status": bk.status,
                "created_at": bk.created_at.isoformat() if bk.created_at else "",
            }
        )

    checkins = []
    for c in db.query(CheckinORM).order_by(CheckinORM.checkin_time.desc()).all():
        m_info = member_map.get(c.member_id, {})
        b_info = batch_map.get(c.batch_id, {})
        checkins.append(
            {
                "id": c.id,
                "member_id": c.member_id,
                "member_name": m_info.get("name", "Member"),
                "member_phone": m_info.get("phone", ""),
                "batch_id": c.batch_id,
                "programme_type": b_info.get("programme_type", "Traditional"),
                "checkin_time": c.checkin_time.isoformat() if c.checkin_time else "",
            }
        )

    waitlist = []
    for w in db.query(WaitlistORM).order_by(WaitlistORM.position.asc()).all():
        m_info = member_map.get(w.member_id, {})
        b_info = batch_map.get(w.batch_id, {})
        waitlist.append(
            {
                "id": w.id,
                "member_id": w.member_id,
                "member_name": m_info.get("name", "Member"),
                "member_phone": m_info.get("phone", ""),
                "batch_id": w.batch_id,
                "programme_type": b_info.get("programme_type", "Yoga Therapy"),
                "batch_date": b_info.get("batch_date", ""),
                "timing_label": b_info.get("timing_label", ""),
                "position": w.position,
                "notified": w.notified,
                "promoted_at": w.promoted_at.isoformat() if w.promoted_at else None,
                "created_at": w.created_at.isoformat() if w.created_at else "",
            }
        )

    return {
        "programmes": programmes,
        "members": members,
        "health_profiles": health_profiles,
        "batches": batches,
        "memberships": memberships,
        "bookings": bookings,
        "checkins": checkins,
        "waitlist": waitlist,
        "retention_triage": build_retention_triage(db, True),
        "conversion_stats": build_conversion_stats(db),
    }


# ---------------------------------------------------------------------------
# 0. Studio Full Snapshot & Reset (/api/studio)
# ---------------------------------------------------------------------------
@app.get("/api/studio")
def get_studio_snapshot(db: Session = Depends(get_db)):
    return serialize_full_snapshot(db)


@app.post("/api/studio")
def manage_studio_state(payload: dict, db: Session = Depends(get_db)):
    if payload.get("action") == "reset":
        seed_database(db, force_reset=True)
        return {
            "ok": True,
            "message": "FastAPI database reset to initial Ashok Nagar, Indore seed state.",
            "snapshot": serialize_full_snapshot(db),
        }
    raise HTTPException(status_code=400, detail="Unsupported action.")


# ---------------------------------------------------------------------------
# 1. Authentication Endpoints (/api/auth/login, /api/auth/register, /api/auth/me)
# ---------------------------------------------------------------------------
@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserORM).filter(UserORM.email == req.email.strip().lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "phone": user.phone,
            "tenant_id": user.tenant_id,
        },
    }


@app.post("/api/auth/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(UserORM).filter(UserORM.email == req.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email is already registered.")

    user = UserORM(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        tenant_id="tenant-indore-ashok-nagar",
        email=req.email.strip().lower(),
        name=req.name,
        role=req.role,
        phone=req.phone,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "phone": user.phone,
            "tenant_id": user.tenant_id,
        },
    }


@app.get("/api/auth/me")
def get_me(user: Optional[UserORM] = Depends(get_current_user_optional)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "phone": user.phone,
        "tenant_id": user.tenant_id,
    }


# ---------------------------------------------------------------------------
# 2. Members & Health Intake Routing (/api/members)
# ---------------------------------------------------------------------------
@app.get("/api/members")
def list_or_lookup_members(
    phone: Optional[str] = Query(None), db: Session = Depends(get_db)
):
    if phone:
        return lookup_member_by_phone(phone, db)
    return serialize_full_snapshot(db)["members"]


@app.post("/api/members", status_code=201)
def create_or_update_member(req: HealthIntakeRequest, db: Session = Depends(get_db)):
    member = db.query(MemberORM).filter(MemberORM.phone == req.phone).first()
    if member:
        member.name = req.name
        member.age = req.age
        member.experience_level = req.experience_level
        member.updated_at = datetime.utcnow()
    else:
        member = MemberORM(
            id=f"mem-{uuid.uuid4().hex[:8]}",
            tenant_id="tenant-indore-ashok-nagar",
            name=req.name,
            phone=req.phone,
            age=req.age,
            experience_level=req.experience_level,
        )
        db.add(member)
        db.flush()

    hp = db.query(HealthProfileORM).filter(HealthProfileORM.member_id == member.id).first()
    if hp:
        hp.conditions = list(req.conditions)
        hp.main_goal = req.main_goal
        hp.consent_given = req.consent_given
        hp.updated_at = datetime.utcnow()
    else:
        hp = HealthProfileORM(
            id=f"hp-{uuid.uuid4().hex[:8]}",
            member_id=member.id,
            conditions=list(req.conditions),
            main_goal=req.main_goal,
            consent_given=req.consent_given,
        )
        db.add(hp)

    db.commit()
    db.refresh(member)

    routing = route_member(list(req.conditions), req.main_goal, req.experience_level)
    snap = serialize_full_snapshot(db)
    active_ms = next((m for m in snap["memberships"] if m["member_id"] == member.id), None)
    has_used_trial = any(
        b["member_id"] == member.id and b["booking_type"] == "trial" and b["status"] != "cancelled"
        for b in snap["bookings"]
    )

    return {
        "member_id": member.id,
        "member": {
            "id": member.id,
            "tenant_id": member.tenant_id,
            "name": member.name,
            "phone": member.phone,
            "age": member.age,
            "experience_level": member.experience_level,
            "created_at": member.created_at.isoformat(),
            "updated_at": member.updated_at.isoformat(),
        },
        "routing": {
            "recommended": routing.recommended,
            "allowed": routing.allowed,
            "blocked": routing.blocked,
            "blockReasons": routing.block_reasons,
            "hardBlock": routing.hard_block,
            "message": routing.message,
            "clinicalNotes": routing.clinical_notes,
        },
        "active_membership": active_ms,
        "has_used_trial": has_used_trial,
        "snapshot": snap,
    }


@app.get("/api/members/{phone}")
def lookup_member_by_phone(phone: str, db: Session = Depends(get_db)):
    clean = "".join(ch for ch in phone if ch.isdigit())[-10:]
    member = db.query(MemberORM).filter(MemberORM.phone == clean).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    hp = member.health_profile
    routing = (
        route_member(hp.conditions, hp.main_goal, member.experience_level).model_dump()
        if hp
        else None
    )
    latest_ms = (
        db.query(MembershipORM)
        .filter(MembershipORM.member_id == member.id)
        .order_by(MembershipORM.expiry_date.desc())
        .first()
    )
    return {
        "member": {
            "id": member.id,
            "name": member.name,
            "phone": member.phone,
            "age": member.age,
            "experience_level": member.experience_level,
        },
        "health_profile": {
            "conditions": hp.conditions if hp else [],
            "main_goal": hp.main_goal if hp else "fitness",
        },
        "routing": routing,
        "membership": {
            "id": latest_ms.id,
            "plan_type": latest_ms.plan_type,
            "plan_label": latest_ms.plan_label,
            "price": latest_ms.price,
            "start_date": str(latest_ms.start_date),
            "expiry_date": str(latest_ms.expiry_date),
            "status": latest_ms.status,
        }
        if latest_ms
        else None,
    }


# ---------------------------------------------------------------------------
# 3. Batches Listing & Owner Creation (/api/batches)
# ---------------------------------------------------------------------------
@app.get("/api/batches")
def list_batches(
    programme: Optional[str] = Query(None),
    time_slot: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(BatchORM).filter(BatchORM.is_active == True)
    if programme and programme != "ALL":
        q = q.filter(BatchORM.programme_type == programme)
    if time_slot and time_slot != "all":
        q = q.filter(BatchORM.time_slot == time_slot)
    rows = q.all()
    return [
        {
            "id": b.id,
            "programme_id": b.programme_id,
            "programme_type": b.programme_type,
            "programme_name": b.programme_name,
            "time_slot": b.time_slot,
            "timing_label": b.timing_label,
            "batch_date": str(b.batch_date),
            "capacity": b.capacity,
            "booked_count": b.booked_count,
            "instructor": b.instructor,
            "is_micro_group": b.is_micro_group,
        }
        for b in rows
    ]


@app.post("/api/batches", status_code=201)
def create_batch(req: CreateBatchRequest, db: Session = Depends(get_db)):
    prog = db.query(ProgrammeORM).filter(ProgrammeORM.type == req.programme_type).first()
    target_date = date.fromisoformat(req.batch_date) if req.batch_date else date.today()
    new_batch = BatchORM(
        id=f"batch-{uuid.uuid4().hex[:8]}",
        programme_id=prog.id if prog else "prog-traditional",
        programme_type=req.programme_type,
        programme_name=req.programme_name,
        tenant_id="tenant-indore-ashok-nagar",
        time_slot=req.time_slot,
        timing_label=req.timing_label,
        batch_date=target_date,
        capacity=req.capacity,
        booked_count=0,
        instructor=req.instructor,
        is_micro_group=req.is_micro_group,
        is_active=True,
    )
    db.add(new_batch)
    db.commit()
    return {
        "ok": True,
        "message": f"Created new {req.programme_type} cohort ({req.timing_label}).",
        "snapshot": serialize_full_snapshot(db),
    }


# ---------------------------------------------------------------------------
# 4. Bookings & Concurrency Lock + Waitlist Auto-Promotion (/api/bookings)
# ---------------------------------------------------------------------------
@app.post("/api/bookings", status_code=201)
def create_booking(req: CreateBookingRequest, db: Session = Depends(get_db)):
    member = db.query(MemberORM).filter(MemberORM.id == req.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    batch = (
        db.query(BatchORM)
        .filter(BatchORM.id == req.batch_id)
        .with_for_update()
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    hp = member.health_profile
    if hp:
        routing = route_member(hp.conditions, hp.main_goal, member.experience_level)
        if routing.hard_block:
            raise HTTPException(
                status_code=403, detail="Please speak to an instructor before joining."
            )
        if batch.programme_type in routing.blocked:
            raise HTTPException(
                status_code=403,
                detail="This programme is not recommended for your health profile. Please choose an available option.",
            )

    if req.booking_type == "trial":
        prior_trial = (
            db.query(BookingORM)
            .join(MemberORM, MemberORM.id == BookingORM.member_id)
            .filter(
                MemberORM.phone == member.phone,
                BookingORM.booking_type == "trial",
                BookingORM.status != "cancelled",
            )
            .first()
        )
        if prior_trial:
            raise HTTPException(
                status_code=409,
                detail="You have already used your free trial. Please purchase a membership to continue.",
            )

    if req.booking_type == "member":
        today = date.today()
        active_ms = (
            db.query(MembershipORM)
            .filter(
                MembershipORM.member_id == member.id,
                MembershipORM.status == "active",
                MembershipORM.expiry_date >= today,
            )
            .first()
        )
        if not active_ms:
            raise HTTPException(
                status_code=403,
                detail="Your membership has expired. Please renew to book.",
            )

    if batch.booked_count >= batch.capacity:
        raise HTTPException(
            status_code=409,
            detail="This batch is full. You can join the waitlist.",
        )

    batch.booked_count += 1
    booking = BookingORM(
        id=f"bk-{uuid.uuid4().hex[:8]}",
        member_id=member.id,
        batch_id=batch.id,
        booking_type=req.booking_type,
        status="confirmed",
    )
    db.add(booking)
    db.commit()

    return {
        "ok": True,
        "booking_id": booking.id,
        "message": f"Confirmed booking in {batch.programme_name} ({batch.timing_label}).",
        "snapshot": serialize_full_snapshot(db),
    }


@app.delete("/api/bookings/{booking_id}")
def cancel_booking_by_path(booking_id: str, db: Session = Depends(get_db)):
    return _cancel_booking_impl(booking_id, db)


@app.delete("/api/bookings")
def cancel_booking_by_query(id: str = Query(...), db: Session = Depends(get_db)):
    return _cancel_booking_impl(id, db)


def _cancel_booking_impl(booking_id: str, db: Session):
    booking = db.query(BookingORM).filter(BookingORM.id == booking_id).first()
    if not booking or booking.status == "cancelled":
        raise HTTPException(status_code=404, detail="Active booking not found.")

    batch = (
        db.query(BatchORM)
        .filter(BatchORM.id == booking.batch_id)
        .with_for_update()
        .first()
    )
    booking.status = "cancelled"
    if batch and batch.booked_count > 0:
        batch.booked_count -= 1

    promoted_info = None
    if batch:
        first_waitlist = (
            db.query(WaitlistORM)
            .filter(WaitlistORM.batch_id == batch.id, WaitlistORM.notified == False)
            .order_by(WaitlistORM.position.asc())
            .first()
        )
        if first_waitlist and batch.booked_count < batch.capacity:
            first_waitlist.notified = True
            first_waitlist.promoted_at = datetime.utcnow()
            batch.booked_count += 1

            promoted_member = (
                db.query(MemberORM).filter(MemberORM.id == first_waitlist.member_id).first()
            )
            new_bk = BookingORM(
                id=f"bk-prom-{uuid.uuid4().hex[:8]}",
                member_id=first_waitlist.member_id,
                batch_id=batch.id,
                booking_type="member",
                status="confirmed",
            )
            db.add(new_bk)

            if promoted_member:
                wa = build_waitlist_promotion_whatsapp(
                    promoted_member.name,
                    promoted_member.phone,
                    batch.programme_name,
                    str(batch.batch_date),
                    batch.timing_label,
                )
                promoted_info = {
                    "promoted_member_name": promoted_member.name,
                    "promoted_member_phone": promoted_member.phone,
                    "whatsapp_url": wa["url"],
                    "whatsapp_message": wa["message"],
                }

    db.commit()
    return {
        "ok": True,
        "promoted": promoted_info,
        "message": (
            f"Booking cancelled. Waitlist #1 ({promoted_info['promoted_member_name']}) automatically promoted!"
            if promoted_info
            else "Booking cancelled."
        ),
        "snapshot": serialize_full_snapshot(db),
    }


# ---------------------------------------------------------------------------
# 5. Memberships (/api/memberships & /api/memberships/{member_id})
# ---------------------------------------------------------------------------
@app.post("/api/memberships", status_code=201)
def create_membership(req: CreateMembershipRequest, db: Session = Depends(get_db)):
    member = db.query(MemberORM).filter(MemberORM.id == req.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    plan_spec = PLAN_DETAILS[req.plan_type]
    start_dt = date.today()
    expiry_dt = start_dt + timedelta(days=plan_spec["duration_days"])
    price = plan_spec["capped_renewal_price"] if req.apply_loyalty_cap else plan_spec["price"]

    db.query(MembershipORM).filter(
        MembershipORM.member_id == member.id, MembershipORM.status == "active"
    ).update({"status": "expired"})

    ms = MembershipORM(
        id=f"ms-{uuid.uuid4().hex[:8]}",
        member_id=member.id,
        plan_type=req.plan_type,
        plan_label=plan_spec["label"],
        price=price,
        start_date=start_dt,
        expiry_date=expiry_dt,
        status="active",
    )
    db.add(ms)
    db.commit()

    return {
        "ok": True,
        "membership_id": ms.id,
        "plan_label": ms.plan_label,
        "price": ms.price,
        "start_date": str(ms.start_date),
        "expiry_date": str(ms.expiry_date),
        "status": ms.status,
        "message": f"{ms.plan_label} activated for {member.name}. Valid until {ms.expiry_date}.",
        "snapshot": serialize_full_snapshot(db),
    }


@app.get("/api/memberships/{member_id}")
def get_active_membership(member_id: str, db: Session = Depends(get_db)):
    ms = (
        db.query(MembershipORM)
        .filter(MembershipORM.member_id == member_id)
        .order_by(MembershipORM.expiry_date.desc())
        .first()
    )
    if not ms:
        raise HTTPException(status_code=404, detail="No membership found for member.")
    return {
        "id": ms.id,
        "member_id": ms.member_id,
        "plan_type": ms.plan_type,
        "plan_label": ms.plan_label,
        "price": ms.price,
        "start_date": str(ms.start_date),
        "expiry_date": str(ms.expiry_date),
        "status": ms.status,
    }


# ---------------------------------------------------------------------------
# 6. Staff Check-In (/api/checkin)
# ---------------------------------------------------------------------------
@app.post("/api/checkin")
def staff_checkin(req: CheckinRequest, db: Session = Depends(get_db)):
    member = db.query(MemberORM).filter(MemberORM.phone == req.phone).first()
    if not member:
        raise HTTPException(
            status_code=404, detail="Member not found. Please ask them to register."
        )

    today = date.today()
    latest_ms = (
        db.query(MembershipORM)
        .filter(MembershipORM.member_id == member.id)
        .order_by(MembershipORM.expiry_date.desc())
        .first()
    )

    if not latest_ms or latest_ms.status != "active" or latest_ms.expiry_date < today:
        if latest_ms and latest_ms.expiry_date < today:
            latest_ms.status = "expired"
            db.commit()
        raise HTTPException(
            status_code=403,
            detail={
                "allowed": False,
                "outcome": "EXPIRED",
                "error": "MEMBERSHIP_EXPIRED",
                "member_name": member.name,
                "expiry_date": str(latest_ms.expiry_date) if latest_ms else None,
                "message": "Membership expired. Please renew to continue.",
            },
        )

    batch = (
        db.query(BatchORM).filter(BatchORM.id == req.batch_id).first()
        if req.batch_id
        else db.query(BatchORM).first()
    )
    chk = CheckinORM(
        id=f"chk-{uuid.uuid4().hex[:8]}",
        member_id=member.id,
        batch_id=batch.id if batch else "batch-1-therapy-am",
        checkin_time=datetime.utcnow(),
    )
    db.add(chk)
    db.commit()

    return {
        "allowed": True,
        "outcome": "APPROVED",
        "member_name": member.name,
        "expiry_date": str(latest_ms.expiry_date),
        "message": f"Check-in approved for {member.name}.",
        "snapshot": serialize_full_snapshot(db),
    }


# ---------------------------------------------------------------------------
# 7. Waitlist (/api/waitlist)
# ---------------------------------------------------------------------------
@app.post("/api/waitlist", status_code=201)
def join_waitlist(req: JoinWaitlistRequest, db: Session = Depends(get_db)):
    existing = (
        db.query(WaitlistORM)
        .filter(
            WaitlistORM.member_id == req.member_id,
            WaitlistORM.batch_id == req.batch_id,
            WaitlistORM.notified == False,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Already on waitlist at Position #{existing.position}.",
        )

    count = (
        db.query(WaitlistORM)
        .filter(WaitlistORM.batch_id == req.batch_id, WaitlistORM.notified == False)
        .count()
    )
    entry = WaitlistORM(
        id=f"wl-{uuid.uuid4().hex[:8]}",
        member_id=req.member_id,
        batch_id=req.batch_id,
        position=count + 1,
        notified=False,
    )
    db.add(entry)
    db.commit()

    return {
        "ok": True,
        "position": entry.position,
        "message": f"Added to waitlist at Position #{entry.position}.",
        "snapshot": serialize_full_snapshot(db),
    }


# ---------------------------------------------------------------------------
# 8. Owner Retention & Conversion Endpoints (/api/dashboard/*)
# ---------------------------------------------------------------------------
@app.get("/api/dashboard/expiring")
def get_expiring_members(db: Session = Depends(get_db)):
    triage = build_retention_triage(db, use_crisis_template=True)
    return [t for t in triage if t["risk_category"] == "EXPIRING_SOON"]


@app.get("/api/dashboard/inactive")
def get_inactive_members(db: Session = Depends(get_db)):
    triage = build_retention_triage(db, use_crisis_template=True)
    return [t for t in triage if t["risk_category"] == "INACTIVE_ACTIVE_MEMBER"]


@app.get("/api/dashboard/triage")
def get_full_retention_triage(db: Session = Depends(get_db)):
    return build_retention_triage(db, use_crisis_template=True)


@app.get("/api/dashboard/conversions")
def get_conversion_report(db: Session = Depends(get_db)):
    return build_conversion_stats(db)
