import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { Referral } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { getScreenTopPadding } from '../../../theme/responsive';
import { AppAlert } from '../../../components';

interface NurseArrivalsScreenProps {
  onArrivalConfirmed?: (admissionId: string) => void;
  onOpenNotifications?: () => void;
  embedded?: boolean;
}

export const NurseArrivalsScreen: React.FC<NurseArrivalsScreenProps> = ({
  onArrivalConfirmed,
  onOpenNotifications,
  embedded = false,
}) => {
  const { referrals, confirmArrival, notifications } = useNetworkStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Accepted referrals that haven't physically arrived yet
  const incomingAccepted = referrals.filter((r) => r.status === 'accepted');

  const handleConfirmArrival = async (referral: Referral) => {
    setIsProcessing(true);
    try {
      const admission = await confirmArrival(referral.referralId, user.name, user.facility);
      AppAlert.success(
        'Arrival Confirmed!',
        `${referral.babyName} (${referral.babyUhid}) marked as physically arrived. Admission episode ${admission.admissionId} created. You can now allocate a PT Station.`,
        () => {
          if (onArrivalConfirmed) onArrivalConfirmed(admission.admissionId);
        },
        'Allocate PT Station'
      );
    } catch {
      AppAlert.error('Error', 'Failed to confirm arrival.');
    } finally {
      setIsProcessing(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      {!embedded && (
        <View style={[styles.header, { paddingTop: getScreenTopPadding(insets, 10) }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Arrivals & Admissions</Text>
              <Text style={styles.headerSubtitle}>
                Confirm Physical Patient Arrival • {user.facility}
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
      )}

      {/* Accepted List */}
      <FlatList
        data={incomingAccepted}
        keyExtractor={(item) => item.id || item.referralId}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👶</Text>
            <Text style={styles.emptyTitle}>No Pending Inbound Transfers</Text>
            <Text style={styles.emptySub}>
              All accepted neonatal referrals have been admitted or no patients are currently en route.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.babyName}>{item.babyName} ({item.babyUhid})</Text>
            <Text style={styles.sourceText}>From: {item.referringCentreName} ({item.referringDoctorName})</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLbl}>Bilirubin at Transfer</Text>
                <Text style={[styles.detailVal, { color: '#7D3BFF' }]}>
                  {item.latestBilirubinValue} {item.latestBilirubinUnit}
                </Text>
              </View>
              <View style={[styles.detailCol, styles.detailColMiddle]}>
                <Text style={styles.detailLbl}>Risk Zone</Text>
                <Text style={styles.detailVal}>{item.latestBhutaniRiskZone?.replace('_', ' ').toUpperCase()}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLbl}>Urgency</Text>
                <Text style={[styles.detailVal, { color: item.urgency === 'emergency' ? '#FC3949' : '#F59E0B' }]}>
                  {item.urgency.toUpperCase()}
                </Text>
              </View>
            </View>

            {item.clinicalSummary ? (
              <View style={styles.clinicalBox}>
                <Text style={styles.clinicalLabel}>Transfer Summary:</Text>
                <Text style={styles.clinicalText}>{item.clinicalSummary}</Text>
              </View>
            ) : null}

            {/* Confirm Physical Arrival Button */}
            <TouchableOpacity
              onPress={() => handleConfirmArrival(item)}
              style={styles.confirmBtn}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {isProcessing ? 'Confirming...' : '✓ Confirm Physical Arrival & Admit'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  babyName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181829',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailCol: {
    flex: 1,
  },
  detailColMiddle: {
    flex: 1.15,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#181829',
    lineHeight: 16,
  },
  clinicalBox: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  clinicalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7D3BFF',
    marginBottom: 2,
  },
  clinicalText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
  },
  confirmBtn: {
    backgroundColor: '#7D3BFF',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
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
});
