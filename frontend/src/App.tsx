import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { HospitalLayout } from './components/layout/HospitalLayout';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import { OverviewPage } from './pages/hospital/OverviewPage';
import { PatientsPage } from './pages/hospital/PatientsPage';
import { ReadingsPage } from './pages/hospital/ReadingsPage';
import { PhototherapyPage } from './pages/hospital/PhototherapyPage';
import { ReferralsPage } from './pages/hospital/ReferralsPage';
import { ReportsPage } from './pages/hospital/ReportsPage';
import { ChatPage } from './pages/hospital/ChatPage';
import { DeviceTestingPage } from './pages/hospital/DeviceTestingPage';
import { SuperAdminDashboard } from './pages/admin/SuperAdminDashboard';
import { SuperAdminDeviceTestingPage } from './pages/admin/SuperAdminDeviceTestingPage';

const ProtectedHospitalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (isSuperAdmin) {
    return <Navigate to="/admin/overview" replace />;
  }
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isSuperAdmin) {
    return <Navigate to="/hospital/overview" replace />;
  }
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isSuperAdmin) return <Navigate to="/admin/overview" replace />;
  return <Navigate to="/hospital/overview" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Hospital Protected Routes */}
          <Route
            path="/hospital"
            element={
              <ProtectedHospitalRoute>
                <HospitalLayout />
              </ProtectedHospitalRoute>
            }
          >
            <Route index element={<Navigate to="/hospital/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="readings" element={<ReadingsPage />} />
            <Route path="phototherapy" element={<PhototherapyPage />} />
            <Route path="device-testing" element={<DeviceTestingPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>

          {/* Super Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <SuperAdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview" element={<SuperAdminDashboard />} />
            <Route path="device-testing" element={<SuperAdminDeviceTestingPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
