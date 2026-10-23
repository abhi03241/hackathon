# TechSprint Crisis Adaptation Addendum
## NG Yoga Studio: Countering "The Great Compression"
**Version:** 1.1 Crisis Addendum  
**Date:** 23 October 2026  
**Context:** Memberships dropped from 180 to 95 due to low-cost AI competitors (YogAI Pro at Rs 299/mo). Two instructors at risk.

---

## 1. Problem Diagnosis & Strategic Stance

### 1.1 The Macro & Micro Threat
- **Macro**: Discretionary spending compression combined with hyper-cheap digital alternatives.
- **Micro**: Member erosion (47% drop), instructor demoralization, existential studio revenue shock.
- **The Competitor Flaw**: Generic AI apps lack safe somatic assessment, posture tactile correction, and clinical pathology adaptation. High BP, lumbar disc herniations, and prenatal conditions are dangerous when guided by non-responsive computer vision algorithms.
- **Our Positioning**: Safe, Human-Led, Clinically-Guarded Yoga Therapy and Precision Alignment (Traditional, Iyengar, Ashtanga, PCOD recovery) that apps cannot replicate without catastrophic injury liabilities.

---

## 2. Technical Modifications & Additions

### 2.1 Unified Retention Risk Engine (Data Signals)
We integrate three signals into an actionable priority triage algorithm:

1. **Expiry Risk Signal**: `expiry_date` between `TODAY` and `TODAY + 7 days`.
2. **Inactivity Risk Signal**: No check-in records for `7+ days` among active plans.
3. **Unconverted Trial Signal**: Completed free trial booking without purchasing a membership within 3 days.

#### SQL Multi-Signal View: `retention_risk_registry`
```sql
CREATE OR REPLACE VIEW retention_risk_registry AS
WITH member_last_checkin AS (
    SELECT member_id, MAX(checkin_time) AS last_checkin
    FROM checkins
    GROUP BY member_id
),
active_memberships AS (
    SELECT member_id, plan_type, expiry_date, status
    FROM memberships
    WHERE status = 'active'
),
trial_records AS (
    SELECT member_id, created_at AS trial_date
    FROM bookings
    WHERE booking_type = 'trial'
)
SELECT 
    m.id AS member_id,
    m.name,
    m.phone,
    m.experience_level,
    hp.conditions,
    hp.main_goal,
    am.plan_type,
    am.expiry_date,
    (am.expiry_date - CURRENT_DATE) AS days_to_expiry,
    mlc.last_checkin,
    COALESCE(EXTRACT(DAY FROM NOW() - mlc.last_checkin)::INT, 999) AS days_inactive,
    CASE
        -- Signal 1: Expiring within 7 days
        WHEN am.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days') 
            THEN 'EXPIRING_SOON'
        -- Signal 2: Active but inactive for 7+ days
        WHEN am.status = 'active' AND (mlc.last_checkin IS NULL OR mlc.last_checkin < (NOW() - INTERVAL '7 days'))
            THEN 'INACTIVE_ACTIVE_MEMBER'
        -- Signal 3: Unconverted trial
        WHEN am.member_id IS NULL AND tr.trial_date IS NOT NULL AND tr.trial_date < (NOW() - INTERVAL '3 days')
            THEN 'UNCONVERTED_TRIAL'
        ELSE 'LOW_RISK'
    END AS risk_category,
    CASE 
        WHEN am.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days') THEN 1
        WHEN am.status = 'active' AND (mlc.last_checkin < (NOW() - INTERVAL '7 days') OR mlc.last_checkin IS NULL) THEN 2
        WHEN am.member_id IS NULL AND tr.trial_date IS NOT NULL THEN 3
        ELSE 4
    END AS triage_priority
FROM members m
LEFT JOIN health_profiles hp ON hp.member_id = m.id
LEFT JOIN active_memberships am ON am.member_id = m.id
LEFT JOIN member_last_checkin mlc ON mlc.member_id = m.id
LEFT JOIN trial_records tr ON tr.member_id = m.id
WHERE 
    (am.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days'))
    OR (am.status = 'active' AND (mlc.last_checkin IS NULL OR mlc.last_checkin < (NOW() - INTERVAL '7 days')))
    OR (am.member_id IS NULL AND tr.trial_date IS NOT NULL)
ORDER BY triage_priority ASC, days_to_expiry ASC, days_inactive DESC;
```

