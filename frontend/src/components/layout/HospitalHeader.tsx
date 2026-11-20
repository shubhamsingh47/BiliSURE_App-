import React from 'react';
import { LogOut, Building2 } from 'lucide-react';
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
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-xs">
      {/* Title / Facility Context */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-xs">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>{hospitalLabel}</span>
        </div>
      </div>

      {/* Right Cluster: Test Balance Control, User Section & Logout */}
      <div className="flex items-center gap-3.5">
        {/* Circular Test Balance Button */}
        <TestBalanceButton />

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-xs shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Medical Staff'}</p>
            <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
              {hospitalFacility} · {user?.role?.replace('_', ' ') || 'Clinician'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
