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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc]">
      {/* Super Admin Navy Sidebar */}
      <aside className="w-64 bg-[#09131f] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-[#16253a]">
        <div className="p-6 pb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-purple-500/25">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              BiliSURE <span className="text-purple-400 font-medium text-xs uppercase tracking-widest">COMMAND</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block uppercase">
              District Health Authority
            </span>
          </div>
        </div>

        <div className="px-4 py-3 flex-1 overflow-y-auto space-y-4">
          <span className="px-3 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            District Command
          </span>
          <div className="space-y-1">
            <NavLink
              to="/admin/overview"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#122033]'
                }`
              }
            >
              <PieChart className="w-4 h-4" />
              <span>District Health Network</span>
            </NavLink>
          </div>
        </div>

        <div className="p-4 border-t border-[#16253a] bg-[#060e18]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-purple-400 font-mono">Lucknow Division</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Dr. Arvind Saxena (CMO)</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Central District Health Authority · Lucknow Neonatal Division
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
