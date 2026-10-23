'use client';

import React from 'react';
import {
  ArrowRight,
  MapPin,
  Clock,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  HeartPulse,
} from 'lucide-react';
import type {Batch, Programme, ProgrammeType} from '@/types';
import {STUDIO_WHATSAPP_NUMBER} from '@/lib/whatsapp';

interface StudioLandingViewProps {
  programmes: Programme[];
  batches: Batch[];
  onStartHealthIntake: () => void;
  onExploreBatches: (programme?: ProgrammeType) => void;
  onOpenAuthModal: () => void;
}

const MINDFUL_SEQUENCE = [
  {
    step: '01 · Structural Grounding',
    sanskrit: 'Utthita Parsvakonasana',
    english: 'Extended Side Angle',
    cue: 'Ground the outer heel and lengthen through the lateral ribcage. Front knee stacks cleanly over the ankle without medial collapse.',
  },
  {
    step: '02 · Core Stabilization',
    sanskrit: 'Chaturanga Dandasana',
    english: 'Four-Limbed Staff Transition',
    cue: 'Transition with slow eccentric control. Elbows hug the ribs while broad scapulae protect the anterior shoulder capsule.',
  },
  {
    step: '03 · Thoracic Expansion',
    sanskrit: 'Urdhva Mukha Svanasana',
    english: 'Upward-Facing Dog',
    cue: 'Open the sternum and anterior spine while lifting the thighs clear of the mat, keeping the lumbar vertebrae decompressed.',
  },
  {
    step: '04 · Autonomic Stillness',
    sanskrit: 'Vajrasana Anjali Mudra',
    english: 'Centered Breath Integration',
    cue: 'Complete the sequence in quiet stillness. Allow heart rate variability to settle before stepping off the mat.',
  },
];

const COMMUNITY_REVIEWS = [
  {
    tag: 'Lumbar Traction · Wall Rope Yoga Therapy',
    quote:
      'Long desk hours had left my lower back constantly stiff. Within three weeks of guided wall-rope spinal decompression here at Prem Plaza, my mornings feel completely pain-free.',
    author: 'Prateek D. · Ashok Nagar, Indore (8:30 AM Cohort)',
  },
  {
    tag: 'Metabolic Stamina · Sunrise Vinyasa Flow',
    quote:
      'The 6:30 AM cohort sets the rhythm for my entire day. It builds genuine metabolic endurance without ever rushing transitions or straining the knees.',
    author: 'Roshni K. · Sapna Sangeeta, Indore (6:30 AM Cohort)',
  },
  {
    tag: 'Clinical Precision · Evening Hatha & Props',
    quote:
      'What sets NG Yoga Studio apart from generic fitness apps is tactile posture correction. Every block, belt, and wall-rope setup is tailored to your spine.',
    author: 'Anjali V. · Bhawarkuan, Indore (7:00 PM Cohort)',
  },
];

