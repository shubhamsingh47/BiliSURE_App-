import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { PTStation, Admission, Baby } from '../../../types';
import { COLORS } from '../../../theme/colors';

interface NurseStationAllocationScreenProps {
  onBack?: () => void;
  onOpenNotifications?: () => void;
  embedded?: boolean;
  selectedBaby?: Baby | null;
  onBabyAllocated?: (baby: Baby, station: PTStation) => void;
}

export const NurseStationAllocationScreen: React.FC<NurseStationAllocationScreenProps> = ({
  onBack,
  onOpenNotifications,
  embedded = false,
  selectedBaby = null,
  onBabyAllocated,
}) => {
  const { stations, admissions, allocateStation, allocateBabyToStation, updateStationStatus, notifications } = useNetworkStore();
  const { babies } = usePatientStore();
  const { user } = useAuthStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const currentHosp = (user?.facility || 'PGI').toUpperCase();
  const currentHospId = user?.facilityId || (currentHosp === 'KGMU' ? 'hosp_kgmu' : currentHosp === 'RML' ? 'hosp_rml' : 'hosp_pgi');

  const hospitalStations = stations.filter(
    (s) => s.hospitalId === currentHospId || s.hospitalName?.toUpperCase() === currentHosp
  );

  const hospitalAdmissions = admissions.filter(
    (a) => a.hospitalId === currentHospId || a.hospitalName?.toUpperCase() === currentHosp
  );

  // Check if a baby (by UHID or ID) is already occupying an active station in this hospital
  const isBabyAlreadyAllocated = (babyUhid?: string, babyId?: string) => {
    if (!babyUhid && !babyId) return false;
    return hospitalStations.some(
      (s) =>
        s.operationalStatus === 'occupied' &&
        ((babyUhid && s.currentBabyUhid === babyUhid) || (babyId && s.currentBabyId === babyId))
    );
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleAllocate = async (station: PTStation) => {
    const targetBaby: Baby | null = selectedBaby;

    if (!targetBaby) {
      Alert.alert('No Baby Selected', 'Please select a baby to send to phototherapy first.');
      return;
    }

    // STRICT CHECK: Ensure patient is not already allocated anywhere
    if (isBabyAlreadyAllocated(targetBaby.uhid, targetBaby.id)) {
      Alert.alert(
        'Patient Already Allocated',
        `Patient ${targetBaby.parentsName || targetBaby.name} (${targetBaby.uhid}) is already assigned to an active phototherapy station.`
      );
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
    const babyName = targetBaby.parentsName || targetBaby.name;
    const babyUhid = targetBaby.uhid;
    try {
      await allocateBabyToStation(targetBaby, station.stationId || station.id, user.name);
      
      await usePatientStore.getState().updateBaby(targetBaby.id, {
        status: 'under_treatment',
        currentStationId: `${station.name} (${station.stationId})`,
      });

      usePatientStore.getState().selectBaby(null);

      Alert.alert(
        'Station Allocated!',
        `${babyName} (${babyUhid}) placed in ${station.name} (${station.stationId}). Phototherapy treatment has begun!`
      );
      onBabyAllocated?.(targetBaby, station);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to allocate station');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkSanitized = async (station: PTStation) => {
    setIsProcessing(true);
    try {
      await updateStationStatus(station.id || station.stationId, 'available', {
        notes: `Sanitized and inspected ready for neonatal admission by ${user.name}`,
      });
      Alert.alert(
        'Station Ready',
        `Station ${station.name} (${station.stationId}) has returned to the Available Pool. Hospital capacity updated.`
      );
    } catch {
      Alert.alert('Error', 'Failed to update station readiness');
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

  const availableCount = hospitalStations.filter((s) => s.operationalStatus === 'available').length;
  const occupiedCount = hospitalStations.filter((s) => s.operationalStatus === 'occupied').length;
  const cleaningCount = hospitalStations.filter((s) => s.operationalStatus === 'cleaning_prep').length;

  return (
    <View style={styles.container}>
      {/* Standalone Header (only when not embedded) */}
      {!embedded && (
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              {onBack && (
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
              )}
              <View>
                <Text style={styles.headerTitle}>PT Station Allocation</Text>
              </View>
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

          {/* Live Fleet Capacity Strip (Standalone) */}
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
              <Text style={styles.fleetStatusVal}>{hospitalStations.length}</Text>
              <Text style={styles.fleetStatusLbl}>Total</Text>
            </View>
          </View>
        </View>
      )}

      {/* Embedded Live Fleet Capacity Strip (Clean White Card on Slate Background) */}
      {embedded && (
        <View style={styles.embeddedFleetCard}>
          <View style={styles.fleetStatusCol}>
            <Text style={[styles.embeddedFleetVal, { color: '#00A569' }]}>{availableCount}</Text>
            <Text style={styles.embeddedFleetLbl}>Available</Text>
          </View>
          <View style={styles.embeddedDivider} />
          <View style={styles.fleetStatusCol}>
            <Text style={[styles.embeddedFleetVal, { color: '#FC3949' }]}>{occupiedCount}</Text>
            <Text style={styles.embeddedFleetLbl}>Occupied</Text>
          </View>
          <View style={styles.embeddedDivider} />
          <View style={styles.fleetStatusCol}>
            <Text style={[styles.embeddedFleetVal, { color: '#D97706' }]}>{cleaningCount}</Text>
            <Text style={styles.embeddedFleetLbl}>Sanitizing</Text>
          </View>
          <View style={styles.embeddedDivider} />
          <View style={styles.fleetStatusCol}>
            <Text style={[styles.embeddedFleetVal, { color: '#181829' }]}>{hospitalStations.length}</Text>
            <Text style={styles.embeddedFleetLbl}>Total Units</Text>
          </View>
        </View>
      )}

      {/* Station Cards Grid */}
      <FlatList
        data={hospitalStations}
        keyExtractor={(item) => item.id || item.stationId}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
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
              <Text style={styles.stationLocation}>📍 {item.location}</Text>

              {item.operationalStatus === 'occupied' && (
                <View style={styles.occupantBanner}>
                  <Text style={styles.occupantLabel}>Current Patient:</Text>
                  <Text style={styles.occupantName}>{item.currentBabyName} ({item.currentBabyUhid})</Text>
                </View>
              )}

              {item.notes ? (
                <Text style={styles.notesText}>Note: {item.notes}</Text>
              ) : null}

              {/* Bottom Right Action for Allocation */}
              {isAvail && (
                <View style={styles.cardBottomRow}>
                  <TouchableOpacity
                    onPress={() => handleAllocate(item)}
                    style={[
                      styles.compactAllocateBtn,
                      isProcessing && styles.allocateBtnDisabled,
                      !selectedBaby && { backgroundColor: '#7D3BFF' },
                    ]}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.compactAllocateBtnText}>
                      {selectedBaby ? 'Send Patient to Station →' : 'Select Baby to Allocate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.operationalStatus === 'cleaning_prep' && (
                <View style={styles.cardBottomRow}>
                  <TouchableOpacity
                    onPress={() => handleMarkSanitized(item)}
                    style={styles.compactSanitizeBtn}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.compactSanitizeBtnText}>
                      ✨ Mark Ready
                    </Text>
                  </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
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
  embeddedFleetCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  embeddedFleetVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  embeddedFleetLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  embeddedDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  embeddedPatientBox: {
    backgroundColor: '#F3E8FF',
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  embeddedSelectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D3BFF',
    marginBottom: 6,
  },
  embeddedPatientPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  embeddedPatientPillActive: {
    backgroundColor: '#7D3BFF',
    borderColor: '#7D3BFF',
  },
  embeddedPatientPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#181829',
  },
  embeddedPatientPillTextActive: {
    color: '#FFFFFF',
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
    marginBottom: 6,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  compactAllocateBtn: {
    backgroundColor: '#00A569',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAllocateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  allocateBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  compactSanitizeBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactSanitizeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

