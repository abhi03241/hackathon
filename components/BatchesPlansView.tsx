'use client';

import React, {useState} from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import type {
  Batch,
  Booking,
  Member,
  Membership,
  PlanType,
  ProgrammeType,
  RoutingResult,
  WaitlistEntry,
} from '@/types';
import {ALL_PROGRAMMES} from '@/lib/routing';

interface BatchesPlansViewProps {
  batches: Batch[];
  bookings: Booking[];
  waitlist: WaitlistEntry[];
  members: Member[];
  activeMember: Member | null;
  activeRouting: RoutingResult | null;
  activeMembership: Membership | null;
  hasUsedTrial: boolean;
  initialProgrammeFilter: ProgrammeType | 'ALL';
  onSnapshotUpdate: (snapshot: unknown) => void;
  onNavigateToIntake: () => void;
}

export default function BatchesPlansView({
  batches,
  bookings,
  waitlist,
  members,
  activeMember,
  activeRouting,
  activeMembership,
  hasUsedTrial,
  initialProgrammeFilter,
  onSnapshotUpdate,
  onNavigateToIntake,
}: BatchesPlansViewProps) {
  const [slotFilter, setSlotFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const [programmeFilter, setProgrammeFilter] = useState<ProgrammeType | 'ALL'>(
    initialProgrammeFilter
  );
  const [bookingType, setBookingType] = useState<'trial' | 'member'>(
    hasUsedTrial ? 'member' : 'trial'
  );
  const [bannerAlert, setBannerAlert] = useState<{
    type: 'success' | 'error' | 'waitlist';
    message: string;
    position?: number;
  } | null>(null);
  const [busyBatchId, setBusyBatchId] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const filteredBatches = batches.filter((b) => {
    if (slotFilter !== 'all' && b.time_slot !== slotFilter) return false;
    if (programmeFilter !== 'ALL' && b.programme_type !== programmeFilter) return false;
    return true;
  });

  const handleBookBatch = async (batch: Batch) => {
    if (!activeMember) {
      setBannerAlert({
        type: 'error',
        message: 'Please complete New Member Onboarding or sign in first to book a session.',
      });
      return;
    }

    if (activeRouting && activeRouting.blocked.includes(batch.programme_type)) {
      setBannerAlert({
        type: 'error',
        message: `Safety Restriction: ${
          activeRouting.blockReasons[batch.programme_type] ||
          'This style is restricted based on your health intake.'
        }`,
      });
      return;
    }

    setBusyBatchId(batch.id);
    setBannerAlert(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          member_id: activeMember.id,
          batch_id: batch.id,
          booking_type: bookingType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.waitlist_available) {
          setBannerAlert({
            type: 'waitlist',
            message: `${data.message} Would you like to join the waitlist queue?`,
          });
          return;
        }
        setBannerAlert({
          type: 'error',
          message: data.message || 'Unable to complete booking.',
        });
        return;
      }

      setBannerAlert({
        type: 'success',
        message: `Spot booked! You are confirmed for ${batch.programme_type} (${batch.timing_label}).`,
      });
      if (data.snapshot) {
        onSnapshotUpdate(data.snapshot);
      }
    } catch {
      setBannerAlert({type: 'error', message: 'Network error during booking.'});
    } finally {
      setBusyBatchId(null);
    }
  };

  const handleJoinWaitlist = async (batchId: string) => {
    if (!activeMember) return;
    setBusyBatchId(batchId);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          member_id: activeMember.id,
          batch_id: batchId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBannerAlert({
          type: 'success',
          message: `Joined waitlist successfully! Position #${data.waitlist_entry.position}. You will be auto-promoted upon cancellation.`,
        });
        if (data.snapshot) onSnapshotUpdate(data.snapshot);
      } else {
        setBannerAlert({type: 'error', message: data.message || 'Waitlist entry failed.'});
      }
    } finally {
      setBusyBatchId(null);
    }
  };

  const handlePurchaseMembership = async (plan: PlanType) => {
    if (!activeMember) {
      setBannerAlert({
        type: 'error',
        message: 'Please complete onboarding or sign in to purchase a membership plan.',
      });
      return;
    }

    setBusyPlan(plan);
    setBannerAlert(null);
    try {
      const res = await fetch('/api/memberships', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          member_id: activeMember.id,
          plan_type: plan,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBannerAlert({
          type: 'success',
          message: `Membership activated! ${data.membership.plan_label} valid until ${data.membership.expiry_date}.`,
        });
        if (data.snapshot) onSnapshotUpdate(data.snapshot);
      } else {
        setBannerAlert({type: 'error', message: data.message || 'Plan purchase failed.'});
      }
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-8 space-y-8 text-[#4c4f69] font-mono">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#1e66f5] font-bold">
            Real-Time Capacity &amp; Scheduling
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11111b] mt-1">
            Studio Batches &amp; Cohorts
          </h1>
          <p className="text-xs text-[#6c6f85] mt-0.5">
            Prem Plaza, Ashok Nagar, Indore. Real-time seat availability with strict concurrency limits.
          </p>
        </div>

        {activeMember && (
          <div className="p-3 rounded-lg border border-[#ccd0da] bg-white text-xs">
            <span className="text-[#6c6f85] block text-[10px] uppercase font-semibold">
              Current Member:
            </span>
            <span className="font-bold text-[#4c4f69]">{activeMember.name}</span>
            <span className="text-[#1e66f5] ml-2">
              (Fit: {activeRouting?.recommended || 'Yoga Therapy'})
            </span>
          </div>
        )}
      </div>

      {/* Banner Alert */}
      {bannerAlert && (
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 text-xs ${
            bannerAlert.type === 'success'
              ? 'border-[#40a02b] bg-[#40a02b]/10 text-[#40a02b]'
              : bannerAlert.type === 'waitlist'
              ? 'border-[#df8e1d] bg-[#df8e1d]/10 text-[#df8e1d]'
              : 'border-[#d20f39] bg-[#d20f39]/10 text-[#d20f39]'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerAlert.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {bannerAlert.type === 'waitlist' && <Clock className="w-4 h-4 shrink-0" />}
            {bannerAlert.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{bannerAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerAlert(null)}
            className="text-xs uppercase font-bold underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl border border-[#ccd0da] bg-white">
        {/* Slot */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-[#6c6f85]">Slot:</span>
          <div className="flex rounded-md bg-[#eff1f5] p-1 border border-[#ccd0da]">
            {(['all', 'morning', 'evening'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlotFilter(s)}
                className={`py-1 px-2.5 rounded text-xs capitalize transition-all cursor-pointer ${
                  slotFilter === s
                    ? 'bg-white text-[#1e66f5] font-bold shadow-sm'
                    : 'text-[#6c6f85] hover:text-[#4c4f69]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Programme Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-[#6c6f85]">Style:</span>
          <select
            value={programmeFilter}
            onChange={(e) => setProgrammeFilter(e.target.value as ProgrammeType | 'ALL')}
            className="py-1 px-2.5 rounded-md bg-[#eff1f5] border border-[#ccd0da] text-xs text-[#4c4f69] focus:outline-none focus:border-[#1e66f5]"
          >
            <option value="ALL">All Programmes</option>
            {ALL_PROGRAMMES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Pass Choice */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-[#6c6f85]">Pass:</span>
          <div className="flex rounded-md bg-[#eff1f5] p-1 border border-[#ccd0da]">
            <button
              type="button"
              disabled={hasUsedTrial}
              onClick={() => setBookingType('trial')}
              className={`py-1 px-2.5 rounded text-xs transition-all cursor-pointer ${
                bookingType === 'trial'
                  ? 'bg-white text-[#40a02b] font-bold shadow-sm'
                  : hasUsedTrial
                  ? 'text-[#9ca0b0] cursor-not-allowed'
                  : 'text-[#6c6f85] hover:text-[#4c4f69]'
              }`}
            >
              Free Trial {hasUsedTrial && '(Used)'}
            </button>
            <button
              type="button"
              onClick={() => setBookingType('member')}
              className={`py-1 px-2.5 rounded text-xs transition-all cursor-pointer ${
                bookingType === 'member'
                  ? 'bg-white text-[#1e66f5] font-bold shadow-sm'
                  : 'text-[#6c6f85] hover:text-[#4c4f69]'
              }`}
            >
              Member Pass
            </button>
          </div>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBatches.map((batch) => {
          const remaining = batch.capacity - batch.booked_count;
          const isFull = remaining <= 0;
          const isBlocked =
            activeRouting && activeRouting.blocked.includes(batch.programme_type);
          const isRecommended =
            activeRouting && activeRouting.recommended === batch.programme_type;

          return (
            <div
              key={batch.id}
              className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 shadow-sm bg-white transition-all ${
                isRecommended
                  ? 'border-2 border-[#1e66f5]'
                  : 'border-[#ccd0da]'
              } ${isBlocked ? 'opacity-60' : ''}`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#1e66f5]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{batch.timing_label}</span>
                  </div>
                  {isRecommended && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e66f5]/10 text-[#1e66f5] font-bold uppercase">
                      Recommended Fit
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#4c4f69]">
                    {batch.programme_name}
                  </h3>
                  <div className="text-xs text-[#6c6f85] mt-0.5">
                    Instructor: <strong className="text-[#4c4f69]">{batch.instructor}</strong>
                  </div>
                </div>

                {isBlocked && (
                  <div className="p-2 rounded border border-[#d20f39]/30 bg-[#d20f39]/10 text-[#d20f39] text-[11px] flex items-start gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      {activeRouting.blockReasons[batch.programme_type] ||
                        'Restricted for your health profile'}
                    </span>
                  </div>
                )}
              </div>

              {/* Seats Remaining & Action */}
              <div className="space-y-2.5 pt-3 border-t border-[#ccd0da]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6c6f85]">Capacity:</span>
                  <span
                    className={`font-bold ${
                      isFull
                        ? 'text-[#d20f39]'
                        : remaining <= 2
                        ? 'text-[#df8e1d]'
                        : 'text-[#40a02b]'
                    }`}
                  >
                    {isFull ? 'BATCH FULL' : `${remaining} of ${batch.capacity} spots open`}
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-[#eff1f5] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isFull
                        ? 'bg-[#d20f39]'
                        : remaining <= 2
                        ? 'bg-[#df8e1d]'
                        : 'bg-[#40a02b]'
                    }`}
                    style={{
                      width: `${Math.min(100, (batch.booked_count / batch.capacity) * 100)}%`,
                    }}
                  />
                </div>

                <div>
                  {isBlocked ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 rounded-lg border border-[#d20f39]/20 bg-[#eff1f5] text-[#d20f39] text-xs uppercase font-bold cursor-not-allowed"
                    >
                      Safety Restricted
                    </button>
                  ) : isFull ? (
                    <button
                      type="button"
                      disabled={busyBatchId === batch.id}
                      onClick={() => handleJoinWaitlist(batch.id)}
                      className="w-full py-2 rounded-lg border border-[#df8e1d] bg-[#df8e1d]/10 hover:bg-[#df8e1d]/20 text-[#df8e1d] text-xs uppercase font-bold transition-colors cursor-pointer"
                    >
                      {busyBatchId === batch.id ? 'Joining...' : 'Join Waitlist Queue'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyBatchId === batch.id}
                      onClick={() => handleBookBatch(batch)}
                      className="w-full py-2 rounded-lg bg-[#1e66f5] hover:bg-[#1e66f5]/90 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {busyBatchId === batch.id
                        ? 'Booking...'
                        : bookingType === 'trial'
                        ? 'Book Free Trial Class'
                        : 'Reserve Member Spot'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Membership Plans Section */}
      <section className="pt-6 border-t border-[#ccd0da] space-y-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#8839ef] font-bold">
            Membership Passes (Rule B3)
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#11111b] mt-0.5">
            Studio Membership Options
          </h2>
          <p className="text-xs text-[#6c6f85]">
            Unlimited access to your recommended studio batches. Safe small cohorts with tactile corrections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1 Month */}
          <div className="p-5 rounded-xl border border-[#ccd0da] bg-white shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-[#1e66f5] uppercase">1 Month Plan</span>
              <div className="text-2xl font-bold text-[#4c4f69] mt-0.5">₹1,500</div>
              <p className="text-xs text-[#6c6f85] mt-1.5">
                30 days continuous access. Ideal for foundational alignment.
              </p>
            </div>
            <button
              type="button"
              disabled={busyPlan === '1month'}
              onClick={() => handlePurchaseMembership('1month')}
              className="w-full py-2 rounded-lg border border-[#1e66f5] bg-[#1e66f5]/10 hover:bg-[#1e66f5]/20 text-[#1e66f5] text-xs uppercase font-bold transition-colors cursor-pointer"
            >
              {busyPlan === '1month' ? 'Activating...' : 'Select 1 Month Pass'}
            </button>
          </div>

          {/* 3 Months */}
          <div className="p-5 rounded-xl border-2 border-[#8839ef] bg-white shadow-sm flex flex-col justify-between space-y-4 relative">
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-[#8839ef] text-white text-[9px] font-bold uppercase">
              Popular
            </div>
            <div>
              <span className="text-xs font-bold text-[#8839ef] uppercase">3 Months Plan</span>
              <div className="text-2xl font-bold text-[#4c4f69] mt-0.5">₹4,000</div>
              <p className="text-xs text-[#6c6f85] mt-1.5">
                90 days structured rehabilitation (Save ₹500). Full posture realignment.
              </p>
            </div>
            <button
              type="button"
              disabled={busyPlan === '3months'}
              onClick={() => handlePurchaseMembership('3months')}
              className="w-full py-2 rounded-lg bg-[#8839ef] hover:bg-[#8839ef]/90 text-white text-xs uppercase font-bold transition-colors cursor-pointer shadow-sm"
            >
              {busyPlan === '3months' ? 'Activating...' : 'Select 3 Months Pass'}
            </button>
          </div>

          {/* 6 Months */}
          <div className="p-5 rounded-xl border border-[#ccd0da] bg-white shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-[#df8e1d] uppercase">6 Months Plan</span>
              <div className="text-2xl font-bold text-[#4c4f69] mt-0.5">₹7,500</div>
              <p className="text-xs text-[#6c6f85] mt-1.5">
                180 days complete somatic transformation (Save ₹1,500).
              </p>
            </div>
            <button
              type="button"
              disabled={busyPlan === '6months'}
              onClick={() => handlePurchaseMembership('6months')}
              className="w-full py-2 rounded-lg border border-[#df8e1d] bg-[#df8e1d]/10 hover:bg-[#df8e1d]/20 text-[#df8e1d] text-xs uppercase font-bold transition-colors cursor-pointer"
            >
              {busyPlan === '6months' ? 'Activating...' : 'Select 6 Months Pass'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
