import type {
  Condition,
  ExperienceLevel,
  Goal,
  ProgrammeType,
  RoutingInput,
  RoutingResult,
} from '@/types';

export const ALL_PROGRAMMES: ProgrammeType[] = [
  'Traditional',
  'Advanced',
  'Iyengar',
  'Power',
  'Weight Loss',
  'PCOD',
  'Yoga Therapy',
];

export const CONDITION_LABELS: Record<Condition, string> = {
  back_pain: 'Back Pain / Lumbar Strain',
  knee_pain: 'Knee Pain / Joint Stiffness',
  high_bp: 'High Blood Pressure (Hypertension)',
  pcod: 'PCOD / PCOS',
  pregnancy: 'Pregnancy (Prenatal)',
  none: 'None of the above',
};

export const GOAL_LABELS: Record<Goal, string> = {
  weight_loss: 'Weight Loss & Metabolic Conditioning',
  flexibility: 'Flexibility & Joint Mobility',
  stress_relief: 'Stress Relief, Breath & Stillness',
  fitness: 'General Fitness & Core Stamina',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner (New or < 6 months practice)',
  intermediate: 'Intermediate (Consistent 6–24 months practice)',
  advanced: 'Advanced (2+ years deep posture & inversion practice)',
};

/**
 * Pure deterministic Programme Routing Engine (Rules R1 to R6)
 * Conditions take absolute priority over goals.
 * Zero framework dependencies — runs identically on client, server, or edge.
 */
export function routeMember(input: RoutingInput): RoutingResult {
  const {conditions, goal, experienceLevel} = input;
  const blocked = new Set<ProgrammeType>();
  const blockReasons: Record<string, string> = {};
  const clinicalNotes: string[] = [];

  const block = (programme: ProgrammeType, reason: string) => {
    blocked.add(programme);
    if (blockReasons[programme]) {
      if (!blockReasons[programme].includes(reason)) {
        blockReasons[programme] = `${blockReasons[programme]} · ${reason}`;
      }
    } else {
      blockReasons[programme] = reason;
    }
  };

  // R1 — Pregnancy: hard block, exits immediately
  if (conditions.includes('pregnancy')) {
    return {
      recommended: 'Yoga Therapy',
      allowed: [],
      blocked: [...ALL_PROGRAMMES],
      blockReasons: Object.fromEntries(
        ALL_PROGRAMMES.map((p) => [
          p,
          'Rule R1: Prenatal practice requires an in-person assessment with our senior instructor before booking.',
        ])
      ),
      hardBlock: true,
      message: 'Please speak to an instructor before joining.',
      clinicalNotes: [
        'Rule R1 Triggered: Pregnancy requires direct 1-on-1 evaluation with NG Gothane before joining any group cohort.',
        'Walk into Prem Plaza, Ashok Nagar (Mon–Sat 8:30 AM or 5:00 PM) or message the studio desk for a complimentary prenatal consultation.',
      ],
    };
  }

  let recommended: ProgrammeType = 'Traditional';
  let hasConditionRecommendation = false;

  // R2 — Back pain or knee pain → recommend Yoga Therapy; block Power and Advanced
  if (conditions.includes('back_pain') || conditions.includes('knee_pain')) {
    block(
      'Power',
      'Rule R2: Blocked — rapid dynamic transitions in Power Yoga risk aggravating lumbar or knee joint load.'
    );
    block(
      'Advanced',
      'Rule R2: Blocked — deep backbends and high-load inversions are unsafe with active back or knee pain.'
    );
    recommended = 'Yoga Therapy';
    hasConditionRecommendation = true;
    clinicalNotes.push(
      'Rule R2 Applied: Back/Knee pain prioritized over general goals. Assigned to wall-rope spinal decompression and prop-supported Yoga Therapy.'
    );
  }

  // R3 — High BP → block Power and Advanced; recommend Traditional or Iyengar if no prior recommendation set
  if (conditions.includes('high_bp')) {
    block(
      'Power',
      'Rule R3: Blocked — high-heat rapid cardiovascular exertion spikes blood pressure.'
    );
    block(
      'Advanced',
      'Rule R3: Blocked — sustained inversions (Sirsasana/Sarvangasana) and breath retention are contraindicated for High BP.'
    );
    if (!hasConditionRecommendation) {
      recommended = experienceLevel === 'intermediate' ? 'Iyengar' : 'Traditional';
      hasConditionRecommendation = true;
    }
    clinicalNotes.push(
      'Rule R3 Applied: High Blood Pressure guarded against inversions and rapid flows. Paced breathwork and upright alignment enforced.'
    );
  }

  // R4 — PCOD/PCOS → recommend PCOD programme
  if (conditions.includes('pcod')) {
    // If they also have back/knee pain, note both while honoring R4 programme match or safety blocks
    recommended = 'PCOD';
    hasConditionRecommendation = true;
    clinicalNotes.push(
      'Rule R4 Applied: PCOD/PCOS neuro-endocrine sequence recommended — pelvic floor circulation, restorative pranayama, and metabolic regulation.'
    );
  }

  // R5 — No condition and weight-loss goal → recommend Weight Loss programme
  const hasNoClinicalCondition =
    conditions.length === 0 ||
    (conditions.length === 1 && conditions[0] === 'none');

  if (hasNoClinicalCondition) {
    if (goal === 'weight_loss') {
      recommended = 'Weight Loss';
      clinicalNotes.push(
        'Rule R5 Applied: Clear health screening + Weight Loss goal routed to Metabolic Vinyasa & Surya Namaskar conditioning.'
      );
    } else if (goal === 'flexibility') {
      recommended = 'Iyengar';
      clinicalNotes.push(
        'Goal Routing: Flexibility & Joint Mobility routed to Iyengar structural alignment with wall ropes and wooden blocks.'
      );
    } else if (goal === 'stress_relief') {
      recommended = 'Traditional';
      clinicalNotes.push(
        'Goal Routing: Stress Relief & Stillness routed to Traditional Hatha, Nadi Shodhana Pranayama & Dhyana.'
      );
    } else if (goal === 'fitness') {
      recommended = experienceLevel === 'beginner' ? 'Traditional' : 'Power';
      clinicalNotes.push(
        `Goal Routing: General Fitness routed to ${
          experienceLevel === 'beginner' ? 'Traditional Hatha Foundation' : 'Power Yoga Conditioning'
        }.`
      );
    }
  }

  // R6 — Beginners cannot join Advanced (Always applied regardless of conditions)
  if (experienceLevel === 'beginner') {
    block(
      'Advanced',
      'Rule R6: Beginners cannot join Advanced. Build foundational alignment first.'
    );
    clinicalNotes.push(
      'Rule R6 Applied: Advanced cohort locked for beginner level to ensure progressive tendon and spinal readiness.'
    );
  }

  // Ensure recommended is never in blocked set
  if (blocked.has(recommended)) {
    recommended = 'Traditional';
  }

  const allowed = ALL_PROGRAMMES.filter((p) => !blocked.has(p));

  return {
    recommended,
    allowed,
    blocked: [...blocked],
    blockReasons,
    hardBlock: false,
    message: `We recommend the ${recommended} programme for you.`,
    clinicalNotes,
  };
}
