import os
from datetime import datetime, date, timedelta
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    JSON,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ng_yoga_studio.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

Base = declarative_base()


class UserORM(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, nullable=True, default="tenant-indore-ashok-nagar")
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'owner' | 'staff' | 'member'
    phone = Column(String(10), nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class MemberORM(Base):
    __tablename__ = "members"
    __table_args__ = (
        UniqueConstraint("phone", "tenant_id", name="members_phone_tenant_unique"),
        CheckConstraint("age >= 10 AND age <= 80", name="check_member_age"),
    )

    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, nullable=True, default="tenant-indore-ashok-nagar", index=True)
    name = Column(String, nullable=False)
    phone = Column(String(10), nullable=False, index=True)
    age = Column(Integer, nullable=False)
    experience_level = Column(String, nullable=False)  # beginner | intermediate | advanced
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    health_profile = relationship(
        "HealthProfileORM", back_populates="member", uselist=False, cascade="all, delete-orphan"
    )
    memberships = relationship("MembershipORM", back_populates="member", cascade="all, delete-orphan")
    bookings = relationship("BookingORM", back_populates="member", cascade="all, delete-orphan")
    checkins = relationship("CheckinORM", back_populates="member", cascade="all, delete-orphan")


class HealthProfileORM(Base):
    __tablename__ = "health_profiles"

    id = Column(String, primary_key=True, index=True)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), unique=True, nullable=False)
    conditions = Column(JSON, nullable=False, default=list)  # list of Condition strings
    main_goal = Column(String, nullable=False)  # weight_loss | flexibility | stress_relief | fitness
    consent_given = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    member = relationship("MemberORM", back_populates="health_profile")


class ProgrammeORM(Base):
    __tablename__ = "programmes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    type = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    focus_areas = Column(String, nullable=True)
    props_used = Column(String, nullable=True)
    instructor = Column(String, nullable=True)
    instructor_credentials = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class BatchORM(Base):
    __tablename__ = "batches"
    __table_args__ = (
        CheckConstraint("capacity > 0", name="check_positive_capacity"),
        CheckConstraint("booked_count >= 0", name="check_non_negative_booked"),
        CheckConstraint("booked_count <= capacity", name="no_overbooking"),
    )

    id = Column(String, primary_key=True, index=True)
    programme_id = Column(String, ForeignKey("programmes.id"), nullable=False, index=True)
    programme_type = Column(String, nullable=False)
    programme_name = Column(String, nullable=False)
    tenant_id = Column(String, nullable=True, default="tenant-indore-ashok-nagar", index=True)
    time_slot = Column(String, nullable=False)  # morning | evening
    timing_label = Column(String, nullable=False)
    batch_date = Column(Date, nullable=False, index=True)
    capacity = Column(Integer, nullable=False, default=15)
    booked_count = Column(Integer, nullable=False, default=0)
    instructor = Column(String, nullable=True)
    is_micro_group = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MembershipORM(Base):
    __tablename__ = "memberships"
    __table_args__ = (
        CheckConstraint("expiry_date > start_date", name="valid_expiry"),
    )

    id = Column(String, primary_key=True, index=True)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_type = Column(String, nullable=False)  # 1month | 3months | 6months
    plan_label = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False, default=date.today)
    expiry_date = Column(Date, nullable=False, index=True)
    status = Column(String, nullable=False, default="active", index=True)  # active | expired | cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("MemberORM", back_populates="memberships")


class BookingORM(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("member_id", "batch_id", name="unique_member_batch_booking"),
    )

    id = Column(String, primary_key=True, index=True)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(String, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_type = Column(String, nullable=False, index=True)  # trial | member
    status = Column(String, nullable=False, default="confirmed")  # confirmed | cancelled | waitlisted
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("MemberORM", back_populates="bookings")


class CheckinORM(Base):
    __tablename__ = "checkins"

    id = Column(String, primary_key=True, index=True)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(String, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    checkin_time = Column(DateTime, default=datetime.utcnow, index=True)

    member = relationship("MemberORM", back_populates="checkins")


class WaitlistORM(Base):
    __tablename__ = "waitlist"
    __table_args__ = (
        UniqueConstraint("member_id", "batch_id", name="unique_member_batch_waitlist"),
    )

    id = Column(String, primary_key=True, index=True)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(String, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    notified = Column(Boolean, default=False, index=True)
    promoted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
