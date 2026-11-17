import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Cpu,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Bell,
  Building2,
  Users,
  KeyRound,
} from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { SyncEngine } from '../../../services/sync.engine';

interface ProfileScreenProps {
  onOpenCalibration: () => void;
  onLogout: () => void;
  onOpenNotifications?: () => void;
  onOpenFacilitySelection?: () => void;
  onOpenStaffManagement?: () => void;
  onOpenFacilityManagement?: () => void;
  onOpenOtp?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenCalibration,
  onLogout,
  onOpenNotifications,
  onOpenFacilitySelection,
  onOpenStaffManagement,
  onOpenFacilityManagement,
  onOpenOtp,
}) => {
  const { user, logout, activeRole, primaryRole, activeHospitalProfile, hasPermission } = useAuthStore();
  const { notifications } = useNetworkStore();
  const insets = useSafeAreaInsets();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isReceivingHospital =
    primaryRole === 'receiving_hospital' ||
    activeRole === 'hospital_doctor' ||
    activeRole === 'hospital_nurse' ||
    activeRole === 'hospital_admin';

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

  const getPrimaryRoleTitle = () => {
    switch (primaryRole) {
      case 'doctor_referring':
        return 'Doctor / Referring Centre';
      case 'receiving_hospital':
        return 'Hospital (Receiving)';
      case 'district_admin':
        return 'District Administrator';
      default:
        return 'Doctor / Referring Centre';
    }
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Independent Notification Icon (top right, no container card) */}
        {onOpenNotifications && (
          <View style={styles.topBellRow}>
            <TouchableOpacity
              onPress={onOpenNotifications}
              style={styles.independentNotifBtn}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <Text style={styles.bellEmoji}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeDotText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <User size={30} color={COLORS.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Healthcare Provider'}</Text>
            <Text style={styles.userMeta}>{user?.email || 'clinician@bilisure.district.org'}</Text>
            <Text style={styles.userDept}>
              {user?.department || 'Pediatrics'} • {user?.facility || 'District Health Network'}
            </Text>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>
                {getPrimaryRoleTitle().toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          {onOpenNotifications && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenNotifications}
              style={styles.menuItem}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: COLORS.primaryBg }]}>
                  <Bell size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.menuLabel}>Notifications & Clinical Alerts</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {!isReceivingHospital && onOpenFacilitySelection && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenFacilitySelection}
              style={styles.menuItem}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
                  <Building2 size={18} color={COLORS.textPrimary} />
                </View>
                <Text style={styles.menuLabel}>Switch Clinical Facility</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {(primaryRole === 'receiving_hospital' || activeRole === 'hospital_admin' || activeRole === 'hospital_doctor') && hasPermission('manage_staff') && onOpenStaffManagement && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenStaffManagement}
              style={styles.menuItem}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                  <Users size={18} color="#4338CA" />
                </View>
                <Text style={styles.menuLabel}>Hospital Staff & Permissions</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {(primaryRole === 'district_admin' || activeRole === 'district_admin') && onOpenFacilityManagement && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenFacilityManagement}
              style={styles.menuItem}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Building2 size={18} color="#059669" />
                </View>
                <Text style={styles.menuLabel}>District Facilities & Network</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenCalibration}
            style={styles.menuItem}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <Cpu size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>BiliSURE Device & Calibration</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {!isReceivingHospital && onOpenOtp && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenOtp}
              style={styles.menuItem}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <KeyRound size={18} color="#D97706" />
                </View>
                <Text style={styles.menuLabel}>Device Activation / OTP</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {!isReceivingHospital && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSyncNow}
              style={styles.menuItem}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                  <RefreshCw size={18} color="#059669" />
                </View>
                <Text style={styles.menuLabel}>Sync Pending Records Now</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {!isReceivingHospital && (
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <ShieldCheck size={18} color="#D97706" />
                </View>
                <Text style={styles.menuLabel}>Offline SQLite Cache: Active</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogoutPress}
          style={styles.logoutBtn}
        >
          <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  topBellRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  independentNotifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bellEmoji: {
    fontSize: 18,
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FC3949',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  userDept: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleChip: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    height: 50,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});
