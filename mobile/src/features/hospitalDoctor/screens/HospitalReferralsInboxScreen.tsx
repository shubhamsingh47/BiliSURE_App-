import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { Referral } from '../../../types';
import { BhutaniNomogramChart } from '../../../components/BhutaniNomogramChart';
import { COLORS } from '../../../theme/colors';

interface HospitalReferralsInboxScreenProps {
  onOpenNotifications?: () => void;
}

export const HospitalReferralsInboxScreen: React.FC<HospitalReferralsInboxScreenProps> = ({
  onOpenNotifications,
}) => {
  const { referrals, acceptReferral, rejectReferral, notifications } = useNetworkStore();
  const { user } = useAuthStore();

  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingReferrals = referrals.filter((r) => r.status === 'pending');
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleAccept = async (referral: Referral) => {
    setIsProcessing(true);
    try {
      await acceptReferral(referral.referralId, user.name);
      Alert.alert(
        'Referral Accepted',
        `${referral.babyName} (${referral.babyUhid}) accepted. Referring centre and nursing unit notified to prepare arrival.`
      );
    } catch {
      Alert.alert('Error', 'Failed to accept referral');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedReferral) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a clinical or operational reason for declining this referral.');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectReferral(selectedReferral.referralId, rejectionReason, user.name);
      setRejectModalVisible(false);
      setRejectionReason('');
      setSelectedReferral(null);
      Alert.alert('Referral Declined', 'Referring doctor notified with the recorded reason.');
    } catch {
      Alert.alert('Error', 'Failed to decline referral');
    } finally {
      setIsProcessing(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Incoming Referrals</Text>
            <Text style={styles.headerSubtitle}>
              {pendingReferrals.length} Pending Review • {user.facility}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onOpenNotifications}
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

      {/* Referrals List */}
      <FlatList
        data={pendingReferrals}
        keyExtractor={(item) => item.id || item.referralId}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySub}>No pending neonatal phototherapy referrals awaiting review.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isEmergency = item.urgency === 'emergency';

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.urgencyBadge, isEmergency ? styles.urgencyBadgeEmerg : styles.urgencyBadgeUrgent]}>
                  <Text style={[styles.urgencyText, isEmergency ? styles.urgencyTextEmerg : styles.urgencyTextUrgent]}>
                    {item.urgency.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.referralTime}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <Text style={styles.patientName}>{item.babyName} ({item.babyUhid})</Text>
              <Text style={styles.centreSource}>Origin: {item.referringCentreName} • {item.referringDoctorName}</Text>

              {/* Bilirubin Callout Row */}
              <View style={styles.bilirubinBanner}>
                <View>
                  <Text style={styles.biliLabel}>Reported Bilirubin</Text>
                  <Text style={styles.biliVal}>{item.latestBilirubinValue} {item.latestBilirubinUnit}</Text>
                </View>
                <View style={styles.zonePill}>
                  <Text style={styles.zonePillText}>{item.latestBhutaniRiskZone?.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.zonePillAge}>at {item.postnatalAgeHoursAtReferral}h Age</Text>
                </View>
              </View>

              {/* Clinical Summary */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Clinical Assessment:</Text>
                <Text style={styles.summaryText}>{item.clinicalSummary}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedReferral(item);
                    setRejectModalVisible(true);
                  }}
                  style={styles.rejectBtn}
                  disabled={isProcessing}
                >
                  <Text style={styles.rejectBtnText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAccept(item)}
                  style={styles.acceptBtn}
                  disabled={isProcessing}
                >
                  <Text style={styles.acceptBtnText}>✓ Accept Referral</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Decline Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Decline Referral</Text>
            <Text style={styles.modalSub}>
              Please provide a clinical or operational reason to inform the referring doctor at {selectedReferral?.referringCentreName}.
            </Text>

            <TextInput
              style={styles.reasonInput}
              multiline
              numberOfLines={3}
              placeholder="e.g., NICU fully at capacity; Level 3 surgical intervention needed..."
              placeholderTextColor="#94A3B8"
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReject}
                style={styles.confirmRejectBtn}
                disabled={isProcessing}
              >
                <Text style={styles.confirmRejectBtnText}>Confirm Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#7D3BFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  badgeDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#FC3949',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#7D3BFF',
  },
  badgeDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgencyBadgeEmerg: {
    backgroundColor: '#FFF1F2',
  },
  urgencyBadgeUrgent: {
    backgroundColor: '#FFFBEB',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
  },
  urgencyTextEmerg: {
    color: '#FC3949',
  },
  urgencyTextUrgent: {
    color: '#D97706',
  },
  referralTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181829',
    marginBottom: 2,
  },
  centreSource: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  bilirubinBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  biliLabel: {
    fontSize: 10,
    color: '#7D3BFF',
    fontWeight: '600',
  },
  biliVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7D3BFF',
  },
  zonePill: {
    alignItems: 'flex-end',
  },
  zonePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#181829',
  },
  zonePillAge: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#7D3BFF',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181829',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181829',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 16,
  },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: '#181829',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmRejectBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FC3949',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRejectBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
