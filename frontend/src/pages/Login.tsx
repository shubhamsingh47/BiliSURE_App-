import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Building2, CheckCircle2, HeartPulse, Activity } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Branding */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/25">
            m
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              medblue <span className="text-blue-600 font-semibold text-xs uppercase tracking-widest">CONNECT</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block uppercase">
              BiliSURE Hospital Suite
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-semibold border border-slate-200 bg-white px-3.5 py-1.5 rounded-full shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secure Hospital Authentication</span>
        </div>
      </header>

      {/* Centered Main Login Box */}
      <main className="max-w-md w-full mx-auto my-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-9 shadow-xl shadow-slate-200/60">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-lg mb-2">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Tertiary Neonatal Command
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Portal Sign In</h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Authenticate with your authorized hospital node or district administration credentials.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="doctor@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Clinical Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Direct Hospital Node Selectors */}
          <div className="mt-7 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
              One-Click Hospital Access:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectHospitalAccount('pgi@hospital.org')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-left transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">PGI Hospital</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tertiary NICU</span>
              </button>

              <button
                type="button"
                onClick={() => selectHospitalAccount('rml@hospital.org')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-left transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">RML Hospital</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Maternity Wing</span>
              </button>

              <button
                type="button"
                onClick={() => selectHospitalAccount('kgmu@hospital.org')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-left transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">KGMU Hospital</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Pediatric HDU</span>
              </button>

              <button
                type="button"
                onClick={() => selectHospitalAccount('admin@bilisure.org')}
                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 hover:border-purple-300 text-left transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">District Admin</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                </div>
                <span className="text-[10px] text-purple-600 block mt-0.5 font-medium">Command Hub</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="text-center text-xs text-slate-400 py-3">
        <p className="font-medium">
          Authorized clinical neonatal diagnostics gateway · MedBlue BiliSURE Architecture
        </p>
      </footer>
    </div>
  );
};
