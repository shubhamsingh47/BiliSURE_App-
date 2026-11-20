import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  BedDouble,
  Activity,
  MessageSquare,
  ArrowRightLeft,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

export const HospitalSidebar: React.FC = () => {
  const { hospitalFacility } = useAuth();

  const workspaceItems = [
    { label: 'Overview', to: '/hospital/overview', icon: LayoutDashboard },
    { label: 'Patients & Results', to: '/hospital/patients', icon: Users },
    { label: 'Readings & Nomogram', to: '/hospital/readings', icon: Activity },
    { label: 'Device Fleet & PT Stations', to: '/hospital/phototherapy', icon: BedDouble },
    { label: 'Device Testing', to: '/hospital/device-testing', icon: Cpu },
  ];

  const integrationItems = [
    { label: 'EHR & Referrals', to: '/hospital/referrals', icon: ArrowRightLeft },
    { label: 'Hospital Comms', to: '/hospital/chat', icon: MessageSquare },
    { label: 'Reports & Export', to: '/hospital/reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col shrink-0 min-h-screen border-r border-slate-200/90 shadow-xs">
      {/* Brand Header */}
      <div className="p-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-blue-500/20">
          m
        </div>
        <div>
          <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            medblue <span className="text-blue-600 font-semibold text-xs uppercase tracking-widest">CONNECT</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider block uppercase">
            BiliSURE Hospital Suite
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="px-3.5 py-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <span className="px-3 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            {hospitalFacility} Workspace
          </span>
          <div className="mt-2 space-y-1">
            {workspaceItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        <div>
          <span className="px-3 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            Clinical Systems & Audit
          </span>
          <div className="mt-2 space-y-1">
            {integrationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Clinical System Operational</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">
          Node: {hospitalFacility} Tertiary Care
        </p>
      </div>
    </aside>
  );
};
