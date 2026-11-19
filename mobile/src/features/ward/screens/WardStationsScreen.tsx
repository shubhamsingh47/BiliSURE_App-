import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Bell, UserPlus, ChevronDown, Search } from 'lucide-react-native';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { PTStationType, Baby } from '../../../types';
import { NurseStationAllocationScreen } from '../../hospitalNurse/screens/NurseStationAllocationScreen';
import { NurseTreatmentTrackerScreen } from '../../hospitalNurse/screens/NurseTreatmentTrackerScreen';
import { fontScale, moderateScale, getScreenTopPadding } from '../../../theme/responsive';

interface WardStationsScreenProps {
  initialSegment?: 'allocation' | 'treatment';
  segmentTrigger?: number;
  initialPatientToSend?: Baby | null;
  initialPtFilter?: 'active' | 'concluded';
  onPatientAllocated?: () => void;
  onOpenNotifications?: () => void;
  onRecordBilirubin?: (babyUhid: string) => void;
}

export const WardStationsScreen: React.FC<WardStationsScreenProps> = ({
  initialSegment = 'allocation',
  segmentTrigger,
  initialPatientToSend = null,
  initialPtFilter = 'active',
  onPatientAllocated,
  onOpenNotifications,
  onRecordBilirubin,
}) => {
  const insets = useSafeAreaInsets();
  const { stations, registerStation, notifications, admissions } = useNetworkStore();
  const { user } = useAuthStore();
  const { babies } = usePatientStore();

  const [activeSegment, setActiveSegment] = useState<'allocation' | 'treatment'>(initialSegment);

  // Dedicated patient selection state for phototherapy - defaults to NONE (null)
  const [ptSelectedBaby, setPtSelectedBaby] = useState<Baby | null>(initialPatientToSend || null);

  useEffect(() => {
    if (initialSegment) {
      setActiveSegment(initialSegment);
    }
  }, [initialSegment, segmentTrigger]);

  useEffect(() => {
    setPtSelectedBaby(initialPatientToSend || null);
  }, [initialPatientToSend, segmentTrigger]);

  // Dynamic Baby Selection Modal State
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  // Add Station Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newStationId, setNewStationId] = useState('');
  const [newStationName, setNewStationName] = useState('');
  const [newStationType, setNewStationType] = useState<PTStationType>('double_surface');
  const [newStationLocation, setNewStationLocation] = useState('NICU Bay 1');
  const [isProcessing, setIsProcessing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const currentHosp = (user?.facility || 'PGI').toUpperCase();
  const currentHospId = user?.facilityId || (currentHosp === 'KGMU' ? 'hosp_kgmu' : currentHosp === 'RML' ? 'hosp_rml' : 'hosp_pgi');

  const hospitalStations = useMemo(() => {
    return stations.filter(
      (s) => s.hospitalId === currentHospId || s.hospitalName?.toUpperCase() === currentHosp
    );
  }, [stations, currentHospId, currentHosp]);

  const hospitalAdmissions = useMemo(() => {
    return admissions.filter(
      (a) => a.hospitalId === currentHospId || a.hospitalName?.toUpperCase() === currentHosp
    );
  }, [admissions, currentHospId, currentHosp]);

  const availableCount = hospitalStations.filter((s) => s.operationalStatus === 'available').length;
  const occupiedCount = hospitalStations.filter((s) => s.operationalStatus === 'occupied').length;
  const activeTreatedCount = hospitalAdmissions.filter((a) => a.admissionStatus === 'under_treatment').length;

  const filteredBabies = useMemo(() => {
    if (!patientSearch.trim()) return babies;
    const q = patientSearch.toLowerCase();
    return babies.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.parentsName?.toLowerCase().includes(q) ||
        b.uhid?.toLowerCase().includes(q)
    );
  }, [babies, patientSearch]);

  const handleAddStation = async () => {
    if (!newStationId.trim() || !newStationName.trim()) {
      Alert.alert('Required Fields', 'Please enter a Station ID and Station Name');
      return;
    }

    setIsProcessing(true);
    try {
      await registerStation({
        hospitalId: user?.facilityId || 'hosp_001',
        hospitalName: user?.facility || 'Facility Phototherapy Unit',
        stationId: newStationId.toUpperCase().trim(),
        name: newStationName.trim(),
        type: newStationType,
        location: newStationLocation.trim() || 'NICU Ward',
      });

      setAddModalVisible(false);
      setNewStationId('');
      setNewStationName('');
      Alert.alert('Station Added', `Station ${newStationId.toUpperCase().trim()} registered successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to register station');
    } finally {
      setIsProcessing(false);
    }
  };

  const stationTypes: { label: string; value: PTStationType }[] = [
    { label: 'Double Surface LED', value: 'double_surface' },
    { label: 'Single Surface Overhead', value: 'single_surface' },
    { label: 'Fiberoptic Blanket', value: 'fiberoptic_blanket' },
    { label: 'LED Tunnel Unit', value: 'led_tunnel' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: getScreenTopPadding(insets, 8) }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>Phototherapy</Text>
            <View style={styles.hospitalPill}>
              <View style={styles.hospitalDot} />
              <Text style={styles.hospitalPillText}>{user?.facility || 'Hospital'}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAddModalVisible(true)}
              style={styles.addStationBtn}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addStationText}>Add Station</Text>
            </TouchableOpacity>

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

        {/* 2-Segment Control Bar: Left = In Phototherapy, Right = PT Station */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'treatment' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('treatment')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'treatment' && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              In Phototherapy ({activeTreatedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'allocation' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('allocation')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'allocation' && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              PT Station ({availableCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeSegment === 'allocation' ? (
          <View style={{ flex: 1 }}>
            {/* Dynamic Baby Selector Banner for Phototherapy */}
            {ptSelectedBaby ? (
              <View style={styles.patientBannerCard}>
                <View style={styles.patientBannerLeft}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>
                      {(ptSelectedBaby.parentsName || ptSelectedBaby.name).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.patientBannerInfo}>
                    <View style={styles.patientTagRow}>
                      <Text style={styles.patientBannerTag}>PATIENT TO SEND TO PHOTOTHERAPY</Text>
                    </View>
                    <Text style={styles.patientBannerName} numberOfLines={1}>
                      {ptSelectedBaby.parentsName?.trim() || ptSelectedBaby.name}
                    </Text>
                    <Text style={styles.patientBannerMeta}>
                      UHID: {ptSelectedBaby.uhid} • {ptSelectedBaby.gestationalAgeWeeks || 38}w • {ptSelectedBaby.weight || 3.1}kg
                    </Text>
                  </View>
                </View>

                {/* Overlapped / Paired Action Buttons: Change and Deselect */}
                <View style={styles.bannerActions}>
                  <TouchableOpacity
                    style={styles.changePatientBtn}
                    onPress={() => setShowPatientModal(true)}
                    activeOpacity={0.8}
                    accessibilityLabel="Change Selected Patient"
                  >
                    <Text style={styles.changePatientBtnText}>Change</Text>
                    <ChevronDown size={13} color="#7D3BFF" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deselectPatientBtn}
                    onPress={() => {
                      setPtSelectedBaby(null);
                      onPatientAllocated?.();
                    }}
                    activeOpacity={0.8}
                    accessibilityLabel="Deselect Patient"
                  >
                    <Text style={styles.deselectPatientBtnText}>✕ Deselect</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectPatientBanner}
                onPress={() => setShowPatientModal(true)}
                activeOpacity={0.85}
              >
                <View style={styles.selectPatientLeft}>
                  <View style={styles.selectPatientIconCircle}>
                    <UserPlus size={16} color="#7D3BFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.selectPatientTitle}>Select Baby to Send to Phototherapy</Text>
                    <Text style={styles.selectPatientSubtitle}>Choose a registered newborn to allocate to a station</Text>
                  </View>
                </View>
                <View style={styles.selectPatientPill}>
                  <Text style={styles.selectPatientPillText}>Select ▾</Text>
                </View>
              </TouchableOpacity>
            )}

            <NurseStationAllocationScreen
              embedded={true}
              selectedBaby={ptSelectedBaby}
              onBabyAllocated={() => {
                setPtSelectedBaby(null);
                onPatientAllocated?.();
                setActiveSegment('treatment');
              }}
            />
          </View>
        ) : (
          <NurseTreatmentTrackerScreen
            embedded={true}
            initialPtFilter={initialPtFilter}
            highlightBabyIdOrUhid={ptSelectedBaby?.uhid || ptSelectedBaby?.id}
            onRecordBilirubin={onRecordBilirubin}
          />
        )}
      </View>

      {/* Baby Selection Modal */}
      <Modal visible={showPatientModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Select Baby for Phototherapy</Text>
                <Text style={styles.modalSubtitle}>
                  Choose a registered newborn to assign to a vacant phototherapy station
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPatientModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Search Box */}
            <View style={styles.modalSearchBox}>
              <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search baby by mother, name, or UHID..."
                placeholderTextColor="#94A3B8"
                value={patientSearch}
                onChangeText={setPatientSearch}
              />
            </View>

            {/* Quick Deselect Action in Modal */}
            {ptSelectedBaby && (
              <TouchableOpacity
                style={styles.modalDeselectBtn}
                onPress={() => {
                  setPtSelectedBaby(null);
                  onPatientAllocated?.();
                  setShowPatientModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalDeselectBtnText}>✕ Deselect / Clear Patient Selection</Text>
              </TouchableOpacity>
            )}

            {/* Patient List */}
            <FlatList
              data={filteredBabies}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isSelected = ptSelectedBaby?.id === item.id;
                const displayName = item.parentsName?.trim() || item.name;

                return (
                  <TouchableOpacity
                    style={[styles.patientItemCard, isSelected && styles.patientItemCardSelected]}
                    onPress={() => {
                      if (isSelected) {
                        setPtSelectedBaby(null);
                        onPatientAllocated?.();
                      } else {
                        setPtSelectedBaby(item);
                      }
                      setShowPatientModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.patientItemAvatar}>
                      <Text style={styles.patientItemAvatarText}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.patientItemInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.patientItemName}>{displayName}</Text>
                      </View>
                      <Text style={styles.patientItemMeta}>
                        UHID: {item.uhid} • {item.gestationalAgeWeeks || 38}w • {item.weight || 3.1}kg
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Add Station Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Phototherapy Station</Text>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Station Identifier (e.g. PT-05)</Text>
            <TextInput
              style={styles.input}
              placeholder="PT-05"
              placeholderTextColor="#94A3B8"
              value={newStationId}
              onChangeText={setNewStationId}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>Station Description / Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Double Surface High-Intensity LED 5"
              placeholderTextColor="#94A3B8"
              value={newStationName}
              onChangeText={setNewStationName}
            />

            <Text style={styles.inputLabel}>Station Equipment Type</Text>
            <View style={styles.typeSelectorRow}>
              {stationTypes.map((type) => {
                const isSelected = newStationType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[styles.typeOption, isSelected && styles.typeOptionActive]}
                    onPress={() => setNewStationType(type.value)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        isSelected && styles.typeOptionTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Physical Ward Location</Text>
            <TextInput
              style={styles.input}
              placeholder="NICU Bay 1"
              placeholderTextColor="#94A3B8"
              value={newStationLocation}
              onChangeText={setNewStationLocation}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddStation}
                style={[styles.confirmBtn, isProcessing && { opacity: 0.7 }]}
                disabled={isProcessing}
              >
                <Text style={styles.confirmBtnText}>
                  {isProcessing ? 'Registering...' : 'Save Station'}
                </Text>
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
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
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
  addStationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7D3BFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addStationText: {
    color: '#FFFFFF',
    fontSize: fontScale(11),
    fontWeight: '700',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FC3949',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#7D3BFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  // Patient Banner Card (Selected)
  patientBannerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#7D3BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patientBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  patientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  patientAvatarText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#7D3BFF',
  },
  patientBannerInfo: {
    flex: 1,
    minWidth: 0,
  },
  patientTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  patientBannerTag: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#7D3BFF',
    letterSpacing: 0.3,
  },
  severityMiniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  severityMiniText: {
    fontSize: 8,
    fontWeight: '800',
  },
  patientBannerName: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#181829',
  },
  patientBannerMeta: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 1,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePatientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changePatientBtnText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  deselectPatientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deselectPatientBtnText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#DC2626',
  },
  modalDeselectBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalDeselectBtnText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#DC2626',
  },
  // Patient Banner (Unselected)
  selectPatientBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7D3BFF',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectPatientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectPatientIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPatientTitle: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#181829',
  },
  selectPatientSubtitle: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 1,
  },
  selectPatientPill: {
    backgroundColor: '#7D3BFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  selectPatientPillText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#181829',
  },
  modalSubtitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
    padding: 4,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: fontScale(12),
    color: '#181829',
  },
  patientItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientItemCardSelected: {
    borderColor: '#7D3BFF',
    backgroundColor: '#F5F3FF',
  },
  patientItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  patientItemAvatarText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#7D3BFF',
  },
  patientItemInfo: {
    flex: 1,
  },
  patientItemName: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#181829',
  },
  patientItemMeta: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 2,
  },
  severityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: fontScale(14),
    color: '#181829',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeOptionActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7D3BFF',
  },
  typeOptionText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  typeOptionTextActive: {
    color: '#7D3BFF',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
