import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Check,
  ChevronDown,
  User as UserIcon,
  Send,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { BhutaniNomogramChart } from '../../../components/BhutaniNomogramChart';
import { calculatePostnatalAgeHours } from '../../../services/bhutani.service';
import { moderateScale, fontScale, SPACING, getScreenTopPadding } from '../../../theme/responsive';
import { AppAlert } from '../../../components';
import { Hospital, ReferralUrgency, Baby } from '../../../types';

interface CreateReferralScreenProps {
  hospital?: Hospital;
  onSuccess: () => void;
  onBack: () => void;
}

export const CreateReferralScreen: React.FC<CreateReferralScreenProps> = ({
  onSuccess,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { selectBaby, babies, readings } = usePatientStore();
  const { hospitals, createReferral } = useNetworkStore();

  // 1. Patient selection defaults to null (no patient selected on open)
  const [chosenBaby, setChosenBaby] = useState<Baby | null>(null);
  const [patientPickerVisible, setPatientPickerVisible] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  // 2. Available receiving hospitals (excluding current hospital)
  const currentHospitalName = (user?.facility || 'PGI').toUpperCase();
  const availableReceivingHospitals = useMemo(() => {
    return hospitals.filter(
      (h) =>
        h.name.toUpperCase() !== currentHospitalName &&
        h.id !== user?.facilityId &&
        h._id !== user?.facilityId
    );
  }, [hospitals, currentHospitalName, user?.facilityId]);

  // Destination hospital defaults to null (neither selected by default)
  const [selectedReceivingHospital, setSelectedReceivingHospital] = useState<Hospital | null>(null);

  // 3. Urgency defaults to 'routine' (Normal) & Notes empty by default
  const [urgency, setUrgency] = useState<ReferralUrgency>('routine');
  const [clinicalSummary, setClinicalSummary] = useState('');

  // Confirmation modal state
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered babies for modal picker (only actively owned babies, excluding pending or transferred-out ones)
  const filteredBabies = useMemo(() => {
    const availableBabies = babies.filter(
      (b) => b.referralStatus !== 'pending' && !b.isTransferredOut && !b.isHistoricalOnly
    );
    if (!patientSearch.trim()) return availableBabies;
    const q = patientSearch.toLowerCase();
    return availableBabies.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.parentsName?.toLowerCase().includes(q) ||
        b.uhid?.toLowerCase().includes(q)
    );
  }, [babies, patientSearch]);

  // Readings for chosen baby
  const babyReadings = useMemo(() => {
    if (!chosenBaby) return [];
    return readings.filter((r) => r.babyId === chosenBaby.id || r.babyId === chosenBaby.uhid);
  }, [readings, chosenBaby]);

  const latestReading = babyReadings[0] || null;

  const handleSelectPatient = (baby: Baby) => {
    setChosenBaby(baby);
    selectBaby(baby);
    setPatientPickerVisible(false);
    setPatientSearch('');
  };

  const handleDeselectPatient = () => {
    setChosenBaby(null);
    selectBaby(null);
  };

  // Safe check if a given hospital is currently selected
  const isHospitalSelected = (hosp: Hospital): boolean => {
    if (!selectedReceivingHospital) return false;
    const currentName = (selectedReceivingHospital.name || '').trim().toLowerCase();
    const candidateName = (hosp.name || '').trim().toLowerCase();
    if (currentName && candidateName) {
      return currentName === candidateName;
    }
    if (selectedReceivingHospital.id && hosp.id) {
      return selectedReceivingHospital.id === hosp.id;
    }
    if (selectedReceivingHospital._id && hosp._id) {
      return selectedReceivingHospital._id === hosp._id;
    }
    return false;
  };

  const handleOpenConfirm = () => {
    if (!chosenBaby) {
      AppAlert.warning('Select Patient', 'Please select a patient first.');
      return;
    }
    if (!selectedReceivingHospital) {
      AppAlert.warning('Select Hospital', 'Please choose a hospital to refer.');
      return;
    }
    setConfirmModalVisible(true);
  };

  const handleConfirmSend = async () => {
    if (!chosenBaby || !selectedReceivingHospital) return;

    setIsSubmitting(true);
    try {
      const bilirubinVal = latestReading ? latestReading.value : 14.5;
      const bilirubinUnit = latestReading ? latestReading.unit : 'mg/dL';
      const riskZone = latestReading?.bhutaniZone || 'high_intermediate';

      const targetName = (selectedReceivingHospital.name || '').trim();
      const targetId =
        targetName.toUpperCase() === 'KGMU'
          ? 'hosp_kgmu'
          : targetName.toUpperCase() === 'RML'
            ? 'hosp_rml'
            : targetName.toUpperCase() === 'PGI'
              ? 'hosp_pgi'
              : selectedReceivingHospital.id || selectedReceivingHospital._id || 'hosp_kgmu';

      await createReferral({
        babyId: chosenBaby.id,
        babyName: chosenBaby.name,
        babyUhid: chosenBaby.uhid,
        dateOfBirth: chosenBaby.dateOfBirth,
        gestationalAgeWeeks: chosenBaby.gestationalAgeWeeks || 38,
        referringDoctorName: user?.name || `${user?.facility || 'PGI'} Doctor`,
        referringCentreName: user?.facility || 'PGI',
        receivingHospitalId: targetId,
        receivingHospitalName: targetName,
        urgency,
        clinicalSummary: clinicalSummary.trim(),
        latestBilirubinValue: bilirubinVal,
        latestBilirubinUnit: bilirubinUnit,
        latestBhutaniRiskZone: riskZone,
        postnatalAgeHoursAtReferral: chosenBaby.dateOfBirth
          ? calculatePostnatalAgeHours(chosenBaby.dateOfBirth, chosenBaby.exactTimeOfBirth, new Date())
          : (latestReading?.postnatalAgeHours || 48),
        phototherapyRecommended: true,
      });

      usePatientStore.getState().markBabyAsReferred(chosenBaby.uhid, targetName, new Date().toISOString());
      await usePatientStore.getState().loadBabies();

      setConfirmModalVisible(false);
      AppAlert.success(
        'Referral Dispatched',
        `Referral for ${chosenBaby.name} (${chosenBaby.uhid}) sent to ${selectedReceivingHospital.name}.`,
        onSuccess,
        'Done'
      );
    } catch (err: any) {
      AppAlert.error('Referral Error', err?.response?.data?.message || err?.message || 'Failed to dispatch referral. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: getScreenTopPadding(insets, 10) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>New Referral</Text>
            <Text style={styles.headerSubtitle}>{user?.facility || 'Hospital'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 85 }]}
      >
        {/* ================= PATIENT SELECTOR ================= */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Patient</Text>

          {!chosenBaby ? (
            <TouchableOpacity
              style={styles.selectPatientBtn}
              onPress={() => setPatientPickerVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.selectPatientLeft}>
                <View style={styles.userIconWrap}>
                  <UserIcon size={18} color="#7D3BFF" />
                </View>
                <Text style={styles.selectPatientPlaceholder}>Select a patient...</Text>
              </View>
              <ChevronDown size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedPatientRow}>
              <TouchableOpacity
                style={styles.selectedPatientLeft}
                onPress={() => setPatientPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientAvatarText}>
                    {(chosenBaby.name || 'B').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.patientInfoCol}>
                  <Text style={styles.patientName}>
                    {chosenBaby.parentsName?.trim() || chosenBaby.name}
                  </Text>
                  <Text style={styles.patientMeta}>
                    UHID: {chosenBaby.uhid} • GA: {chosenBaby.gestationalAgeWeeks || 38}w
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Cross button on top-right to deselect patient */}
              <TouchableOpacity
                style={styles.deselectBtn}
                onPress={handleDeselectPatient}
                activeOpacity={0.7}
                accessibilityLabel="Deselect patient"
              >
                <X size={16} color="#64748B" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ================= NOMOGRAM (ONLY WHEN PATIENT SELECTED, NO HEADING) ================= */}
        {chosenBaby && (
          <View style={styles.sectionCard}>
            {latestReading && (
              <View style={styles.nomogramHeader}>
                <View style={styles.latestTsbBadge}>
                  <Text style={styles.latestTsbText}>
                    Latest TSB: {latestReading.value} {latestReading.unit}
                  </Text>
                </View>
                {latestReading.bhutaniZone && (
                  <View style={styles.riskZoneBadge}>
                    <Text style={styles.riskZoneBadgeText}>
                      {latestReading.bhutaniZone.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.chartWrapper}>
              <BhutaniNomogramChart
                readings={
                  babyReadings.length > 0
                    ? (babyReadings as any)
                    : ([{ value: 14.5, unit: 'mg/dL', postnatalAgeHours: 48, bhutaniZone: 'high_intermediate' }] as any)
                }
                gestationalAgeWeeks={chosenBaby.gestationalAgeWeeks || 38}
                compact={false}
              />
            </View>
          </View>
        )}

        {/* ================= SELECT HOSPITAL TO SEND REFERRAL ================= */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Select Hospital to Send Referral</Text>

          <View style={styles.hospitalsRow}>
            {availableReceivingHospitals.map((hosp) => {
              const isSelected = isHospitalSelected(hosp);
              return (
                <TouchableOpacity
                  key={hosp.id || hosp._id || hosp.name}
                  style={[styles.smallHospitalBox, isSelected && styles.smallHospitalBoxSelected]}
                  onPress={() => setSelectedReceivingHospital(isSelected ? null : hosp)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.smallHospitalText, isSelected && styles.smallHospitalTextSelected]}>
                    {hosp.name}
                  </Text>
                  {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ================= URGENCY & NOTES ================= */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Urgency & Notes</Text>

          {/* Urgency Buttons: Normal selected by default */}
          <View style={styles.urgencyRow}>
            {[
              { key: 'routine', label: 'Normal' },
              { key: 'urgent', label: 'Urgent' },
              { key: 'emergency', label: 'Emergency' },
            ].map((item) => {
              const isSel = urgency === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setUrgency(item.key as ReferralUrgency)}
                  style={[
                    styles.urgencyBtn,
                    isSel && item.key === 'routine' && styles.urgencyNormalActive,
                    isSel && item.key === 'urgent' && styles.urgencyUrgentActive,
                    isSel && item.key === 'emergency' && styles.urgencyEmergencyActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.urgencyBtnText, isSel && styles.urgencyBtnTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Empty Notes Input by default */}
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            value={clinicalSummary}
            onChangeText={setClinicalSummary}
            placeholder="Add clinical notes (optional)..."
            placeholderTextColor="#94A3B8"
          />
        </View>
      </ScrollView>

      {/* ================= BOTTOM ACTION BAR ================= */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.sendBtn, (!chosenBaby || !selectedReceivingHospital) && styles.sendBtnDisabled]}
          onPress={handleOpenConfirm}
          disabled={!chosenBaby || !selectedReceivingHospital || isSubmitting}
          activeOpacity={0.85}
        >
          <Send size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.sendBtnText}>Send Referral</Text>
        </TouchableOpacity>
      </View>

      {/* ================= CONFIRMATION POPUP MODAL ================= */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Referral</Text>
              <TouchableOpacity
                onPress={() => setConfirmModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Are you sure you want to send this referral to {selectedReceivingHospital?.name}?
            </Text>

            <View style={styles.modalSummaryBox}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Patient</Text>
                <Text style={styles.modalVal}>
                  {chosenBaby?.parentsName?.trim() || chosenBaby?.name} ({chosenBaby?.uhid})
                </Text>
              </View>
              {latestReading && (
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Latest TSB</Text>
                  <Text style={styles.modalValAlert}>
                    {latestReading.value} {latestReading.unit}
                  </Text>
                </View>
              )}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>To Hospital</Text>
                <Text style={styles.modalValHighlight}>
                  {selectedReceivingHospital?.name}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Urgency</Text>
                <Text style={styles.modalVal}>
                  {urgency === 'routine' ? 'Normal' : urgency.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConfirmModalVisible(false)}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleConfirmSend}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.modalConfirmText}>Confirm & Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= PATIENT PICKER MODAL ================= */}
      <Modal
        visible={patientPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPatientPickerVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.pickerModalOverlay}
        >
          <View style={styles.pickerModalSheet}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Patient</Text>
              <TouchableOpacity
                onPress={() => setPatientPickerVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.pickerSearchRow}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search patient name, UHID..."
                placeholderTextColor="#94A3B8"
                value={patientSearch}
                onChangeText={setPatientSearch}
                clearButtonMode="while-editing"
              />
            </View>

            {filteredBabies.length === 0 ? (
              <View style={styles.pickerEmptyBox}>
                <Text style={styles.pickerEmptyText}>
                  {babies.length === 0
                    ? `No patients registered at ${user?.facility || 'current hospital'}.`
                    : 'No patients match your search.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredBabies}
                keyExtractor={(item) => item.id || item.uhid}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSel = chosenBaby?.id === item.id || chosenBaby?.uhid === item.uhid;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isSel && styles.pickerItemSelected]}
                      onPress={() => handleSelectPatient(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pickerItemLeft}>
                        <View style={[styles.avatarCircleSmall, isSel && styles.avatarCircleSmallSel]}>
                          <Text style={[styles.avatarTextSmall, isSel && styles.avatarTextSmallSel]}>
                            {(item.name || 'B').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.pickerItemName}>
                            {item.parentsName?.trim() || item.name}
                          </Text>
                          <Text style={styles.pickerItemMeta}>UHID: {item.uhid} • GA: {item.gestationalAgeWeeks || 38}w</Text>
                        </View>
                      </View>
                      {isSel && <Check size={18} color="#7D3BFF" strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  selectPatientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectPatientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPatientPlaceholder: {
    fontSize: fontScale(13),
    color: '#64748B',
    fontWeight: '500',
  },
  selectedPatientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedPatientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  patientAvatarText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  patientInfoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  patientMeta: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  deselectBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  nomogramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  latestTsbBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  latestTsbText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#DC2626',
  },
  riskZoneBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  riskZoneBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#D97706',
  },
  chartWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  hospitalsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  smallHospitalBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  smallHospitalBoxSelected: {
    backgroundColor: '#7D3BFF',
    borderColor: '#7D3BFF',
  },
  smallHospitalText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#1E293B',
  },
  smallHospitalTextSelected: {
    color: '#FFFFFF',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  urgencyBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyBtnText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  urgencyBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  urgencyNormalActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  urgencyUrgentActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  urgencyEmergencyActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: fontScale(12),
    color: '#0F172A',
    minHeight: 55,
    textAlignVertical: 'top',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7D3BFF',
    height: 44,
    borderRadius: 10,
    gap: 6,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(22),
    width: '100%',
    maxWidth: moderateScale(340),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginBottom: moderateScale(14),
    lineHeight: 18,
  },
  modalCloseBtn: {
    padding: 2,
  },
  modalSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalLabel: {
    fontSize: fontScale(11),
    color: '#64748B',
  },
  modalVal: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '65%',
    textAlign: 'right',
  },
  modalValAlert: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#DC2626',
  },
  modalValHighlight: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalConfirmText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'flex-end',
  },
  pickerModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(26),
    borderTopRightRadius: moderateScale(26),
    padding: moderateScale(20),
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerModalTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  pickerSearchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: fontScale(12),
    color: '#0F172A',
  },
  pickerEmptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  pickerEmptyText: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemSelected: {
    backgroundColor: '#FAF5FF',
    borderRadius: 6,
  },
  pickerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarCircleSmallSel: {
    backgroundColor: '#7D3BFF',
  },
  avatarTextSmall: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  avatarTextSmallSel: {
    color: '#FFFFFF',
  },
  pickerItemName: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerItemMeta: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
});