export default function StudioLandingView({
  programmes,
  batches,
  onStartHealthIntake,
  onExploreBatches,
  onOpenAuthModal,
}: StudioLandingViewProps) {
  return (
    <div className="space-y-12 pb-16 text-[#11111b] font-mono">
      {/* Hero Section */}
      <section className="pt-8 pb-4">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ccd0da] bg-white text-[#1e66f5] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Iyengar Wall Ropes · Somatic Spinal Decompression</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#11111b] leading-tight">
                Human-Led Precision Alignment.{' '}
                <span className="text-[#1e66f5]">Zero Generic Video Feeds.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#4c4f69] leading-relaxed max-w-xl font-medium">
                Founded by <strong className="text-[#11111b] font-bold">Narayan Gothane (NG)</strong> at Prem Plaza, Ashok Nagar. We replace automated screen workouts with clinically safe, tactile posture corrections and Iyengar wall-rope therapy.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onStartHealthIntake}
                  className="py-3.5 px-6 rounded-lg bg-[#1e66f5] hover:bg-[#1e66f5]/90 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <span>Start New Member Onboarding</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onExploreBatches()}
                  className="py-3.5 px-5 rounded-lg border-2 border-[#ccd0da] bg-white hover:bg-[#eff1f5] text-[#11111b] text-xs uppercase font-extrabold transition-colors cursor-pointer"
                >
                  View Cohort Schedule
                </button>
              </div>

              {/* Meta Badges */}
              <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-[#5c5f77] font-semibold">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1e66f5]" />
                  <span>Prem Plaza, Ashok Nagar, Indore</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#179299]" />
                  <span>Morning 6:30 AM &amp; Evening 5:00 PM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#40a02b]" />
                  <span>Deterministic R1–R6 Safety Guardrails</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Information Card */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border-2 border-[#ccd0da] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ccd0da]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#1e66f5] font-extrabold">
                      STUDIO SPECIALTY
                    </span>
                    <h3 className="text-lg font-bold text-[#11111b]">
                      Wall-Rope Spinal Decompression
                    </h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-[#1e66f5]/10 text-[#1e66f5] flex items-center justify-center font-bold">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs text-[#4c4f69] leading-relaxed">
                  Our flagship clinical programme decompresses lumbar vertebrae, stretches tight piriformis muscles, and rehabilitates knee joints using gravity and wall-mounted cotton ropes.
                </p>

                <div className="p-3.5 rounded-lg bg-[#eff1f5] border border-[#ccd0da] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5c5f77] font-semibold">Class Size:</span>
                    <span className="font-extrabold text-[#11111b]">Capped at 6–8 members</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5c5f77] font-semibold">Props Used:</span>
                    <span className="text-[#11111b] font-bold">Wall Ropes, Wooden Blocks &amp; Bolsters</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5c5f77] font-semibold">Instructor:</span>
                    <span className="text-[#1e66f5] font-extrabold">NG Gothane (Lead Specialist)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onStartHealthIntake}
                  className="w-full py-2.5 rounded-lg bg-[#eff1f5] hover:bg-[#ccd0da]/40 border border-[#ccd0da] text-[#1e66f5] text-xs uppercase tracking-wider font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Check Your Suitability (R1–R6)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator Section */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <div className="rounded-xl border border-[#ccd0da] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-wider text-[#8839ef] font-extrabold">
              Anatomical Safeguards
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11111b] mt-0.5">
              Why Tactile Somatic Yoga Cannot Be Automated
            </h2>
            <p className="text-xs sm:text-sm text-[#4c4f69] mt-1 font-medium">
              Low-cost digital apps lack physical posture tactile feedback. When people with high BP or lumbar herniations follow generic screen sequences, injuries occur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-lg border border-[#ccd0da] bg-[#eff1f5] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#1e66f5]/10 text-[#1e66f5] flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#11111b]">
                Deterministic Safety Engine
              </h3>
              <p className="text-xs text-[#4c4f69] leading-relaxed">
                Rules R1 through R6 instantly filter out high-impact or inversion postures for those with elevated blood pressure, knee pain, or lumbar fatigue.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-[#ccd0da] bg-[#eff1f5] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#8839ef]/10 text-[#8839ef] flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#11111b]">
                Iyengar Wall-Rope Alignment
              </h3>
              <p className="text-xs text-[#4c4f69] leading-relaxed">
                Props create safe structural traction that no floor workout can mimic, gently unpinning compressed nerves without joint wear.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-[#ccd0da] bg-[#eff1f5] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#40a02b]/10 text-[#40a02b] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#11111b]">
                Micro-Group Attention
              </h3>
              <p className="text-xs text-[#4c4f69] leading-relaxed">
                Batches are capped at 6 to 15 members so instructor NG Gothane personally checks every spine angle, breath cadence, and posture placement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mindful Sequence */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 space-y-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#1e66f5] font-extrabold">
            Somatic Methodology
          </span>
          <h2 className="text-2xl font-extrabold text-[#11111b] mt-0.5">
            The NG Studio Practice Progression
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {MINDFUL_SEQUENCE.map((s, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#ccd0da] bg-white space-y-1.5 shadow-sm"
            >
              <div className="text-[10px] text-[#1e66f5] uppercase font-bold">
                {s.step}
              </div>
              <div className="font-extrabold text-sm text-[#11111b]">
                {s.sanskrit}
              </div>
              <div className="text-xs text-[#8839ef] font-bold">
                {s.english}
              </div>
              <p className="text-xs text-[#4c4f69] leading-relaxed pt-0.5">
                {s.cue}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Community Reviews */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 space-y-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#179299] font-extrabold">
            Member Experiences
          </span>
          <h2 className="text-2xl font-extrabold text-[#11111b] mt-0.5">
            Voices from Ashok Nagar Cohorts
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COMMUNITY_REVIEWS.map((r, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-[#ccd0da] bg-white flex flex-col justify-between space-y-3 shadow-sm"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-[#1e66f5] font-bold uppercase tracking-wider inline-block">
                  {r.tag}
                </span>
                <p className="text-xs text-[#11111b] font-medium leading-relaxed italic">
                  &ldquo;{r.quote}&rdquo;
                </p>
              </div>
              <div className="text-[10px] text-[#5c5f77] pt-2 border-t border-[#ccd0da] font-semibold">
                {r.author}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Location / Action Bar */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <div className="rounded-xl border border-[#ccd0da] bg-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#1e66f5] font-extrabold">
              Visit NG Yoga Studio
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#11111b]">
              Prem Plaza, Near ICICI Bank, Ashok Nagar
            </h3>
            <p className="text-xs text-[#5c5f77] font-semibold">
              Indore (MP 452001) · Lead Instructor: NG Gothane
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onStartHealthIntake}
              className="py-3 px-6 rounded-lg bg-[#1e66f5] hover:bg-[#1e66f5]/90 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-sm"
            >
              Start Client Onboarding
            </button>
            <a
              href={`https://wa.me/91${STUDIO_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-5 rounded-lg bg-[#40a02b] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            >
              <span>WhatsApp Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
