import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, HeartPulse } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customEmail || email;

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password,
      });

      const { accessToken, user } = res.data.data;
      login(accessToken, user);

      const isSuper =
        user.role === 'district_admin' ||
        user.primaryRole === 'district_admin' ||
        user.role === 'admin';

      if (isSuper) {
        navigate('/admin/overview');
      } else {
        navigate('/hospital/overview');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectHospitalAccount = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('Password123!');
    handleLogin(undefined, accEmail);
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-screen overflow-hidden bg-slate-50/80 flex flex-col items-center justify-center p-3 sm:p-4 font-sans select-none">
      <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center">
        {/* Brand Header */}
        <div className="text-center mb-2.5 sm:mb-3 shrink-0">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20 mb-1.5">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">BiliSURE</h1>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Neonatal Jaundice Care & Telemetry Network</p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 shrink-0">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clinical Portal Sign In</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Staff authentication & telemetry access
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Online
            </span>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => handleLogin(e)} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="doctor@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 sm:py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 sm:py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 disabled:opacity-50 mt-1"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Facility Access */}
          <div className="pt-2.5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Demo Access
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Click to auto-authenticate</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => selectHospitalAccount('pgi@hospital.org')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-200 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block leading-tight">PGI Hospital</span>
                  <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Tertiary NICU</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => selectHospitalAccount('rml@hospital.org')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-200 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block leading-tight">RML Hospital</span>
                  <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Neonatal Unit</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => selectHospitalAccount('kgmu@hospital.org')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-200 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block leading-tight">KGMU Hospital</span>
                  <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Pediatric Ward</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => selectHospitalAccount('admin@bilisure.org')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-purple-50/70 hover:border-purple-200 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 block leading-tight">Command Hub</span>
                  <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">System Admin</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-purple-600 transition-colors shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-medium mt-2.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Encrypted Clinical Environment · Protected Health Information</span>
        </div>
      </div>
    </div>
  );
};
