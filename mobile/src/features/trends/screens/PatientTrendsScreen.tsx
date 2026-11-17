import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { ChevronDown, ArrowLeft, Check, Edit3, X } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { ChartCard } from '../../../components/ChartCard';
import { BhutaniNomogramChart } from '../../../components/BhutaniNomogramChart';
import { usePatientStore } from '../../../store/usePatientStore';
import { Baby } from '../../../types';

interface PatientTrendsScreenProps {
  onBackToDashboard: () => void;
  onOpenReadingDetail: (readingVal: number, site: string) => void;
  onSeeAllObservations: () => void;
  onOpenReferral?: () => void;
}

export const PatientTrendsScreen: React.FC<PatientTrendsScreenProps> = ({
  onBackToDashboard,
  onOpenReadingDetail,
  onSeeAllObservations,
  onOpenReferral,
}) => {
  const { babies, selectedBaby, selectBaby, updateBaby, observations, readings } = usePatientStore();
  const activeBaby: Baby = selectedBaby || babies[0];
  const [showBabyDropdown, setShowBabyDropdown] = useState(false);

  // Edit Patient State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(activeBaby.name);
  const [editParentsName, setEditParentsName] = useState(activeBaby.parentsName || '');
  const [editGestationalAge, setEditGestationalAge] = useState(
    activeBaby.gestationalAgeWeeks ? String(activeBaby.gestationalAgeWeeks) : '38'
  );
  const [editWeight, setEditWeight] = useState(
    activeBaby.weight ? String(activeBaby.weight) : '3.1'
  );
  const [editSeverity, setEditSeverity] = useState(activeBaby.severityState || 'normal');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = () => {
    setEditName(activeBaby.name);
    setEditParentsName(activeBaby.parentsName || '');
    setEditGestationalAge(
      activeBaby.gestationalAgeWeeks ? String(activeBaby.gestationalAgeWeeks) : '38'
    );
    setEditWeight(activeBaby.weight ? String(activeBaby.weight) : '3.1');
    setEditSeverity(activeBaby.severityState || 'normal');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Patient name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await updateBaby(activeBaby.id, {
        name: editName.trim(),
        parentsName: editParentsName.trim(),
        gestationalAgeWeeks: parseInt(editGestationalAge, 10) || 38,
        weight: parseFloat(editWeight) || 3.1,
        severityState: editSeverity,
      });
      setShowEditModal(false);
      Alert.alert('Updated', `Patient ${editName.trim()} has been updated.`);
    } catch {
      Alert.alert('Error', 'Failed to update patient details');
    } finally {
      setIsSaving(false);
    }
  };

  const initialVal = activeBaby.initialValue || 10.0;
  const dischargeVal = activeBaby.dischargeValue || 5.0;

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBackToDashboard}
            style={styles.backBtn}
            accessibilityLabel="Back to Dashboard"
          >
            <ArrowLeft size={22} color="#7D3BFF" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowBabyDropdown(true)}
            style={styles.babyDropdownPill}
            accessibilityLabel="Select Patient Dropdown"
          >
            <ChevronDown size={18} color="#7D3BFF" />
            <Text style={styles.babyDropdownText}>{activeBaby.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenEdit}
            style={styles.editBtn}
            accessibilityLabel="Edit Patient"
          >
            <Edit3 size={18} color="#7D3BFF" />
          </TouchableOpacity>
        </View>

        {/* Baby Filter Dropdown Modal */}
        <Modal visible={showBabyDropdown} transparent animationType="fade">
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setShowBabyDropdown(false)}
          >
            <View style={styles.dropdownCard}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select Patient</Text>
                <TouchableOpacity onPress={() => setShowBabyDropdown(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.dropdownClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {babies.map((baby) => {
                  const isSelected = activeBaby.id === baby.id;
                  return (
                    <TouchableOpacity
                      key={baby.id}
                      style={[styles.dropdownOption, isSelected && styles.dropdownOptionActive]}
                      onPress={() => {
                        selectBaby(baby);
                        setShowBabyDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.babyOptionInfo}>
                        <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextActive]}>
                          {baby.name}
                        </Text>
                        <Text style={styles.babySubText}>
                          UHID: {baby.uhid} • Gestation: {baby.gestationalAgeWeeks || 38}w
                        </Text>
                      </View>
                      {isSelected && <Check size={18} color="#7D3BFF" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Edit Patient Modal */}
        <Modal visible={showEditModal} transparent animationType="slide">
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <View>
                  <Text style={styles.editModalTitle}>Edit Patient Information</Text>
                  <Text style={styles.editModalSub}>UHID: {activeBaby.uhid}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.editCloseBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.editModalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Patient's Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Baby 1"
                />

                <Text style={styles.inputLabel}>Parent / Mother's Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editParentsName}
                  onChangeText={setEditParentsName}
                  placeholder="e.g. Sarah Jenkins"
                />

                <View style={styles.inputRow}>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Gestation (weeks)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editGestationalAge}
                      onChangeText={setEditGestationalAge}
                      keyboardType="numeric"
                      placeholder="38"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Birth Weight (kg)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editWeight}
                      onChangeText={setEditWeight}
                      keyboardType="numeric"
                      placeholder="3.1"
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Clinical Risk Status</Text>
                <View style={styles.severityOptionsRow}>
                  {(['normal', 'moderate', 'critical'] as const).map((st) => {
                    const isSel = editSeverity === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        onPress={() => setEditSeverity(st)}
                        style={[styles.severityPill, isSel && styles.severityPillActive]}
                      >
                        <Text
                          style={[
                            styles.severityPillText,
                            isSel && styles.severityPillTextActive,
                          ]}
                        >
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </Text>
                        {isSel && <Check size={14} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveEdit}
                    disabled={isSaving}
                  >
                    <Text style={styles.saveBtnText}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Present State */}
        <View style={styles.presentStateContainer}>
          <Text style={styles.presentStateLabel}>Present State</Text>
          <Text style={styles.presentStateVal}>
            {activeBaby.severityState ? activeBaby.severityState.charAt(0).toUpperCase() + activeBaby.severityState.slice(1) : 'Moderate'}
          </Text>
        </View>

        {/* Two Big Stat Cards from Frame 27 */}
        <View style={styles.statCardsRow}>
          {/* Initial Value Card (Green) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenReadingDetail(initialVal, 'Palms and soles')}
            style={[styles.statCard, { backgroundColor: '#00A569' }]}
          >
            <Text style={styles.statCardLabel}>Initial Value</Text>
            <Text style={styles.statCardValue}>{initialVal.toFixed(1)}mg/dL</Text>
          </TouchableOpacity>

          {/* Discharge Value Card (Red/Coral) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenReadingDetail(dischargeVal, 'Forehead')}
            style={[styles.statCard, { backgroundColor: '#FC3949' }]}
          >
            <Text style={styles.statCardLabel}>Discharge Value</Text>
            <Text style={styles.statCardValue}>{dischargeVal.toFixed(1)}mg/dL</Text>
          </TouchableOpacity>
        </View>

        {/* Mandatory Feature: Bhutani Bilirubin Risk Assessment Section */}
        <View style={styles.nomogramSection}>
          <BhutaniNomogramChart
            readings={readings as any}
            gestationalAgeWeeks={activeBaby.gestationalAgeWeeks || 38}
            compact={false}
            height={260}
          />
        </View>

        {/* Bilirubin Readings Spline Chart (Video Frame 27) */}
        <ChartCard
          initialValue={initialVal}
          dischargeValue={dischargeVal}
        />

        {/* Referral Action Callout Button */}
        {onOpenReferral && (
          <TouchableOpacity
            onPress={onOpenReferral}
            style={styles.referralCalloutBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.referralCalloutText}>Initiate District Phototherapy Referral →</Text>
          </TouchableOpacity>
        )}

        {/* Recent Observations Section */}
        <View style={styles.obsHeaderRow}>
          <Text style={styles.obsSectionTitle}>Recent Observations</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSeeAllObservations}
            style={styles.seeAllPill}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Observation Card from Frame 27 */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenReadingDetail(18.0, 'Face')}
          style={styles.obsCard}
        >
          <View>
            <Text style={styles.obsTitle}>{activeBaby.name}: Face</Text>
            <Text style={styles.obsSub}>Readings By Nurse A</Text>
          </View>
          <View style={styles.obsRight}>
            <Text style={styles.obsReadingVal}>18.0mg/dL</Text>
            <Text style={styles.obsTime}>10:00 AM</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  babyDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  babyDropdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181829',
    marginLeft: 6,
  },
  presentStateContainer: {
    backgroundColor: '#FDF4E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  presentStateLabel: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: '600',
  },
  presentStateVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2,
  },
  statCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    height: 120,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    marginHorizontal: 4,
  },
  statCardLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  statCardValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  nomogramSection: {
    marginVertical: 10,
  },
  referralCalloutBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  referralCalloutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  obsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  obsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181829',
  },
  seeAllPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  obsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  obsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181829',
  },
  obsSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  obsRight: {
    alignItems: 'flex-end',
  },
  obsReadingVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181829',
  },
  obsTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownClose: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  dropdownOptionActive: {
    backgroundColor: '#F3E8FF',
  },
  babyOptionInfo: {
    flex: 1,
    marginRight: 8,
  },
  dropdownOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdownOptionTextActive: {
    color: '#7D3BFF',
  },
  babySubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 14,
  },
  editModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  editModalSub: {
    fontSize: 12,
    color: '#7D3BFF',
    fontWeight: '700',
    marginTop: 2,
  },
  editCloseBtn: {
    padding: 4,
  },
  editModalBody: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  severityOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  severityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  severityPillActive: {
    backgroundColor: '#7D3BFF',
  },
  severityPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  severityPillTextActive: {
    color: '#FFFFFF',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
