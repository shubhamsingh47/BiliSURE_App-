import React from 'react';
import { Outlet } from 'react-router-dom';
import { HospitalSidebar } from './HospitalSidebar';
import { HospitalHeader } from './HospitalHeader';

export const HospitalLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50/60 font-sans">
      {/* Sidebar */}
      <HospitalSidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <HospitalHeader />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
