import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { User, Cpu, RefreshCw, LogOut, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { useAuthStore } from '../../../store/useAuthStore';
import { SyncEngine } from '../../../services/sync.engine';

interface ProfileScreenProps {
  onOpenCalibration: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenCalibration,
  onLogout,
}) => {
  const { user, logout } = useAuthStore();

  const handleSyncNow = async () => {
    const res = await SyncEngine.syncPending();
    Alert.alert(
      'Synchronization',
      `Offline sync processed: ${res.syncedCount} records confirmed with hospital backend.`
    );
  };

  const handleLogoutPress = async () => {
    await logout();
    onLogout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Clinician Profile</Text>
        </View>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <User size={32} color="#7C3AED" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Nurse A'}</Text>
            <Text style={styles.userMeta}>{user?.email || 'nurse@bilisure.org'}</Text>
            <Text style={styles.userDept}>
              {user?.department || 'NICU'} • {user?.facility || 'Central Children Hospital'}
            </Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenCalibration}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <Cpu size={20} color="#7C3AED" />
              </View>
              <Text style={styles.menuLabel}>BiliSURE Device & Calibration</Text>
            </View>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSyncNow}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                <RefreshCw size={20} color="#059669" />
              </View>
              <Text style={styles.menuLabel}>Sync Pending Records Now</Text>
            </View>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <ShieldCheck size={20} color="#D97706" />
              </View>
              <Text style={styles.menuLabel}>Offline SQLite Cache: Active</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogoutPress}
          style={styles.logoutBtn}
        >
          <LogOut size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    padding: 24,
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  userMeta: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  userDept: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
});
