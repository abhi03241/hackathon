import re
from datetime import date
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator

ConditionLiteral = Literal["back_pain", "knee_pain", "high_bp", "pcod", "pregnancy", "none"]
GoalLiteral = Literal["weight_loss", "flexibility", "stress_relief", "fitness"]
ExperienceLiteral = Literal["beginner", "intermediate", "advanced"]
PlanLiteral = Literal["1month", "3months", "6months"]
ProgrammeLiteral = Literal[
    "Traditional", "Advanced", "Iyengar", "Power", "Weight Loss", "PCOD", "Yoga Therapy"
]


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=6)
    phone: str
    role: Literal["member", "staff", "owner"] = "member"


class HealthIntakeRequest(BaseModel):
    name: str = Field(..., min_length=2)
    phone: str
    age: int = Field(..., ge=10, le=80)
    experience_level: ExperienceLiteral
    main_goal: GoalLiteral
    conditions: List[ConditionLiteral] = Field(..., min_length=1)
    consent_given: bool

    @field_validator("phone")
    @classmethod
    def validate_indian_phone(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^[6-9]\d{9}$", clean):
            raise ValueError("Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.")
        return clean

    @field_validator("consent_given")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must agree to share this information with NG Yoga Studio staff.")
        return v


class CreateBookingRequest(BaseModel):
    member_id: str
    batch_id: str
    booking_type: Literal["trial", "member"]


class CreateBatchRequest(BaseModel):
    programme_type: ProgrammeLiteral
    programme_name: str = Field(..., min_length=3)
    time_slot: Literal["morning", "evening"]
    timing_label: str = Field(..., min_length=3)
    batch_date: Optional[str] = None
    capacity: int = Field(default=12, ge=1, le=50)
    instructor: str = Field(default="NG Gothane")
    is_micro_group: bool = False


class CreateMembershipRequest(BaseModel):
    member_id: str
    plan_type: PlanLiteral
    apply_loyalty_cap: Optional[bool] = False


class CheckinRequest(BaseModel):
    phone: str
    batch_id: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = re.sub(r"\D", "", v)[-10:]
        if not re.match(r"^[6-9]\d{9}$", clean):
            raise ValueError("Enter a valid 10-digit Indian mobile number.")
        return clean


class JoinWaitlistRequest(BaseModel):
    member_id: str
    batch_id: str
