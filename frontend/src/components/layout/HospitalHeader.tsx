import React from 'react';
import { LogOut, Building2, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const HospitalHeader: React.FC = () => {
  const { user, hospitalFacility, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hospitalLabel =
    hospitalFacility === 'PGI'
      ? 'PGI Hospital · NICU'
      : hospitalFacility === 'RML'
      ? 'RML Hospital · NICU'
      : hospitalFacility === 'KGMU'
      ? 'KGMU Hospital · NICU'
      : `${user?.facility || 'Hospital'} · NICU`;

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shrink-0">
      {/* Title / Facility Context */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-bold">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>{hospitalLabel}</span>
        </div>
        <span className="text-xs text-slate-400 font-medium hidden md:inline">
          Live Clinical Telemetry
        </span>
      </div>

      {/* User Section & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Staff'}</p>
            <p className="text-[10px] text-slate-500 font-medium capitalize mt-1">
              {user?.role?.replace('_', ' ') || 'Clinician'}
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
