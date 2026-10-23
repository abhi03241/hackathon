'use client';

import React, {useEffect, useState, useCallback} from 'react';
import {
  Sparkles,
  User,
  LogOut,
  Calendar,
  HeartPulse,
  Clock,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type {
  Batch,
  Booking,
  Checkin,
  Condition,
  ConversionStats,
  Goal,
  HealthProfile,
  Member,
  Membership,
  PlanType,
  Programme,
  ProgrammeType,
  RetentionRiskItem,
  RoutingResult,
  WaitlistEntry,
} from '@/types';
import {routeMember} from '@/lib/routing';
import StudioLandingView from '@/components/StudioLandingView';
import ClientOnboardingWizard from '@/components/ClientOnboardingWizard';
import BatchesPlansView from '@/components/BatchesPlansView';
import ClientMemberPortal from '@/components/ClientMemberPortal';
import ClientAuthModal, {type AuthenticatedClient} from '@/components/ClientAuthModal';

interface StudioSnapshot {
  programmes: Programme[];
  members: Member[];
  health_profiles: HealthProfile[];
  batches: Batch[];
  memberships: Membership[];
  bookings: Booking[];
  checkins: Checkin[];
  waitlist: WaitlistEntry[];
  retention_triage: RetentionRiskItem[];
  conversion_stats: ConversionStats;
}

export type ClientTab = 'landing' | 'intake' | 'batches' | 'portal';

export default function StudioAppShell({
  initialTab = 'landing',
}: {
  initialTab?: ClientTab;
}) {
  const [snapshot, setSnapshot] = useState<StudioSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<ClientTab>(initialTab);
  const [programmeFilter, setProgrammeFilter] = useState<ProgrammeType | 'ALL'>('ALL');

  const [currentClient, setCurrentClient] = useState<AuthenticatedClient | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [activeRouting, setActiveRouting] = useState<RoutingResult | null>(null);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean>(false);

  // Sync member session ONLY if phone is provided or logged-in client exists
  const syncMemberSession = useCallback(
    (snap: StudioSnapshot, targetPhone?: string) => {
      if (!targetPhone) return;

      const foundMember = snap.members.find((m) => m.phone === targetPhone);
      if (!foundMember) return;

      const hp = snap.health_profiles.find((h) => h.member_id === foundMember.id);
      const conds: Condition[] = hp?.conditions || ['none'];
      const goal: Goal = hp?.main_goal || 'fitness';
      const routing = routeMember({
        conditions: conds,
        goal,
        experienceLevel: foundMember.experience_level,
      });

      const latestMs =
        snap.memberships
          .filter((ms) => ms.member_id === foundMember.id)
          .sort((a, b) => b.expiry_date.localeCompare(a.expiry_date))[0] || null;

      const trialUsed = snap.bookings.some(
        (b) =>
          (b.member_id === foundMember.id || b.member_phone === foundMember.phone) &&
          b.booking_type === 'trial' &&
          b.status !== 'cancelled'
      );

      setActiveMember(foundMember);
      setActiveRouting(routing);
      setActiveMembership(latestMs);
      setHasUsedTrial(trialUsed);
    },
    []
  );

  // Initial load: check localStorage for saved member, but DO NOT auto-login to any default member
  useEffect(() => {
    let savedPhone: string | undefined = undefined;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ngyoga_client_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthenticatedClient;
          setCurrentClient(parsed);
          savedPhone = parsed.phone;
        } catch {
          localStorage.removeItem('ngyoga_client_user');
        }
      }
    }

    fetch('/api/studio')
      .then((res) => res.json())
      .then((data: StudioSnapshot) => {
        setSnapshot(data);
        if (savedPhone) {
          syncMemberSession(data, savedPhone);
        }
      });
  }, [syncMemberSession]);

  const handleSnapshotUpdate = (newSnap: unknown) => {
    const typed = newSnap as StudioSnapshot;
    setSnapshot(typed);
    if (currentClient?.phone) {
      syncMemberSession(typed, currentClient.phone);
    }
  };

  const handleAuthSuccess = (user: AuthenticatedClient, token: string) => {
    setCurrentClient(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ngyoga_client_token', token);
      localStorage.setItem('ngyoga_client_user', JSON.stringify(user));
    }
    if (snapshot) {
      syncMemberSession(snapshot, user.phone);
    }
  };

  const handleLogout = () => {
    // Explicitly reset all client states and clear browser cache
    setCurrentClient(null);
    setActiveMember(null);
    setActiveRouting(null);
    setActiveMembership(null);
    setHasUsedTrial(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ngyoga_client_token');
      localStorage.removeItem('ngyoga_client_user');
    }
    setActiveTab('landing');
  };

  const handleRenewPlan = async (plan: PlanType) => {
    if (!activeMember) return;
    const res = await fetch('/api/memberships', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        member_id: activeMember.id,
        plan_type: plan,
      }),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      handleSnapshotUpdate(data.snapshot);
    }
  };

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-[#eff1f5] text-[#11111b] font-mono flex items-center justify-center p-6">
        <div className="rounded-xl border border-[#ccd0da] bg-white p-8 max-w-md w-full text-center space-y-3 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-[#5c5f77] font-bold">
            NG YOGA STUDIO · INDORE
          </div>
          <div className="text-xl font-bold text-[#11111b]">
            Loading Client Platform...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#eff1f5] text-[#11111b] font-mono">
      {/* Catppuccin Latte Header - Plain, Crisp, Black Headlines */}
      <header className="sticky top-0 z-40 bg-[#eff1f5] border-b border-[#ccd0da]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-6">
          {/* Brand Wordmark & Tagline */}
          <button
            type="button"
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 text-left cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1e66f5] text-white flex items-center justify-center font-bold text-sm">
              NG
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold tracking-tight text-[#11111b]">
                NG Yoga Studio
              </div>
              <div className="text-[10px] tracking-wider text-[#5c5f77] uppercase font-semibold">
                Prem Plaza · Ashok Nagar, Indore
              </div>
            </div>
          </button>

          {/* Client Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#5c5f77]">
            <button
              type="button"
              onClick={() => setActiveTab('landing')}
              className={`py-1.5 transition-colors cursor-pointer ${
                activeTab === 'landing'
                  ? 'border-b-2 border-[#1e66f5] text-[#1e66f5] font-bold'
                  : 'hover:text-[#11111b]'
              }`}
            >
              Studio Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('intake')}
              className={`py-1.5 transition-colors cursor-pointer ${
                activeTab === 'intake'
                  ? 'border-b-2 border-[#1e66f5] text-[#1e66f5] font-bold'
                  : 'hover:text-[#11111b]'
              }`}
            >
              New Member Onboarding
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batches')}
              className={`py-1.5 transition-colors cursor-pointer ${
                activeTab === 'batches'
                  ? 'border-b-2 border-[#1e66f5] text-[#1e66f5] font-bold'
                  : 'hover:text-[#11111b]'
              }`}
            >
              Batches &amp; Cohorts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('portal')}
              className={`py-1.5 transition-colors cursor-pointer ${
                activeTab === 'portal'
                  ? 'border-b-2 border-[#1e66f5] text-[#1e66f5] font-bold'
                  : 'hover:text-[#11111b]'
              }`}
            >
              My Member Pass
            </button>
          </nav>

          {/* Client Authentication CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {currentClient ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg border border-[#ccd0da] bg-white hover:bg-[#e6e9ef] text-[#11111b] text-xs transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-[#1e66f5] text-white flex items-center justify-center font-bold text-[10px]">
                    {currentClient.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline font-bold">{currentClient.name}</span>
                  <span className="text-[10px] text-[#40a02b] font-bold px-1.5 py-0.5 rounded bg-[#40a02b]/15">
                    MEMBER
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="py-1.5 px-3 rounded-lg border border-[#d20f39]/30 bg-white hover:bg-[#d20f39]/10 text-[#d20f39] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="py-2 px-4 rounded-lg bg-[#1e66f5] text-white text-xs uppercase tracking-wider font-bold hover:bg-[#1e66f5]/90 transition-all cursor-pointer shadow-sm"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around border-t border-[#ccd0da] py-2 text-xs text-[#5c5f77]">
          <button
            type="button"
            onClick={() => setActiveTab('landing')}
            className={`py-1 px-2 ${activeTab === 'landing' ? 'text-[#1e66f5] font-bold' : ''}`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('intake')}
            className={`py-1 px-2 ${activeTab === 'intake' ? 'text-[#1e66f5] font-bold' : ''}`}
          >
            Onboarding
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batches')}
            className={`py-1 px-2 ${activeTab === 'batches' ? 'text-[#1e66f5] font-bold' : ''}`}
          >
            Batches
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('portal')}
            className={`py-1 px-2 ${activeTab === 'portal' ? 'text-[#1e66f5] font-bold' : ''}`}
          >
            My Pass
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <StudioLandingView
            programmes={snapshot.programmes}
            batches={snapshot.batches}
            onStartHealthIntake={() => setActiveTab('intake')}
            onExploreBatches={(prog) => {
              if (prog) setProgrammeFilter(prog);
              setActiveTab('batches');
            }}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'intake' && (
          <ClientOnboardingWizard
            programmes={snapshot.programmes}
            batches={snapshot.batches}
            activeMember={activeMember}
            activeMembership={activeMembership}
            hasUsedTrial={hasUsedTrial}
            onOnboardingComplete={(payload) => {
              if (payload.snapshot) {
                handleSnapshotUpdate(payload.snapshot);
              }
              setActiveMember(payload.member);
              setActiveRouting(payload.routing);
              if (payload.membership) setActiveMembership(payload.membership);
              handleAuthSuccess(
                {
                  id: payload.member.id,
                  name: payload.member.name,
                  phone: payload.member.phone,
                  email: `${payload.member.phone}@ngyoga.in`,
                  role: 'member',
                  age: payload.member.age,
                  experience_level: payload.member.experience_level,
                },
                'demo_client_jwt'
              );
            }}
            onExploreBatches={() => setActiveTab('batches')}
          />
        )}

        {activeTab === 'batches' && (
          <BatchesPlansView
            batches={snapshot.batches}
            bookings={snapshot.bookings}
            waitlist={snapshot.waitlist}
            members={snapshot.members}
            activeMember={activeMember}
            activeRouting={activeRouting}
            activeMembership={activeMembership}
            hasUsedTrial={hasUsedTrial}
            initialProgrammeFilter={programmeFilter}
            onSnapshotUpdate={handleSnapshotUpdate}
            onNavigateToIntake={() => setActiveTab('intake')}
          />
        )}

        {activeTab === 'portal' && (
          <ClientMemberPortal
            activeMember={activeMember}
            activeMembership={activeMembership}
            activeRouting={activeRouting}
            bookings={snapshot.bookings}
            batches={snapshot.batches}
            onStartOnboarding={() => setActiveTab('intake')}
            onExploreBatches={() => setActiveTab('batches')}
            onRenewPlan={handleRenewPlan}
          />
        )}
      </main>

      {/* Client Authentication Modal */}
      <ClientAuthModal
        isOpen={authModalOpen}
        currentUser={currentClient}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onStartOnboarding={() => {
          setAuthModalOpen(false);
          setActiveTab('intake');
        }}
      />

      {/* Clean Studio Footer */}
      <footer className="border-t border-[#ccd0da] bg-[#e6e9ef] py-6 text-xs text-[#5c5f77]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#11111b]">NG Yoga Studio</span>
            <span>·</span>
            <span>Prem Plaza, Near ICICI Bank, Ashok Nagar, Indore (MP 452001)</span>
          </div>
          <div>
            Lead Instructor: NG Gothane · Iyengar Wall-Rope Somatics
          </div>
        </div>
      </footer>
    </div>
  );
}
