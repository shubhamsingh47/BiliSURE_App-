import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Bell, Check, X, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle } from 'lucide-react-native';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { Referral } from '../../../types';
import { fontScale, moderateScale, getScreenTopPadding } from '../../../theme/responsive';

interface ReferralsHubScreenProps {
  onOpenNotifications?: () => void;
  onOpenCreateReferral?: () => void;
  onArrivalConfirmed?: (admissionId: string) => void;
}

export const ReferralsHubScreen: React.FC<ReferralsHubScreenProps> = ({
  onOpenNotifications,
  onOpenCreateReferral,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { referrals, notifications, acceptReferral, rejectReferral, loadNetworkData, isLoading } = useNetworkStore();

  // Two main sections: 'incoming' (LEFT) | 'sent' (RIGHT)
  const [activeSection, setActiveSection] = useState<'incoming' | 'sent'>('incoming');

  // Three status filters: 'pending' | 'accepted' | 'rejected'
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  // Reject Modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReferralForReject, setSelectedReferralForReject] = useState<Referral | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  useEffect(() => {
    loadNetworkData();
  }, [loadNetworkData]);

  const currentHospital = (user?.facility || 'PGI').toUpperCase();

  // Filter referrals by Section (Incoming vs Sent)
  const incomingReferrals = useMemo(() => {
    return referrals.filter(
      (r) =>
        r.receivingHospitalName?.toUpperCase() === currentHospital ||
        r.receivingHospitalId === user?.facilityId
    );
  }, [referrals, currentHospital, user?.facilityId]);

  const sentReferrals = useMemo(() => {
    return referrals.filter(
      (r) =>
        r.referringCentreName?.toUpperCase() === currentHospital ||
        (r as any).referringCentreId === user?.facilityId
    );
  }, [referrals, currentHospital, user?.facilityId]);

  // Active section list
  const activeList = activeSection === 'incoming' ? incomingReferrals : sentReferrals;

  // Filter by Status within active section
  const filteredList = useMemo(() => {
    return activeList.filter((r) => (r.status || 'pending').toLowerCase() === statusFilter);
  }, [activeList, statusFilter]);

  // Counts for Badges
  const pendingCount = activeList.filter((r) => (r.status || 'pending').toLowerCase() === 'pending').length;
  const acceptedCount = activeList.filter((r) => (r.status || 'pending').toLowerCase() === 'accepted').length;
  const rejectedCount = activeList.filter((r) => (r.status || 'pending').toLowerCase() === 'rejected').length;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Actions
  const handleAccept = async (referral: Referral) => {
    setIsActionProcessing(true);
    try {
      await acceptReferral(referral.referralId, user?.name || `${currentHospital} Attending`);
      await Promise.all([loadNetworkData(), usePatientStore.getState().loadBabies()]);
      Alert.alert(
        'Referral Accepted',
        `Referral for ${referral.babyName} (${referral.babyUhid}) from ${referral.referringCentreName} has been accepted.`
      );
    } catch {
      Alert.alert('Error', 'Failed to accept referral. Please try again.');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleOpenRejectModal = (referral: Referral) => {
    setSelectedReferralForReject(referral);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedReferralForReject) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a clinical or operational reason for declining this referral.');
      return;
    }

    setIsActionProcessing(true);
    try {
      await rejectReferral(
        selectedReferralForReject.referralId,
        rejectionReason.trim(),
        user?.name || `${currentHospital} Attending`
      );
      setRejectModalVisible(false);
      setSelectedReferralForReject(null);
      setRejectionReason('');
      await Promise.all([loadNetworkData(), usePatientStore.getState().loadBabies()]);
      Alert.alert('Referral Declined', 'The referring centre has been notified with the recorded reason.');
    } catch {
      Alert.alert('Error', 'Failed to decline referral. Please try again.');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const renderUrgencyTag = (urgency?: string) => {
    const u = (urgency || 'routine').toLowerCase();
    if (u === 'emergency') {
      return (
        <View style={[styles.urgencyTag, styles.urgencyTagEmergency]}>
          <Text style={styles.urgencyTagEmergencyText}>Emergency</Text>
        </View>
      );
    }
    if (u === 'urgent') {
      return (
        <View style={[styles.urgencyTag, styles.urgencyTagUrgent]}>
          <Text style={styles.urgencyTagUrgentText}>Urgent</Text>
        </View>
      );
    }
    return (
      <View style={[styles.urgencyTag, styles.urgencyTagNormal]}>
        <Text style={styles.urgencyTagNormalText}>Normal</Text>
      </View>
    );
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'accepted') {
      return (
        <View style={[styles.statusBadge, styles.statusAccepted]}>
          <CheckCircle2 size={12} color="#059669" />
          <Text style={styles.statusAcceptedText}>Accepted</Text>
        </View>
      );
    }
    if (s === 'rejected') {
      return (
        <View style={[styles.statusBadge, styles.statusRejected]}>
          <XCircle size={12} color="#DC2626" />
          <Text style={styles.statusRejectedText}>Rejected</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusPending]}>
        <Clock size={12} color="#D97706" />
        <Text style={styles.statusPendingText}>Pending</Text>
      </View>
    );
  };

  const renderReferralCard = ({ item }: { item: Referral }) => {
    const isIncomingPending = activeSection === 'incoming' && (item.status || 'pending').toLowerCase() === 'pending';

    return (
      <View style={styles.card}>
        {/* Card Header: Patient & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.cardPatientWrap}>
            <View style={styles.nameAndUrgencyRow}>
              <Text style={styles.babyName} numberOfLines={1}>
                {item.babyName || 'Newborn Patient'}
              </Text>
              {renderUrgencyTag(item.urgency)}
            </View>
            <Text style={styles.uhidText}>UHID: {item.babyUhid}</Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        {/* Clinical Info Row */}
        <View style={styles.clinicalGrid}>
          <View style={styles.clinicalCol}>
            <Text style={styles.clinicalLabel}>Bilirubin</Text>
            <Text style={styles.clinicalValueHighlight}>
              {item.latestBilirubinValue} {item.latestBilirubinUnit || 'mg/dL'}
            </Text>
          </View>
          <View style={styles.clinicalCol}>
            <Text style={styles.clinicalLabel}>Age</Text>
            <Text style={styles.clinicalValue}>{item.postnatalAgeHoursAtReferral || 48} hrs</Text>
          </View>
          <View style={styles.clinicalCol}>
            <Text style={styles.clinicalLabel}>GA</Text>
            <Text style={styles.clinicalValue}>{item.gestationalAgeWeeks || 38} wks</Text>
          </View>
        </View>

        {/* Transfer Pathway */}
        <View style={styles.routeRow}>
          {activeSection === 'sent' ? (
            <View style={styles.routeItem}>
              <ArrowUpRight size={14} color="#7D3BFF" />
              <Text style={styles.routeText}>
                Sent to: <Text style={styles.routeHospName}>{item.receivingHospitalName}</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.routeItem}>
              <ArrowDownLeft size={14} color="#059669" />
              <Text style={styles.routeText}>
                Received from: <Text style={styles.routeHospName}>{item.referringCentreName}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Clinical Summary */}
        {item.clinicalSummary &&
        !item.clinicalSummary.toLowerCase().includes('phototherapy refer') &&
        !item.clinicalSummary.toLowerCase().includes('bilirubin elevated') ? (
          <View style={styles.summaryWrap}>
            <Text style={styles.summaryText} numberOfLines={2}>
              {item.clinicalSummary}
            </Text>
          </View>
        ) : null}

        {/* Status Notes (Rejection reason) */}
        {item.status === 'rejected' && item.rejectionReason ? (
          <View style={styles.rejectionWrap}>
            <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        ) : null}

        {/* Incoming Pending Action Buttons */}
        {isIncomingPending && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleOpenRejectModal(item)}
              activeOpacity={0.8}
              disabled={isActionProcessing}
            >
              <X size={16} color="#DC2626" />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAccept(item)}
              activeOpacity={0.8}
              disabled={isActionProcessing}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: getScreenTopPadding(insets, 8) }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Referal</Text>
            <View style={styles.hospitalPill}>
              <View style={styles.hospitalDot} />
              <Text style={styles.hospitalPillText}>{user?.facility || 'Hospital'}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {onOpenCreateReferral && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onOpenCreateReferral}
                style={styles.newReferralBtn}
                accessibilityRole="button"
                accessibilityLabel="Create New Referral"
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.newReferralText}>Refer</Text>
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

        {/* ================= LEVEL 1: COMPACT PRIMARY WORKSPACE SECTION CONTROLS (INCOMING vs SENT) ================= */}
        <View style={styles.workspaceCardsRow}>
          {/* Card 1: Incoming Referrals (LEFT) */}
          <TouchableOpacity
            style={[
              styles.workspaceCard,
              activeSection === 'incoming' ? styles.workspaceCardActive : styles.workspaceCardInactive,
            ]}
            onPress={() => setActiveSection('incoming')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === 'incoming' }}
            accessibilityLabel={`Incoming Referrals, ${incomingReferrals.length} total`}
          >
            {activeSection === 'incoming' && <View style={styles.workspaceCardAccentBarIncoming} />}
            <View style={styles.compactCardContent}>
              <View
                style={[
                  styles.workspaceIconCircle,
                  activeSection === 'incoming'
                    ? styles.workspaceIconCircleActiveIncoming
                    : styles.workspaceIconCircleInactive,
                ]}
              >
                <ArrowDownLeft
                  size={15}
                  color={activeSection === 'incoming' ? '#059669' : '#64748B'}
                  strokeWidth={2.4}
                />
              </View>
              <Text
                style={[
                  styles.workspaceTitle,
                  activeSection === 'incoming' ? styles.workspaceTitleActive : styles.workspaceTitleInactive,
                ]}
                numberOfLines={1}
              >
                Incoming
              </Text>
              <View
                style={[
                  styles.workspaceCountBadge,
                  activeSection === 'incoming'
                    ? styles.workspaceCountBadgeActiveIncoming
                    : styles.workspaceCountBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.workspaceCountText,
                    activeSection === 'incoming'
                      ? styles.workspaceCountTextActiveIncoming
                      : styles.workspaceCountTextInactive,
                  ]}
                >
                  {incomingReferrals.length}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Sent Referrals (RIGHT) */}
          <TouchableOpacity
            style={[
              styles.workspaceCard,
              activeSection === 'sent' ? styles.workspaceCardActive : styles.workspaceCardInactive,
            ]}
            onPress={() => setActiveSection('sent')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === 'sent' }}
            accessibilityLabel={`Sent Referrals, ${sentReferrals.length} total`}
          >
            {activeSection === 'sent' && <View style={styles.workspaceCardAccentBarSent} />}
            <View style={styles.compactCardContent}>
              <View
                style={[
                  styles.workspaceIconCircle,
                  activeSection === 'sent'
                    ? styles.workspaceIconCircleActiveSent
                    : styles.workspaceIconCircleInactive,
                ]}
              >
                <ArrowUpRight
                  size={15}
                  color={activeSection === 'sent' ? '#7D3BFF' : '#64748B'}
                  strokeWidth={2.4}
                />
              </View>
              <Text
                style={[
                  styles.workspaceTitle,
                  activeSection === 'sent' ? styles.workspaceTitleActive : styles.workspaceTitleInactive,
                ]}
                numberOfLines={1}
              >
                Sent
              </Text>
              <View
                style={[
                  styles.workspaceCountBadge,
                  activeSection === 'sent'
                    ? styles.workspaceCountBadgeActiveSent
                    : styles.workspaceCountBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.workspaceCountText,
                    activeSection === 'sent'
                      ? styles.workspaceCountTextActiveSent
                      : styles.workspaceCountTextInactive,
                  ]}
                >
                  {sentReferrals.length}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= LEVEL 2: SECONDARY STATUS FILTERS (PENDING | ACCEPTED | REJECTED) ================= */}
        <View style={styles.statusFilterContainer}>
          <View style={styles.filterChipGroup}>
            {/* Pending Filter Chip */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'pending' ? styles.filterChipPendingActive : styles.filterChipInactive,
              ]}
              onPress={() => setStatusFilter('pending')}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityLabel={`Filter Pending (${pendingCount})`}
            >
              <Clock
                size={13}
                color={statusFilter === 'pending' ? '#D97706' : '#94A3B8'}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'pending' ? styles.filterChipTextPendingActive : styles.filterChipTextInactive,
                ]}
              >
                Pending
              </Text>
              <View
                style={[
                  styles.filterChipCountPill,
                  statusFilter === 'pending'
                    ? styles.filterChipCountPillPendingActive
                    : styles.filterChipCountPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipCountText,
                    statusFilter === 'pending'
                      ? styles.filterChipCountTextPendingActive
                      : styles.filterChipCountTextInactive,
                  ]}
                >
                  {pendingCount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Accepted Filter Chip */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'accepted' ? styles.filterChipAcceptedActive : styles.filterChipInactive,
              ]}
              onPress={() => setStatusFilter('accepted')}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityLabel={`Filter Accepted (${acceptedCount})`}
            >
              <CheckCircle2
                size={13}
                color={statusFilter === 'accepted' ? '#059669' : '#94A3B8'}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'accepted' ? styles.filterChipTextAcceptedActive : styles.filterChipTextInactive,
                ]}
              >
                Accepted
              </Text>
              <View
                style={[
                  styles.filterChipCountPill,
                  statusFilter === 'accepted'
                    ? styles.filterChipCountPillAcceptedActive
                    : styles.filterChipCountPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipCountText,
                    statusFilter === 'accepted'
                      ? styles.filterChipCountTextAcceptedActive
                      : styles.filterChipCountTextInactive,
                  ]}
                >
                  {acceptedCount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Rejected Filter Chip */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'rejected' ? styles.filterChipRejectedActive : styles.filterChipInactive,
              ]}
              onPress={() => setStatusFilter('rejected')}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityLabel={`Filter Rejected (${rejectedCount})`}
            >
              <XCircle
                size={13}
                color={statusFilter === 'rejected' ? '#DC2626' : '#94A3B8'}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'rejected' ? styles.filterChipTextRejectedActive : styles.filterChipTextInactive,
                ]}
              >
                Rejected
              </Text>
              <View
                style={[
                  styles.filterChipCountPill,
                  statusFilter === 'rejected'
                    ? styles.filterChipCountPillRejectedActive
                    : styles.filterChipCountPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipCountText,
                    statusFilter === 'rejected'
                      ? styles.filterChipCountTextRejectedActive
                      : styles.filterChipCountTextInactive,
                  ]}
                >
                  {rejectedCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Referral Cards List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id || item.referralId}
        renderItem={renderReferralCard}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadNetworkData} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Clock size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              No {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Referrals
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeSection === 'sent'
                ? `You have not sent any ${statusFilter} referrals from ${user?.facility || 'this hospital'}.`
                : `There are no incoming ${statusFilter} referrals received at ${user?.facility || 'this hospital'}.`}
            </Text>
          </View>
        }
      />

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Decline Referral</Text>
            <Text style={styles.modalSubtitle}>
              Provide a clinical or operational reason for declining referral of{' '}
              {selectedReferralForReject?.babyName}.
            </Text>

            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="e.g. NICU at full capacity, redirecting to tertiary apex center..."
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
                disabled={isActionProcessing}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, isActionProcessing && { opacity: 0.6 }]}
                onPress={handleConfirmReject}
                disabled={isActionProcessing}
              >
                {isActionProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Decline</Text>
                )}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  hospitalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  hospitalDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  hospitalPillText: {
    fontSize: fontScale(12),
    color: '#64748B',
    fontWeight: '600',
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
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
  },
  newReferralText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDotText: {
    color: '#FFFFFF',
    fontSize: fontScale(8),
    fontWeight: '700',
  },

  /* Level 1: Compact Primary Workspace Section Controls (Incoming vs Sent) */
  workspaceCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  workspaceCard: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  workspaceCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#7D3BFF',
    shadowColor: '#7D3BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workspaceCardInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  workspaceCardAccentBarIncoming: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#059669',
  },
  workspaceCardAccentBarSent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#7D3BFF',
  },
  compactCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workspaceIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceIconCircleActiveIncoming: {
    backgroundColor: '#ECFDF5',
  },
  workspaceIconCircleActiveSent: {
    backgroundColor: '#F3E8FF',
  },
  workspaceIconCircleInactive: {
    backgroundColor: '#E2E8F0',
  },
  workspaceTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  workspaceTitleActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  workspaceTitleInactive: {
    color: '#64748B',
  },
  workspaceCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  workspaceCountBadgeActiveIncoming: {
    backgroundColor: '#D1FAE5',
  },
  workspaceCountBadgeActiveSent: {
    backgroundColor: '#EDE9FE',
  },
  workspaceCountBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  workspaceCountText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
  },
  workspaceCountTextActiveIncoming: {
    color: '#065F46',
  },
  workspaceCountTextActiveSent: {
    color: '#6D28D9',
  },
  workspaceCountTextInactive: {
    color: '#64748B',
  },

  /* Level 2: Secondary Status Filter Bar */
  statusFilterContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 9,
    borderWidth: 1,
    gap: 4,
  },
  filterChipInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  filterChipPendingActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  filterChipAcceptedActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  filterChipRejectedActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  filterChipText: {
    fontSize: fontScale(11.5),
    fontWeight: '600',
  },
  filterChipTextInactive: {
    color: '#64748B',
  },
  filterChipTextPendingActive: {
    color: '#B45309',
    fontWeight: '800',
  },
  filterChipTextAcceptedActive: {
    color: '#065F46',
    fontWeight: '800',
  },
  filterChipTextRejectedActive: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  filterChipCountPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  filterChipCountPillInactive: {
    backgroundColor: '#E2E8F0',
  },
  filterChipCountPillPendingActive: {
    backgroundColor: '#FDE68A',
  },
  filterChipCountPillAcceptedActive: {
    backgroundColor: '#A7F3D0',
  },
  filterChipCountPillRejectedActive: {
    backgroundColor: '#FECACA',
  },
  filterChipCountText: {
    fontSize: fontScale(10),
    fontWeight: '700',
  },
  filterChipCountTextInactive: {
    color: '#64748B',
  },
  filterChipCountTextPendingActive: {
    color: '#78350F',
  },
  filterChipCountTextAcceptedActive: {
    color: '#064E3B',
  },
  filterChipCountTextRejectedActive: {
    color: '#7F1D1D',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardPatientWrap: {
    flex: 1,
    marginRight: 8,
  },
  nameAndUrgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  babyName: {
    fontSize: fontScale(15),
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  urgencyTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'center',
  },
  urgencyTagNormal: {
    backgroundColor: '#ECFDF5',
  },
  urgencyTagNormalText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#059669',
  },
  urgencyTagUrgent: {
    backgroundColor: '#FEF3C7',
  },
  urgencyTagUrgentText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#D97706',
  },
  urgencyTagEmergency: {
    backgroundColor: '#FEE2E2',
  },
  urgencyTagEmergencyText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#DC2626',
  },
  uhidText: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#D97706',
  },
  statusAccepted: {
    backgroundColor: '#DCFCE7',
  },
  statusAcceptedText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#059669',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusRejectedText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#DC2626',
  },
  clinicalGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  clinicalCol: {
    flex: 1,
  },
  clinicalLabel: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  clinicalValue: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  clinicalValueHighlight: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 2,
  },
  riskZonePill: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  riskZoneText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#D97706',
  },
  routeRow: {
    marginBottom: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    fontSize: fontScale(12),
    color: '#64748B',
  },
  routeHospName: {
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: fontScale(11),
    color: '#475569',
    lineHeight: 16,
  },
  rejectionWrap: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  rejectionLabel: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#DC2626',
  },
  rejectionText: {
    fontSize: fontScale(11),
    color: '#7F1D1D',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  rejectBtnText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#DC2626',
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 8,
    backgroundColor: '#059669',
    gap: 6,
  },
  acceptBtnText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: fontScale(15),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fontScale(16),
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: fontScale(12),
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: fontScale(13),
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});