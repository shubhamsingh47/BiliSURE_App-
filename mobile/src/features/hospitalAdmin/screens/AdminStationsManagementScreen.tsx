import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { PTStation, PTStationType, PTStationStatus } from '../../../types';
import { COLORS } from '../../../theme/colors';

export const AdminStationsManagementScreen: React.FC = () => {
  const { stations, registerStation, updateStationStatus, hospitals } = useNetworkStore();
  const { user } = useAuthStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newStationId, setNewStationId] = useState('');
  const [newStationName, setNewStationName] = useState('');
  const [newStationType, setNewStationType] = useState<PTStationType>('double_surface');
  const [newStationLocation, setNewStationLocation] = useState('NICU Bay 3');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentHospital = hospitals.find((h) => h.id === 'hosp_001') || hospitals[0];
  const hospitalStations = stations.filter((s) => s.hospitalId === 'hosp_001');

  const handleAddStation = async () => {
    if (!newStationId.trim() || !newStationName.trim()) {
      Alert.alert('Required Fields', 'Please enter Station ID and Station Name');
      return;
    }

    setIsProcessing(true);
    try {
      await registerStation({
        hospitalId: 'hosp_001',
        hospitalName: currentHospital?.name || 'District Civil Hospital',
        stationId: newStationId.toUpperCase(),
        name: newStationName,
        type: newStationType,
        location: newStationLocation,
      });

      setAddModalVisible(false);
      setNewStationId('');
      setNewStationName('');
      Alert.alert('Station Added', `Station ${newStationId.toUpperCase()} registered into facility fleet.`);
    } catch {
      Alert.alert('Error', 'Failed to register station');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleMaintenance = async (station: PTStation) => {
    const newStatus: PTStationStatus = station.operationalStatus === 'maintenance' ? 'available' : 'maintenance';
    try {
      await updateStationStatus(station.id || station.stationId, newStatus, {
        notes: newStatus === 'maintenance' ? 'Scheduled engineering inspection' : 'Maintenance completed & operational',
      });
      Alert.alert('Status Updated', `Station marked as ${newStatus.toUpperCase()}`);
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>PT Station Fleet</Text>
            <Text style={styles.headerSubtitle}>{currentHospital?.name || 'Hospital Fleet'}</Text>
          </View>
          <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add Station</Text>
          </TouchableOpacity>
        </View>

        {/* Live Capacity Card */}
        <View style={styles.capacityCard}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityTitle}>Live Phototherapy Capacity</Text>
            <Text style={styles.capacityFormula}>Available = Operational - Occupied</Text>
          </View>
          <View style={styles.capacityGrid}>
            <View style={styles.capCol}>
              <Text style={styles.capVal}>{currentHospital?.totalPTStations || hospitalStations.length}</Text>
              <Text style={styles.capLbl}>Total</Text>
            </View>
            <View style={styles.capCol}>
              <Text style={styles.capVal}>{currentHospital?.operationalPTStations || 5}</Text>
              <Text style={styles.capLbl}>Operational</Text>
            </View>
            <View style={styles.capCol}>
              <Text style={[styles.capVal, { color: '#FC3949' }]}>{currentHospital?.occupiedPTStations || 2}</Text>
              <Text style={styles.capLbl}>Occupied</Text>
            </View>
            <View style={styles.capCol}>
              <Text style={[styles.capVal, { color: '#00A569' }]}>{currentHospital?.availablePTStations || 3}</Text>
              <Text style={styles.capLbl}>Available</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stations List */}
      <FlatList
        data={hospitalStations}
        keyExtractor={(item) => item.id || item.stationId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isOccupied = item.operationalStatus === 'occupied';
          const isMaint = item.operationalStatus === 'maintenance';
          const isAvail = item.operationalStatus === 'available';

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.idPill}>
                  <Text style={styles.idText}>{item.stationId}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    isAvail
                      ? styles.statusAvail
                      : isOccupied
                      ? styles.statusOccupied
                      : item.operationalStatus === 'cleaning_prep'
                      ? styles.statusCleaning
                      : styles.statusMaint,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isAvail
                        ? styles.textAvail
                        : isOccupied
                        ? styles.textOccupied
                        : item.operationalStatus === 'cleaning_prep'
                        ? styles.textCleaning
                        : styles.textMaint,
                    ]}
                  >
                    {item.operationalStatus.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.stationName}>{item.name}</Text>
              <Text style={styles.stationLocation}>📍 {item.location} • Type: {item.type.replace('_', ' ').toUpperCase()}</Text>

              {isOccupied && (
                <View style={styles.occupiedNotice}>
                  <Text style={styles.occupiedText}>
                    Occupied by {item.currentBabyName} ({item.currentBabyUhid})
                  </Text>
                </View>
              )}

              {item.notes ? (
                <Text style={styles.notesText}>Note: {item.notes}</Text>
              ) : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => handleToggleMaintenance(item)}
                  style={[styles.actionBtn, isMaint ? styles.btnReturnOp : styles.btnMaint]}
                  disabled={isOccupied}
                >
                  <Text style={[styles.actionBtnText, isMaint ? styles.textReturnOp : styles.textMaintBtn]}>
                    {isMaint ? 'Return to Service' : 'Mark for Maintenance'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Add Station Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Phototherapy Station</Text>
            <Text style={styles.modalSub}>Register new phototherapy hardware into facility directory</Text>

            <Text style={styles.inputLabel}>Station Identifier (e.g. PT-DCH-07)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="PT-DCH-XX"
              placeholderTextColor="#94A3B8"
              value={newStationId}
              onChangeText={setNewStationId}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>Station Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Double LED Tunnel B1"
              placeholderTextColor="#94A3B8"
              value={newStationName}
              onChangeText={setNewStationName}
            />

            <Text style={styles.inputLabel}>Hardware Type</Text>
            <View style={styles.typeRow}>
              {(['single_surface', 'double_surface', 'led_tunnel', 'fiberoptic_blanket'] as PTStationType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewStationType(t)}
                  style={[styles.typePill, newStationType === t && styles.typePillActive]}
                >
                  <Text style={[styles.typePillText, newStationType === t && styles.typePillTextActive]}>
                    {t.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Ward / Room Location</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. NICU Stepdown Bed 5"
              placeholderTextColor="#94A3B8"
              value={newStationLocation}
              onChangeText={setNewStationLocation}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddStation} style={styles.saveBtn} disabled={isProcessing}>
                <Text style={styles.saveBtnText}>Save Station</Text>
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
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  addBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  capacityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 14,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  capacityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  capacityFormula: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    fontStyle: 'italic',
  },
  capacityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
  },
  capCol: {
    alignItems: 'center',
  },
  capVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181829',
  },
  capLbl: {
    fontSize: 10,
    color: '#64748B',
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
    marginBottom: 14,
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
  idPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  idText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7D3BFF',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusAvail: {
    backgroundColor: '#F2FDEF',
  },
  statusOccupied: {
    backgroundColor: '#FFF1F2',
  },
  statusCleaning: {
    backgroundColor: '#FFFBEB',
  },
  statusMaint: {
    backgroundColor: '#F1F5F9',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textAvail: {
    color: '#00A569',
  },
  textOccupied: {
    color: '#FC3949',
  },
  textCleaning: {
    color: '#D97706',
  },
  textMaint: {
    color: '#64748B',
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
  occupiedNotice: {
    backgroundColor: '#FFF1F2',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  occupiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  notesText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtn: {
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMaint: {
    backgroundColor: '#F1F5F9',
  },
  btnReturnOp: {
    backgroundColor: '#F2FDEF',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textMaintBtn: {
    color: '#64748B',
  },
  textReturnOp: {
    color: '#00A569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#181829',
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#181829',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    marginBottom: 6,
  },
  typePillActive: {
    backgroundColor: '#7D3BFF',
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
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
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
