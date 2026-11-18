import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bed, Hospital, Share2, LogOut } from 'lucide-react-native';
import { moderateScale, fontScale } from '../theme/responsive';

export type TabName = 'babies' | 'ward_stations' | 'referrals';

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  onFabPress?: () => void;
  onLogoutPress?: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
  onLogoutPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          minHeight: moderateScale(60) + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      ]}
    >
      {/* 1. Babies Tab */}
      <TouchableOpacity
        onPress={() => onTabPress('babies')}
        style={styles.tabItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Babies Census and Profiles"
      >
        <Bed
          size={22}
          color={activeTab === 'babies' ? '#7D3BFF' : '#94A3B8'}
          strokeWidth={activeTab === 'babies' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, activeTab === 'babies' && styles.tabLabelActive]} numberOfLines={1}>
          Babies
        </Text>
      </TouchableOpacity>

      {/* 2. Phototherapy Tab */}
      <TouchableOpacity
        onPress={() => onTabPress('ward_stations')}
        style={styles.tabItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Phototherapy Stations and Admissions"
      >
        <Hospital
          size={22}
          color={activeTab === 'ward_stations' ? '#7D3BFF' : '#94A3B8'}
          strokeWidth={activeTab === 'ward_stations' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, activeTab === 'ward_stations' && styles.tabLabelActive]} numberOfLines={1}>
          Phototherapy
        </Text>
      </TouchableOpacity>

      {/* 3. Referal Tab */}
      <TouchableOpacity
        onPress={() => onTabPress('referrals')}
        style={styles.tabItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="District Referal and Transfers"
      >
        <Share2
          size={22}
          color={activeTab === 'referrals' ? '#7D3BFF' : '#94A3B8'}
          strokeWidth={activeTab === 'referrals' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, activeTab === 'referrals' && styles.tabLabelActive]} numberOfLines={1}>
          Referal
        </Text>
      </TouchableOpacity>

      {/* 4. Logout Tab */}
      <TouchableOpacity
        onPress={onLogoutPress}
        style={styles.tabItem}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Log out of hospital account"
      >
        <LogOut
          size={22}
          color="#94A3B8"
          strokeWidth={2}
        />
        <Text style={styles.tabLabel} numberOfLines={1}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#7D3BFF',
    fontWeight: '700',
  },
});
