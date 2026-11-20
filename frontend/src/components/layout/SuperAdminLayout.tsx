import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  PieChart,
  LogOut,
  Bell,
  Activity,
  Layers,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TestBalanceButton } from '../common/TestBalanceButton';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50/70">
      {/* Super Admin Clean White Healthcare Sidebar */}
      <aside className="w-64 bg-white text-slate-700 flex flex-col shrink-0 min-h-screen border-r border-slate-200/90 shadow-xs">
        <div className="p-5 pb-4 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-purple-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              BiliSURE <span className="text-purple-600 font-semibold text-xs uppercase tracking-widest">COMMAND</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block uppercase">
              District Health Authority
            </span>
          </div>
        </div>

        <div className="px-3.5 py-4 flex-1 overflow-y-auto space-y-5">
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              District Clinical Command
            </span>
            <div className="mt-2 space-y-1">
              <NavLink
                to="/admin/overview"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-bold border-l-2 border-purple-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <PieChart className="w-4 h-4" />
                <span>District Health Network</span>
              </NavLink>
            </div>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Hospital Fleet Oversight
            </span>
            <div className="mt-2 space-y-1">
              <NavLink
                to="/admin/device-testing"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-bold border-l-2 border-purple-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Cpu className="w-4 h-4" />
                <span>Device Testing</span>
              </NavLink>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">{user?.name || 'Dr. Arvind Saxena'}</p>
              <p className="text-[10px] text-purple-700 font-semibold">Chief Medical Officer</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Dr. Arvind Saxena (CMO)</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Central District Health Authority · Lucknow Neonatal Division
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Circular Test Balance Control (Aggregated PGI, RML, KGMU) */}
            <TestBalanceButton />

            <div className="h-6 w-px bg-slate-200" />

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
