import React from 'react';
import { Outlet } from 'react-router-dom';
import { HospitalSidebar } from './HospitalSidebar';

export const HospitalLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f7fb]">
      {/* Hospital Sidebar with Name and Logout at bottom */}
      <HospitalSidebar />

      {/* Main View Area (Full height, vertical space reclaimed) */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-8 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};
