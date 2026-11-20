import React from 'react';
import { Outlet } from 'react-router-dom';
import { HospitalSidebar } from './HospitalSidebar';
import { HospitalHeader } from './HospitalHeader';
import { Info } from 'lucide-react';

export const HospitalLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f7fb]">
      {/* Dark Navy Sidebar */}
      <HospitalSidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <HospitalHeader />

        {/* Clinical Disclaimer Banner */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-8 py-2.5 flex items-center gap-2 text-xs text-blue-800 font-medium shrink-0">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Clinical safety: BiliSURE screening readings (TcB) assist clinical decision-making and are not equivalent to laboratory confirmation. Follow hospital neonatal triage protocols.
          </span>
        </div>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
