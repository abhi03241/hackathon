'use client';

import React, {useState} from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Lock,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  HeartPulse,
  Info,
} from 'lucide-react';
import type {
  Condition,
  ExperienceLevel,
  Goal,
  Member,
  Membership,
  Programme,
  ProgrammeType,
  RoutingResult,
} from '@/types';
import {
  routeMember,
  CONDITION_LABELS,
  GOAL_LABELS,
  EXPERIENCE_LABELS,
} from '@/lib/routing';
import {STUDIO_WHATSAPP_NUMBER} from '@/lib/whatsapp';

interface OnboardingRoutingViewProps {
  programmes: Programme[];
  activeMember: Member | null;
  activeRouting: RoutingResult | null;
  activeConditions: Condition[];
  activeGoal: Goal;
  activeMembership: Membership | null;
  hasUsedTrial: boolean;
  onIntakeSuccess: (payload: {
    member: Member;
    routing: RoutingResult;
    conditions: Condition[];
    goal: Goal;
    active_membership: Membership | null;
    has_used_trial: boolean;
    snapshot: unknown;
  }) => void;
  onNavigateToBatches: (filterProgramme?: ProgrammeType) => void;
  onNavigateToMemberships: () => void;
}

const DEMO_PERSONAS: Array<{
  label: string;
  subtitle: string;
  name: string;
  phone: string;
  age: number;
  experience_level: ExperienceLevel;
  main_goal: Goal;
  conditions: Condition[];
}> = [
  {
    label: 'Test Case 3: Amit P. (High BP + Back Pain)',
    subtitle: 'Blocks Power & Advanced (R2/R3/R6) → Yoga Therapy',
    name: 'Amit Patidar',
    phone: '9826033333',
    age: 52,
    experience_level: 'beginner',
    main_goal: 'fitness',
    conditions: ['high_bp', 'back_pain'],
  },
  {
    label: 'Rule R1: Meera S. (Pregnancy Hard Block)',
    subtitle: 'Immediate booking lock & instructor consultation',
    name: 'Meera Soni',
    phone: '9826099111',
    age: 29,
    experience_level: 'beginner',
    main_goal: 'flexibility',
    conditions: ['pregnancy'],
  },
  {
    label: 'Rule R4: Anjali V. (PCOD + Weight Loss)',
    subtitle: 'Condition overrides goal → PCOD Programme',
    name: 'Anjali Verma',
    phone: '9876543210',
    age: 32,
    experience_level: 'beginner',
    main_goal: 'weight_loss',
    conditions: ['pcod'],
  },
  {
    label: 'Rule R5: Aarav K. (No Condition + Weight Loss)',
    subtitle: 'Clear screening + Weight Loss → Weight Loss Flow',
    name: 'Aarav Kulkarni',
    phone: '9826099222',
    age: 28,
    experience_level: 'intermediate',
    main_goal: 'weight_loss',
    conditions: ['none'],
  },
];

