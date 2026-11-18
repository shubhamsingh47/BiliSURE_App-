import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Bell } from 'lucide-react-native';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { HospitalReferralsInboxScreen } from '../../hospitalDoctor/screens/HospitalReferralsInboxScreen';
import { ReferralTrackerScreen } from './ReferralTrackerScreen';
import { NurseArrivalsScreen } from '../../hospitalNurse/screens/NurseArrivalsScreen';
import { fontScale, moderateScale, getScreenTopPadding } from '../../../theme/responsive';

interface ReferralsHubScreenProps {
  onOpenNotifications?: () => void;
  onOpenCreateReferral?: () => void;
  onArrivalConfirmed?: (admissionId: string) => void;
}

export const ReferralsHubScreen: React.FC<ReferralsHubScreenProps> = ({
  onOpenNotifications,
  onOpenCreateReferral,
  onArrivalConfirmed,
}) => {
  const insets = useSafeAreaInsets();
  const { referrals, notifications } = useNetworkStore();

  const [activeSegment, setActiveSegment] = useState<'incoming' | 'tracker' | 'arrivals'>('incoming');

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const pendingCount = referrals.filter((r) => r.status === 'pending').length;
  const incomingAccepted = referrals.filter((r) => r.status === 'accepted');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: getScreenTopPadding(insets, 8) }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>Incoming Referrals</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {pendingCount} Pending Review • {incomingAccepted.length} En Route
            </Text>
          </View>

          <View style={styles.headerActions}>
            {onOpenCreateReferral && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onOpenCreateReferral}
                style={styles.newReferralBtn}
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.newReferralText}>+ Refer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onOpenNotifications}
              style={styles.notifBtn}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <Bell size={18} color="#181829" />
              {unreadCount > 0 && (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeDotText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 3-Segment Control Bar */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'incoming' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('incoming')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'incoming' && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'arrivals' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('arrivals')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'arrivals' && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              Arrivals ({incomingAccepted.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'tracker' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('tracker')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'tracker' && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              Tracker ({referrals.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeSegment === 'incoming' && (
          <HospitalReferralsInboxScreen embedded={true} />
        )}
        {activeSegment === 'tracker' && (
          <ReferralTrackerScreen isTab={true} embedded={true} />
        )}
        {activeSegment === 'arrivals' && (
          <NurseArrivalsScreen
            embedded={true}
            onArrivalConfirmed={onArrivalConfirmed}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: fontScale(19),
    fontWeight: '800',
    color: '#181829',
  },
  headerSubtitle: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newReferralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7D3BFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  newReferralText: {
    color: '#FFFFFF',
    fontSize: fontScale(12),
    fontWeight: '700',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FC3949',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#7D3BFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
