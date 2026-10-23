from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from .database import (
    Base,
    engine,
    UserORM,
    ProgrammeORM,
    MemberORM,
    HealthProfileORM,
    BatchORM,
    MembershipORM,
    BookingORM,
    CheckinORM,
    WaitlistORM,
)
from .auth import hash_password


def seed_database(db: Session, force_reset: bool = False):
    Base.metadata.create_all(bind=engine)

    if force_reset:
        db.query(WaitlistORM).delete()
        db.query(CheckinORM).delete()
        db.query(BookingORM).delete()
        db.query(MembershipORM).delete()
        db.query(HealthProfileORM).delete()
        db.query(BatchORM).delete()
        db.query(MemberORM).delete()
        db.query(ProgrammeORM).delete()
        db.query(UserORM).delete()
        db.commit()

    if db.query(ProgrammeORM).count() > 0:
        return

    today = date.today()
    tomorrow = today + timedelta(days=1)
    now = datetime.utcnow()

    # 1. Seed Users (Owner, Staff, Member)
    users = [
        UserORM(
            id="usr-owner-ng",
            tenant_id="tenant-indore-ashok-nagar",
            email="owner@ngyoga.in",
            name="Narayan Gothane (Founder & Studio Owner)",
            role="owner",
            phone="9171744543",
            password_hash=hash_password("owner123"),
        ),
        UserORM(
            id="usr-staff-desk",
            tenant_id="tenant-indore-ashok-nagar",
            email="staff@ngyoga.in",
            name="Ritu Sharma (Prem Plaza Front Desk)",
            role="staff",
            phone="7000656390",
            password_hash=hash_password("staff123"),
        ),
        UserORM(
            id="usr-member-amit",
            tenant_id="tenant-indore-ashok-nagar",
            email="amit@ngyoga.in",
            name="Amit Patidar",
            role="member",
            phone="9826033333",
            password_hash=hash_password("member123"),
        ),
    ]
    db.add_all(users)

    # 2. Seed Programmes
    programmes = [
        ProgrammeORM(
            id="prog-yoga-therapy",
            name="Back Pain Relief & Wall Rope Yoga Therapy",
            type="Yoga Therapy",
            description="Clinical lumbar decompression, sciatica relief, and knee joint rehabilitation using Iyengar wall ropes, wooden blocks, and bolsters.",
            focus_areas="Lumbar Traction • Cervical Alignment • Knee Rehabilitation",
            props_used="Wall Ropes • Wooden Blocks • Cotton Bolsters",
            instructor="NG Gothane (Founder & Therapy Specialist)",
            instructor_credentials="Certified Iyengar Wall-Rope & Spinal Therapy Specialist",
            is_active=True,
        ),
        ProgrammeORM(
            id="prog-pcod",
            name="PCOD / PCOS Hormonal & Metabolic Recovery",
            type="PCOD",
            description="Specialized neuro-endocrine sequence combining pelvic floor circulation, Baddha Konasana variations, and cortisol-lowering pranayama.",
            focus_areas="Pelvic Circulation • Endocrine Balance • Insulin Sensitivity",
            props_used="Bolsters • Yoga Straps • Blankets",
            instructor="Acharya Kavita Sharma",
            instructor_credentials="Women’s Health & Therapeutic Yoga Specialist",
            is_active=True,
        ),
        ProgrammeORM(
            id="prog-weight-loss",
            name="Metabolic Vinyasa & Weight Loss Flow",
            type="Weight Loss",
            description="Continuous breath-led Surya Namaskar variations, core metabolic conditioning, and lean stamina building for sustainable fat loss.",
            focus_areas="Metabolic Burn • Core Conditioning • Respiratory Stamina",
            props_used="Non-Slip Studio Mat • Alignment Blocks",
            instructor="NG Gothane",
            instructor_credentials="Lead Vinyasa & Metabolic Conditioning Coach",
            is_active=True,
        ),
        ProgrammeORM(
            id="prog-traditional",
            name="Traditional Hatha & Pranayama Foundation",
            type="Traditional",
            description="Grounded Hatha postures, Nadi Shodhana breathwork, and mindful stillness safe for all ages, beginners, and blood pressure regulation.",
            focus_areas="Postural Steadiness • Nervous System Reset • Blood Pressure Care",
            props_used="Meditation Cushions • Studio Mats",
            instructor="Pt. Devendra Joshi",
            instructor_credentials="Traditional Hatha & Pranayama Master",
            is_active=True,
        ),
        ProgrammeORM(
            id="prog-iyengar",
            name="Iyengar Precision Alignment & Prop Mobility",
            type="Iyengar",
            description="Anatomical precision using studio props to unlock stiff hips, hamstrings, and shoulders without straining the spine or cardiovascular system.",
            focus_areas="Structural Symmetry • Joint Opening • Safe Hold Duration",
            props_used="Wall Ropes • Chairs • Wooden Bricks • Belts",
            instructor="NG Gothane",
            instructor_credentials="Senior Alignment & Prop-Assisted Asana Instructor",
            is_active=True,
        ),
        ProgrammeORM(
            id="prog-power",
            name="Dynamic Power Yoga & Core Strength",
            type="Power",
            description="High-intensity athletic flow, Chaturanga transitions, and isometric strength holds for injury-free intermediate and advanced practitioners.",
            focus_areas="Upper Body Strength • Cardiovascular Endurance • Sweat Flow",
            props_used="Studio Mat",
            instructor="Rohan Deshmukh",
            instructor_credentials="Ashtanga & Dynamic Power Flow Instructor",
            is_active=True,
        ),
        ProgrammeORM(
            id="prog-advanced",
            name="Advanced Backbends, Splits & Inversions",
            type="Advanced",
            description="Deep Chakrasana (Wheel), Purna Dhanurasana, Hanumanasana splits, and Sirsasana headstands for seasoned practitioners.",
            focus_areas="Deep Thoracic Backbends • Inversions • Advanced Arm Balances",
            props_used="Wall Ropes • Backbend Bench",
            instructor="NG Gothane",
            instructor_credentials="Master Asana & Advanced Backbend Coach",
            is_active=True,
        ),
    ]
    db.add_all(programmes)

    # 3. Seed Members & Health Profiles
    members_data = [
        ("mem-rahul", "Rahul Mehra", "9826011111", 38, "intermediate", ["back_pain"], "flexibility"),
        ("mem-sunita", "Sunita Khandelwal", "9826022222", 46, "beginner", ["knee_pain"], "stress_relief"),
        ("mem-amit", "Amit Patidar", "9826033333", 52, "beginner", ["high_bp", "back_pain"], "fitness"),
        ("mem-anjali", "Anjali Verma", "9876543210", 32, "beginner", ["pcod"], "weight_loss"),
        ("mem-priya", "Priya Nair", "9826044444", 27, "beginner", ["pcod", "back_pain"], "weight_loss"),
        ("mem-vikram", "Vikramaditya Joshi", "9826055555", 41, "intermediate", ["high_bp"], "stress_relief"),
        ("mem-neha", "Neha Agrawal", "9826066666", 34, "beginner", ["none"], "weight_loss"),
        ("mem-sneha", "Sneha Tiwari", "9826077777", 29, "intermediate", ["back_pain"], "flexibility"),
        ("mem-karan", "Karan Malhotra", "9826088888", 31, "beginner", ["none"], "weight_loss"),
    ]

    for m_id, name, phone, age, exp, conds, goal in members_data:
        db.add(
            MemberORM(
                id=m_id,
                tenant_id="tenant-indore-ashok-nagar",
                name=name,
                phone=phone,
                age=age,
                experience_level=exp,
                created_at=now - timedelta(days=30),
                updated_at=now - timedelta(days=1),
            )
        )
        db.add(
            HealthProfileORM(
                id=f"hp-{m_id.split('-')[1]}",
                member_id=m_id,
                conditions=conds,
                main_goal=goal,
                consent_given=True,
                created_at=now - timedelta(days=30),
                updated_at=now - timedelta(days=1),
            )
        )

    # 4. Seed Batches
    batches = [
        BatchORM(
            id="batch-1-therapy-am",
            programme_id="prog-yoga-therapy",
            programme_type="Yoga Therapy",
            programme_name="Back Pain Relief & Wall Rope Therapy (Micro-Cohort)",
            tenant_id="tenant-indore-ashok-nagar",
            time_slot="morning",
            timing_label="08:30 AM – 09:30 AM",
            batch_date=today,
            capacity=6,
            booked_count=6,  # Full batch to test B1 & Waitlist promotion
            instructor="NG Gothane",
            is_micro_group=True,
            is_active=True,
        ),
        BatchORM(
            id="batch-2-therapy-pm",
            programme_id="prog-yoga-therapy",
            programme_type="Yoga Therapy",
            programme_name="Evening Spine Decompression & Lumbar Care",
            tenant_id="tenant-indore-ashok-nagar",
            time_slot="evening",
            timing_label="05:00 PM – 06:00 PM",
            batch_date=today,
            capacity=8,
            booked_count=5,
            instructor="NG Gothane",
            is_micro_group=True,
            is_active=True,
        ),
        BatchORM(
            id="batch-3-pcod-am",
            programme_id="prog-pcod",
            programme_type="PCOD",
            programme_name="PCOD / PCOS Hormonal & Metabolic Recovery",
            tenant_id="tenant-indore-ashok-nagar",
            time_slot="morning",
            timing_label="09:00 AM – 10:00 AM",
            batch_date=today,
            capacity=8,
            booked_count=6,
            instructor="Acharya Kavita Sharma",
            is_micro_group=True,
            is_active=True,
        ),
        BatchORM(
            id="batch-4-weightloss-am",
            programme_id="prog-weight-loss",
            programme_type="Weight Loss",
            programme_name="Sunrise Metabolic Vinyasa & Surya Namaskar",
            tenant_id="tenant-indore-ashok-nagar",
            time_slot="morning",
            timing_label="06:30 AM – 07:30 AM",
            batch_date=today,
            capacity=15,
            booked_count=12,
            instructor="NG Gothane",
            is_micro_group=False,
            is_active=True,
        ),
        BatchORM(
            id="batch-5-weightloss-pm",
            programme_id="prog-weight-loss",
            programme_type="Weight Loss",
            programme_name="Evening Metabolic Vinyasa & Core Burn",
            tenant_id="tenant-indore-ashok-nagar",
            time_slot="evening",
            timing_label="06:00 PM – 07:00 PM",
            batch_date=today,
            capacity=15,
            booked_count=11,
            instructor="NG Gothane",
            is_micro_group=False,
            is_active=True,
        ),
        BatchORM(
            id="batch-6-traditional-am",
            programme_id="prog-traditional",
            programme_type="Traditional",
            programme_name="Traditional Hatha, Pranayama & BP Care",
            tenant_id="tenant-indore-ashok-nagar",
            time_slot="morning",
            timing_label="07:30 AM – 08:30 AM",
            batch_date=today,
            capacity=15,
            booked_count=9,
            instructor="Pt. Devendra Joshi",
            is_micro_group=False,
            is_active=True,
        ),
        BatchORM(
            id="batch-7-iyengar-pm",
            programme_id="prog-iyengar",
            programme_type="Iyengar",
            programme_name="Iyengar Precision Alignment & Wall Props",
            tenant_id="tenant-indore-ashok-nagar",
            time_slot="evening",
            timing_label="07:00 PM – 08:00 PM",
            batch_date=today,
            capacity=12,
            booked_count=8,
            instructor="NG Gothane",
            is_micro_group=False,
            is_active=True,
        ),
        BatchORM(
            id="batch-8-power-pm",
            programme_id="prog-power",
            programme_type="Power",
            programme_name="Dynamic Power Yoga & Core Strength",
            tenant_id="tenant-indore-ashok-nagar",
            time_slot="evening",
            timing_label="07:30 PM – 08:30 PM",
            batch_date=today,
            capacity=14,
            booked_count=10,
            instructor="Rohan Deshmukh",
            is_micro_group=False,
            is_active=True,
        ),
        BatchORM(
            id="batch-9-advanced-am",
            programme_id="prog-advanced",
            programme_type="Advanced",
            programme_name="Advanced Backbends (Chakrasana) & Inversions",
            tenant_id="tenant-indore-ashok-nagar",
            time_slot="morning",
            timing_label="07:00 AM – 08:30 AM",
            batch_date=tomorrow,
            capacity=10,
            booked_count=7,
            instructor="NG Gothane",
            is_micro_group=False,
            is_active=True,
        ),
    ]
    db.add_all(batches)

    # 5. Seed Memberships
    memberships = [
        MembershipORM(
            id="ms-rahul",
            member_id="mem-rahul",
            plan_type="3months",
            plan_label="3 Months Practice Commitment",
            price=4000,
            start_date=today - timedelta(days=45),
            expiry_date=today + timedelta(days=45),
            status="active",
        ),
        MembershipORM(
            id="ms-sunita",
            member_id="mem-sunita",
            plan_type="1month",
            plan_label="1 Month Practice Pass",
            price=1500,
            start_date=today - timedelta(days=26),
            expiry_date=today + timedelta(days=4),  # Expiring in 4 days
            status="active",
        ),
        MembershipORM(
            id="ms-amit",
            member_id="mem-amit",
            plan_type="6months",
            plan_label="6 Months Deep Transformation",
            price=7500,
            start_date=today - timedelta(days=20),
            expiry_date=today + timedelta(days=160),
            status="active",
        ),
        MembershipORM(
            id="ms-anjali",
            member_id="mem-anjali",
            plan_type="1month",
            plan_label="1 Month Practice Pass",
            price=1500,
            start_date=today - timedelta(days=38),
            expiry_date=today - timedelta(days=8),  # Expired 8 days ago (B4 Denial)
            status="expired",
        ),
        MembershipORM(
            id="ms-vikram",
            member_id="mem-vikram",
            plan_type="3months",
            plan_label="3 Months Practice Commitment",
            price=4000,
            start_date=today - timedelta(days=88),
            expiry_date=today + timedelta(days=2),  # Expiring in 2 days
            status="active",
        ),
        MembershipORM(
            id="ms-neha",
            member_id="mem-neha",
            plan_type="1month",
            plan_label="1 Month Practice Pass",
            price=1500,
            start_date=today - timedelta(days=18),
            expiry_date=today + timedelta(days=12),
            status="active",
        ),
        MembershipORM(
            id="ms-sneha",
            member_id="mem-sneha",
            plan_type="3months",
            plan_label="3 Months Practice Commitment",
            price=4000,
            start_date=today - timedelta(days=15),
            expiry_date=today + timedelta(days=75),
            status="active",
        ),
    ]
    db.add_all(memberships)

    # 6. Seed Bookings
    bookings = [
        BookingORM(
            id="bk-amit-1",
            member_id="mem-amit",
            batch_id="batch-1-therapy-am",
            booking_type="member",
            status="confirmed",
        ),
        BookingORM(
            id="bk-sunita-1",
            member_id="mem-sunita",
            batch_id="batch-1-therapy-am",
            booking_type="member",
            status="confirmed",
        ),
        BookingORM(
            id="bk-trial-rahul",
            member_id="mem-rahul",
            batch_id="batch-2-therapy-pm",
            booking_type="trial",
            status="confirmed",
        ),
        BookingORM(
            id="bk-trial-priya",
            member_id="mem-priya",
            batch_id="batch-3-pcod-am",
            booking_type="trial",
            status="confirmed",
        ),
        BookingORM(
            id="bk-trial-karan",
            member_id="mem-karan",
            batch_id="batch-4-weightloss-am",
            booking_type="trial",
            status="confirmed",
        ),
    ]
    db.add_all(bookings)

    # 7. Seed Checkins
    checkins = [
        CheckinORM(
            id="chk-rahul-1",
            member_id="mem-rahul",
            batch_id="batch-2-therapy-pm",
            checkin_time=now - timedelta(days=11),  # 11 days inactive
        ),
        CheckinORM(
            id="chk-sunita-1",
            member_id="mem-sunita",
            batch_id="batch-1-therapy-am",
            checkin_time=now - timedelta(days=2),
        ),
        CheckinORM(
            id="chk-amit-1",
            member_id="mem-amit",
            batch_id="batch-1-therapy-am",
            checkin_time=now - timedelta(days=1),
        ),
        CheckinORM(
            id="chk-vikram-1",
            member_id="mem-vikram",
            batch_id="batch-6-traditional-am",
            checkin_time=now - timedelta(days=1),
        ),
        CheckinORM(
            id="chk-neha-1",
            member_id="mem-neha",
            batch_id="batch-4-weightloss-am",
            checkin_time=now - timedelta(days=9),  # 9 days inactive
        ),
        CheckinORM(
            id="chk-sneha-1",
            member_id="mem-sneha",
            batch_id="batch-2-therapy-pm",
            checkin_time=now - timedelta(days=1),
        ),
    ]
    db.add_all(checkins)

    # 8. Seed Waitlist
    waitlist = [
        WaitlistORM(
            id="wl-sneha-1",
            member_id="mem-sneha",
            batch_id="batch-1-therapy-am",
            position=1,
            notified=False,
        ),
        WaitlistORM(
            id="wl-rahul-2",
            member_id="mem-rahul",
            batch_id="batch-1-therapy-am",
            position=2,
            notified=False,
        ),
    ]
    db.add_all(waitlist)

    db.commit()
