import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SplashScreen } from '../features/authentication/screens/SplashScreen';
import { OnboardingScreen } from '../features/authentication/screens/OnboardingScreen';
import { LoginScreen } from '../features/authentication/screens/LoginScreen';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { PatientTrendsScreen } from '../features/trends/screens/PatientTrendsScreen';
import { NewRegistrationScreen } from '../features/babies/screens/NewRegistrationScreen';
import { PatientsScreen } from '../features/babies/screens/PatientsScreen';
import { RegistrationSuccessScreen } from '../features/babies/screens/RegistrationSuccessScreen';
import { PresentBilirubinScreen } from '../features/bilirubin/screens/PresentBilirubinScreen';
import { RiskScreen } from '../features/recommendations/screens/RiskScreen';
import { RecommendationsScreen } from '../features/recommendations/screens/RecommendationsScreen';
import { StoriesCarouselScreen } from '../features/analytics/screens/StoriesCarouselScreen';
import { SummaryTotalScreen } from '../features/analytics/screens/SummaryTotalScreen';
import { CalibrationScreen } from '../features/devices/screens/CalibrationScreen';
import { CalibrationStatusScreen } from '../features/devices/screens/CalibrationStatusScreen';
import { DeviceAlertScreen } from '../features/devices/screens/DeviceAlertScreen';
import { ExportDataScreen } from '../features/reports/screens/ExportDataScreen';
import { ObservationsListScreen } from '../features/observations/screens/ObservationsListScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';

// District & Hospital Network Screens
import { HospitalDirectoryScreen } from '../features/referrals/screens/HospitalDirectoryScreen';
import { CreateReferralScreen } from '../features/referrals/screens/CreateReferralScreen';
import { ReferralTrackerScreen } from '../features/referrals/screens/ReferralTrackerScreen';
import { HospitalReferralsInboxScreen } from '../features/hospitalDoctor/screens/HospitalReferralsInboxScreen';
import { DischargeApprovalScreen } from '../features/hospitalDoctor/screens/DischargeApprovalScreen';
import { NurseArrivalsScreen } from '../features/hospitalNurse/screens/NurseArrivalsScreen';
import { NurseStationAllocationScreen } from '../features/hospitalNurse/screens/NurseStationAllocationScreen';
import { NurseTreatmentTrackerScreen } from '../features/hospitalNurse/screens/NurseTreatmentTrackerScreen';
import { StationReadinessScreen } from '../features/hospitalNurse/screens/StationReadinessScreen';
import { AdminStationsManagementScreen } from '../features/hospitalAdmin/screens/AdminStationsManagementScreen';
import { DistrictOverviewScreen } from '../features/districtAdmin/screens/DistrictOverviewScreen';
import { FacilityUserManagementScreen } from '../features/districtAdmin/screens/FacilityUserManagementScreen';
import { StaffManagementScreen } from '../features/hospitalAdmin/screens/StaffManagementScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { FacilitySelectionScreen } from '../features/authentication/screens/FacilitySelectionScreen';
import { OtpActivationScreen } from '../features/authentication/screens/OtpActivationScreen';

import { BottomTabBar, TabName } from './BottomTabNavigator';
import { RoleSwitcherBar } from '../components/RoleSwitcherBar';
import { usePatientStore } from '../store/usePatientStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { Hospital, Admission } from '../types';

type ScreenRoute =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'main'
  | 'trends'
  | 'new_registration'
  | 'registration_success'
  | 'present_bilirubin'
  | 'risk'
  | 'recommendations'
  | 'stories_carousel'
  | 'export_data'
  | 'observations_list'
  | 'calibration'
  | 'calibration_status'
  | 'device_alert'
  | 'hospital_directory'
  | 'create_referral'
  | 'referral_tracker'
  | 'discharge_approval'
  | 'notifications'
  | 'facility_selection'
  | 'staff_management'
  | 'facility_user_management'
  | 'otp';

