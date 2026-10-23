import urllib.parse
from typing import List, Dict
from .routing import CONDITION_LABELS

PLAN_DETAILS: Dict[str, dict] = {
    "1month": {
        "label": "1 Month Practice Pass",
        "duration_days": 30,
        "price": 1500,
        "capped_renewal_price": 1350,
    },
    "3months": {
        "label": "3 Months Practice Commitment",
        "duration_days": 90,
        "price": 4000,
        "capped_renewal_price": 3600,
    },
    "6months": {
        "label": "6 Months Deep Transformation",
        "duration_days": 180,
        "price": 7500,
        "capped_renewal_price": 6750,
    },
}


def build_wa_url(phone_10: str, message: str) -> str:
    clean = "".join(ch for ch in phone_10 if ch.isdigit())[-10:]
    encoded = urllib.parse.quote(message)
    return f"https://wa.me/91{clean}?text={encoded}"


def build_renewal_whatsapp(
    name: str, phone: str, expiry_date: str, plan_type: str, use_crisis_template: bool = True
) -> dict:
    plan = PLAN_DETAILS.get(plan_type, PLAN_DETAILS["1month"])
    if use_crisis_template:
        msg = (
            f"Hi {name}, your NG Yoga Studio membership concludes on {expiry_date}. "
            f"To safeguard your continuous progress with our senior instructors, renew your {plan['label']} "
            f"today at our locked studio rate of Rs {plan['capped_renewal_price']} (saving 10% with zero price hikes). "
            f"Contact us at NG Yoga Studio, Prem Plaza, Ashok Nagar, Indore."
        )
    else:
        msg = (
            f"Hi {name}, your NG Yoga Studio membership expires on {expiry_date}. "
            f"Renew now to keep your spot. Contact us at NG Yoga Studio, Ashok Nagar, Indore."
        )
    return {"message": msg, "url": build_wa_url(phone, msg)}


def build_inactivity_whatsapp(
    name: str, phone: str, days_inactive: int, use_crisis_template: bool = True
) -> dict:
    if use_crisis_template:
        msg = (
            f"Hi {name}, we noticed you haven't attended class in {days_inactive} days at NG Yoga Studio. "
            f"Generic apps cannot adjust for posture fatigue or injury risks like your instructor can. "
            f"Book an exclusive 15-minute instructor posture-alignment review included with your plan this week. "
            f"Contact us at NG Yoga Studio, Ashok Nagar, Indore."
        )
    else:
        msg = (
            f"Hi {name}, we have not seen you at NG Yoga Studio for {days_inactive} days. "
            f"We hope you are well. Come back and continue your wellness journey. "
            f"Contact us at NG Yoga Studio, Ashok Nagar, Indore."
        )
    return {"message": msg, "url": build_wa_url(phone, msg)}


def build_unconverted_trial_whatsapp(
    name: str, phone: str, conditions: List[str], recommended_programme: str
) -> dict:
    active_conds = [CONDITION_LABELS.get(c, c) for c in conditions if c != "none"]
    cond_summary = ", ".join(active_conds) if active_conds else "foundational posture alignment"
    msg = (
        f"Hi {name}, thank you for taking your trial session at NG Yoga Studio. "
        f"Because your intake indicates {cond_summary}, unsupervised digital apps pose high strain risks. "
        f"Our senior instructor has opened a special {recommended_programme} micro-group session (maximum 6 members) "
        f"for your specific needs. Join this week at NG Yoga Studio, Ashok Nagar, Indore."
    )
    return {"message": msg, "url": build_wa_url(phone, msg)}


def build_waitlist_promotion_whatsapp(
    name: str, phone: str, programme_name: str, batch_date: str, timing_label: str
) -> dict:
    msg = (
        f"Namaste {name}! Great news from NG Yoga Studio, Ashok Nagar: A mat has opened up and you have been "
        f"automatically promoted from #1 on the waitlist to a CONFIRMED seat in {programme_name} ({timing_label}) "
        f"on {batch_date}. See you on the mat at Prem Plaza!"
    )
    return {"message": msg, "url": build_wa_url(phone, msg)}
