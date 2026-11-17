import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { PTStation, Admission } from '../../../types';
import { COLORS } from '../../../theme/colors';

interface NurseStationAllocationScreenProps {
  onBack?: () => void;
}

export const NurseStationAllocationScreen: React.FC<NurseStationAllocationScreenProps> = ({
  onBack,
}) => {
  const { stations, admissions, allocateStation } = useNetworkStore();
  const { user } = useAuthStore();

  // Find admitted babies awaiting station allocation
  const pendingAdmissions = admissions.filter(
    (a) => a.admissionStatus === 'admitted' && !a.ptStationId
  );
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(
    pendingAdmissions[0] || null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAllocate = async (station: PTStation) => {
    if (!selectedAdmission) {
      Alert.alert('Select Patient', 'Please select an admitted patient above to allocate.');
      return;
    }

    if (station.operationalStatus === 'occupied') {
      Alert.alert('Station Occupied', `Station ${station.stationId} is already occupied by ${station.currentBabyName || 'another patient'}. Double allocation is prevented.`);
      return;
    }

    if (station.operationalStatus === 'maintenance' || station.operationalStatus === 'out_of_service') {
      Alert.alert('Station Unavailable', `Station ${station.stationId} is currently under maintenance.`);
      return;
    }

    if (station.operationalStatus === 'cleaning_prep') {
      Alert.alert('Cleaning in Progress', `Station ${station.stationId} requires sanitization confirmation before it can be occupied.`);
      return;
    }

    setIsProcessing(true);
    try {
      await allocateStation(selectedAdmission.id || selectedAdmission.admissionId, station.id || station.stationId, user.name);
      Alert.alert(
        'Station Allocated!',
        `${selectedAdmission.babyName} successfully placed in ${station.name} (${station.stationId}). Phototherapy treatment can now begin.`
      );
    } catch {
      Alert.alert('Error', 'Failed to allocate station');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStationBadge = (status: string) => {
    switch (status) {
      case 'available':
        return { label: 'AVAILABLE', bg: '#F2FDEF', text: '#00A569' };
      case 'occupied':
        return { label: 'OCCUPIED', bg: '#FFF1F2', text: '#FC3949' };
      case 'cleaning_prep':
        return { label: 'CLEANING / PREP', bg: '#FFFBEB', text: '#D97706' };
      default:
        return { label: 'MAINTENANCE', bg: '#F1F5F9', text: '#64748B' };
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
            <Text style={styles.headerTitle}>PT Station Allocation</Text>
            <Text style={styles.headerSubtitle}>Real-time Station Bay Management</Text>
          </View>
        </View>

        {/* Admitted Patient Selector Banner */}
        {pendingAdmissions.length > 0 ? (
          <View style={styles.patientSelectBox}>
            <Text style={styles.selectLabel}>Select Patient for Bed Assignment:</Text>
            <View style={styles.pillList}>
              {pendingAdmissions.map((adm) => {
                const isSel = selectedAdmission?.admissionId === adm.admissionId;
                return (
                  <TouchableOpacity
                    key={adm.admissionId}
                    onPress={() => setSelectedAdmission(adm)}
                    style={[styles.patientPill, isSel && styles.patientPillActive]}
                  >
                    <Text style={[styles.patientPillText, isSel && styles.patientPillTextActive]}>
                      {adm.babyName} ({adm.babyUhid})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.noPendingBanner}>
            <Text style={styles.noPendingText}>All currently admitted patients have active PT stations.</Text>
          </View>
        )}
      </View>

      {/* Station Cards Grid */}
      <FlatList
        data={stations}
        keyExtractor={(item) => item.id || item.stationId}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        renderItem={({ item }) => {
          const badge = getStationBadge(item.operationalStatus);
          const isAvail = item.operationalStatus === 'available';

          return (
            <View style={styles.stationCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.stationIdBadge}>
                  <Text style={styles.stationIdText}>{item.stationId}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>

              <Text style={styles.stationName}>{item.name}</Text>
              <Text style={styles.stationLocation}>📍 {item.location} • Type: {item.type.replace('_', ' ').toUpperCase()}</Text>

              {item.operationalStatus === 'occupied' && (
                <View style={styles.occupantBanner}>
                  <Text style={styles.occupantLabel}>Current Patient:</Text>
                  <Text style={styles.occupantName}>{item.currentBabyName} ({item.currentBabyUhid})</Text>
                </View>
              )}

              {item.notes ? (
                <Text style={styles.notesText}>Note: {item.notes}</Text>
              ) : null}

              {/* Allocate Button */}
              {isAvail ? (
                <TouchableOpacity
                  onPress={() => handleAllocate(item)}
                  style={[styles.allocateBtn, (!selectedAdmission || isProcessing) && styles.allocateBtnDisabled]}
                  disabled={!selectedAdmission || isProcessing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.allocateBtnText}>
                    {selectedAdmission ? `Allocate to ${selectedAdmission.babyName} →` : 'Select Patient Above'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.unavailableRow}>
                  <Text style={styles.unavailableText}>
                    {item.operationalStatus === 'occupied'
                      ? 'Station Busy (Locked)'
                      : item.operationalStatus === 'cleaning_prep'
                      ? 'Sanitization Required'
                      : 'Under Service'}
                  </Text>
                </View>
              )}
            </View>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  patientSelectBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 10,
    marginTop: 4,
  },
  selectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
  },
  pillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  patientPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  patientPillActive: {
    backgroundColor: '#00A569',
  },
  patientPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  patientPillTextActive: {
    color: '#FFFFFF',
  },
  noPendingBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 8,
    marginTop: 4,
  },
  noPendingText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stationCard: {
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationIdBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stationIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7D3BFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
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
  occupantBanner: {
    backgroundColor: '#FFF1F2',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  occupantLabel: {
    fontSize: 9,
    color: '#FC3949',
    fontWeight: '700',
  },
  occupantName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  notesText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  allocateBtn: {
    backgroundColor: '#00A569',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocateBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  allocateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unavailableRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