---

### 2.2 Crisis-Adapted Contextual WhatsApp Generator

Different member segments receive distinct tailored communications emphasizing human care, personalized modifications, and value-add small-group sessions within the 10% regulatory pricing cap:

#### Template A: Inactive Member (Human Care & Reactivation)
```
Hi {Name}, we noticed you haven't attended class in {DaysInactive} days at NG Yoga Studio. 
Generic apps cannot adjust for posture fatigue or injury risks like your instructor can. 
Book an exclusive 15-minute instructor posture-alignment review included with your plan this week. 
Reply to claim your spot: wa.me/91XXXXXXXXXX
```

#### Template B: Pre-Expiry Renewal (Value Reinforcement & 10% Capped Loyalty Incentive)
```
Hi {Name}, your NG Yoga membership concludes on {ExpiryDate}. 
To safeguard your continuous progress with our senior instructors, renew your {PlanType} plan today at our locked studio rate of Rs {CappedRenewalPrice} (saving 10% with zero price hikes). 
Secure your batch place directly: {RenewLink}
```

#### Template C: Unconverted Trial (Safe Clinical Matching)
```
Hi {Name}, thank you for taking your trial session at NG Yoga Studio. 
Because your intake indicates {ConditionsSummary}, unsupervised digital apps pose high strain risks. 
Our senior instructor has opened a special micro-group session (maximum 6 members) for your specific needs. 
Join this week with our intro package: {JoinLink}
```

---

### 2.3 Member-Facing Programme-Fit & Safety Transparency Explainer

On `/join/recommendation`, instead of merely showing approved/blocked classes, render an explicit **Clinical Differentiation Summary**:

1. **Why Human-Led Alignment Matters**:
   - Contrast auto-generated generic video flows with hands-on anatomical corrections (essential for back pain, cervical issues, and knee rehabilitation).
2. **Instructor Safeguard Badges**:
   - Explicitly list why unsafe options were blocked (`Power` yoga blocked due to BP/Lumbar strain).
   - Display instructor credentials and specializations (Iyengar prop therapy, Ashtanga breath pacing, PCOD metabolic yoga).
3. **Micro-Group & Free Trial Options**:
   - Allow booking into an instructor-supervised small group (capped at 6 to 8 members) maintaining compliance with the price cap.

---

### 2.4 Acceptance Demo Verification Matrix

| Scenario | Member Data Input | System Reaction & Verification | Message Generation |
|----------|-------------------|--------------------------------|-------------------|
| **Test Case 1: Inactive Active Member** | Rahul M. (Active 3-Month Plan, Last check-in 11 days ago) | Appears on Triage Dashboard with Priority 2 flag (`INACTIVE_ACTIVE_MEMBER`). | Generates Template A emphasizing instructor postural check-in and session re-entry. |
| **Test Case 2: Pre-Expiry Member** | Sunita K. (1-Month Plan, Expires in 4 days) | Appears with Priority 1 flag (`EXPIRING_SOON`). | Generates Template B with renewal link and 10% protected fee guarantee. |
| **Test Case 3: Safety Guardrail (Safety Test)** | Amit P. (Beginner, High Blood Pressure + Back Pain) | Routing engine strictly blocks `Advanced` (R6 beginner rule) and blocks `Power` (R2/R3 condition rule). Forces `Yoga Therapy`. | Rejection modal prevents manual override. Disclaimer explicitly rendered. |

---

### 2.5 Strict Guardrails Adherence
1. **Zero Medical Diagnoses**: The system guides class suitability and posture assistance, displaying the medical disclaimer at all times.
2. **Zero Invasions of R1–R6 Rules**: Under no market pressure can pregnancy, spinal pain, or cardiovascular restrictions be bypassed for commercial gains.
3. **Instructor Protection**: No instructor terminations for 90 days; retention workflows route members directly to fill instructors' specialized batches.