export default function OnboardingRoutingView({
  programmes,
  activeMember,
  activeRouting,
  activeConditions,
  onIntakeSuccess,
  onNavigateToBatches,
  onNavigateToMemberships,
}: OnboardingRoutingViewProps) {
  const [name, setName] = useState(activeMember?.name || '');
  const [phone, setPhone] = useState(activeMember?.phone || '');
  const [age, setAge] = useState<string>(
    activeMember?.age ? String(activeMember.age) : '32'
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    activeMember?.experience_level || 'beginner'
  );
  const [mainGoal, setMainGoal] = useState<Goal>('weight_loss');
  const [conditions, setConditions] = useState<Condition[]>(
    activeConditions.length > 0 ? activeConditions : ['none']
  );
  const [consentGiven, setConsentGiven] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rejectionModalProgramme, setRejectionModalProgramme] =
    useState<Programme | null>(null);

  const livePreviewRouting = routeMember({
    conditions,
    goal: mainGoal,
    experienceLevel,
  });

  const displayedRouting = activeRouting || livePreviewRouting;

  const toggleCondition = (cond: Condition) => {
    if (cond === 'none') {
      setConditions(['none']);
      return;
    }
    const withoutNone = conditions.filter((c) => c !== 'none');
    if (withoutNone.includes(cond)) {
      const next = withoutNone.filter((c) => c !== cond);
      setConditions(next.length > 0 ? next : ['none']);
    } else {
      setConditions([...withoutNone, cond]);
    }
  };

  const applyDemoPersona = (persona: (typeof DEMO_PERSONAS)[number]) => {
    setName(persona.name);
    setPhone(persona.phone);
    setAge(String(persona.age));
    setExperienceLevel(persona.experience_level);
    setMainGoal(persona.main_goal);
    setConditions(persona.conditions);
    setConsentGiven(true);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name,
          phone,
          age: Number(age),
          experience_level: experienceLevel,
          main_goal: mainGoal,
          conditions,
          consent_given: consentGiven,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || 'Validation failed. Check your inputs.');
        setSubmitting(false);
        return;
      }

      onIntakeSuccess({
        member: data.member,
        routing: data.routing,
        conditions,
        goal: mainGoal,
        active_membership: data.active_membership,
        has_used_trial: data.has_used_trial,
        snapshot: data.snapshot,
      });
    } catch {
      setFormError('Network error while saving health intake.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="rounded-xl border border-[#CBD8CE] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#4E675E] mb-1.5">
              LEVEL 1 CORE · HEALTH INTAKE &amp; DETERMINISTIC ROUTING (R1 – R6)
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0F241D]">
              Clinical Somatic Assessment &amp; Cohort Routing
            </h1>
            <p className="mt-2 text-sm text-[#4E675E] leading-relaxed">
              Our deterministic routing engine evaluates clinical conditions
              above general fitness goals. Unsafe programmes are automatically
              locked to prevent spinal or cardiovascular strain.
            </p>
          </div>

          <div className="rounded-lg border border-[#CBD8CE] bg-[#E6EFE9]/60 p-4 shrink-0 lg:w-80">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#4E675E]">
              RULE EVALUATION PRIORITY
            </div>
            <div className="mt-1 font-mono text-xs font-semibold text-[#0F241D]">
              R1 (Pregnancy) → R2 (Spine/Knee) → R3 (High BP) → R4 (PCOD) → R5
              (Goal) → R6 (Beginner)
            </div>
          </div>
        </div>

        {/* One-Click Test Case Presets */}
        <div className="mt-6 pt-5 border-t border-[#CBD8CE]">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#4E675E] mb-2.5">
            ONE-CLICK SRS TEST CASE PRESETS:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyDemoPersona(p)}
                className="text-left p-3 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] hover:bg-[#1B4332] hover:text-white hover:border-[#1B4332] transition-colors group cursor-pointer"
              >
                <div className="font-mono text-xs font-semibold tracking-tight truncate">
                  {p.label}
                </div>
                <div className="text-[11px] text-[#4E675E] group-hover:text-[#E6EFE9] mt-0.5 line-clamp-1">
                  {p.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Intake Form (5 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 rounded-xl border border-[#CBD8CE] bg-white p-6 space-y-5 shadow-sm"
        >
          <div className="border-b border-[#CBD8CE] pb-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#4E675E]">
              STEP 01 · PAR-Q HEALTH SCREENING
            </span>
            <h2 className="font-display text-2xl font-semibold text-[#0F241D] mt-1">
              Practitioner Health Profile
            </h2>
          </div>

          {formError && (
            <div className="p-3.5 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C] text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[#0F241D] mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Anjali Verma"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-mono text-xs uppercase tracking-wider text-[#0F241D] mb-1.5">
                  10-Digit Mobile *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#CBD8CE] bg-[#E6EFE9] font-mono text-xs font-semibold text-[#0F241D]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-r-lg border border-[#CBD8CE] bg-[#F4F7F4] font-mono text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#0F241D] mb-1.5">
                  Age (10–80) *
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  max={80}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] font-mono text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[#0F241D] mb-1.5">
                Experience Level * (Rule R6)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(
                  ['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]
                ).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperienceLevel(lvl)}
                    className={`text-left px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                      experienceLevel === lvl
                        ? 'border-[#1B4332] bg-[#1B4332] text-white'
                        : 'border-[#CBD8CE] bg-[#F4F7F4] text-[#0F241D] hover:bg-[#E6EFE9]'
                    }`}
                  >
                    <span>{EXPERIENCE_LABELS[lvl]}</span>
                    {lvl === 'beginner' && (
                      <span className="font-mono text-[10px] opacity-80">
                        Locks Advanced
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Health Conditions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-[#0F241D]">
                  Health Conditions * (Rules R1–R4)
                </label>
                <span className="font-mono text-[10px] text-[#C86446] font-semibold">
                  Priority Over Goals
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    'back_pain',
                    'knee_pain',
                    'high_bp',
                    'pcod',
                    'pregnancy',
                    'none',
                  ] as Condition[]
                ).map((cond) => {
                  const selected = conditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                        selected
                          ? cond === 'pregnancy'
                            ? 'border-[#B91C1C] bg-[#B91C1C] text-white'
                            : 'border-[#1B4332] bg-[#1B4332] text-white'
                          : 'border-[#CBD8CE] bg-[#F4F7F4] text-[#0F241D] hover:bg-[#E6EFE9]'
                      }`}
                    >
                      <span className="truncate">{CONDITION_LABELS[cond]}</span>
                      <span className="font-mono text-[10px] ml-1 shrink-0">
                        {selected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Goal */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[#0F241D] mb-1.5">
                Primary Practice Goal * (Rule R5)
              </label>
              <select
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value as Goal)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              >
                {(
                  [
                    'weight_loss',
                    'flexibility',
                    'stress_relief',
                    'fitness',
                  ] as Goal[]
                ).map((g) => (
                  <option key={g} value={g}>
                    {GOAL_LABELS[g]}
                  </option>
                ))}
              </select>
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#1B4332]"
              />
              <span className="text-xs text-[#4E675E] leading-relaxed">
                I agree to share this information with NG Yoga Studio staff for
                class placement purposes.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-5 rounded-lg bg-[#1B4332] text-white hover:bg-[#0F241D] font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>
              {submitting
                ? 'Evaluating Safety Routing...'
                : 'Save Profile & Lock Programme Routing'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-3 border-t border-[#CBD8CE] flex items-start gap-2 text-[11px] text-[#4E675E]">
            <Info className="w-4 h-4 shrink-0 text-[#1B4332] mt-0.5" />
            <p>
              <strong>Medical Disclaimer:</strong> This is not medical advice.
              Consult a qualified health professional for medical concerns.
            </p>
          </div>
        </form>

        {/* Right: Routing Result & Programme Suitability Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeMember && (
            <div className="rounded-xl border border-[#15803D]/40 bg-[#F0FDF4] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-[#15803D] shrink-0" />
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-[#15803D] font-semibold">
                    ACTIVE PROFILE SAVED · {activeMember.name} (+91{' '}
                    {activeMember.phone})
                  </div>
                  <div className="text-xs text-[#0F241D]/80">
                    Recommended Cohort:{' '}
                    <strong>{displayedRouting.recommended}</strong> · Allowed:{' '}
                    {displayedRouting.allowed.length} · Blocked:{' '}
                    {displayedRouting.blocked.length}
                  </div>
                </div>
              </div>
              {!displayedRouting.hardBlock && (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToBatches(displayedRouting.recommended)
                  }
                  className="px-4 py-2 rounded-lg bg-[#15803D] text-white font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Book {displayedRouting.recommended} Batch →
                </button>
              )}
            </div>
          )}

          {/* R1 Hard Block Alert */}
          {displayedRouting.hardBlock ? (
            <div className="rounded-xl border-2 border-[#B91C1C] bg-[#FEF2F2] p-8 space-y-5">
              <div className="flex items-start gap-4">
                <ShieldAlert className="w-8 h-8 text-[#B91C1C] shrink-0 mt-1" />
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-[#B91C1C] font-semibold">
                    RULE R1 SAFETY INTERLOCK · PRENATAL CARE
                  </div>
                  <h3 className="font-display text-3xl font-semibold text-[#B91C1C] mt-1">
                    {displayedRouting.message}
                  </h3>
                  <p className="mt-2 text-sm text-[#0F241D] leading-relaxed">
                    Online group batch booking is disabled under Rule R1. Please
                    consult senior instructor <strong>NG Gothane</strong> in
                    person at Prem Plaza, Ashok Nagar before joining.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={`https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    'Namaste NG Gothane Sir, I completed the health intake at NG Yoga Studio (Rule R1). I would like to speak with an instructor before joining.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#B91C1C] text-white font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#991b1b] transition-colors"
                >
                  <span>Speak to Instructor on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-xs font-mono text-[#4E675E]">
                  This is not medical advice.
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Primary Recommendation Card */}
              <div className="rounded-xl border border-[#1B4332] bg-[#1B4332] text-white p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-wider text-[#86EFAC]">
                      DETERMINISTIC ROUTING RESULT (R1–R6)
                    </div>
                    <h3 className="font-display text-3xl font-semibold mt-1">
                      Recommended: {displayedRouting.recommended} Programme
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToBatches(displayedRouting.recommended)
                    }
                    className="px-4 py-2.5 rounded-lg bg-[#C86446] text-white font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#b55538] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    View {displayedRouting.recommended} Batches →
                  </button>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[#A3B8AF]">
                    CLINICAL RULE EVALUATION TRACE:
                  </div>
                  {displayedRouting.clinicalNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-[#E6EFE9] flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#86EFAC] shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allowed & Blocked Programme Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-[#0F241D]">
                    PROGRAMME SUITABILITY MATRIX · ALLOWED (
                    {displayedRouting.allowed.length}) &amp; BLOCKED (
                    {displayedRouting.blocked.length})
                  </h4>
                  <span className="text-xs text-[#4E675E]">
                    This is not medical advice.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {programmes.map((prog) => {
                    const isRecommended =
                      prog.type === displayedRouting.recommended;
                    const isBlocked = displayedRouting.blocked.includes(
                      prog.type
                    );
                    const blockReason =
                      displayedRouting.blockReasons[prog.type];

                    return (
                      <div
                        key={prog.id}
                        className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                          isBlocked
                            ? 'border-[#B91C1C]/40 bg-[#FEF2F2]/65'
                            : isRecommended
                            ? 'border-2 border-[#1B4332] bg-white shadow-sm'
                            : 'border-[#CBD8CE] bg-white hover:border-[#1B4332]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs font-mono">
                            <span
                              className={
                                isBlocked
                                  ? 'text-[#B91C1C] font-semibold'
                                  : isRecommended
                                  ? 'text-[#15803D] font-semibold'
                                  : 'text-[#4E675E]'
                              }
                            >
                              {isBlocked
                                ? 'BLOCKED BY SAFETY RULE'
                                : isRecommended
                                ? '★ RECOMMENDED MATCH'
                                : 'ALLOWED PROGRAMME'}
                            </span>
                            <span className="text-[#4E675E]">{prog.type}</span>
                          </div>

                          <h5 className="font-display text-xl font-semibold text-[#0F241D] mt-1">
                            {prog.name}
                          </h5>
                          <p className="text-xs text-[#4E675E] mt-1 leading-relaxed">
                            {prog.description}
                          </p>

                          <div className="mt-2.5 pt-2.5 border-t border-[#CBD8CE]/60 text-[11px] text-[#0F241D]/80 space-y-0.5">
                            <div>
                              <strong>Props:</strong> {prog.propsUsed}
                            </div>
                            <div>
                              <strong>Lead:</strong> {prog.instructor}
                            </div>
                          </div>

                          {isBlocked && blockReason && (
                            <div className="mt-3 p-2.5 rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] text-[11px] text-[#B91C1C] font-medium flex items-start gap-2">
                              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{blockReason}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-2">
                          {isBlocked ? (
                            <button
                              type="button"
                              onClick={() => setRejectionModalProgramme(prog)}
                              className="w-full py-2 px-3 rounded-lg border border-[#B91C1C] text-[#B91C1C] font-mono text-[11px] uppercase tracking-wider hover:bg-[#B91C1C] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Blocked — Inspect Safety Guardrail</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onNavigateToBatches(prog.type)}
                              className={`w-full py-2 px-3 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                                isRecommended
                                  ? 'bg-[#1B4332] text-white hover:bg-[#0F241D] font-semibold'
                                  : 'border border-[#CBD8CE] bg-[#F4F7F4] text-[#0F241D] hover:bg-[#E6EFE9]'
                              }`}
                            >
                              Select {prog.type} Batch →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Crisis Adaptation Section 17.2.3 */}
              <div className="rounded-xl border border-[#CBD8CE] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#CBD8CE] pb-3">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-[#C86446]" />
                    <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#0F241D]">
                      CLINICAL DIFFERENTIATION SUMMARY (HUMAN STUDIO VS. ₹299
                      APPS)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToMemberships}
                    className="font-mono text-xs text-[#1B4332] underline cursor-pointer"
                  >
                    View Plans (₹1,500–₹7,500) →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-lg bg-[#F4F7F4] border border-[#CBD8CE]">
                    <div className="font-mono font-semibold uppercase text-[#0F241D] mb-1">
                      1. Hands-On Spinal Safeguards
                    </div>
                    <p className="text-[#4E675E]">
                      Automated video apps cannot detect lumbar flexion or
                      hypertensive breath retention. Our instructors adjust props
                      in real time.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#F4F7F4] border border-[#CBD8CE]">
                    <div className="font-mono font-semibold uppercase text-[#0F241D] mb-1">
                      2. Iyengar Wall-Rope Traction
                    </div>
                    <p className="text-[#4E675E]">
                      Certified wall ropes, bolsters, and wooden bricks unload
                      compressed discs safely for back and knee pain recovery.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#F4F7F4] border border-[#CBD8CE]">
                    <div className="font-mono font-semibold uppercase text-[#0F241D] mb-1">
                      3. Capped Micro-Cohorts (6–8)
                    </div>
                    <p className="text-[#4E675E]">
                      Strict database capacity locks (Rule B1) ensure every
                      therapeutic practitioner receives individual supervision.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Safety Guardrail Rejection Modal */}
      {rejectionModalProgramme && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl border border-[#CBD8CE] bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3 text-[#B91C1C]">
              <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-xs uppercase tracking-wider font-semibold">
                  HTTP 403 · PROGRAMME SAFETY GUARDRAIL
                </div>
                <h3 className="font-display text-2xl font-semibold text-[#0F241D] mt-0.5">
                  {rejectionModalProgramme.name} is Locked
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-[#B91C1C]/40 bg-[#FEF2F2] text-xs text-[#B91C1C] leading-relaxed">
              {displayedRouting.blockReasons[rejectionModalProgramme.type] ||
                'Blocked for your current health and experience profile.'}
            </div>

            <p className="text-xs text-[#4E675E] leading-relaxed">
              Manual override is disabled under NG Yoga Studio safety rules
              (R1–R6). Our routing engine recommends{' '}
              <strong>{displayedRouting.recommended}</strong>.
            </p>

            <div className="text-[11px] text-[#4E675E] border-t border-[#CBD8CE] pt-2">
              This is not medical advice. Consult a qualified health
              professional for medical concerns.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalProgramme(null)}
                className="px-4 py-2 rounded-lg border border-[#CBD8CE] text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const rec = displayedRouting.recommended;
                  setRejectionModalProgramme(null);
                  onNavigateToBatches(rec);
                }}
                className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer"
              >
                Book {displayedRouting.recommended} Instead →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
