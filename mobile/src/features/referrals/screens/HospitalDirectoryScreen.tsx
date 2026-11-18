import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  UserPlus,
  ChevronDown,
  Check,
  X,
  Search,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { Hospital, Baby } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { moderateScale, fontScale, SPACING } from '../../../theme/responsive';

interface HospitalDirectoryScreenProps {
  onSelectHospital: (hospital: Hospital) => void;
  onBack?: () => void;
  isTab?: boolean;
  initialPatient?: Baby | null;
  onSelectPatient?: (baby: Baby) => void;
}

export const HospitalDirectoryScreen: React.FC<HospitalDirectoryScreenProps> = ({
  onSelectHospital,
  onBack,
  isTab = false,
  initialPatient = null,
  onSelectPatient,
}) => {
  const { hospitals } = useNetworkStore();
  const { babies, selectBaby } = usePatientStore();
  const [search, setSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Baby | null>(initialPatient);
  const [pendingHospital, setPendingHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
    }
  }, [initialPatient]);

  const receivingHospitals = hospitals.filter(
    (h) => h.type === 'receiving_hospital' && h.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const handlePickBaby = (baby: Baby) => {
    setSelectedPatient(baby);
    selectBaby(baby);
    onSelectPatient?.(baby);
    setShowPatientModal(false);

    if (pendingHospital) {
      const target = pendingHospital;
      setPendingHospital(null);
      onSelectHospital(target);
    }
  };

  const handleHospitalAction = (hospital: Hospital) => {
    if (hospital.availablePTStations === 0) return;

    if (!selectedPatient) {
      setPendingHospital(hospital);
      setShowPatientModal(true);
      return;
    }

    selectBaby(selectedPatient);
    onSelectHospital(hospital);
  };

  const insets = useSafeAreaInsets();
  const dynamicTopPadding = isTab ? 10 : insets.top + 10;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: dynamicTopPadding }]}>
        <View style={styles.headerTop}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>District PT Network</Text>
            <Text style={styles.headerSubtitle}>Live Phototherapy Capacity Directory</Text>
          </View>
        </View>

        {/* Dynamic Patient Selector Banner */}
        {selectedPatient ? (
          <View style={styles.patientBannerCard}>
            <View style={styles.patientBannerLeft}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>
                  {(selectedPatient.parentsName || selectedPatient.name).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.patientBannerInfo}>
                <View style={styles.patientTagRow}>
                  <Text style={styles.patientBannerTag}>REFERRING PATIENT</Text>
                  {selectedPatient.severityState && (
                    <View
                      style={[
                        styles.severityMiniBadge,
                        {
                          backgroundColor:
                            selectedPatient.severityState === 'critical'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityMiniText,
                          {
                            color:
                              selectedPatient.severityState === 'critical'
                                ? '#DC2626'
                                : '#D97706',
                          },
                        ]}
                      >
                        {selectedPatient.severityState.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.patientBannerName} numberOfLines={1}>
                  {selectedPatient.parentsName?.trim() || selectedPatient.name}
                </Text>
                <Text style={styles.patientBannerMeta}>
                  UHID: {selectedPatient.uhid} • {selectedPatient.gestationalAgeWeeks || 38}w
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.changePatientBtn}
              onPress={() => {
                setPendingHospital(null);
                setShowPatientModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.changePatientBtnText}>Change</Text>
              <ChevronDown size={14} color="#7D3BFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.selectPatientBanner}
            onPress={() => {
              setPendingHospital(null);
              setShowPatientModal(true);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.selectPatientLeft}>
              <View style={styles.selectPatientIconCircle}>
                <UserPlus size={16} color="#7D3BFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.selectPatientTitle}>Select Patient to Refer</Text>
                <Text style={styles.selectPatientSubtitle}>Choose a registered newborn to initiate transfer</Text>
              </View>
            </View>
            <View style={styles.selectPatientPill}>
              <Text style={styles.selectPatientPillText}>Select ▾</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Search box */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search district hospital or facility..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Hospital List */}
      <FlatList
        data={receivingHospitals}
        keyExtractor={(item) => item.id || item.code}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        renderItem={({ item }) => {
          const isFull = item.availablePTStations === 0;

          return (
            <View style={styles.hospitalCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.hospInfo}>
                  <Text style={styles.hospitalName}>{item.name}</Text>
                  <Text style={styles.hospitalAddress}>{item.address}</Text>
                  <Text style={styles.hospitalContact}>📞 {item.contactNumber}</Text>
                </View>

                {/* Capacity Pill */}
                <View
                  style={[
                    styles.capacityPill,
                    isFull ? styles.capacityPillFull : styles.capacityPillAvailable,
                  ]}
                >
                  <Text
                    style={[
                      styles.capacityPillNumber,
                      isFull ? styles.capacityPillTextFull : styles.capacityPillTextAvailable,
                    ]}
                  >
                    {item.availablePTStations}
                  </Text>
                  <Text
                    style={[
                      styles.capacityPillSub,
                      isFull ? styles.capacityPillTextFull : styles.capacityPillTextAvailable,
                    ]}
                  >
                    Available
                  </Text>
                </View>
              </View>

              {/* Station metrics row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{item.totalPTStations}</Text>
                  <Text style={styles.metricLbl}>Total Units</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{item.operationalPTStations}</Text>
                  <Text style={styles.metricLbl}>Operational</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: '#FC3949' }]}>{item.occupiedPTStations}</Text>
                  <Text style={styles.metricLbl}>Occupied</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: '#00A569' }]}>{item.availablePTStations}</Text>
                  <Text style={styles.metricLbl}>Vacant</Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                onPress={() => handleHospitalAction(item)}
                style={[styles.referBtn, isFull && styles.referBtnDisabled]}
                disabled={isFull}
                activeOpacity={0.8}
              >
                <Text style={styles.referBtnText}>
                  {isFull
                    ? 'Station Capacity Full'
                    : selectedPatient
                    ? `Refer ${selectedPatient.parentsName?.trim() || selectedPatient.name} →`
                    : 'Select for Phototherapy Referral →'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Patient Selection Modal */}
      <Modal
        visible={showPatientModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPatientModal(false);
          setPendingHospital(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Select Patient for Referral</Text>
                <Text style={styles.modalSubtitle}>
                  {pendingHospital
                    ? `Choose newborn to refer to ${pendingHospital.name}`
                    : 'Choose a registered newborn to initiate phototherapy transfer'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowPatientModal(false);
                  setPendingHospital(null);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Filter Search */}
            <View style={styles.modalSearchBox}>
              <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search by baby name, mother, or UHID..."
                placeholderTextColor="#94A3B8"
                value={patientSearch}
                onChangeText={setPatientSearch}
              />
            </View>

            {/* Patient List */}
            <FlatList
              data={filteredBabies}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.patientListContent}
              renderItem={({ item }) => {
                const isSelected = selectedPatient?.id === item.id;
                const displayName = item.parentsName?.trim() || item.name;

                return (
                  <TouchableOpacity
                    style={[styles.patientItemCard, isSelected && styles.patientItemCardSelected]}
                    onPress={() => handlePickBaby(item)}
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
                        {item.severityState && (
                          <View
                            style={[
                              styles.severityPill,
                              {
                                backgroundColor:
                                  item.severityState === 'critical' ? '#FEE2E2' : '#FEF3C7',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.severityPillText,
                                {
                                  color:
                                    item.severityState === 'critical' ? '#DC2626' : '#D97706',
                                },
                              ]}
                            >
                              {item.severityState.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.patientItemUhid}>UHID: {item.uhid}</Text>
                      <Text style={styles.patientItemDetails}>
                        DOB: {item.dateOfBirth} • {item.gestationalAgeWeeks || 38}w • {item.weight || 3.1}kg
                      </Text>
                    </View>

                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No registered newborns found</Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
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
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
  },
  backBtnText: {
    fontSize: fontScale(20),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: fontScale(20),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: fontScale(12),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  patientBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientBannerLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  patientBannerName: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  patientBannerMeta: {
    fontSize: fontScale(11),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  selectPatientBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectPatientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectPatientIconCircle: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPatientTitle: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectPatientSubtitle: {
    fontSize: fontScale(11),
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  selectPatientPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  selectPatientPillText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  patientBannerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  patientBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#7D3BFF',
  },
  patientBannerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  patientTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientBannerTag: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  severityMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  severityMiniText: {
    fontSize: fontScale(9),
    fontWeight: '800',
  },
  changePatientBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    marginLeft: 8,
  },
  changePatientBtnText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '85%',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#181829',
  },
  modalSubtitle: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(12),
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    marginHorizontal: SPACING.lg,
    paddingHorizontal: moderateScale(12),
    minHeight: moderateScale(42),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: fontScale(13),
    color: '#181829',
  },
  patientListContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 24,
  },
  patientItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientItemCardSelected: {
    borderColor: '#7D3BFF',
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
  },
  patientItemAvatar: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientItemAvatarText: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#7D3BFF',
  },
  patientItemInfo: {
    flex: 1,
  },
  patientItemName: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#181829',
  },
  patientItemUhid: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  patientItemDetails: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    marginTop: 2,
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityPillText: {
    fontSize: fontScale(10),
    fontWeight: '700',
  },
  checkCircle: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: fontScale(13),
    color: '#94A3B8',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    minHeight: moderateScale(44),
    paddingHorizontal: SPACING.lg,
    fontSize: fontScale(13),
    color: '#181829',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  hospitalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: SPACING.lg,
    marginBottom: SPACING.md,
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
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  hospInfo: {
    flex: 1,
    paddingRight: 12,
  },
  hospitalName: {
    fontSize: fontScale(15),
    fontWeight: '700',
    color: '#181829',
    marginBottom: 4,
  },
  hospitalAddress: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginBottom: 4,
  },
  hospitalContact: {
    fontSize: fontScale(11),
    color: '#7D3BFF',
    fontWeight: '600',
  },
  capacityPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(14),
    minWidth: moderateScale(68),
  },
  capacityPillAvailable: {
    backgroundColor: '#F2FDEF',
    borderColor: '#00A569',
    borderWidth: 1,
  },
  capacityPillFull: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FC3949',
    borderWidth: 1,
  },
  capacityPillNumber: {
    fontSize: fontScale(19),
    fontWeight: '800',
  },
  capacityPillSub: {
    fontSize: fontScale(10),
    fontWeight: '700',
  },
  capacityPillTextAvailable: {
    color: '#00A569',
  },
  capacityPillTextFull: {
    color: '#FC3949',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: SPACING.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#181829',
  },
  metricLbl: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    marginTop: 2,
  },
  referBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: moderateScale(14),
    minHeight: moderateScale(46),
    alignItems: 'center',
    justifyContent: 'center',
  },
  referBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  referBtnText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
