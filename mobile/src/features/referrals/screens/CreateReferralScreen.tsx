import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronDown, Check, X, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { BhutaniNomogramChart } from '../../../components/BhutaniNomogramChart';
import { Hospital, ReferralUrgency, Baby } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { moderateScale, fontScale, SPACING } from '../../../theme/responsive';

interface CreateReferralScreenProps {
  hospital: Hospital;
  onSuccess: () => void;
  onBack: () => void;
}

export const CreateReferralScreen: React.FC<CreateReferralScreenProps> = ({
  hospital,
  onSuccess,
  onBack,
}) => {
  const { selectedBaby, selectBaby, babies, readings } = usePatientStore();
  const { createReferral } = useNetworkStore();

  const [urgency, setUrgency] = useState<ReferralUrgency>('urgent');
  const [clinicalSummary, setClinicalSummary] = useState(
    'Bilirubin level elevated in high-intermediate risk zone. Phototherapy indicated to prevent further neurotoxicity. Vitals stable.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const filteredBabies = React.useMemo(() => {
    if (!patientSearch.trim()) return babies;
    const q = patientSearch.toLowerCase();
    return babies.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.parentsName?.toLowerCase().includes(q) ||
        b.uhid?.toLowerCase().includes(q)
    );
  }, [babies, patientSearch]);

  const babyReadings = readings.filter((r) => !selectedBaby || r.babyId === selectedBaby.id);
  const latestReading = babyReadings[0] || readings[0] || {
    value: 14.8,
    unit: 'mg/dL',
    postnatalAgeHours: 48,
    bhutaniZone: 'high_intermediate',
    method: 'TSB',
  };

  const handleSendReferral = async () => {
    if (!selectedBaby) {
      Alert.alert('Error', 'No patient selected');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReferral({
        babyId: selectedBaby.id,
        babyName: selectedBaby.name,
        babyUhid: selectedBaby.uhid,
        dateOfBirth: selectedBaby.dateOfBirth,
        gestationalAgeWeeks: selectedBaby.gestationalAgeWeeks || 38,
        referringDoctorName: 'Dr. Priya Sharma',
        referringCentreName: 'North Community Health Centre (CHC)',
        receivingHospitalId: hospital.id || hospital._id || 'hosp_001',
        receivingHospitalName: hospital.name,
        urgency,
        clinicalSummary,
        latestBilirubinValue: latestReading.value,
        latestBilirubinUnit: latestReading.unit,
        latestBhutaniRiskZone: latestReading.bhutaniZone || 'high_intermediate',
        postnatalAgeHoursAtReferral: latestReading.postnatalAgeHours || 40,
        phototherapyRecommended: true,
      });

      Alert.alert(
        'Referral Dispatched!',
        `Phototherapy referral successfully sent to ${hospital.name}. You will be notified as soon as hospital doctor reviews.`,
        [{ text: 'View Referral Status', onPress: onSuccess }]
      );
    } catch {
      Alert.alert('Error', 'Failed to send referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Compose Referral</Text>
          <Text style={styles.headerSubtitle}>Destination: {hospital.name}</Text>
        </View>
      </View>

      {/* Target Hospital Card */}
      <View style={styles.hospBanner}>
        <View style={styles.hospBannerTop}>
          <Text style={styles.hospBannerName} numberOfLines={2}>
            {hospital.name}
          </Text>
          <View style={styles.capacityBadge}>
            <Text style={styles.capacityBadgeText}>
              {hospital.availablePTStations} PT Stations Available
            </Text>
          </View>
        </View>
        <Text style={styles.hospBannerSub}>
          {hospital.address} • Contact: {hospital.contactNumber}
        </Text>
      </View>

      {/* Patient Summary Card */}
      {selectedBaby && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionTitle}>Newborn Patient Details</Text>
            <TouchableOpacity
              onPress={() => setShowPatientModal(true)}
              style={styles.changePatientChip}
              activeOpacity={0.7}
            >
              <Text style={styles.changePatientChipText}>Change Patient ▾</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient Name:</Text>
            <Text style={styles.infoValue}>{selectedBaby.parentsName?.trim() || selectedBaby.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>UHID:</Text>
            <Text style={styles.infoValue}>{selectedBaby.uhid}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mother's Name:</Text>
            <Text style={styles.infoValue}>{selectedBaby.parentsName?.trim() || selectedBaby.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gestational Age:</Text>
            <Text style={styles.infoValue}>{selectedBaby.gestationalAgeWeeks || 38} Weeks</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight / Height:</Text>
            <Text style={styles.infoValue}>{selectedBaby.weight || 3.1} kg / {selectedBaby.height || 49} cm</Text>
          </View>
        </View>
      )}

      {/* Compact Bhutani Nomogram Preview */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Bhutani Bilirubin Risk Assessment</Text>
        <BhutaniNomogramChart
          readings={babyReadings as any}
          gestationalAgeWeeks={selectedBaby?.gestationalAgeWeeks || 38}
          compact={true}
        />
      </View>

      {/* Urgency Selector */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Referral Urgency</Text>
        <View style={styles.urgencyRow}>
          {(['routine', 'urgent', 'emergency'] as ReferralUrgency[]).map((u) => {
            const isSel = urgency === u;
            return (
              <TouchableOpacity
                key={u}
                onPress={() => setUrgency(u)}
                style={[
                  styles.urgencyPill,
                  isSel && u === 'routine' && { backgroundColor: '#10B981' },
                  isSel && u === 'urgent' && { backgroundColor: '#F59E0B' },
                  isSel && u === 'emergency' && { backgroundColor: '#FC3949' },
                ]}
              >
                <Text style={[styles.urgencyPillText, isSel && styles.urgencyPillTextActive]}>
                  {u.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Clinical Notes Input */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Clinical Summary & Transport Notes</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={4}
          value={clinicalSummary}
          onChangeText={setClinicalSummary}
          placeholder="Add clinical observations, feeding status, maternal blood group..."
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Submit Referral Button */}
      <TouchableOpacity
        onPress={handleSendReferral}
        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        <Text style={styles.submitBtnText}>
          {isSubmitting ? 'Dispatching Referral...' : 'Send Referral to Hospital →'}
        </Text>
      </TouchableOpacity>

      {/* Patient Selection Modal */}
      <Modal
        visible={showPatientModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Select Newborn Patient</Text>
                <Text style={styles.modalSubtitle}>Change active patient for this referral</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPatientModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search by baby name or UHID..."
                placeholderTextColor="#94A3B8"
                value={patientSearch}
                onChangeText={setPatientSearch}
              />
            </View>

            <FlatList
              data={filteredBabies}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSelected = selectedBaby?.id === item.id;
                const displayName = item.parentsName?.trim() || item.name;

                return (
                  <TouchableOpacity
                    style={[styles.patientItemCard, isSelected && styles.patientItemCardSelected]}
                    onPress={() => {
                      selectBaby(item);
                      setShowPatientModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.patientItemAvatar}>
                      <Text style={styles.patientItemAvatarText}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientItemName}>{displayName}</Text>
                      <Text style={styles.patientItemUhid}>UHID: {item.uhid} • {item.gestationalAgeWeeks || 38}w</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
  },
  backBtnText: {
    fontSize: fontScale(20),
    color: '#181829',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#181829',
  },
  headerSubtitle: {
    fontSize: fontScale(12),
    color: '#64748B',
  },
  hospBanner: {
    backgroundColor: '#F3E8FF',
    borderRadius: moderateScale(16),
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#7D3BFF',
  },
  hospBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: moderateScale(8),
    marginBottom: moderateScale(6),
  },
  hospBannerName: {
    flex: 1,
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#7D3BFF',
    marginRight: moderateScale(8),
  },
  capacityBadge: {
    backgroundColor: '#00A569',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  capacityBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hospBannerSub: {
    fontSize: fontScale(11),
    color: '#475569',
    marginTop: moderateScale(2),
    lineHeight: fontScale(16),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardSectionTitle: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#181829',
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    fontSize: fontScale(12),
    color: '#64748B',
  },
  infoValue: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#181829',
  },
  urgencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  urgencyPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  urgencyPillText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  urgencyPillTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: SPACING.md,
    fontSize: fontScale(12),
    color: '#181829',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: moderateScale(70),
  },
  submitBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: moderateScale(16),
    minHeight: moderateScale(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  submitBtnDisabled: {
    backgroundColor: '#A855F7',
  },
  submitBtnText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changePatientChip: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  changePatientChipText: {
    fontSize: fontScale(11),
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
    maxHeight: '80%',
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
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientItemAvatarText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#7D3BFF',
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
  checkCircle: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
