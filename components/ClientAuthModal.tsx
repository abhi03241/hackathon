'use client';

import React, {useState} from 'react';
import {
  X,
  Phone,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface AuthenticatedClient {
  id: string;
  email: string;
  name: string;
  role: 'member';
  phone: string;
  age?: number;
  experience_level?: string;
}

interface ClientAuthModalProps {
  isOpen: boolean;
  currentUser: AuthenticatedClient | null;
  onClose: () => void;
  onAuthSuccess: (user: AuthenticatedClient, token: string) => void;
  onLogout: () => void;
  onStartOnboarding?: () => void;
}

export default function ClientAuthModal({
  isOpen,
  currentUser,
  onClose,
  onAuthSuccess,
  onLogout,
  onStartOnboarding,
}: ClientAuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [phoneOrEmail, setPhoneOrEmail] = useState('9826033333');
  const [password, setPassword] = useState('member123');
  const [fullName, setFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: phoneOrEmail, password}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Authentication failed. Please check your credentials.');
        return;
      }
      onAuthSuccess(data.user, data.access_token);
      onClose();
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: fullName,
          phone: regPhone,
          password: password || 'member123',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed.');
        return;
      }
      onAuthSuccess(data.user, data.access_token);
      onClose();
    } catch {
      setError('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#4c4f69]/40 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="max-w-md w-full rounded-xl border border-[#ccd0da] bg-white shadow-xl overflow-hidden text-[#4c4f69]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ccd0da] bg-[#eff1f5]">
          <div>
            <div className="text-base font-bold text-[#4c4f69]">
              Member Sanctuary Access
            </div>
            <div className="text-[10px] tracking-wider text-[#6c6f85] uppercase">
              NG Yoga Studio · Ashok Nagar, Indore
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#6c6f85] hover:text-[#4c4f69] hover:bg-[#ccd0da]/30 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logged in state view */}
        {currentUser ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-lg border border-[#ccd0da] bg-[#eff1f5] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#1e66f5] text-white flex items-center justify-center font-bold text-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#4c4f69] text-sm truncate">
                  {currentUser.name}
                </div>
                <div className="text-xs text-[#6c6f85]">
                  +91 {currentUser.phone}
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] text-[#40a02b] font-semibold mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated Member
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onStartOnboarding) onStartOnboarding();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e66f5]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Update Health Intake / Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2 px-4 rounded-lg border border-[#d20f39]/30 text-[#d20f39] hover:bg-[#d20f39]/10 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Sign Out from Studio
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 rounded-lg bg-[#eff1f5] border border-[#ccd0da]">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setError(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  tab === 'signin'
                    ? 'bg-white text-[#1e66f5] shadow-sm'
                    : 'text-[#6c6f85] hover:text-[#4c4f69]'
                }`}
              >
                Member Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-white text-[#1e66f5] shadow-sm'
                    : 'text-[#6c6f85] hover:text-[#4c4f69]'
                }`}
              >
                Quick Register
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-[#d20f39] bg-[#d20f39]/10 text-[#d20f39] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {tab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6c6f85] mb-1 font-semibold">
                    10-Digit Mobile or Email
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#9ca0b0] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      placeholder="e.g. 9826033333"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#eff1f5] border border-[#ccd0da] text-xs text-[#4c4f69] focus:outline-none focus:border-[#1e66f5]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6c6f85] mb-1 font-semibold">
                    Password / Studio PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9ca0b0] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="default: member123"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#eff1f5] border border-[#ccd0da] text-xs text-[#4c4f69] focus:outline-none focus:border-[#1e66f5]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e66f5]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Studio Portal'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick-fill helpers */}
                <div className="pt-2 border-t border-[#ccd0da]">
                  <div className="text-[11px] text-[#6c6f85] mb-1.5 text-center">
                    Quick Fill Existing Member:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneOrEmail('9826033333');
                        setPassword('member123');
                      }}
                      className="p-2 rounded-lg bg-[#eff1f5] hover:bg-[#ccd0da]/40 border border-[#ccd0da] text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-[#1e66f5]">Amit Patidar</div>
                      <div className="text-[10px] text-[#6c6f85]">Active Member</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneOrEmail('9876543210');
                        setPassword('member123');
                      }}
                      className="p-2 rounded-lg bg-[#eff1f5] hover:bg-[#ccd0da]/40 border border-[#ccd0da] text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-[#8839ef]">Anjali Verma</div>
                      <div className="text-[10px] text-[#6c6f85]">PCOD Cohort</div>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6c6f85] mb-1 font-semibold">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#9ca0b0] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Roshni Khandelwal"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#eff1f5] border border-[#ccd0da] text-xs text-[#4c4f69] focus:outline-none focus:border-[#1e66f5]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6c6f85] mb-1 font-semibold">
                    10-Digit Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#9ca0b0] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. 9826012345"
                      maxLength={10}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#eff1f5] border border-[#ccd0da] text-xs text-[#4c4f69] focus:outline-none focus:border-[#1e66f5]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1e66f5] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e66f5]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 disabled:opacity-50"
                >
                  {loading ? 'Creating Member Pass...' : 'Create Account & Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
