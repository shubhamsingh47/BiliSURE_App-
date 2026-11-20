import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  BedDouble,
  Cpu,
  ArrowRightLeft,
  FileText,
  HeartPulse,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

export const HospitalSidebar: React.FC = () => {
  const { hospitalFacility } = useAuth();

  const clinicalItems = [
    { label: 'Overview', to: '/hospital/overview', icon: LayoutDashboard },
    { label: 'Patients', to: '/hospital/patient', icon: Users },
    { label: 'Nomogram & Triage', to: '/hospital/nomogram', icon: Activity },
    { label: 'PT Stations', to: '/hospital/phototherapy', icon: BedDouble },
    { label: 'Device Testing', to: '/hospital/device-testing', icon: Cpu },
  ];

  const auditItems = [
    { label: 'EHR & Referrals', to: '/hospital/referrals', icon: ArrowRightLeft },
    { label: 'Reports & Export', to: '/hospital/reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col shrink-0 h-full border-r border-slate-200/90 shadow-xs">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs shadow-blue-500/20">
          <HeartPulse className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-bold text-slate-900 tracking-tight block truncate">
            BiliSURE
          </span>
          <span className="text-[11px] font-semibold text-blue-600 block truncate">
            {hospitalFacility} Clinical Suite
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="px-3 py-4 flex-1 overflow-y-auto space-y-5">
        <div>
          <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Clinical Workspace
          </span>
          <div className="mt-1.5 space-y-1">
            {clinicalItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={clsx('w-4 h-4 shrink-0', isActive ? 'text-blue-600' : 'text-slate-400')} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        <div>
          <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Integration & Audit
          </span>
          <div className="mt-1.5 space-y-1">
            {auditItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={clsx('w-4 h-4 shrink-0', isActive ? 'text-blue-600' : 'text-slate-400')} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2 text-slate-600 text-xs px-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="truncate">Node Telemetry Active</span>
        </div>
      </div>
    </aside>
  );
};
