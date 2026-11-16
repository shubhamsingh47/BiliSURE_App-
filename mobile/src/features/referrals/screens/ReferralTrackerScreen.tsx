import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { Referral, ReferralStatus } from '../../../types';
import { COLORS } from '../../../theme/colors';

interface ReferralTrackerScreenProps {
  onBack?: () => void;
  onSelectReferral?: (referral: Referral) => void;
}

export const ReferralTrackerScreen: React.FC<ReferralTrackerScreenProps> = ({
  onBack,
  onSelectReferral,
}) => {
  const { referrals } = useNetworkStore();
  const [activeFilter, setActiveFilter] = useState<'all' | ReferralStatus>('all');

  const filteredReferrals = referrals.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

  const getStatusBadge = (status: ReferralStatus) => {
    switch (status) {
      case 'accepted':
      case 'arrived':
      case 'admitted':
        return { label: status.toUpperCase(), bg: '#F2FDEF', text: '#00A569' };
      case 'rejected':
      case 'cancelled':
        return { label: status.toUpperCase(), bg: '#FFF1F2', text: '#FC3949' };
      default:
        return { label: 'PENDING REVIEW', bg: '#FFFBEB', text: '#D97706' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Referral Tracking</Text>
            <Text style={styles.headerSubtitle}>Status of District Phototherapy Transfers</Text>
          </View>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((filter) => {
            const isSel = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterPill, isSel && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, isSel && styles.filterTextActive]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Referral Cards */}
      <FlatList
        data={filteredReferrals}
        keyExtractor={(item) => item.id || item.referralId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No referrals in '{activeFilter}' state.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);

          return (
            <TouchableOpacity
              onPress={() => onSelectReferral && onSelectReferral(item)}
              style={styles.card}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.idPill}>
                  <Text style={styles.idText}>{item.referralId}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>

              <Text style={styles.babyName}>{item.babyName} ({item.babyUhid})</Text>

              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLbl}>Receiving Hospital:</Text>
                  <Text style={styles.detailVal}>{item.receivingHospitalName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLbl}>Latest Bilirubin:</Text>
                  <Text style={[styles.detailVal, { color: '#7D3BFF', fontWeight: '800' }]}>
                    {item.latestBilirubinValue} {item.latestBilirubinUnit || 'mg/dL'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLbl}>Bhutani Risk Zone:</Text>
                  <Text style={styles.detailVal}>{item.latestBhutaniRiskZone?.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLbl}>Urgency:</Text>
                  <Text style={[styles.detailVal, { color: item.urgency === 'emergency' ? '#FC3949' : '#F59E0B' }]}>
                    {item.urgency.toUpperCase()}
                  </Text>
                </View>
                {item.rejectionReason && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionTitle}>Declined Reason:</Text>
                    <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.timestamp}>
                  Created: {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
  },
  backBtnText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    padding: 4,
  },
  filterPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 10,
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterTextActive: {
    color: '#7D3BFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  idPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  idText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  babyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181829',
    marginBottom: 8,
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLbl: {
    fontSize: 11,
    color: '#64748B',
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#181829',
  },
  rejectionBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  rejectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FC3949',
    marginBottom: 2,
  },
  rejectionText: {
    fontSize: 11,
    color: '#991B1B',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  timestamp: {
    fontSize: 10,
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
