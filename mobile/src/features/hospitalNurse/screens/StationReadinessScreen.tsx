import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { PTStation } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { AppAlert } from '../../../components';

interface StationReadinessScreenProps {
  onBack?: () => void;
}

export const StationReadinessScreen: React.FC<StationReadinessScreenProps> = ({
  onBack,
}) => {
  const { stations, updateStationStatus } = useNetworkStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Stations needing cleaning or currently in preparation
  const cleaningStations = stations.filter((s) => s.operationalStatus === 'cleaning_prep');
  const allOtherStations = stations.filter((s) => s.operationalStatus !== 'cleaning_prep');

  const handleConfirmReady = async (station: PTStation) => {
    setIsProcessing(true);
    try {
      await updateStationStatus(station.id || station.stationId, 'available', {
        notes: `Sanitized and inspected ready for neonatal admission by ${user.name}`,
      });
      AppAlert.success(
        'Operational Readiness Confirmed',
        `Station ${station.name} (${station.stationId}) has returned to the Available Pool. Hospital capacity updated.`
      );
    } catch {
      AppAlert.error('Error', 'Failed to update readiness status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const insets = useSafeAreaInsets();

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
            <Text style={styles.headerTitle}>Station Sanitization & Readiness</Text>
            <Text style={styles.headerSubtitle}>Infection Prevention & Bed Release • {user.facility}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={cleaningStations}
        keyExtractor={(item) => item.id || item.stationId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.infoBanner}>
            <Text style={styles.infoTitle}>Operational Readiness Protocol</Text>
            <Text style={styles.infoText}>
              Following neonate discharge, stations must be thoroughly sanitized with neonatal-grade disinfectant, optical irradiance calibrated, and fresh linen positioned before marking 'Available'.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>All Stations Fully Ready</Text>
            <Text style={styles.emptySub}>No stations are currently awaiting cleaning or preparation.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cleaningPill}>
                <Text style={styles.cleaningPillText}>REQUIRES SANITIZATION</Text>
              </View>
              <Text style={styles.stationIdText}>{item.stationId}</Text>
            </View>

            <Text style={styles.stationName}>{item.name}</Text>
            <Text style={styles.stationLocation}>📍 {item.location} • Type: {item.type.replace('_', ' ').toUpperCase()}</Text>

            {item.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            ) : null}

            {/* Checklist items */}
            <View style={styles.checklist}>
              <Text style={styles.checkItem}>✓ Acrylic bassinet & tunnel wiped with disinfectant</Text>
              <Text style={styles.checkItem}>✓ Blue LED phototherapy lamp surfaces sanitized</Text>
              <Text style={styles.checkItem}>✓ Clean eye shields and disposable pad placed</Text>
            </View>

            <TouchableOpacity
              onPress={() => handleConfirmReady(item)}
              style={styles.readyBtn}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.readyBtnText}>
                {isProcessing ? 'Updating...' : '✓ Confirm Ready → Return to Available Pool'}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
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
  cleaningPill: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cleaningPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  stationIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7D3BFF',
  },
  stationName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#181829',
    marginBottom: 2,
  },
  stationLocation: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },
  checklist: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  checkItem: {
    fontSize: 11,
    color: '#166534',
    marginBottom: 3,
    fontWeight: '500',
  },
  readyBtn: {
    backgroundColor: '#00A569',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyBtnText: {
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
  },
});
