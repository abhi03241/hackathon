'use client';

import React, {useState} from 'react';
import {
  ShieldCheck,
  X,
  KeyRound,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'staff' | 'member';
  phone: string;
  tenant_id: string;
}

interface AuthPortalModalProps {
  isOpen: boolean;
  currentUser: AuthenticatedUser | null;
  onClose: () => void;
  onLoginSuccess: (user: AuthenticatedUser, token: string) => void;
  onLogout: () => void;
}

const DEMO_ACCOUNTS = [
  {
    roleLabel: 'Studio Owner (Elevated Access)',
    email: 'owner@ngyoga.in',
    password: 'owner123',
    desc: 'Unlocks Owner Retention Risk Registry, Trial Conversion Analytics & Staff Check-In',
  },
  {
    roleLabel: 'Front Desk Staff (Prem Plaza Desk)',
    email: 'staff@ngyoga.in',
    password: 'staff123',
    desc: 'Unlocks 10-Digit Phone Check-In (Rule B4), Instant Renewal & Waitlist Cancellation',
  },
  {
    roleLabel: 'Registered Member (Amit Patidar)',
    email: 'amit@ngyoga.in',
    password: 'member123',
    desc: 'Member portal view for health profile, allowed batches & active 6-month pass',
  },
];

export default function AuthPortalModal({
  isOpen,
  currentUser,
  onClose,
  onLoginSuccess,
  onLogout,
}: AuthPortalModalProps) {
  const [email, setEmail] = useState('owner@ngyoga.in');
  const [password, setPassword] = useState('owner123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Authentication failed.');
        setLoading(false);
        return;
      }
      onLoginSuccess(data.user, data.access_token);
      onClose();
    } catch {
      setError('Network error during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-xl border border-[#CBD8CE] bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#CBD8CE] bg-[#E6EFE9]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1B4332]" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#0F241D]">
              ROLE-BASED AUTHENTICATION (JWT + RLS GUARD)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#0F241D] hover:opacity-70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {currentUser && (
            <div className="p-4 rounded-lg border border-[#15803D] bg-[#F0FDF4] flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#15803D] font-semibold">
                  CURRENTLY SIGNED IN ({currentUser.role.toUpperCase()} ROLE)
                </div>
                <div className="font-display text-xl font-semibold text-[#0F241D]">
                  {currentUser.name}
                </div>
                <div className="font-mono text-xs text-[#4E675E]">
                  {currentUser.email} · Tenant: {currentUser.tenant_id}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-3 py-2 rounded-lg border border-[#B91C1C] text-[#B91C1C] hover:bg-[#B91C1C] hover:text-white font-mono text-xs uppercase flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#4E675E] mb-2">
              1-CLICK STUDIO DEMO CREDENTIALS (SRS SECTION 3.1 ACCESS MATRIX):
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    setError(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    email === acc.email
                      ? 'border-2 border-[#1B4332] bg-[#F4F7F4]'
                      : 'border-[#CBD8CE] bg-white hover:bg-[#F4F7F4]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs font-semibold text-[#0F241D]">
                    <span>{acc.roleLabel}</span>
                    <span className="text-[#4E675E]">{acc.email}</span>
                  </div>
                  <div className="text-[11px] text-[#4E675E] mt-0.5">
                    {acc.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-4 pt-2 border-t border-[#CBD8CE]"
          >
            {error && (
              <div className="p-3 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-xs uppercase text-[#0F241D] mb-1">
                  Studio Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase text-[#0F241D] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD8CE] bg-[#F4F7F4] font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-[#1B4332] text-white hover:bg-[#0F241D] font-mono text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {loading
                  ? 'Authenticating JWT...'
                  : 'Sign In & Issue Bearer Token'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
