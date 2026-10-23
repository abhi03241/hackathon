'use client';

import React, {useState} from 'react';
import {
  User,
  Clock,
  HeartPulse,
  Award,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import type {
  Batch,
  Booking,
  Member,
  Membership,
  PlanType,
  Programme,
  RoutingResult,
} from '@/types';
import {STUDIO_WHATSAPP_NUMBER} from '@/lib/whatsapp';

interface ClientMemberPortalProps {
  activeMember: Member | null;
  activeMembership: Membership | null;
  activeRouting: RoutingResult | null;
  bookings: Booking[];
  batches: Batch[];
  onStartOnboarding: () => void;
  onExploreBatches: () => void;
  onRenewPlan: (plan: PlanType) => void;
}

export default function ClientMemberPortal({
  activeMember,
  activeMembership,
  activeRouting,
  bookings,
  batches,
  onStartOnboarding,
  onExploreBatches,
  onRenewPlan,
}: ClientMemberPortalProps) {
  const [renewing, setRenewing] = useState<PlanType | null>(null);

  if (!activeMember) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 text-[#4c4f69] font-mono">
        <div className="w-12 h-12 rounded-xl bg-[#1e66f5]/10 text-[#1e66f5] flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">No Active Member Session</h2>
          <p className="text-xs text-[#6c6f85]">
            Please sign in with your phone or complete onboarding to view your pass.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onStartOnboarding}
            className="py-2.5 px-5 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e66f5]/90 cursor-pointer shadow-sm"
          >
            Start Client Onboarding
          </button>
        </div>
      </div>
    );
  }

  // Filter member's bookings
  const myBookings = bookings.filter(
    (b) =>
      b.member_id === activeMember.id || b.member_phone === activeMember.phone
  );

  const calculateDaysRemaining = (expiryDateStr?: string) => {
    if (!expiryDateStr) return 0;
    const exp = new Date(expiryDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const daysRemaining = calculateDaysRemaining(activeMembership?.expiry_date);

  const handleRenew = async (plan: PlanType) => {
    setRenewing(plan);
    try {
      await onRenewPlan(plan);
    } finally {
      setRenewing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-[#4c4f69] font-mono">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-[#ccd0da] bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1e66f5] text-white flex items-center justify-center text-lg font-bold">
            {activeMember.name.charAt(0)}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#6c6f85]">
              NG Yoga Member Sanctuary
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#11111b]">
              {activeMember.name}
            </h1>
            <div className="text-xs text-[#6c6f85]">
              +91 {activeMember.phone} · Age: {activeMember.age} · Level: {activeMember.experience_level}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartOnboarding}
          className="self-start sm:self-auto py-2 px-3.5 rounded-lg border border-[#ccd0da] bg-[#eff1f5] hover:bg-[#ccd0da]/40 text-xs uppercase tracking-wider text-[#4c4f69] font-semibold transition-colors cursor-pointer"
        >
          Retake Health Intake
        </button>
      </div>

      {/* Grid: Membership Pass & Clinical Fit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Active Membership Pass Card */}
        <div className="p-5 rounded-xl border border-[#ccd0da] bg-white shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#ccd0da]">
            <span className="text-xs uppercase tracking-wider text-[#1e66f5] font-bold">
              Active Studio Pass
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                activeMembership?.status === 'active'
                  ? 'bg-[#40a02b]/15 text-[#40a02b]'
                  : 'bg-[#d20f39]/15 text-[#d20f39]'
              }`}
            >
              {activeMembership?.status === 'active'
                ? daysRemaining < 7
                  ? 'Expiring Soon'
                  : 'Active'
                : 'No Active Pass'}
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-[#4c4f69]">
              {activeMembership?.plan_label || 'Complimentary Trial / Inactive'}
            </div>
            <div className="text-xs text-[#6c6f85] mt-0.5">
              {activeMembership?.expiry_date ? (
                <>
                  Valid until:{' '}
                  <strong className="text-[#4c4f69]">
                    {activeMembership.expiry_date}
                  </strong>{' '}
                  ({daysRemaining} days remaining)
                </>
              ) : (
                'Choose a plan below to secure your daily practice cohort.'
              )}
            </div>
          </div>

          {/* Quick Plan Extension */}
          <div className="pt-2 border-t border-[#ccd0da]">
            <span className="text-[10px] uppercase text-[#6c6f85] block mb-1.5 font-semibold">
              Renew / Extend Membership
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={renewing !== null}
                onClick={() => handleRenew('1month')}
                className="p-2 rounded-lg bg-[#eff1f5] hover:bg-[#1e66f5]/10 hover:border-[#1e66f5] border border-[#ccd0da] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#1e66f5]">1 Month</div>
                <div className="text-[10px] text-[#6c6f85]">₹1,500</div>
              </button>
              <button
                type="button"
                disabled={renewing !== null}
                onClick={() => handleRenew('3months')}
                className="p-2 rounded-lg bg-[#eff1f5] hover:bg-[#8839ef]/10 hover:border-[#8839ef] border border-[#ccd0da] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#8839ef]">3 Months</div>
                <div className="text-[10px] text-[#6c6f85]">₹4,000</div>
              </button>
              <button
                type="button"
                disabled={renewing !== null}
                onClick={() => handleRenew('6months')}
                className="p-2 rounded-lg bg-[#eff1f5] hover:bg-[#df8e1d]/10 hover:border-[#df8e1d] border border-[#ccd0da] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#df8e1d]">6 Months</div>
                <div className="text-[10px] text-[#6c6f85]">₹7,500</div>
              </button>
            </div>
          </div>
        </div>

        {/* Clinical Health & Programme Card */}
        <div className="p-5 rounded-xl border border-[#ccd0da] bg-white shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#ccd0da]">
            <span className="text-xs uppercase tracking-wider text-[#8839ef] font-bold">
              Clinical Alignment Fit
            </span>
            <span className="text-[10px] text-[#6c6f85]">
              Rule Engine (R1–R6)
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-[#6c6f85] block">
              Recommended Style
            </span>
            <div className="text-lg font-bold text-[#4c4f69] mt-0.5">
              {activeRouting?.recommended || 'Yoga Therapy'}
            </div>
            <p className="text-xs text-[#6c6f85] mt-1 leading-relaxed">
              {activeRouting?.message ||
                'Tailored to your somatic intake for spinal traction and joint mobility.'}
            </p>
          </div>

          <div className="pt-2 border-t border-[#ccd0da] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#40a02b] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Lead: NG Gothane</span>
            </div>
            <span className="text-[#6c6f85] text-[11px]">Prem Plaza, Ashok Nagar</span>
          </div>
        </div>
      </div>

      {/* Booked Batches */}
      <div className="p-5 rounded-xl border border-[#ccd0da] bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#ccd0da]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1e66f5]" />
            <h3 className="font-bold text-base text-[#4c4f69]">
              My Booked Cohorts ({myBookings.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onExploreBatches}
            className="py-1 px-3 rounded-md bg-[#1e66f5]/10 text-[#1e66f5] hover:bg-[#1e66f5]/20 text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            + Book Another Session
          </button>
        </div>

        {myBookings.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <Clock className="w-6 h-6 text-[#9ca0b0] mx-auto" />
            <p className="text-xs text-[#6c6f85]">
              No active session bookings yet. Browse open batch times below.
            </p>
            <button
              type="button"
              onClick={onExploreBatches}
              className="py-2 px-4 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm"
            >
              Browse Available Batches
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-lg border border-[#ccd0da] bg-[#eff1f5] space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#4c4f69]">
                    {b.programme_type}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#40a02b]/15 text-[#40a02b] font-bold uppercase">
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#6c6f85]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{b.timing_label}</span>
                </div>
                <div className="text-[11px] text-[#6c6f85]">
                  Type: <span className="capitalize text-[#4c4f69] font-medium">{b.booking_type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WhatsApp Support CTA */}
      <div className="p-4 rounded-xl border border-[#40a02b]/30 bg-[#40a02b]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-[#40a02b] block">
            Questions about your alignment or session reschedule?
          </span>
          <span className="text-[#6c6f85]">
            Direct contact with founder NG Gothane at Prem Plaza, Ashok Nagar, Indore.
          </span>
        </div>
        <a
          href={`https://wa.me/91${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(
            `Hi NG Gothane, I am ${activeMember.name} (+91 ${activeMember.phone}). I would like to check in about my yoga posture adjustments.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start sm:self-auto py-2 px-4 rounded-lg bg-[#40a02b] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
        >
          <span>Chat on WhatsApp</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
