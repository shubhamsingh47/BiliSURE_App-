import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  PieChart,
  LogOut,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminLayout: React.FC = () => {
  const { logout } = useAuth();
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

        <div className="px-3.5 py-4 flex-1 overflow-y-auto space-y-1">
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

        {/* Sidebar Bottom: Super Admin & Logout */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-800">
            Super Admin
          </span>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container without redundant top bar */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-8 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};
