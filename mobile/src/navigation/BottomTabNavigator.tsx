import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Home,
  Share2,
  Plus,
  PieChart,
  User,
  Inbox,
  Bed,
  Hospital,
  Activity,
  FileSpreadsheet,
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { PrimaryUserRole } from '../types';

export type TabName =
  | 'home'
  | 'phototherapy'
  | 'report'
  | 'profile'
  | 'tracker'
  | 'inbox'
  | 'admitted'
  | 'discharge'
  | 'arrivals'
  | 'allocation'
  | 'readiness'
  | 'fleet'
  | 'capacity'
  | 'grid'
  | 'nomogram_stats';

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  onFabPress: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
  onFabPress,
}) => {
  const { primaryRole } = useAuthStore();

  const renderRoleTabs = () => {
    switch (primaryRole) {
      // 1. Doctor / Referring Centre
      // Tabs: Home | Patients | Add Baby (FAB) | Referrals | Profile
      case 'doctor_referring':
        return (
          <>
            <TouchableOpacity onPress={() => onTabPress('home')} style={styles.tabItem}>
              <Home size={22} color={activeTab === 'home' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('admitted')} style={styles.tabItem}>
              <Bed size={22} color={activeTab === 'admitted' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'admitted' && styles.tabLabelActive]}>
                Patients
              </Text>
            </TouchableOpacity>

            <View style={styles.fabWrapper}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onFabPress}
                style={styles.fabButton}
              >
                <Plus size={30} color="#FFFFFF" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => onTabPress('tracker')} style={styles.tabItem}>
              <Share2 size={22} color={activeTab === 'tracker' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'tracker' && styles.tabLabelActive]}>
                Referrals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('profile')} style={styles.tabItem}>
              <User size={22} color={activeTab === 'profile' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
                Profile
              </Text>
            </TouchableOpacity>
          </>
        );

      // 2. Receiving Hospital
      // Tabs: Home | Incoming Referrals | Patients | PT Stations | Profile
      case 'receiving_hospital':
        return (
          <>
            <TouchableOpacity onPress={() => onTabPress('home')} style={styles.tabItem}>
              <Home size={22} color={activeTab === 'home' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('inbox')} style={styles.tabItem}>
              <Inbox size={22} color={activeTab === 'inbox' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'inbox' && styles.tabLabelActive]}>
                Referrals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('admitted')} style={styles.tabItem}>
              <Bed size={22} color={activeTab === 'admitted' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'admitted' && styles.tabLabelActive]}>
                Patients
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('allocation')} style={styles.tabItem}>
              <Hospital size={22} color={activeTab === 'allocation' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'allocation' && styles.tabLabelActive]}>
                PT Stations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('profile')} style={styles.tabItem}>
              <User size={22} color={activeTab === 'profile' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
                Profile
              </Text>
            </TouchableOpacity>
          </>
        );

      // 3. District Administrator
      // Tabs: Overview | Hospitals | Referrals | Reports | Profile
      case 'district_admin':
      default:
        return (
          <>
            <TouchableOpacity onPress={() => onTabPress('home')} style={styles.tabItem}>
              <PieChart size={22} color={activeTab === 'home' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('grid')} style={styles.tabItem}>
              <Hospital size={22} color={activeTab === 'grid' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'grid' && styles.tabLabelActive]}>
                Hospitals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('tracker')} style={styles.tabItem}>
              <Share2 size={22} color={activeTab === 'tracker' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'tracker' && styles.tabLabelActive]}>
                Referrals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('report')} style={styles.tabItem}>
              <Activity size={22} color={activeTab === 'report' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'report' && styles.tabLabelActive]}>
                Reports
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onTabPress('profile')} style={styles.tabItem}>
              <User size={22} color={activeTab === 'profile' ? '#7D3BFF' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
                Profile
              </Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return <View style={styles.tabBarContainer}>{renderRoleTabs()}</View>;
};

const styles = StyleSheet.create({
  tabBarContainer: {
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#7D3BFF',
    fontWeight: '700',
  },
  fabWrapper: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  fabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#7D3BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
