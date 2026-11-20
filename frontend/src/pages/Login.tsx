import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#070e17] flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Branding */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-600/30">
            m
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              medblue <span className="text-blue-400 font-medium text-xs uppercase tracking-widest">CONNECT</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block uppercase">
              BiliSURE Hospital Suite
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium border border-[#17263d] bg-[#0c1626] px-3.5 py-1.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secure Clinical Gateway</span>
        </div>
      </header>

      {/* Centered Main Login Box */}
      <main className="max-w-md w-full mx-auto my-auto">
        <div className="bg-[#0b1523] border border-[#182a44] rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight">Clinical Portal Sign In</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your authorized hospital or administrative account credentials
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Identity / Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. pgi@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060c14] border border-[#1e3455] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060c14] border border-[#1e3455] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block animate-spin mr-1">●</span>
              ) : (
                <>
                  <span>Sign In to Hospital Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Hospital Switcher */}
          <div className="mt-7 pt-5 border-t border-[#182a44]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5 text-center">
              Quick Role / Hospital Context Select
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectHospitalAccount('pgi@hospital.org')}
                className="p-2.5 rounded-xl bg-[#0e1b2d] hover:bg-[#142640] border border-[#1c3354] text-left transition"
              >
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                  <Building2 className="w-3.5 h-3.5" /> PGI Hospital
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">pgi@hospital.org</div>
              </button>

              <button
                type="button"
                onClick={() => selectHospitalAccount('rml@hospital.org')}
                className="p-2.5 rounded-xl bg-[#0e1b2d] hover:bg-[#142640] border border-[#1c3354] text-left transition"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <Building2 className="w-3.5 h-3.5" /> RML Hospital
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">rml@hospital.org</div>
              </button>

              <button
                type="button"
                onClick={() => selectHospitalAccount('kgmu@hospital.org')}
                className="p-2.5 rounded-xl bg-[#0e1b2d] hover:bg-[#142640] border border-[#1c3354] text-left transition"
              >
                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                  <Building2 className="w-3.5 h-3.5" /> KGMU Hospital
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">kgmu@hospital.org</div>
              </button>

              <button
                type="button"
                onClick={() => selectHospitalAccount('admin@bilisure.org')}
                className="p-2.5 rounded-xl bg-[#0e1b2d] hover:bg-[#142640] border border-[#1c3354] text-left transition"
              >
                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">District Command</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Notices */}
      <footer className="text-center text-xs text-slate-500 max-w-md mx-auto">
        BiliSURE Hospital Suite · Restricted Clinical Network Access · All actions are logged and audited.
      </footer>
    </div>
  );
};
