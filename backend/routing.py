from typing import List, Dict
from pydantic import BaseModel

ALL_PROGRAMMES = [
    "Traditional",
    "Advanced",
    "Iyengar",
    "Power",
    "Weight Loss",
    "PCOD",
    "Yoga Therapy",
]

CONDITION_LABELS: Dict[str, str] = {
    "back_pain": "Back Pain / Lumbar Strain",
    "knee_pain": "Knee Pain / Joint Stiffness",
    "high_bp": "High Blood Pressure (Hypertension)",
    "pcod": "PCOD / PCOS",
    "pregnancy": "Pregnancy (Prenatal)",
    "none": "None of the above",
}


class RoutingResultModel(BaseModel):
    recommended: str
    allowed: List[str]
    blocked: List[str]
    block_reasons: Dict[str, str]
    hard_block: bool
    message: str
    clinical_notes: List[str]


def route_member(conditions: List[str], goal: str, experience_level: str) -> RoutingResultModel:
    """
    Pure deterministic Programme Routing Engine (Rules R1 to R6).
    Conditions take absolute priority over goals.
    """
    blocked = set()
    block_reasons: Dict[str, str] = {}
    clinical_notes: List[str] = []

    def add_block(prog: str, reason: str):
        blocked.add(prog)
        if prog in block_reasons:
            if reason not in block_reasons[prog]:
                block_reasons[prog] = f"{block_reasons[prog]} · {reason}"
        else:
            block_reasons[prog] = reason

    # R1 — Pregnancy: hard block, exits immediately
    if "pregnancy" in conditions:
        return RoutingResultModel(
            recommended="Yoga Therapy",
            allowed=[],
            blocked=list(ALL_PROGRAMMES),
            block_reasons={
                p: "Rule R1: Prenatal practice requires an in-person assessment with our senior instructor before booking."
                for p in ALL_PROGRAMMES
            },
            hard_block=True,
            message="Please speak to an instructor before joining.",
            clinical_notes=[
                "Rule R1 Triggered: Pregnancy requires direct 1-on-1 evaluation with NG Gothane before joining any group cohort.",
                "Walk into Prem Plaza, Ashok Nagar (Mon–Sat 8:30 AM or 5:00 PM) or message the studio desk for a complimentary prenatal consultation.",
            ],
        )

    recommended = "Traditional"
    has_condition_recommendation = False

    # R2 — Back pain or knee pain -> recommend Yoga Therapy; block Power and Advanced
    if "back_pain" in conditions or "knee_pain" in conditions:
        add_block(
            "Power",
            "Rule R2: Blocked — rapid dynamic transitions in Power Yoga risk aggravating lumbar or knee joint load.",
        )
        add_block(
            "Advanced",
            "Rule R2: Blocked — deep backbends and high-load inversions are unsafe with active back or knee pain.",
        )
        recommended = "Yoga Therapy"
        has_condition_recommendation = True
        clinical_notes.append(
            "Rule R2 Applied: Back/Knee pain prioritized over general goals. Assigned to wall-rope spinal decompression and prop-supported Yoga Therapy."
        )

    # R3 — High BP -> block Power and Advanced; recommend Traditional or Iyengar if no prior recommendation
    if "high_bp" in conditions:
        add_block(
            "Power",
            "Rule R3: Blocked — high-heat rapid cardiovascular exertion spikes blood pressure.",
        )
        add_block(
            "Advanced",
            "Rule R3: Blocked — sustained inversions (Sirsasana/Sarvangasana) and breath retention are contraindicated for High BP.",
        )
        if not has_condition_recommendation:
            recommended = "Iyengar" if experience_level == "intermediate" else "Traditional"
            has_condition_recommendation = True
        clinical_notes.append(
            "Rule R3 Applied: High Blood Pressure guarded against inversions and rapid flows. Paced breathwork and upright alignment enforced."
        )

    # R4 — PCOD/PCOS -> recommend PCOD programme
    if "pcod" in conditions:
        recommended = "PCOD"
        has_condition_recommendation = True
        clinical_notes.append(
            "Rule R4 Applied: PCOD/PCOS neuro-endocrine sequence recommended — pelvic floor circulation, restorative pranayama, and metabolic regulation."
        )

    # R5 — No condition and weight-loss goal -> recommend Weight Loss programme
    has_no_clinical = len(conditions) == 0 or (len(conditions) == 1 and conditions[0] == "none")
    if has_no_clinical:
        if goal == "weight_loss":
            recommended = "Weight Loss"
            clinical_notes.append(
                "Rule R5 Applied: Clear health screening + Weight Loss goal routed to Metabolic Vinyasa & Surya Namaskar conditioning."
            )
        elif goal == "flexibility":
            recommended = "Iyengar"
            clinical_notes.append(
                "Goal Routing: Flexibility & Joint Mobility routed to Iyengar structural alignment with wall ropes and wooden blocks."
            )
        elif goal == "stress_relief":
            recommended = "Traditional"
            clinical_notes.append(
                "Goal Routing: Stress Relief & Stillness routed to Traditional Hatha, Nadi Shodhana Pranayama & Dhyana."
            )
        elif goal == "fitness":
            recommended = "Traditional" if experience_level == "beginner" else "Power"
            clinical_notes.append(
                f"Goal Routing: General Fitness routed to {'Traditional Hatha Foundation' if experience_level == 'beginner' else 'Power Yoga Conditioning'}."
            )

    # R6 — Beginners cannot join Advanced (Always applied regardless of conditions)
    if experience_level == "beginner":
        add_block(
            "Advanced",
            "Rule R6: Beginners cannot join Advanced. Build foundational alignment first.",
        )
        clinical_notes.append(
            "Rule R6 Applied: Advanced cohort locked for beginner level to ensure progressive tendon and spinal readiness."
        )

    if recommended in blocked:
        recommended = "Traditional"

    allowed = [p for p in ALL_PROGRAMMES if p not in blocked]

    return RoutingResultModel(
        recommended=recommended,
        allowed=allowed,
        blocked=list(blocked),
        block_reasons=block_reasons,
        hard_block=False,
        message=f"We recommend the {recommended} programme for you.",
        clinical_notes=clinical_notes,
    )
