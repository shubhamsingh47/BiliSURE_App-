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
import { StoriesCarouselScreen } from '../features/analytics/screens/StoriesCarouselScreen';
import { SummaryTotalScreen } from '../features/analytics/screens/SummaryTotalScreen';
import { CalibrationScreen } from '../features/devices/screens/CalibrationScreen';
import { CalibrationStatusScreen } from '../features/devices/screens/CalibrationStatusScreen';
import { DeviceAlertScreen } from '../features/devices/screens/DeviceAlertScreen';
import { ExportDataScreen } from '../features/reports/screens/ExportDataScreen';
import { ObservationsListScreen } from '../features/observations/screens/ObservationsListScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { BottomTabBar, TabName } from './BottomTabNavigator';
import { usePatientStore } from '../store/usePatientStore';

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
  | 'device_alert';

export const RootNavigator: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('splash');
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [readingVal, setReadingVal] = useState<number>(10.0);
  const [readingSite, setReadingSite] = useState<string>('Palms and soles');
  const [registeredUhid, setRegisteredUhid] = useState<string>('M1A2N3S4I5');

  const { selectBaby, selectedBaby } = usePatientStore();

  const handleSplashFinish = () => setCurrentRoute('onboarding');
  const handleOnboardingContinue = () => setCurrentRoute('login');
  const handleLoginSuccess = () => setCurrentRoute('main');

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
            doctor="Dr. XYZ"
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
            riskLevel={readingVal > 15 ? 'High' : readingVal > 11 ? 'Moderate' : 'Low'}
            onBack={() => setCurrentRoute('present_bilirubin')}
            onContinue={() => setCurrentRoute('recommendations')}
          />
        );

      case 'recommendations':
        return (
          <RecommendationsScreen
            onBack={() => setCurrentRoute('risk')}
            onContinue={() => setCurrentRoute('trends')}
          />
        );

      case 'trends':
        return (
          <PatientTrendsScreen
            onBackToDashboard={() => setCurrentRoute('main')}
            onOpenReadingDetail={handleOpenReadingDetail}
            onSeeAllObservations={() => setCurrentRoute('observations_list')}
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
        // Render according to active tab
        if (activeTab === 'phototherapy') {
          return (
            <RecommendationsScreen
              onBack={() => setActiveTab('home')}
              onContinue={() => setActiveTab('home')}
            />
          );
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
          return (
            <ProfileScreen
              onOpenCalibration={() => setCurrentRoute('calibration')}
              onLogout={() => setCurrentRoute('login')}
            />
          );
        }
        return (
          <DashboardScreen
            onSelectBaby={handleSelectBaby}
            onOpenReportStories={() => setCurrentRoute('stories_carousel')}
            onOpenNewRegistration={() => setCurrentRoute('new_registration')}
          />
        );
    }
  };

  const showBottomNav =
    currentRoute === 'main' || currentRoute === 'trends';

  return (
    <View style={styles.rootContainer}>
      {renderCurrentScreen()}

      {showBottomNav && (
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
            if (currentRoute !== 'main') setCurrentRoute('main');
          }}
          onFabPress={() => setCurrentRoute('new_registration')}
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
});
