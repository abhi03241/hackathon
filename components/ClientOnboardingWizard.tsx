'use client';

import React, {useState, useMemo} from 'react';
import {
  User,
  Phone,
  Sparkles,
  HeartPulse,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
  Lock,
  ExternalLink,
  Info,
  Award,
} from 'lucide-react';
import type {
  Batch,
  Booking,
  Condition,
  ExperienceLevel,
  Goal,
  Member,
  Membership,
  PlanType,
  Programme,
  ProgrammeType,
  RoutingResult,
} from '@/types';
import {
  routeMember,
  CONDITION_LABELS,
  GOAL_LABELS,
  EXPERIENCE_LABELS,
  ALL_PROGRAMMES,
} from '@/lib/routing';
import {STUDIO_WHATSAPP_NUMBER} from '@/lib/whatsapp';

interface ClientOnboardingWizardProps {
  programmes: Programme[];
  batches: Batch[];
  activeMember: Member | null;
  activeMembership: Membership | null;
  hasUsedTrial: boolean;
  onOnboardingComplete: (payload: {
    member: Member;
    routing: RoutingResult;
    membership: Membership | null;
    booking?: Booking | null;
    snapshot?: unknown;
  }) => void;
  onExploreBatches: () => void;
}

export default function ClientOnboardingWizard({
  programmes,
  batches,
  activeMember,
  activeMembership,
  hasUsedTrial,
  onOnboardingComplete,
  onExploreBatches,
}: ClientOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [name, setName] = useState<string>(activeMember?.name || '');
  const [phone, setPhone] = useState<string>(activeMember?.phone || '');
  const [age, setAge] = useState<number>(activeMember?.age || 32);
  const [password, setPassword] = useState<string>('member123');

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    activeMember?.experience_level || 'beginner'
  );
  const [mainGoal, setMainGoal] = useState<Goal>('fitness');

  const [conditions, setConditions] = useState<Condition[]>(['none']);
  const [consentGiven, setConsentGiven] = useState<boolean>(true);

  // Selected Programme in Step 4
  const [selectedProgramme, setSelectedProgramme] = useState<ProgrammeType | null>(null);

  // Booking & Pass Choice in Step 5
  const [passType, setPassType] = useState<'trial' | PlanType>(
    hasUsedTrial ? '1month' : 'trial'
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // Submission & Confirmation State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedPass, setConfirmedPass] = useState<{
    member: Member;
    routing: RoutingResult;
    membership: Membership | null;
    booking: Booking | null;
    batch: Batch | null;
  } | null>(null);

  // Deterministic routing evaluation
  const routing = useMemo<RoutingResult>(() => {
    return routeMember({
      conditions,
      goal: mainGoal,
      experienceLevel,
    });
  }, [conditions, mainGoal, experienceLevel]);

  // Set default selected programme to recommended
  React.useEffect(() => {
    if (routing && !selectedProgramme) {
      setSelectedProgramme(routing.recommended);
    }
  }, [routing, selectedProgramme]);

  // Filter batches for the chosen programme
  const availableBatches = useMemo(() => {
    const progType = selectedProgramme || routing.recommended;
    const matched = batches.filter((b) => b.programme_type === progType);
    return matched.length > 0 ? matched : batches.slice(0, 4);
  }, [batches, selectedProgramme, routing.recommended]);

  // Auto-select first batch if none selected
  React.useEffect(() => {
    if (availableBatches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(availableBatches[0].id);
    }
  }, [availableBatches, selectedBatchId]);

  const toggleCondition = (cond: Condition) => {
    if (cond === 'none') {
      setConditions(['none']);
      return;
    }
    const filtered = conditions.filter((c) => c !== 'none');
    if (filtered.includes(cond)) {
      const next = filtered.filter((c) => c !== cond);
      setConditions(next.length === 0 ? ['none'] : next);
    } else {
      setConditions([...filtered, cond]);
    }
  };

  // Validation
  const validateStep1 = () => {
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return false;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (e.g. 9826012345).');
      return false;
    }
    if (age < 10 || age > 80) {
      setErrorMsg('Age must be between 10 and 80 years.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep3 = () => {
    if (!consentGiven) {
      setErrorMsg('Informed consent is required to recommend safe yoga postures for your body.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setErrorMsg(null);
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitOnboarding = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const cleanPhone = phone.trim().replace(/\D/g, '');

      // 1. Submit Member Health Intake
      const memberRes = await fetch('/api/members', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          age,
          experience_level: experienceLevel,
          main_goal: mainGoal,
          conditions,
          consent_given: consentGiven,
        }),
      });

      const memberData = await memberRes.json();
      if (!memberRes.ok) {
        throw new Error(memberData.message || 'Health intake registration failed.');
      }

      const createdMember: Member = {
        id: memberData.member_id,
        tenant_id: 'tenant-indore-ashok-nagar',
        name: name.trim(),
        phone: cleanPhone,
        age,
        experience_level: experienceLevel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let createdMembership: Membership | null = null;
      let createdBooking: Booking | null = null;

      // 2. If paid plan selected, create membership
      if (passType !== 'trial') {
        const msRes = await fetch('/api/memberships', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            member_id: createdMember.id,
            plan_type: passType,
          }),
        });
        const msData = await msRes.json();
        if (msRes.ok && msData.membership) {
          createdMembership = msData.membership;
        }
      }

      // 3. Book selected batch
      if (selectedBatchId && !routing.hardBlock) {
        const bookRes = await fetch('/api/bookings', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            member_id: createdMember.id,
            batch_id: selectedBatchId,
            booking_type: passType === 'trial' ? 'trial' : 'member',
          }),
        });
        const bookData = await bookRes.json();
        if (bookRes.ok && bookData.booking) {
          createdBooking = bookData.booking;
        }
      }

      const chosenBatch = batches.find((b) => b.id === selectedBatchId) || null;

      setConfirmedPass({
        member: createdMember,
        routing,
        membership: createdMembership,
        booking: createdBooking,
        batch: chosenBatch,
      });

      setCurrentStep(6);

      onOnboardingComplete({
        member: createdMember,
        routing,
        membership: createdMembership,
        booking: createdBooking,
        snapshot: memberData.snapshot,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during onboarding.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    {num: 1, label: 'Profile'},
    {num: 2, label: 'Experience'},
    {num: 3, label: 'Somatic Check'},
    {num: 4, label: 'Clinical Fit'},
    {num: 5, label: 'Batch & Pass'},
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-[#4c4f69] font-mono">
      {/* Multistep Progress Header */}
      {currentStep <= 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-[#1e66f5] uppercase tracking-wider">
              Step {currentStep} of 5: {stepsList[currentStep - 1].label}
            </span>
            <span className="text-[#6c6f85]">
              NG Yoga Studio · Client Onboarding
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {stepsList.map((s) => {
              const isPast = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="space-y-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isPast
                        ? 'bg-[#40a02b]'
                        : isCurrent
                        ? 'bg-[#1e66f5]'
                        : 'bg-[#ccd0da]'
                    }`}
                  />
                  <div className="hidden sm:block text-[11px] truncate text-[#6c6f85]">
                    {s.num}. {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-lg border border-[#d20f39] bg-[#d20f39]/10 text-[#d20f39] text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Personal Details */}
      {currentStep === 1 && (
        <div className="rounded-xl border border-[#ccd0da] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e66f5]/10 text-[#1e66f5] text-xs mb-2 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Somatic Practice</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11111b]">
              Welcome to NG Yoga Studio
            </h2>
            <p className="text-xs text-[#6c6f85] mt-1">
              Prem Plaza, Ashok Nagar, Indore. Please provide your details for safe class routing by lead instructor NG Gothane.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-[#6c6f85] font-semibold">
                Full Name <span className="text-[#d20f39]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9ca0b0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pooja Sharma"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#eff1f5] border border-[#ccd0da] text-[#4c4f69] text-xs focus:outline-none focus:border-[#1e66f5]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-[#6c6f85] font-semibold">
                10-Digit Mobile <span className="text-[#d20f39]">*</span>
              </label>
              <div className="relative">
                <span className="text-xs text-[#6c6f85] absolute left-3 top-1/2 -translate-y-1/2">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9826019999"
                  maxLength={10}
                  className="w-full pl-11 pr-3 py-2 rounded-lg bg-[#eff1f5] border border-[#ccd0da] text-[#4c4f69] text-xs focus:outline-none focus:border-[#1e66f5]"
                  required
                />
              </div>
              <span className="text-[10px] text-[#6c6f85]">
                Used for attendance check-in &amp; booking confirmation.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-[#6c6f85] font-semibold">
                Age (10 – 80) <span className="text-[#d20f39]">*</span>
              </label>
              <input
                type="number"
                min={10}
                max={80}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#eff1f5] border border-[#ccd0da] text-[#4c4f69] text-xs focus:outline-none focus:border-[#1e66f5]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-[#6c6f85] font-semibold">
                Portal PIN / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9ca0b0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="default: member123"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#eff1f5] border border-[#ccd0da] text-[#4c4f69] text-xs focus:outline-none focus:border-[#1e66f5]"
                />
              </div>
              <span className="text-[10px] text-[#6c6f85]">
                Enables instant login to your digital member pass.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#ccd0da]">
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e66f5]/90 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Continue to Experience &amp; Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Experience & Wellness Intentions */}
      {currentStep === 2 && (
        <div className="rounded-xl border border-[#ccd0da] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8839ef]/10 text-[#8839ef] text-xs mb-2 font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Step 2 · Experience &amp; Goals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11111b]">
              Your Yoga Background &amp; Intentions
            </h2>
            <p className="text-xs text-[#6c6f85] mt-1">
              Helps us customize spinal alignment cues to prevent ligament strain.
            </p>
          </div>

          {/* Experience Selector */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-[#6c6f85] font-semibold">
              Experience Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map((level) => {
                const isSelected = experienceLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setExperienceLevel(level)}
                    className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#1e66f5] bg-[#1e66f5]/10 text-[#1e66f5]'
                        : 'border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#4c4f69]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase">
                        {EXPERIENCE_LABELS[level]}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1e66f5]" />}
                    </div>
                    <p className="text-[11px] text-[#6c6f85]">
                      {level === 'beginner' &&
                        'New to yoga practice. Activates Rule R6 safety guardrails.'}
                      {level === 'intermediate' &&
                        'Familiar with Surya Namaskar and foundational poses.'}
                      {level === 'advanced' &&
                        '2+ years regular practice with deep backbends.'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Selector */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-[#6c6f85] font-semibold">
              Primary Wellness Goal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['weight_loss', 'flexibility', 'stress_relief', 'fitness'] as Goal[]).map((g) => {
                const isSelected = mainGoal === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setMainGoal(g)}
                    className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#1e66f5] bg-[#1e66f5]/10 text-[#1e66f5]'
                        : 'border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#4c4f69]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs uppercase">
                        {GOAL_LABELS[g]}
                      </div>
                      <div className="text-[11px] text-[#6c6f85] mt-0.5">
                        {g === 'weight_loss' && 'Metabolic endurance & stamina'}
                        {g === 'flexibility' && 'Safe fascia elongation & joint mobility'}
                        {g === 'stress_relief' && 'Parasympathetic nervous system reset'}
                        {g === 'fitness' && 'Postural alignment & core tone'}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1e66f5] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ccd0da]">
            <button
              type="button"
              onClick={handleBack}
              className="py-2 px-4 rounded-lg border border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-xs uppercase tracking-wider text-[#6c6f85] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e66f5]/90 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Continue to Somatic Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Somatic Health Assessment & Informed Consent */}
      {currentStep === 3 && (
        <div className="rounded-xl border border-[#ccd0da] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#179299]/10 text-[#179299] text-xs mb-2 font-semibold">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Step 3 · Somatic Screening</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11111b]">
              Health Conditions &amp; Safety
            </h2>
            <p className="text-xs text-[#6c6f85] mt-1">
              Select conditions that apply. Our studio applies deterministic safety routing (R1–R6) to protect your body.
            </p>
          </div>

          {/* Condition Selectors */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-[#6c6f85] font-semibold">
              Health Conditions (Select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                const isSelected = conditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? cond === 'pregnancy'
                          ? 'border-[#d20f39] bg-[#d20f39]/10 text-[#d20f39]'
                          : 'border-[#1e66f5] bg-[#1e66f5]/10 text-[#1e66f5]'
                        : 'border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#4c4f69]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs uppercase">
                        {CONDITION_LABELS[cond]}
                      </div>
                      <div className="text-[11px] text-[#6c6f85] mt-0.5">
                        {cond === 'back_pain' && 'Lumbar traction · Triggers Rule R2 (Yoga Therapy)'}
                        {cond === 'knee_pain' && 'Joint caution · Triggers Rule R2 (Yoga Therapy)'}
                        {cond === 'high_bp' && 'Cardiovascular limit · Triggers Rule R3 (Traditional)'}
                        {cond === 'pcod' && 'Endocrine pacing · Triggers Rule R4 (PCOD Focus)'}
                        {cond === 'pregnancy' && 'Triggers Rule R1 (Mandatory Instructor Safety Lock)'}
                        {cond === 'none' && 'No diagnosed cardiovascular or somatic restrictions'}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ml-2 ${
                          cond === 'pregnancy' ? 'text-[#d20f39]' : 'text-[#1e66f5]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="p-3.5 rounded-lg border border-[#ccd0da] bg-[#eff1f5] space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#1e66f5] accent-[#1e66f5] cursor-pointer"
              />
              <span className="text-xs text-[#4c4f69] leading-relaxed">
                I agree to share this health information with NG Yoga Studio instructors for class placement, postural corrections, and anatomical alignment purposes.
              </span>
            </label>

            {/* Medical Disclaimer */}
            <div className="pt-2 border-t border-[#ccd0da] flex items-start gap-2 text-[11px] text-[#6c6f85] leading-relaxed">
              <Info className="w-3.5 h-3.5 text-[#df8e1d] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#df8e1d]">Medical Disclaimer:</strong> This system guides studio programme suitability only and does not provide medical diagnoses or clinical advice. Consult a qualified health professional for medical concerns.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ccd0da]">
            <button
              type="button"
              onClick={handleBack}
              className="py-2 px-4 rounded-lg border border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-xs uppercase tracking-wider text-[#6c6f85] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e66f5]/90 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Evaluate My Clinical Fit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Clinical Routing Result & Safety Fit */}
      {currentStep === 4 && (
        <div className="rounded-xl border border-[#ccd0da] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#df8e1d]/10 text-[#df8e1d] text-xs mb-2 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Step 4 · Clinical Routing Fit (R1–R6)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11111b]">
              Your Evaluated Studio Programme
            </h2>
            <p className="text-xs text-[#6c6f85] mt-1">
              Based on your intake, here is your instructor-recommended programme and safety guardrails.
            </p>
          </div>

          {/* R1 Pregnancy Hard Block Check */}
          {routing.hardBlock ? (
            <div className="p-5 rounded-lg border border-[#d20f39] bg-[#d20f39]/10 space-y-3">
              <div className="flex items-center gap-2 text-[#d20f39]">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Rule R1: Prenatal Safety Guardrail Active
                </h3>
              </div>
              <p className="text-xs text-[#4c4f69] leading-relaxed">
                Because you indicated pregnancy, digital booking is safely locked. To ensure absolute prenatal safety, please speak directly with founder and lead instructor Narayan Gothane before starting classes.
              </p>
              <div className="pt-1">
                <a
                  href={`https://wa.me/91${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `Hi NG Gothane, I am enrolling at NG Yoga Studio and would like to schedule a prenatal safety consultation for safe alignment.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#40a02b] text-white font-bold text-xs tracking-wider uppercase shadow-sm"
                >
                  <span>Chat with Instructor on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Highlighted Recommended Card */}
              <div className="p-5 rounded-xl border-2 border-[#1e66f5] bg-[#eff1f5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e66f5]">
                    Recommended Programme
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e66f5] text-white font-bold uppercase">
                    Primary Fit
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#4c4f69]">
                  {routing.recommended}
                </h3>
                <p className="text-xs text-[#6c6f85] leading-relaxed">
                  {routing.message}
                </p>

                <div className="pt-3 border-t border-[#ccd0da] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#6c6f85] block text-[10px] uppercase">
                      Instructor:
                    </span>
                    <span className="text-[#4c4f69] font-semibold">NG Gothane (Lead Specialist)</span>
                  </div>
                  <div>
                    <span className="text-[#6c6f85] block text-[10px] uppercase">
                      Studio Props:
                    </span>
                    <span className="text-[#4c4f69] font-semibold">Wall Ropes, Wooden Blocks &amp; Bolsters</span>
                  </div>
                </div>
              </div>

              {/* Blocked Programmes */}
              {routing.blocked.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#d20f39] font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Safety Restricted Styles ({routing.blocked.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {routing.blocked.map((p) => {
                      const reason = routing.blockReasons[p] || 'Restricted for safety';
                      return (
                        <div
                          key={p}
                          className="p-3 rounded-lg border border-[#d20f39]/30 bg-[#d20f39]/5 text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-[#d20f39] font-bold">
                            <span>{p}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#d20f39]/15">
                              BLOCKED
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6c6f85]">{reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#ccd0da]">
            <button
              type="button"
              onClick={handleBack}
              className="py-2 px-4 rounded-lg border border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-xs uppercase tracking-wider text-[#6c6f85] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            {!routing.hardBlock && (
              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-5 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e66f5]/90 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Select Batch &amp; Pass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: Select Batch & Pass Choice */}
      {currentStep === 5 && (
        <div className="rounded-xl border border-[#ccd0da] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#179299]/10 text-[#179299] text-xs mb-2 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Step 5 · Choose Pass &amp; Schedule</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11111b]">
              Reserve Your First Class
            </h2>
            <p className="text-xs text-[#6c6f85] mt-1">
              Select an upcoming session for <strong className="text-[#1e66f5]">{selectedProgramme || routing.recommended}</strong>.
            </p>
          </div>

          {/* Pass Type Choice */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-[#6c6f85] font-semibold">
              Select Your Intro Pass or Plan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* Free Trial */}
              <button
                type="button"
                disabled={hasUsedTrial}
                onClick={() => setPassType('trial')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  passType === 'trial'
                    ? 'border-[#40a02b] bg-[#40a02b]/10 text-[#40a02b]'
                    : hasUsedTrial
                    ? 'border-[#ccd0da] bg-[#e6e9ef] text-[#9ca0b0] cursor-not-allowed'
                    : 'border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#4c4f69]'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-[#40a02b]">
                  {hasUsedTrial ? 'Used' : 'First Visit'}
                </div>
                <div className="font-bold text-xs text-[#4c4f69] mt-0.5">Free Trial</div>
                <div className="text-base font-extrabold text-[#40a02b] mt-0.5">₹0</div>
              </button>

              {/* 1 Month */}
              <button
                type="button"
                onClick={() => setPassType('1month')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  passType === '1month'
                    ? 'border-[#1e66f5] bg-[#1e66f5]/10 text-[#1e66f5]'
                    : 'border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#4c4f69]'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-[#1e66f5]">1 Month</div>
                <div className="font-bold text-xs text-[#4c4f69] mt-0.5">Monthly</div>
                <div className="text-base font-extrabold text-[#1e66f5] mt-0.5">₹1,500</div>
              </button>

              {/* 3 Months */}
              <button
                type="button"
                onClick={() => setPassType('3months')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  passType === '3months'
                    ? 'border-[#8839ef] bg-[#8839ef]/10 text-[#8839ef]'
                    : 'border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#4c4f69]'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-[#8839ef]">3 Months</div>
                <div className="font-bold text-xs text-[#4c4f69] mt-0.5">Quarterly</div>
                <div className="text-base font-extrabold text-[#8839ef] mt-0.5">₹4,000</div>
              </button>

              {/* 6 Months */}
              <button
                type="button"
                onClick={() => setPassType('6months')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  passType === '6months'
                    ? 'border-[#df8e1d] bg-[#df8e1d]/10 text-[#df8e1d]'
                    : 'border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#4c4f69]'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-[#df8e1d]">6 Months</div>
                <div className="font-bold text-xs text-[#4c4f69] mt-0.5">Half-Yearly</div>
                <div className="text-base font-extrabold text-[#df8e1d] mt-0.5">₹7,500</div>
              </button>
            </div>
          </div>

          {/* Batch Slots */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-[#6c6f85] font-semibold">
              Select Cohort Timing
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableBatches.map((b) => {
                const isSelected = selectedBatchId === b.id;
                const remaining = b.capacity - b.booked_count;
                const isFull = remaining <= 0;

                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSelectedBatchId(b.id)}
                    className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#1e66f5] bg-[#1e66f5]/10 text-[#1e66f5]'
                        : isFull
                        ? 'border-[#ccd0da] bg-[#e6e9ef] opacity-50 cursor-not-allowed'
                        : 'border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#4c4f69]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{b.timing_label}</span>
                      </div>
                      <div className="text-[11px] text-[#6c6f85] mt-0.5">
                        Instructor: {b.instructor}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isFull
                          ? 'bg-[#d20f39]/15 text-[#d20f39]'
                          : remaining <= 2
                          ? 'bg-[#df8e1d]/15 text-[#df8e1d]'
                          : 'bg-[#40a02b]/15 text-[#40a02b]'
                      }`}
                    >
                      {isFull ? 'FULL' : `${remaining} left`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ccd0da]">
            <button
              type="button"
              onClick={handleBack}
              className="py-2 px-4 rounded-lg border border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-xs uppercase tracking-wider text-[#6c6f85] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitOnboarding}
              className="py-2.5 px-6 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e66f5]/90 transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating Pass...' : 'Confirm Booking & Get Pass'}
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Confirmation & Digital Member Pass */}
      {currentStep === 6 && confirmedPass && (
        <div className="space-y-6">
          <div className="text-center space-y-1 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#40a02b]/15 text-[#40a02b] text-xs font-bold uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Booking &amp; Registration Confirmed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11111b]">
              Welcome to NG Yoga Studio
            </h2>
            <p className="text-xs text-[#6c6f85]">
              Your member pass has been issued. Give your mobile number at Prem Plaza desk on arrival.
            </p>
          </div>

          {/* Clean Member Pass Card */}
          <div className="max-w-md mx-auto rounded-xl border-2 border-[#1e66f5] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ccd0da]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#1e66f5]">
                  NG YOGA STUDIO · INDORE
                </span>
                <div className="text-base font-bold text-[#4c4f69]">
                  Digital Member Pass
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#40a02b]/15 text-[#40a02b]">
                CONFIRMED
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase text-[#6c6f85] block">
                  Member
                </span>
                <div className="text-base font-bold text-[#4c4f69]">
                  {confirmedPass.member.name}
                </div>
                <div className="text-xs text-[#6c6f85]">
                  +91 {confirmedPass.member.phone}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] uppercase text-[#6c6f85] block">
                    Programme
                  </span>
                  <div className="font-bold text-[#1e66f5]">
                    {confirmedPass.routing.recommended}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#6c6f85] block">
                    Pass Type
                  </span>
                  <div className="font-bold text-[#8839ef]">
                    {confirmedPass.membership
                      ? confirmedPass.membership.plan_label
                      : 'Free Trial Pass'}
                  </div>
                </div>
              </div>

              {confirmedPass.batch && (
                <div className="pt-1">
                  <span className="text-[10px] uppercase text-[#6c6f85] block">
                    Booked Session Cohort
                  </span>
                  <div className="font-bold text-[#40a02b] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{confirmedPass.batch.timing_label}</span>
                  </div>
                  <div className="text-[11px] text-[#6c6f85]">
                    Instructor: {confirmedPass.batch.instructor}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#ccd0da] flex items-center justify-between text-[11px] text-[#6c6f85]">
              <span>Prem Plaza, Ashok Nagar, Indore</span>
              <span className="font-bold text-[#1e66f5]">PASS ACTIVE</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={`https://wa.me/91${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `Hi NG Yoga Studio, I just completed onboarding! My name is ${confirmedPass.member.name} (+91 ${confirmedPass.member.phone}). I am enrolled in ${confirmedPass.routing.recommended}. Looking forward to class!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-5 rounded-lg bg-[#40a02b] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            >
              <span>Send Pass to WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onExploreBatches}
              className="py-2.5 px-5 rounded-lg border border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#4c4f69] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              View Full Batch Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
