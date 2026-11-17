import React, { useState, useEffect } from 'react';
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

  // Check if a baby (by UHID or ID) is already occupying an active station
  const isBabyAlreadyAllocated = (babyUhid?: string, babyId?: string) => {
    if (!babyUhid && !babyId) return false;
    return stations.some(
      (s) =>
        s.operationalStatus === 'occupied' &&
        ((babyUhid && s.currentBabyUhid === babyUhid) || (babyId && s.currentBabyId === babyId))
    );
  };

  // Find admitted babies awaiting station allocation (excluding any baby already occupying a station)
  const pendingAdmissions = admissions.filter(
    (a) =>
      a.admissionStatus === 'admitted' &&
      !a.ptStationId &&
      !isBabyAlreadyAllocated(a.babyUhid, a.babyId)
  );

  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(
    pendingAdmissions[0]?.admissionId || pendingAdmissions[0]?.id || null
  );

  // Sync selectedAdmissionId: if selected baby was allocated or no longer in pending, update immediately
  useEffect(() => {
    const isStillPending = pendingAdmissions.some(
      (a) => (a.admissionId === selectedAdmissionId || a.id === selectedAdmissionId)
    );
    if (!isStillPending) {
      setSelectedAdmissionId(pendingAdmissions[0]?.admissionId || pendingAdmissions[0]?.id || null);
    }
  }, [admissions, stations, pendingAdmissions.length, selectedAdmissionId]);

  const selectedAdmission = pendingAdmissions.find(
    (a) => a.admissionId === selectedAdmissionId || a.id === selectedAdmissionId
  ) || null;

  const [isProcessing, setIsProcessing] = useState(false);

  const handleAllocate = async (station: PTStation) => {
    if (!selectedAdmission) {
      Alert.alert('Select Patient', 'Please select an admitted patient above to allocate.');
      return;
    }

    // STRICT CHECK: Ensure patient is not already allocated anywhere
    if (isBabyAlreadyAllocated(selectedAdmission.babyUhid, selectedAdmission.babyId)) {
      Alert.alert(
        'Patient Already Allocated',
        `Patient ${selectedAdmission.babyName} (${selectedAdmission.babyUhid}) is already assigned to an active phototherapy station. A patient cannot occupy more than one station.`
      );
      setSelectedAdmissionId(pendingAdmissions[0]?.admissionId || null);
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
    const babyName = selectedAdmission.babyName;
    const babyUhid = selectedAdmission.babyUhid;
    try {
      await allocateStation(selectedAdmission.id || selectedAdmission.admissionId, station.id || station.stationId, user.name);
      
      // Auto-select next unallocated patient if any
      const nextPending = pendingAdmissions.filter(
        (a) => a.admissionId !== selectedAdmission.admissionId && a.id !== selectedAdmission.id
      );
      setSelectedAdmissionId(nextPending[0]?.admissionId || nextPending[0]?.id || null);

      Alert.alert(
        'Station Allocated!',
        `${babyName} (${babyUhid}) successfully placed in ${station.name} (${station.stationId}). Phototherapy treatment can now begin.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to allocate station');
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

  const availableCount = stations.filter((s) => s.operationalStatus === 'available').length;
  const occupiedCount = stations.filter((s) => s.operationalStatus === 'occupied').length;
  const cleaningCount = stations.filter((s) => s.operationalStatus === 'cleaning_prep').length;

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

        {/* Live Fleet Capacity Strip */}
        <View style={styles.fleetStatusCard}>
          <View style={styles.fleetStatusCol}>
            <Text style={[styles.fleetStatusVal, { color: '#00A569' }]}>{availableCount}</Text>
            <Text style={styles.fleetStatusLbl}>Available</Text>
          </View>
          <View style={styles.fleetDivider} />
          <View style={styles.fleetStatusCol}>
            <Text style={[styles.fleetStatusVal, { color: '#FC3949' }]}>{occupiedCount}</Text>
            <Text style={styles.fleetStatusLbl}>Occupied</Text>
          </View>
          <View style={styles.fleetDivider} />
          <View style={styles.fleetStatusCol}>
            <Text style={[styles.fleetStatusVal, { color: '#D97706' }]}>{cleaningCount}</Text>
            <Text style={styles.fleetStatusLbl}>Sanitizing</Text>
          </View>
          <View style={styles.fleetDivider} />
          <View style={styles.fleetStatusCol}>
            <Text style={styles.fleetStatusVal}>{stations.length}</Text>
            <Text style={styles.fleetStatusLbl}>Total</Text>
          </View>
        </View>

        {/* Admitted Patient Selector Banner */}
        {pendingAdmissions.length > 0 ? (
          <View style={styles.patientSelectBox}>
            <Text style={styles.selectLabel}>Select Patient for Bed Assignment:</Text>
            <View style={styles.pillList}>
              {pendingAdmissions.map((adm) => {
                const isSel = selectedAdmission?.admissionId === adm.admissionId || selectedAdmission?.id === adm.id;
                return (
                  <TouchableOpacity
                    key={adm.admissionId || adm.id}
                    onPress={() => setSelectedAdmissionId(adm.admissionId || adm.id)}
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

              {/* Allocate Button / Station Status */}
              {isAvail ? (
                selectedAdmission ? (
                  <TouchableOpacity
                    onPress={() => handleAllocate(item)}
                    style={[styles.allocateBtn, isProcessing && styles.allocateBtnDisabled]}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.allocateBtnText}>
                      Allocate to {selectedAdmission.babyName} ({selectedAdmission.babyUhid}) →
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.availableUnassignedBox}>
                    <Text style={styles.availableUnassignedText}>
                      {pendingAdmissions.length === 0
                        ? '✓ Station Available • No Patients Awaiting Bed'
                        : 'Select Admitted Patient Above to Allocate'}
                    </Text>
                  </View>
                )
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
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  fleetStatusCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fleetStatusCol: {
    flex: 1,
    alignItems: 'center',
  },
  fleetDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  fleetStatusVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fleetStatusLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
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
    padding: 10,
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
  availableUnassignedBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  availableUnassignedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
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
