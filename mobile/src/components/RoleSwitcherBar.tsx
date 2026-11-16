import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { PrimaryUserRole, PermissionProfile } from '../types';
import { COLORS } from '../theme/colors';

const PRIMARY_ROLES: { key: PrimaryUserRole; label: string; badge: string }[] = [
  { key: 'doctor_referring', label: 'Doctor / Referring Centre', badge: 'REFERRING' },
  { key: 'receiving_hospital', label: 'Receiving Hospital', badge: 'HOSPITAL' },
  { key: 'district_admin', label: 'District Administrator', badge: 'DISTRICT' },
];

const HOSPITAL_PROFILES: { key: PermissionProfile; label: string }[] = [
  { key: 'clinical', label: 'Doctor (Clinical)' },
  { key: 'nursing', label: 'Nurse (Treatment)' },
  { key: 'management', label: 'Admin (Operations)' },
];

interface RoleSwitcherBarProps {
  onOpenNotifications?: () => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({ onOpenNotifications }) => {
  const {
    primaryRole,
    switchRole,
    activeHospitalProfile,
    setHospitalPermissionProfile,
    user,
  } = useAuthStore();
  const { notifications } = useNetworkStore();
  const [showNotifModal, setShowNotifModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.wrapper}>
      {/* Primary Role Pill Switcher (3 Roles Only) */}
      <View style={styles.topRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {PRIMARY_ROLES.map((r) => {
            const isActive = primaryRole === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                onPress={() => switchRole(r.key)}
                style={[styles.rolePill, isActive && styles.rolePillActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.rolePillText, isActive && styles.rolePillTextActive]}>
                  {r.label}
                </Text>
                <View style={[styles.miniBadge, isActive && styles.miniBadgeActive]}>
                  <Text style={[styles.miniBadgeText, isActive && styles.miniBadgeTextActive]}>
                    {r.badge}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notification Bell */}
        <TouchableOpacity
          onPress={() => setShowNotifModal(true)}
          style={styles.notifBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badgeDot}>
              <Text style={styles.badgeDotText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sub-bar for Receiving Hospital: Configurable Permissions Profile */}
      {primaryRole === 'receiving_hospital' && (
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Permissions Profile:</Text>
          <View style={styles.profileButtons}>
            {HOSPITAL_PROFILES.map((p) => {
              const isSelected = activeHospitalProfile === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setHospitalPermissionProfile(p.key)}
                  style={[styles.profilePill, isSelected && styles.profilePillSelected]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.profilePillText,
                      isSelected && styles.profilePillTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* User & Facility Active Identity Banner */}
      <View style={styles.identityRow}>
        <View style={styles.identityLeft}>
          <Text style={styles.userNameText}>{user.name}</Text>
          <Text style={styles.facilityText}>
            {user.facility} • {user.department}
          </Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.onlineText}>Connected</Text>
        </View>
      </View>

      {/* Notifications Drawer Modal */}
      <Modal visible={showNotifModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Network Notifications ({notifications.length})</Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notifList}>
              {notifications.map((n) => (
                <View key={n.id} style={[styles.notifCard, !n.isRead && styles.notifCardUnread]}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={styles.notifCardTitle}>{n.title}</Text>
                    <Text style={styles.notifTime}>
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.notifCardMsg}>{n.message}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingRight: 8,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  rolePillActive: {
    backgroundColor: '#7D3BFF',
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  rolePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  miniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  miniBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  miniBadgeTextActive: {
    color: '#FFFFFF',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  profileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  profileButtons: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  profilePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  profilePillSelected: {
    backgroundColor: '#7D3BFF',
  },
  profilePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  profilePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: 4,
  },
  bellIcon: {
    fontSize: 18,
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FAFAFD',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  identityLeft: {
    flex: 1,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  facilityText: {
    fontSize: 11,
    color: '#64748B',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },
  notifList: {
    padding: 16,
  },
  notifCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5E1',
  },
  notifCardUnread: {
    backgroundColor: '#F5F3FF',
    borderLeftColor: '#7D3BFF',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 8,
  },
  notifCardMsg: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
});
