import React from 'react';
import { LogOut, Building2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TestBalanceButton } from '../common/TestBalanceButton';

export const HospitalHeader: React.FC = () => {
  const { user, hospitalFacility, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hospitalLabel =
    hospitalFacility === 'PGI'
      ? 'PGI Tertiary Medical Centre · NICU'
      : hospitalFacility === 'RML'
        ? 'Dr. RML Institute · Neonatal Unit'
        : hospitalFacility === 'KGMU'
          ? 'KGMU Apex Hospital · Pediatric Ward'
          : `${user?.facility || 'Hospital'} · Clinical Care`;

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
      {/* Title / Facility Context */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50/80 border border-blue-200/80 text-blue-800 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>{hospitalLabel}</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium pl-3 border-l border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-700 font-medium">Telemetry Connected</span>
        </div>
      </div>

      {/* Right Cluster: Test Balance Control, User Section & Logout */}
      <div className="flex items-center gap-3">
        {/* Test Balance Control */}
        <TestBalanceButton />

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* User profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name || 'Medical Staff'}</p>
            <p className="text-[10px] text-slate-500 capitalize mt-0.5">
              {hospitalFacility} · {user?.role?.replace('_', ' ') || 'Clinician'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
