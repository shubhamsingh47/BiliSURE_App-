import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SplashScreen } from '../features/authentication/screens/SplashScreen';
import { OnboardingScreen } from '../features/authentication/screens/OnboardingScreen';
import { LoginScreen } from '../features/authentication/screens/LoginScreen';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { PatientTrendsScreen } from '../features/trends/screens/PatientTrendsScreen';
import { NewRegistrationScreen } from '../features/babies/screens/NewRegistrationScreen';
import { RegistrationSuccessScreen } from '../features/babies/screens/RegistrationSuccessScreen';
import { PresentBilirubinScreen } from '../features/bilirubin/screens/PresentBilirubinScreen';
import { RiskScreen } from '../features/recommendations/screens/RiskScreen';
import { RecommendationsScreen } from '../features/recommendations/screens/RecommendationsScreen';
import { ObservationsListScreen } from '../features/observations/screens/ObservationsListScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { CalibrationScreen } from '../features/devices/screens/CalibrationScreen';
import { CalibrationStatusScreen } from '../features/devices/screens/CalibrationStatusScreen';
import { DeviceAlertScreen } from '../features/devices/screens/DeviceAlertScreen';

// 3-Tab Main Screens
import { WardStationsScreen } from '../features/ward/screens/WardStationsScreen';
import { ReferralsHubScreen } from '../features/referrals/screens/ReferralsHubScreen';
import { CreateReferralScreen } from '../features/referrals/screens/CreateReferralScreen';
import { ReferralTrackerScreen } from '../features/referrals/screens/ReferralTrackerScreen';
import { HospitalDirectoryScreen } from '../features/referrals/screens/HospitalDirectoryScreen';

import { BottomTabBar, TabName } from './BottomTabNavigator';
import { usePatientStore } from '../store/usePatientStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { useAuthStore } from '../store/useAuthStore';
import { Hospital, Baby } from '../types';

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
  | 'create_referral'
  | 'hospital_directory'
  | 'referral_tracker'
  | 'observations_list'
  | 'notifications'
  | 'calibration'
  | 'calibration_status'
  | 'device_alert';

export const RootNavigator: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('splash');
  const [activeTab, setActiveTab] = useState<TabName>('babies');
  const [wardSegment, setWardSegment] = useState<'treatment' | 'allocation'>('treatment');
  const [wardSegmentTrigger, setWardSegmentTrigger] = useState<number>(0);
  const [readingVal, setReadingVal] = useState<number>(14.8);
  const [readingSite, setReadingSite] = useState<string>('Forehead');
  const [registeredUhid, setRegisteredUhid] = useState<string>('BS-IN-100001');
  const [selectedHospitalForReferral, setSelectedHospitalForReferral] = useState<Hospital | null>(null);
  const [referralContextPatient, setReferralContextPatient] = useState<Baby | null>(null);

  const { selectBaby, selectedBaby } = usePatientStore();
  const { hospitals } = useNetworkStore();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    setCurrentRoute('login');
  };

  const handleSplashFinish = () => setCurrentRoute('onboarding');
  const handleOnboardingContinue = () => setCurrentRoute('login');
  const handleLoginSuccess = () => {
    setActiveTab('babies');
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
            doctor="Attending Pediatrician"
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
            onContinue={() => setCurrentRoute('create_referral')}
          />
        );

      case 'hospital_directory':
        return (
          <HospitalDirectoryScreen
            initialPatient={referralContextPatient}
            onSelectPatient={(b) => {
              setReferralContextPatient(b);
              selectBaby(b);
            }}
            onSelectHospital={(hosp) => {
              setSelectedHospitalForReferral(hosp);
              setCurrentRoute('create_referral');
            }}
            onBack={() => {
              setReferralContextPatient(null);
              setCurrentRoute('main');
            }}
          />
        );

      case 'create_referral':
        return (
          <CreateReferralScreen
            onSuccess={() => {
              setActiveTab('referrals');
              setCurrentRoute('main');
            }}
            onBack={() => setCurrentRoute('main')}
          />
        );

      case 'referral_tracker':
        return (
          <ReferralTrackerScreen
            onBack={() => {
              setActiveTab('referrals');
              setCurrentRoute('main');
            }}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            onBack={() => setCurrentRoute('main')}
            onNotificationPress={() => setCurrentRoute('main')}
          />
        );

      case 'trends':
        return (
          <PatientTrendsScreen
            onBackToDashboard={() => setCurrentRoute('main')}
            onOpenReadingDetail={handleOpenReadingDetail}
            onSeeAllObservations={() => setCurrentRoute('observations_list')}
            onSendToPhototherapy={(targetBaby) => {
              const babyToAllocate = targetBaby || selectedBaby;
              if (babyToAllocate) {
                selectBaby(babyToAllocate);
              }
              setWardSegment('allocation');
              setWardSegmentTrigger((prev) => prev + 1);
              setActiveTab('ward_stations');
              setCurrentRoute('main');
            }}
            onOpenReferral={() => {
              if (selectedBaby) {
                selectBaby(selectedBaby);
              }
              setWardSegment('allocation');
              setWardSegmentTrigger((prev) => prev + 1);
              setActiveTab('ward_stations');
              setCurrentRoute('main');
            }}
          />
        );

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
        // 3-Tab Main Navigation
        switch (activeTab) {
          case 'ward_stations':
            return (
              <WardStationsScreen
                initialSegment={wardSegment}
                segmentTrigger={wardSegmentTrigger}
                onOpenNotifications={() => setCurrentRoute('notifications')}
                onRecordBilirubin={(uhid) => {
                  setReadingVal(12.4);
                  setCurrentRoute('present_bilirubin');
                }}
              />
            );

          case 'referrals':
            return (
              <ReferralsHubScreen
                onOpenNotifications={() => setCurrentRoute('notifications')}
                onOpenCreateReferral={() => {
                  setReferralContextPatient(null);
                  setCurrentRoute('create_referral');
                }}
                onArrivalConfirmed={(admId) => {
                  setActiveTab('ward_stations');
                }}
              />
            );

          case 'babies':
          default:
            return (
              <DashboardScreen
                onSelectBaby={handleSelectBaby}
                onOpenReportStories={() => {}}
                onOpenNewRegistration={() => setCurrentRoute('new_registration')}
              />
            );
        }
    }
  };

  const showBottomNav = currentRoute === 'main';

  return (
    <View style={styles.rootContainer}>
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
          onLogoutPress={handleLogout}
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
