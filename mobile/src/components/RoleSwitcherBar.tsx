import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { moderateScale, fontScale, SPACING } from '../theme/responsive';

interface RoleSwitcherBarProps {
  onOpenNotifications?: () => void;
  showOnlyBell?: boolean;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({
  onOpenNotifications,
  showOnlyBell = false,
}) => {
  const { user, primaryRole } = useAuthStore();
  const { notifications } = useNetworkStore();
  const [showNotifModal, setShowNotifModal] = useState(false);
  const insets = useSafeAreaInsets();

  const isReceiving =
    primaryRole === 'receiving_hospital' ||
    user?.role === 'receiving_hospital' ||
    user?.primaryRole === 'receiving_hospital';
  const displayName = isReceiving
    ? 'District Civil Hospital (NICU / Pediatrics)'
    : user.name;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpenNotifications = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      setShowNotifModal(true);
    }
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      {/* User & Facility Active Identity Banner */}
      <View style={[styles.identityRow, showOnlyBell && { justifyContent: 'flex-end' }]}>
        {!showOnlyBell && (
          <View style={styles.identityLeft}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.facilityText} numberOfLines={1}>
              {isReceiving
                ? 'District Civil Hospital • Neonatal Intensive Care & PT Unit'
                : `${user.facility} • ${user.department}`}
            </Text>
          </View>
        )}

        <View style={styles.identityRight}>
          {/* Preserved Notification Bell with unread badge */}
          <TouchableOpacity
            onPress={handleOpenNotifications}
            style={styles.notifBtn}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeDotText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
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
    shadowRadius: 3,
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: moderateScale(6),
    backgroundColor: '#FFFFFF',
  },
  identityLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  userNameText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  facilityText: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  identityRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bellIcon: {
    fontSize: fontScale(17),
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: moderateScale(8),
    minWidth: moderateScale(16),
    height: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: '#FFFFFF',
    fontSize: fontScale(9),
    fontWeight: '800',
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
