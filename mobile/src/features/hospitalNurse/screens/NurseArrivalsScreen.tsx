import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { Referral } from '../../../types';
import { COLORS } from '../../../theme/colors';

interface NurseArrivalsScreenProps {
  onArrivalConfirmed?: (admissionId: string) => void;
}

export const NurseArrivalsScreen: React.FC<NurseArrivalsScreenProps> = ({
  onArrivalConfirmed,
}) => {
  const { referrals, confirmArrival } = useNetworkStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Accepted referrals that haven't physically arrived yet
  const incomingAccepted = referrals.filter((r) => r.status === 'accepted');

  const handleConfirmArrival = async (referral: Referral) => {
    setIsProcessing(true);
    try {
      const admission = await confirmArrival(referral.referralId, user.name, user.facility);
      Alert.alert(
        'Arrival Confirmed!',
        `Baby ${referral.babyName} (${referral.babyUhid}) marked as physically arrived. Admission episode ${admission.admissionId} created. You can now allocate a PT Station.`,
        [
          {
            text: 'Allocate PT Station',
            onPress: () => onArrivalConfirmed && onArrivalConfirmed(admission.admissionId),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to confirm arrival');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arrivals & Admissions</Text>
        <Text style={styles.headerSubtitle}>
          Confirm Physical Patient Arrival • {user.facility}
        </Text>
      </View>

      {/* Accepted List */}
      <FlatList
        data={incomingAccepted}
        keyExtractor={(item) => item.id || item.referralId}
        contentContainerStyle={styles.listContent}
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
            <View style={styles.cardHeader}>
              <View style={styles.acceptedBadge}>
                <Text style={styles.acceptedBadgeText}>ACCEPTED FOR ADMISSION</Text>
              </View>
              <Text style={styles.idText}>{item.referralId}</Text>
            </View>

            <Text style={styles.babyName}>{item.babyName} ({item.babyUhid})</Text>
            <Text style={styles.sourceText}>From: {item.referringCentreName} ({item.referringDoctorName})</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLbl}>Bilirubin at Transfer</Text>
                <Text style={[styles.detailVal, { color: '#7D3BFF' }]}>
                  {item.latestBilirubinValue} {item.latestBilirubinUnit}
                </Text>
              </View>
              <View style={styles.detailCol}>
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
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  acceptedBadge: {
    backgroundColor: '#F2FDEF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  acceptedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00A569',
  },
  idText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  babyName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181829',
    marginBottom: 2,
  },
  sourceText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  detailCol: {
    flex: 1,
  },
  detailLbl: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#181829',
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
