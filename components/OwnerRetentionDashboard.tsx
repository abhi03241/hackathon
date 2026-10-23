'use client';

import React, {useState} from 'react';
import {
  MessageCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  ExternalLink,
  Copy,
  Check,
  Info,
  Plus,
} from 'lucide-react';
import type {
  ConversionStats,
  ProgrammeType,
  RetentionRiskItem,
} from '@/types';
import {ALL_PROGRAMMES, CONDITION_LABELS} from '@/lib/routing';
import {buildInactivityWhatsApp, buildRenewalWhatsApp} from '@/lib/whatsapp';

interface OwnerRetentionDashboardProps {
  retentionTriage: RetentionRiskItem[];
  conversionStats: ConversionStats;
  onSnapshotUpdate?: (snapshot: unknown) => void;
}

export default function OwnerRetentionDashboard({
  retentionTriage,
  conversionStats,
  onSnapshotUpdate,
}: OwnerRetentionDashboardProps) {
  const [filterPriority, setFilterPriority] = useState<
    'ALL' | 'EXPIRING_SOON' | 'INACTIVE_ACTIVE_MEMBER' | 'UNCONVERTED_TRIAL'
  >('ALL');
  const [useCrisisTemplates, setUseCrisisTemplates] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Studio Owner Batch Creation Drawer State
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
  const [newProgType, setNewProgType] =
    useState<ProgrammeType>('Yoga Therapy');
  const [newProgName, setNewProgName] = useState(
    'Mid-Morning Lumbar & Wall-Rope Cohort'
  );
  const [newSlot, setNewSlot] = useState<'morning' | 'evening'>('morning');
  const [newTiming, setNewTiming] = useState('10:00 AM – 11:00 AM');
  const [newCapacity, setNewCapacity] = useState('8');
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchCreatedMsg, setBatchCreatedMsg] = useState<string | null>(null);

  const filteredItems = retentionTriage.filter((item) => {
    if (filterPriority === 'ALL') return true;
    return item.risk_category === filterPriority;
  });

  const getDynamicWhatsApp = (item: RetentionRiskItem) => {
    if (
      item.risk_category === 'EXPIRING_SOON' &&
      item.plan_type &&
      item.expiry_date
    ) {
      return buildRenewalWhatsApp({
        name: item.name,
        phone: item.phone,
        expiryDate: item.expiry_date,
        planType: item.plan_type,
        useCrisisTemplate: useCrisisTemplates,
      });
    }
    if (item.risk_category === 'INACTIVE_ACTIVE_MEMBER') {
      return buildInactivityWhatsApp({
        name: item.name,
        phone: item.phone,
        daysInactive: item.days_inactive === 999 ? 14 : item.days_inactive,
        useCrisisTemplate: useCrisisTemplates,
      });
    }
    return {
      url: item.whatsapp_url,
      message: item.whatsapp_message,
    };
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBatch(true);
    setBatchCreatedMsg(null);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          programme_type: newProgType,
          programme_name: newProgName,
          time_slot: newSlot,
          timing_label: newTiming,
          capacity: Number(newCapacity),
          instructor: 'NG Gothane',
          is_micro_group: Number(newCapacity) <= 8,
        }),
      });
      const data = await res.json();
      if (data.snapshot && onSnapshotUpdate) {
        onSnapshotUpdate(data.snapshot);
      }
      if (res.ok) {
        setBatchCreatedMsg(data.message);
        setShowNewBatchForm(false);
      }
    } finally {
      setCreatingBatch(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-xl border border-[#CBD8CE] bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#4E675E]">
              LEVEL 2 &amp; CRISIS ADDENDUM · OWNER RETENTION TRIAGE &amp;
              ANALYTICS
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#0F241D] mt-1">
              Multi-Signal Retention Registry &amp; Trial Conversion
            </h1>
            <p className="text-xs sm:text-sm text-[#4E675E] mt-1 max-w-3xl">
              Surfaces memberships expiring within 7 days, active members
              inactive for 7+ days, and unconverted free trials—paired with
              1-click WhatsApp deep-links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNewBatchForm((prev) => !prev)}
              className="px-4 py-2.5 rounded-lg border border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Studio Batch</span>
            </button>

            <div className="rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] p-2.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#4E675E]">
                WHATSAPP COPY MODE:
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setUseCrisisTemplates(true)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] uppercase cursor-pointer ${
                    useCrisisTemplates
                      ? 'bg-[#1B4332] text-white font-semibold'
                      : 'bg-white text-[#0F241D] border border-[#CBD8CE]'
                  }`}
                >
                  Crisis Addendum
                </button>
                <button
                  type="button"
                  onClick={() => setUseCrisisTemplates(false)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] uppercase cursor-pointer ${
                    !useCrisisTemplates
                      ? 'bg-[#1B4332] text-white font-semibold'
                      : 'bg-white text-[#0F241D] border border-[#CBD8CE]'
                  }`}
                >
                  Standard SRS
                </button>
              </div>
            </div>
          </div>
        </div>

        {batchCreatedMsg && (
          <div className="mt-4 p-3 rounded-lg border border-[#15803D] bg-[#F0FDF4] text-xs font-mono text-[#15803D]">
            ✓ {batchCreatedMsg}
          </div>
        )}

        {showNewBatchForm && (
          <form
            onSubmit={handleCreateBatch}
            className="mt-5 pt-5 border-t border-[#CBD8CE] grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#4E675E] mb-1">
                Programme Type
              </label>
              <select
                value={newProgType}
                onChange={(e) =>
                  setNewProgType(e.target.value as ProgrammeType)
                }
                className="w-full px-3 py-2 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] text-xs font-mono"
              >
                {ALL_PROGRAMMES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#4E675E] mb-1">
                Cohort Title
              </label>
              <input
                type="text"
                required
                value={newProgName}
                onChange={(e) => setNewProgName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#4E675E] mb-1">
                Slot &amp; Timing
              </label>
              <div className="flex gap-1.5">
                <select
                  value={newSlot}
                  onChange={(e) =>
                    setNewSlot(e.target.value as 'morning' | 'evening')
                  }
                  className="px-2 py-2 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] text-xs font-mono"
                >
                  <option value="morning">AM</option>
                  <option value="evening">PM</option>
                </select>
                <input
                  type="text"
                  required
                  value={newTiming}
                  onChange={(e) => setNewTiming(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#4E675E] mb-1">
                Capacity
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={creatingBatch}
              className="py-2 px-4 rounded-lg bg-[#1B4332] text-white font-mono text-xs uppercase font-semibold cursor-pointer"
            >
              {creatingBatch ? 'Saving...' : 'Publish Cohort'}
            </button>
          </form>
        )}
      </section>

      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#CBD8CE] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#4E675E]">
            <span>TRIAL-TO-PAID CONVERSION</span>
            <TrendingUp className="w-4 h-4 text-[#15803D]" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-[#0F241D] tabular-nums">
            {conversionStats.conversion_rate}%
          </div>
          <div className="mt-1 text-xs text-[#4E675E] font-mono tabular-nums">
            {conversionStats.converted_members} converted of{' '}
            {conversionStats.total_trials} trials
          </div>
        </div>

        <div className="rounded-xl border border-[#CBD8CE] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#B91C1C]">
            <span>PRIORITY 1 · EXPIRING ≤ 7D</span>
            <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-[#B91C1C] tabular-nums">
            {conversionStats.expiring_soon_count}
          </div>
          <div className="mt-1 text-xs text-[#4E675E]">
            10% capped loyalty renewal eligible
          </div>
        </div>

        <div className="rounded-xl border border-[#CBD8CE] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#B45309]">
            <span>PRIORITY 2 · INACTIVE ≥ 7D</span>
            <Clock className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-[#B45309] tabular-nums">
            {conversionStats.inactive_7d_count}
          </div>
          <div className="mt-1 text-xs text-[#4E675E]">
            15-min instructor posture review invite
          </div>
        </div>

        <div className="rounded-xl border border-[#CBD8CE] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#1B4332]">
            <span>PRIORITY 3 · UNCONVERTED TRIALS</span>
            <Users className="w-4 h-4 text-[#1B4332]" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-[#0F241D] tabular-nums">
            {conversionStats.unconverted_trials}
          </div>
          <div className="mt-1 text-xs text-[#4E675E]">
            Micro-group (max 6) clinical follow-up
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CBD8CE] pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              {
                id: 'ALL',
                label: `All At-Risk Members (${retentionTriage.length})`,
              },
              {
                id: 'EXPIRING_SOON',
                label: `Priority 1: Expiring ≤ 7 Days (${conversionStats.expiring_soon_count})`,
              },
              {
                id: 'INACTIVE_ACTIVE_MEMBER',
                label: `Priority 2: Inactive ≥ 7 Days (${conversionStats.inactive_7d_count})`,
              },
              {
                id: 'UNCONVERTED_TRIAL',
                label: `Priority 3: Unconverted Trials (${conversionStats.unconverted_trials})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterPriority(tab.id)}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                filterPriority === tab.id
                  ? 'bg-[#1B4332] text-white font-semibold'
                  : 'bg-white border border-[#CBD8CE] text-[#0F241D] hover:bg-[#E6EFE9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Retention Table */}
      <section className="rounded-xl border border-[#CBD8CE] bg-white overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#CBD8CE] bg-[#E6EFE9]/70 font-mono text-[11px] uppercase tracking-wider text-[#0F241D]">
              <th className="py-3.5 px-4">Priority &amp; Signal</th>
              <th className="py-3.5 px-4">Practitioner &amp; Phone</th>
              <th className="py-3.5 px-4">Clinical Profile &amp; Match</th>
              <th className="py-3.5 px-4">Plan &amp; Telemetry</th>
              <th className="py-3.5 px-4">Pre-Filled WhatsApp Message</th>
              <th className="py-3.5 px-4 text-right">1-Click Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CBD8CE] text-xs">
            {filteredItems.map((item) => {
              const wa = getDynamicWhatsApp(item);

              return (
                <tr
                  key={item.member_id}
                  className="hover:bg-[#F4F7F4] transition-colors align-top"
                >
                  <td className="py-4 px-4 font-mono whitespace-nowrap">
                    <div
                      className={`font-semibold ${
                        item.triage_priority === 1
                          ? 'text-[#B91C1C]'
                          : item.triage_priority === 2
                          ? 'text-[#B45309]'
                          : 'text-[#1B4332]'
                      }`}
                    >
                      P{item.triage_priority} ·{' '}
                      {item.risk_category === 'EXPIRING_SOON'
                        ? 'EXPIRING SOON'
                        : item.risk_category === 'INACTIVE_ACTIVE_MEMBER'
                        ? 'INACTIVE ACTIVE'
                        : 'UNCONVERTED TRIAL'}
                    </div>
                    <div className="text-[11px] text-[#4E675E] mt-0.5">
                      {item.risk_category === 'EXPIRING_SOON'
                        ? `Expires in ${item.days_to_expiry} days`
                        : item.risk_category === 'INACTIVE_ACTIVE_MEMBER'
                        ? `No check-in for ${item.days_inactive} days`
                        : `Trial on ${item.trial_date}`}
                    </div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-semibold text-sm text-[#0F241D]">
                      {item.name}
                    </div>
                    <div className="font-mono text-xs text-[#4E675E] tabular-nums">
                      +91 {item.phone}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-medium text-[#0F241D]">
                      Programme: <strong>{item.recommended_programme}</strong>
                    </div>
                    <div className="text-[11px] text-[#4E675E] mt-0.5">
                      Conditions:{' '}
                      {item.conditions
                        .map((c) => CONDITION_LABELS[c])
                        .join(', ')}
                    </div>
                  </td>

                  <td className="py-4 px-4 font-mono tabular-nums whitespace-nowrap">
                    {item.plan_label ? (
                      <>
                        <div className="text-[#0F241D] font-semibold">
                          {item.plan_label}
                        </div>
                        <div className="text-[11px] text-[#4E675E]">
                          Expiry: {item.expiry_date}
                        </div>
                        {item.capped_renewal_price && (
                          <div className="text-[11px] text-[#15803D]">
                            10% Lock: ₹
                            {item.capped_renewal_price.toLocaleString('en-IN')}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-[#4E675E]">
                        Free Trial Only (Unconverted)
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 max-w-xs">
                    <div className="p-2.5 rounded-lg bg-[#F4F7F4] border border-[#CBD8CE] text-[11px] text-[#0F241D]/90 leading-relaxed">
                      {wa.message}
                    </div>
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end gap-1.5">
                      <a
                        href={wa.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B4332] text-white hover:bg-[#0F241D] font-mono text-[11px] uppercase tracking-wider font-semibold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyMessage(item.member_id, wa.message)
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-[#4E675E] hover:text-[#0F241D] cursor-pointer"
                      >
                        {copiedId === item.member_id ? (
                          <>
                            <Check className="w-3 h-3 text-[#15803D]" />
                            <span className="text-[#15803D]">Copied Text</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="flex items-center gap-2 text-xs text-[#4E675E]">
        <Info className="w-4 h-4 shrink-0 text-[#1B4332]" />
        <span>
          <strong>Medical Disclaimer:</strong> This is not medical advice.
          Consult a qualified health professional for medical concerns.
        </span>
      </div>
    </div>
  );
}
