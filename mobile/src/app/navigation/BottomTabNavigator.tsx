import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Share2, Plus, PieChart, User } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

export type TabName = 'home' | 'phototherapy' | 'report' | 'profile';

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
  return (
    <View style={styles.tabBarContainer}>
      {/* Tab 1: Home */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTabPress('home')}
        style={styles.tabItem}
      >
        <Home
          size={24}
          color={activeTab === 'home' ? '#7C3AED' : '#94A3B8'}
          strokeWidth={activeTab === 'home' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Tab 2: Photo therapy Ref */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTabPress('phototherapy')}
        style={styles.tabItem}
      >
        <Share2
          size={24}
          color={activeTab === 'phototherapy' ? '#7C3AED' : '#94A3B8'}
          strokeWidth={activeTab === 'phototherapy' ? 2.5 : 2}
        />
        <Text
          style={[styles.tabLabel, activeTab === 'phototherapy' && styles.tabLabelActive]}
          numberOfLines={1}
        >
          Photo therapy Ref
        </Text>
      </TouchableOpacity>

      {/* Center Elevated Floating Action Button (+) from Video Frame 9 */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onFabPress}
          style={styles.fabButton}
        >
          <Plus size={32} color="#FFFFFF" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* Tab 4: Report */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTabPress('report')}
        style={styles.tabItem}
      >
        <PieChart
          size={24}
          color={activeTab === 'report' ? '#7C3AED' : '#94A3B8'}
          strokeWidth={activeTab === 'report' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, activeTab === 'report' && styles.tabLabelActive]}>
          Report
        </Text>
      </TouchableOpacity>

      {/* Tab 5: Profile */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTabPress('profile')}
        style={styles.tabItem}
      >
        <User
          size={24}
          color={activeTab === 'profile' ? '#7C3AED' : '#94A3B8'}
          strokeWidth={activeTab === 'profile' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
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
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  fabWrapper: {
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
});
