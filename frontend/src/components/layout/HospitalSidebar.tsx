import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Users,
  BedDouble,
  Cpu,
  ArrowRightLeft,
  FileText,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

export const HospitalSidebar: React.FC = () => {
  const { hospitalFacility, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { label: 'Overview', to: '/hospital/overview', icon: LayoutDashboard },
    { label: 'Patient', to: '/hospital/patient', icon: Users },
    { label: 'PT Stations', to: '/hospital/phototherapy', icon: BedDouble },
    { label: 'Device Testing', to: '/hospital/device-testing', icon: Cpu },
    { label: 'EHR & Referrals', to: '/hospital/referrals', icon: ArrowRightLeft },
    { label: 'Reports & Export', to: '/hospital/reports', icon: FileText },
  ];

  const hospitalDisplayName = hospitalFacility
    ? `${hospitalFacility} Hospital`
    : 'Hospital';

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

      {/* Navigation Items in Requested Exact Order */}
      <div className="px-3.5 py-4 flex-1 overflow-y-auto space-y-1">
        {navigationItems.map((item) => {
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

      {/* Sidebar Bottom: Hospital Name & Logout Icon */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span className="text-xs font-bold text-slate-800 truncate" title={hospitalDisplayName}>
          {hospitalDisplayName}
        </span>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
