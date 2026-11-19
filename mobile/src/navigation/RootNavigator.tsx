import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { moderateScale, fontScale } from '../theme/responsive';
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
  const [wardSegment, setWardSegment] = useState<'allocation' | 'treatment'>('allocation');
  const [wardNavTimestamp, setWardNavTimestamp] = useState<number>(Date.now());
  const [readingVal, setReadingVal] = useState<number>(14.8);
  const [readingSite, setReadingSite] = useState<string>('Forehead');
  const [registeredUhid, setRegisteredUhid] = useState<string>('BS-IN-100001');
  const [selectedHospitalForReferral, setSelectedHospitalForReferral] = useState<Hospital | null>(null);
  const [referralContextPatient, setReferralContextPatient] = useState<Baby | null>(null);
  const [ptTargetBaby, setPtTargetBaby] = useState<Baby | null>(null);
  const [ptTargetFilter, setPtTargetFilter] = useState<'active' | 'concluded'>('active');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { selectBaby, selectedBaby } = usePatientStore();
  const { hospitals } = useNetworkStore();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    usePatientStore.getState().reset();
    useNetworkStore.getState().reset();
    await logout();
    setCurrentRoute('login');
  };

  const handleSplashFinish = () => setCurrentRoute('onboarding');
  const handleOnboardingContinue = () => setCurrentRoute('login');
  const handleLoginSuccess = () => {
    usePatientStore.getState().reset();
    useNetworkStore.getState().reset();
    usePatientStore.getState().loadBabies();
    useNetworkStore.getState().loadNetworkData();
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
            onBackToDashboard={() => {
              setPtTargetBaby(null);
              setCurrentRoute('main');
            }}
            onOpenReadingDetail={handleOpenReadingDetail}
            onSeeAllObservations={() => setCurrentRoute('observations_list')}
            onViewPhototherapyTracker={(targetBaby, filter = 'active') => {
              const babyToView = targetBaby || selectedBaby;
              setPtTargetBaby(babyToView || null);
              setPtTargetFilter(filter);
              setWardSegment('treatment');
              setWardNavTimestamp(Date.now());
              setActiveTab('ward_stations');
              setCurrentRoute('main');
            }}
            onSendToPhototherapy={(targetBaby) => {
              const babyToAllocate = targetBaby || selectedBaby;
              setPtTargetBaby(babyToAllocate || null);
              setWardSegment('allocation');
              setWardNavTimestamp(Date.now());
              setActiveTab('ward_stations');
              setCurrentRoute('main');
            }}
            onOpenReferral={() => {
              setPtTargetBaby(selectedBaby || null);
              setWardSegment('allocation');
              setWardNavTimestamp(Date.now());
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
                segmentTrigger={wardNavTimestamp}
                initialPatientToSend={ptTargetBaby}
                initialPtFilter={ptTargetFilter}
                onPatientAllocated={() => {
                  setPtTargetBaby(null);
                }}
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
                  setWardSegment('allocation');
                  setWardNavTimestamp(Date.now());
                  setActiveTab('ward_stations');
                }}
              />
            );

          case 'babies':
          default:
            return (
              <DashboardScreen
                onSelectBaby={handleSelectBaby}
                onOpenReportStories={() => { }}
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
            if (tab !== 'ward_stations') {
              setPtTargetBaby(null);
            }
            setActiveTab(tab);
            if (currentRoute !== 'main') setCurrentRoute('main');
          }}
          onLogoutPress={() => setShowLogoutModal(true)}
        />
      )}

      {/* Custom Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalCard}>
            <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to log out of your account?
            </Text>

            <View style={styles.logoutActionsRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel logout"
              >
                <Text style={styles.logoutCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={async () => {
                  setShowLogoutModal(false);
                  await handleLogout();
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Yes, Logout"
              >
                <Text style={styles.logoutConfirmText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoutModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    paddingVertical: moderateScale(26),
    paddingHorizontal: moderateScale(22),
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  logoutModalTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  logoutModalMessage: {
    fontSize: fontScale(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: moderateScale(22),
    paddingHorizontal: moderateScale(6),
  },
  logoutActionsRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    width: '100%',
  },
  logoutCancelBtn: {
    flex: 1,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#475569',
  },
  logoutConfirmBtn: {
    flex: 1.15,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
