'use client';

import React, {useState} from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  UserX,
  RefreshCw,
  Clock,
  ShieldCheck,
  Info,
} from 'lucide-react';
import type {
  Batch,
  Checkin,
  HealthProfile,
  Member,
  Membership,
  RoutingResult,
} from '@/types';
import {CONDITION_LABELS} from '@/lib/routing';

interface StaffCheckinViewProps {
  batches: Batch[];
  checkins: Checkin[];
  members: Member[];
  onSnapshotUpdate: (snapshot: unknown) => void;
}

interface CheckinResponseState {
  outcome: 'APPROVED' | 'EXPIRED' | 'NOT_FOUND';
  message: string;
  member?: Member;
  membership?: Membership | null;
  routing?: RoutingResult | null;
  health_profile?: HealthProfile | null;
  expiry_date?: string | null;
  checkin?: Checkin;
}

export default function StaffCheckinView({
  batches,
  checkins,
  onSnapshotUpdate,
}: StaffCheckinViewProps) {
  const [phone, setPhone] = useState('9876543210');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    batches[0]?.id || ''
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckinResponseState | null>(null);
  const [renewingPlan, setRenewingPlan] = useState<string | null>(null);

  const runCheckin = async (targetPhone: string) => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          phone: targetPhone,
          batch_id: selectedBatchId || undefined,
        }),
      });
      const data = await res.json();
      if (data.snapshot) {
        onSnapshotUpdate(data.snapshot);
      }

      setResult({
        outcome: data.outcome || (res.ok ? 'APPROVED' : 'NOT_FOUND'),
        message: data.message,
        member: data.member,
        membership: data.membership,
        routing: data.routing,
        health_profile: data.health_profile,
        expiry_date: data.expiry_date,
        checkin: data.checkin,
      });
    } catch {
      setResult({
        outcome: 'NOT_FOUND',
        message: 'Network error during check-in lookup.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstantRenew = async (
    memberId: string,
    planType: '1month' | '3months' | '6months'
  ) => {
    setRenewingPlan(planType);
    try {
      const res = await fetch('/api/memberships', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          member_id: memberId,
          plan_type: planType,
        }),
      });
      const data = await res.json();
      if (data.snapshot) {
        onSnapshotUpdate(data.snapshot);
      }
      if (res.ok && result?.member) {
        await runCheckin(result.member.phone);
      }
    } finally {
      setRenewingPlan(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[#CBD8CE] bg-white p-6 shadow-sm">
        <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#4E675E]">
          LEVEL 1 CORE · FRONT DESK &amp; INSTRUCTOR CHECK-IN (RULE B4)
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#0F241D] mt-1">
          10-Digit Phone Lookup &amp; Expiry Gatekeeper
        </h1>
        <p className="text-xs sm:text-sm text-[#4E675E] mt-1 max-w-2xl">
          Verify active membership expiry dates (Rule B4) and surface clinical
          posture modifications for instructors before class begins.
        </p>

        <div className="mt-5 pt-4 border-t border-[#CBD8CE] flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#4E675E]">
            QUICK CHECK-IN SCENARIOS:
          </span>
          <button
            type="button"
            onClick={() => {
              setPhone('9826033333');
              runCheckin('9826033333');
            }}
            className="px-3 py-1.5 rounded-lg border border-[#15803D] bg-[#F0FDF4] text-[#15803D] font-mono text-xs hover:bg-[#15803D] hover:text-white transition-colors cursor-pointer"
          >
            ✓ Amit Patidar (9826033333 · Active Plan)
          </button>
          <button
            type="button"
            onClick={() => {
              setPhone('9876543210');
              runCheckin('9876543210');
            }}
            className="px-3 py-1.5 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C] font-mono text-xs hover:bg-[#B91C1C] hover:text-white transition-colors cursor-pointer"
          >
            ✕ Anjali Verma (9876543210 · Expired Plan — Rule B4)
          </button>
          <button
            type="button"
            onClick={() => {
              setPhone('9826011111');
              runCheckin('9826011111');
            }}
            className="px-3 py-1.5 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] text-[#0F241D] font-mono text-xs hover:bg-[#1B4332] hover:text-white transition-colors cursor-pointer"
          >
            ✓ Rahul Mehra (9826011111 · Reactivate 11d Inactive)
          </button>
          <button
            type="button"
            onClick={() => {
              setPhone('9999988888');
              runCheckin('9999988888');
            }}
            className="px-3 py-1.5 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] text-[#4E675E] font-mono text-xs hover:bg-[#1B4332] hover:text-white transition-colors cursor-pointer"
          >
            ? Unregistered Visitor (9999988888)
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runCheckin(phone);
            }}
            className="rounded-xl border border-[#CBD8CE] bg-white p-6 space-y-4 shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label className="block font-mono text-xs uppercase tracking-wider text-[#0F241D] mb-1.5">
                  Member 10-Digit Mobile Number
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
                    className="w-full px-3.5 py-2.5 rounded-r-lg border border-[#CBD8CE] bg-[#F4F7F4] font-mono text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="block font-mono text-xs uppercase tracking-wider text-[#0F241D] mb-1.5">
                  Target Batch Session
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] font-mono text-xs text-[#0F241D]"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.programme_type} · {b.timing_label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-lg bg-[#1B4332] text-white hover:bg-[#0F241D] font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>
                {loading
                  ? 'Verifying Membership & Safety Profile...'
                  : 'Verify & Record Attendance Check-In'}
              </span>
            </button>
          </form>

          {result && (
            <div
              className={`rounded-xl border-2 p-6 space-y-4 ${
                result.outcome === 'APPROVED'
                  ? 'border-[#15803D] bg-[#F0FDF4]'
                  : result.outcome === 'EXPIRED'
                  ? 'border-[#B91C1C] bg-[#FEF2F2]'
                  : 'border-[#CBD8CE] bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {result.outcome === 'APPROVED' ? (
                  <CheckCircle2 className="w-7 h-7 text-[#15803D] shrink-0 mt-0.5" />
                ) : result.outcome === 'EXPIRED' ? (
                  <XCircle className="w-7 h-7 text-[#B91C1C] shrink-0 mt-0.5" />
                ) : (
                  <UserX className="w-7 h-7 text-[#4E675E] shrink-0 mt-0.5" />
                )}

                <div className="flex-1">
                  <div className="font-mono text-xs uppercase tracking-widest font-semibold">
                    {result.outcome === 'APPROVED'
                      ? 'CHECK-IN APPROVED · ATTENDANCE LOGGED'
                      : result.outcome === 'EXPIRED'
                      ? 'RULE B4 DENIAL · MEMBERSHIP EXPIRED'
                      : 'PHONE LOOKUP · UNREGISTERED VISITOR'}
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-[#0F241D] mt-0.5">
                    {result.member ? result.member.name : 'Member Not Found'}
                  </h3>
                  <p className="text-xs font-medium mt-1">{result.message}</p>
                </div>
              </div>

              {result.member && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#CBD8CE] text-xs">
                  <div className="p-3 rounded-lg bg-white border border-[#CBD8CE]">
                    <div className="font-mono text-[10px] uppercase text-[#4E675E]">
                      MEMBERSHIP STATUS
                    </div>
                    <div className="font-mono font-semibold text-sm mt-0.5 tabular-nums text-[#0F241D]">
                      {result.membership
                        ? `${result.membership.plan_label} (${result.membership.status.toUpperCase()})`
                        : 'No Membership Found'}
                    </div>
                    <div className="font-mono text-[11px] text-[#4E675E] mt-0.5 tabular-nums">
                      Expiry Date:{' '}
                      {result.expiry_date ||
                        result.membership?.expiry_date ||
                        'N/A'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-[#CBD8CE]">
                    <div className="font-mono text-[10px] uppercase text-[#4E675E]">
                      INSTRUCTOR SAFETY BRIEF
                    </div>
                    <div className="font-semibold text-sm mt-0.5 text-[#0F241D]">
                      Assigned: {result.routing?.recommended || 'Traditional'}
                    </div>
                    <div className="text-[11px] text-[#4E675E] mt-0.5">
                      Conditions:{' '}
                      {result.health_profile?.conditions
                        .map((c) => CONDITION_LABELS[c])
                        .join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              )}

              {result.outcome === 'EXPIRED' && result.member && (
                <div className="pt-4 border-t border-[#B91C1C]/25 space-y-3">
                  <div className="font-mono text-xs uppercase tracking-wider text-[#B91C1C] font-semibold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>
                      RENEW NOW TO UNLOCK CHECK-IN (INSTANT FRONT-DESK RENEWAL):
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        {type: '1month', label: 'Renew 1 Month · ₹1,500'},
                        {type: '3months', label: 'Renew 3 Months · ₹4,000'},
                        {type: '6months', label: 'Renew 6 Months · ₹7,500'},
                      ] as const
                    ).map((pl) => (
                      <button
                        key={pl.type}
                        type="button"
                        disabled={renewingPlan === pl.type}
                        onClick={() =>
                          handleInstantRenew(result.member!.id, pl.type)
                        }
                        className="py-2.5 px-3 rounded-lg bg-[#B91C1C] text-white hover:bg-[#991b1b] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                      >
                        {renewingPlan === pl.type ? 'Renewing...' : pl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[#4E675E]">
            <Info className="w-4 h-4 shrink-0 text-[#1B4332]" />
            <span>
              This is not medical advice. Staff condition flags are displayed
              strictly for safe studio posture adjustments.
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[#CBD8CE] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#CBD8CE] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1B4332]" />
              <h2 className="font-mono text-xs uppercase tracking-wider font-semibold text-[#0F241D]">
                RECENT STUDIO ATTENDANCE LOG ({checkins.length})
              </h2>
            </div>
            <span className="font-mono text-[11px] text-[#4E675E]">
              PREM PLAZA DESK
            </span>
          </div>

          <div className="divide-y divide-[#CBD8CE] max-h-[420px] overflow-y-auto">
            {checkins.map((chk) => (
              <div
                key={chk.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-[#0F241D]">
                    {chk.member_name}
                  </div>
                  <div className="font-mono text-[11px] text-[#4E675E]">
                    +91 {chk.member_phone} · {chk.programme_type}
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-[#4E675E] tabular-nums flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{chk.checkin_time.replace('T', ' ').slice(0, 16)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
