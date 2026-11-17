import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { CheckCheck, BellOff } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { PurpleHeader } from '../../../components/PurpleHeader';
import { NotificationItem, NotificationType } from '../../../components/NotificationItem';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';

interface NotificationsScreenProps {
  onBack: () => void;
  onNotificationPress?: (notif: any) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  onNotificationPress,
}) => {
  const { notifications, markNotificationRead } = useNetworkStore();
  const { activeRole } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'referrals' | 'alerts'>('all');

  // Filter based on selected chip
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'referrals') {
      return n.type.includes('referral');
    }
    if (filter === 'alerts') {
      return n.type.includes('alert') || n.type.includes('arrival');
    }
    return true;
  });

  return (
    <View style={styles.safeArea}>
      <PurpleHeader
        title="Notifications & Alerts"
        subtitle={`Role: ${activeRole.replace('_', ' ').toUpperCase()}`}
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.markReadBtn}
            onPress={() => {
              notifications.forEach((n) => markNotificationRead(n.id));
            }}
          >
            <CheckCheck size={18} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[styles.tabChip, filter === 'all' && styles.tabChipActive]}
        >
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('referrals')}
          style={[styles.tabChip, filter === 'referrals' && styles.tabChipActive]}
        >
          <Text style={[styles.tabText, filter === 'referrals' && styles.tabTextActive]}>
            Referrals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('alerts')}
          style={[styles.tabChip, filter === 'alerts' && styles.tabChipActive]}
        >
          <Text style={[styles.tabText, filter === 'alerts' && styles.tabTextActive]}>
            Clinical Alerts
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <BellOff size={32} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You're fully up to date on all patient activities.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <NotificationItem
            id={item.id}
            type={item.type as NotificationType}
            title={item.title}
            message={item.message}
            timestamp={new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            isRead={item.isRead}
            onPress={() => {
              markNotificationRead(item.id);
              if (onNotificationPress) onNotificationPress(item);
            }}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  markReadBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabChipActive: {
    backgroundColor: COLORS.primaryBg,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
});