export const RootNavigator: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('splash');
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [readingVal, setReadingVal] = useState<number>(14.8);
  const [readingSite, setReadingSite] = useState<string>('Palms and soles');
  const [registeredUhid, setRegisteredUhid] = useState<string>('M1A2N3S4I5');
  const [selectedHospitalForReferral, setSelectedHospitalForReferral] = useState<Hospital | null>(null);
  const [selectedAdmissionForDischarge, setSelectedAdmissionForDischarge] = useState<Admission | null>(null);

  const { selectBaby, selectedBaby } = usePatientStore();
  const { activeRole, primaryRole, activeHospitalProfile, hasPermission } = useAuthStore();
  const { hospitals, admissions } = useNetworkStore();

  const handleSplashFinish = () => setCurrentRoute('onboarding');
  const handleOnboardingContinue = () => setCurrentRoute('login');
  const handleLoginSuccess = () => {
    setActiveTab('home');
    setCurrentRoute('main');
  };

  const handleSelectBaby = (baby: any) => {
    selectBaby(baby);
    setCurrentRoute('trends');
  };

  const handleOpenReadingDetail = (val: number, site: string) => {
    setReadingVal(val);
    setReadingSite(site);
    setCurrentRoute('present_bilirubin');
  };

  const renderProfile = () => (
    <ProfileScreen
      onOpenCalibration={() => setCurrentRoute('calibration')}
      onLogout={() => {
        setActiveTab('home');
        setCurrentRoute('login');
      }}
      onOpenNotifications={() => setCurrentRoute('notifications')}
      onOpenFacilitySelection={() => setCurrentRoute('facility_selection')}
      onOpenStaffManagement={() => setCurrentRoute('staff_management')}
      onOpenFacilityManagement={() => setCurrentRoute('facility_user_management')}
      onOpenOtp={() => setCurrentRoute('otp')}
    />
  );

  const handleFabPress = () => {
    switch (primaryRole) {
      case 'receiving_hospital':
        if (hasPermission('enter_bilirubin')) {
          setCurrentRoute('present_bilirubin');
        } else {
          setActiveTab('allocation');
        }
        break;
      case 'district_admin':
        setCurrentRoute('export_data');
        break;
      case 'doctor_referring':
      default:
        setCurrentRoute('new_registration');
        break;
    }
  };

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case 'splash':
        return <SplashScreen onFinish={handleSplashFinish} />;

      case 'onboarding':
        return <OnboardingScreen onContinue={handleOnboardingContinue} />;

      case 'login':
        return <LoginScreen onSuccess={handleLoginSuccess} />;

      case 'new_registration':
        return (
          <NewRegistrationScreen
            onBack={() => setCurrentRoute('main')}
            onSuccess={(uhid: string) => {
              setRegisteredUhid(uhid);
              setCurrentRoute('registration_success');
            }}
          />
        );

      case 'registration_success':
        return (
          <RegistrationSuccessScreen
            uhid={registeredUhid}
            doctor="Dr. Priya Sharma"
            onContinue={() => setCurrentRoute('trends')}
          />
        );

      case 'present_bilirubin':
        return (
          <PresentBilirubinScreen
            readingValue={readingVal}
            measurementSite={readingSite}
            onBack={() => setCurrentRoute('trends')}
            onContinue={() => setCurrentRoute('risk')}
          />
        );

      case 'risk':
        return (
          <RiskScreen
            riskLevel={readingVal >= 15 ? 'High' : readingVal >= 11 ? 'High-Intermediate' : 'Low'}
            onBack={() => setCurrentRoute('present_bilirubin')}
            onContinue={() => setCurrentRoute('recommendations')}
          />
        );

      case 'recommendations':
        return (
          <RecommendationsScreen
            onBack={() => setCurrentRoute('risk')}
            onContinue={() => setCurrentRoute('hospital_directory')}
          />
        );

      case 'hospital_directory':
        return (
          <HospitalDirectoryScreen
            onSelectHospital={(hosp) => {
              setSelectedHospitalForReferral(hosp);
              setCurrentRoute('create_referral');
            }}
            onBack={() => setCurrentRoute('main')}
          />
        );

      case 'create_referral':
        return (
          <CreateReferralScreen
            hospital={selectedHospitalForReferral || hospitals[0]}
            onSuccess={() => setCurrentRoute('referral_tracker')}
            onBack={() => setCurrentRoute('hospital_directory')}
          />
        );

      case 'referral_tracker':
        return (
          <ReferralTrackerScreen
            onBack={() => setCurrentRoute('main')}
          />
        );

      case 'discharge_approval':
        return (
          <DischargeApprovalScreen
            admission={selectedAdmissionForDischarge || admissions[0]}
            onSuccess={() => {
              setActiveTab('admitted');
              setCurrentRoute('main');
            }}
            onBack={() => setCurrentRoute('main')}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            onBack={() => setCurrentRoute('main')}
            onNotificationPress={() => setCurrentRoute('main')}
          />
        );

      case 'facility_selection':
        return (
          <FacilitySelectionScreen
            onBack={() => setCurrentRoute('main')}
            onFacilitySelected={() => setCurrentRoute('main')}
          />
        );

      case 'staff_management':
        return (
          <StaffManagementScreen
            onBack={() => setCurrentRoute('main')}
          />
        );

      case 'facility_user_management':
        return (
          <FacilityUserManagementScreen
            onBack={() => setCurrentRoute('main')}
          />
        );

      case 'otp':
        return (
          <OtpActivationScreen
            onBack={() => setCurrentRoute('main')}
            onActivateSuccess={() => setCurrentRoute('main')}
          />
        );

      case 'trends':
        return (
          <PatientTrendsScreen
            onBackToDashboard={() => setCurrentRoute('main')}
            onOpenReadingDetail={handleOpenReadingDetail}
            onSeeAllObservations={() => setCurrentRoute('observations_list')}
            onOpenReferral={() => setCurrentRoute('hospital_directory')}
          />
        );

      case 'stories_carousel':
        return (
          <StoriesCarouselScreen
            onClose={() => setCurrentRoute('main')}
            onNavigateAction={(action: string) => {
              if (action.includes('Discharge')) {
                setActiveTab('report');
                setCurrentRoute('main');
              } else if (action.includes('Reports')) {
                setCurrentRoute('export_data');
              } else {
                setCurrentRoute('main');
              }
            }}
          />
        );

      case 'export_data':
        return <ExportDataScreen onBack={() => setCurrentRoute('main')} />;

      case 'observations_list':
        return <ObservationsListScreen onBack={() => setCurrentRoute('trends')} />;

      case 'calibration':
        return (
          <CalibrationScreen
            onBack={() => setCurrentRoute('main')}
            onOpenStatus={() => setCurrentRoute('calibration_status')}
            onOpenAlert={() => setCurrentRoute('device_alert')}
          />
        );

      case 'calibration_status':
        return (
          <CalibrationStatusScreen
            onBack={() => setCurrentRoute('calibration')}
            onOpenAlert={() => setCurrentRoute('device_alert')}
          />
        );

      case 'device_alert':
        return <DeviceAlertScreen onBack={() => setCurrentRoute('calibration')} />;

      case 'main':
      default:
        // Unified 3-Primary-Role views for 'main' route
        if (primaryRole === 'receiving_hospital') {
          // Tab 1: Arrivals & Admissions
          if (activeTab === 'home' || activeTab === 'arrivals') {
            return (
              <NurseArrivalsScreen
                onArrivalConfirmed={(admId) => setActiveTab('allocation')}
              />
            );
          }

          // Tab 2: Incoming Referrals
          if (activeTab === 'inbox') {
            return <HospitalReferralsInboxScreen />;
          }

          // Tab 3: Phototherapy Tracking
          if (activeTab === 'tracking' || activeTab === 'admitted') {
            return (
              <NurseTreatmentTrackerScreen
                onRecordBilirubin={(uhid) => {
                  setReadingVal(12.4);
                  setCurrentRoute('present_bilirubin');
                }}
              />
            );
          }

          // Tab 4: PT Station Allocation
          if (activeTab === 'allocation') {
            return <NurseStationAllocationScreen />;
          }

          // Tab 5: Profile
          if (activeTab === 'profile') {
            return renderProfile();
          }

          if (activeTab === 'discharge') {
            return (
              <DischargeApprovalScreen
                admission={admissions[0]}
                onSuccess={() => setActiveTab('inbox')}
                onBack={() => setActiveTab('inbox')}
              />
            );
          }

          return (
            <NurseArrivalsScreen
              onArrivalConfirmed={(admId) => setActiveTab('allocation')}
            />
          );
        }

        if (primaryRole === 'district_admin') {
          if (activeTab === 'grid') {
            return (
              <HospitalDirectoryScreen
                onSelectHospital={(hosp) => {}}
                onBack={() => setActiveTab('home')}
              />
            );
          }
          if (activeTab === 'tracker') {
            return <ReferralTrackerScreen onBack={() => setActiveTab('home')} />;
          }
          if (activeTab === 'report') {
            return (
              <SummaryTotalScreen
                onBack={() => setActiveTab('home')}
                onExport={() => setCurrentRoute('export_data')}
              />
            );
          }
          if (activeTab === 'profile') {
            return renderProfile();
          }
          return (
            <DistrictOverviewScreen
              onExportPress={() => setCurrentRoute('export_data')}
            />
          );
        }

        // Primary Role: Doctor / Referring Centre (Strategy A: Unified Census & Hospital Capacity)
        if (activeTab === 'phototherapy') {
          return (
            <HospitalDirectoryScreen
              onSelectHospital={(hosp) => {
                setSelectedHospitalForReferral(hosp);
                setCurrentRoute('create_referral');
              }}
              onBack={() => setActiveTab('home')}
            />
          );
        }
        if (activeTab === 'tracker') {
          return <ReferralTrackerScreen onBack={() => setActiveTab('home')} />;
        }
        if (activeTab === 'report') {
          return (
            <SummaryTotalScreen
              onBack={() => setActiveTab('home')}
              onExport={() => setCurrentRoute('export_data')}
            />
          );
        }
        if (activeTab === 'profile') {
          return renderProfile();
        }
        // Unified Patients Census screen for 'home' and 'admitted'
        return (
          <DashboardScreen
            onSelectBaby={handleSelectBaby}
            onOpenReportStories={() => setCurrentRoute('stories_carousel')}
            onOpenNewRegistration={() => setCurrentRoute('new_registration')}
          />
        );
    }
  };

  const showBottomNav = currentRoute === 'main' || currentRoute === 'trends';
  const showRoleSwitcher =
    (currentRoute === 'main' && activeTab !== 'profile') || currentRoute === 'trends';

  return (
    <View style={styles.rootContainer}>
      {showRoleSwitcher && (
        <RoleSwitcherBar onOpenNotifications={() => setCurrentRoute('notifications')} />
      )}

      <View style={[styles.screenContainer, !showBottomNav && { paddingBottom: 0 }]}>
        {renderCurrentScreen()}
      </View>

      {showBottomNav && (
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
            if (currentRoute !== 'main') setCurrentRoute('main');
          }}
          onFabPress={handleFabPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
});
