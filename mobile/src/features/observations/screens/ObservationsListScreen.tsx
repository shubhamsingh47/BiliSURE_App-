import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { Edit3, Calendar, User, X, Plus } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { CustomHeader } from '../../../components/CustomHeader';
import { usePatientStore } from '../../../store/usePatientStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { ClinicalObservation } from '../../../types';
import { moderateScale, fontScale, SPACING } from '../../../theme/responsive';

const OBS_SITES = ['Forehead', 'Sternum', 'Face', 'Palms and soles'];

interface ObservationsListScreenProps {
  onBack: () => void;
}

export const ObservationsListScreen: React.FC<ObservationsListScreenProps> = ({ onBack }) => {
  const { observations, selectedBaby, updateObservation, addObservation } = usePatientStore();
  const { user } = useAuthStore();

  const [editingObs, setEditingObs] = useState<ClinicalObservation | null>(null);
  const [obsValue, setObsValue] = useState('');
  const [obsSite, setObsSite] = useState(OBS_SITES[0]);
  const [obsError, setObsError] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const isDischarged = selectedBaby?.status === 'discharged';
  const patientDisplayName = selectedBaby?.parentsName?.trim() || selectedBaby?.name || 'Patient';

  // Filter observations for the selected patient and sort newest first
  const sortedObservations = observations
    .filter((o) => !selectedBaby || o.babyId === selectedBaby.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatObservationDateTime = (timestamp: string | number | Date) => {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Date Unknown';
    const dateStr = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} · ${timeStr}`;
  };

  const handleOpenEdit = (obs: ClinicalObservation) => {
    setIsAddingNew(false);
    setEditingObs(obs);
    setObsValue(String(obs.bilirubinValue));
    setObsSite(obs.site || OBS_SITES[0]);
    setObsError('');
  };

  const handleOpenAdd = () => {
    setIsAddingNew(true);
    setEditingObs(null);
    setObsValue('');
    setObsSite(OBS_SITES[0]);
    setObsError('');
  };

  const handleObsValueChange = (t: string) => {
    const cleaned = t.replace(/[^0-9.]/g, '');
    setObsValue(cleaned);
    if (cleaned === '') {
      setObsError('');
      return;
    }
    const num = parseFloat(cleaned);
    if (isNaN(num) || num < 0 || num > 30) {
      setObsError('Enter a value between 0 and 30');
    } else {
      setObsError('');
    }
  };

  const handleSave = () => {
    Keyboard.dismiss();
    const num = parseFloat(obsValue);
    if (obsValue.trim() === '' || isNaN(num) || num < 0 || num > 30) {
      setObsError('Enter a value between 0 and 30');
      return;
    }

    if (isAddingNew && selectedBaby) {
      addObservation(selectedBaby.id, obsSite, num, user?.name || 'Nurse A');
      setIsAddingNew(false);
    } else if (editingObs) {
      updateObservation(editingObs.id, { bilirubinValue: num, site: obsSite });
      setEditingObs(null);
    }
  };

  const handleCloseModal = () => {
    setEditingObs(null);
    setIsAddingNew(false);
  };

  const showModal = isAddingNew || editingObs !== null;

  return (
    <View style={styles.safeArea}>
      <CustomHeader
        title={`Observations - ${patientDisplayName}`}
        onBack={onBack}
        rightAction={
          !isDischarged ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenAdd}
              style={styles.headerAddBtn}
              accessibilityLabel="Add Observation"
            >
              <Plus size={moderateScale(15)} color="#FFFFFF" />
              <Text style={styles.headerAddBtnText}>Add</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={sortedObservations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Observations Recorded</Text>
            <Text style={styles.emptySub}>
              Clinical observations for {patientDisplayName} will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* 1. Primary Information: Observation Value + Edit Action */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.valueContainer}>
                <Text style={styles.valueNumber}>
                  {item.bilirubinValue != null ? item.bilirubinValue.toFixed(1) : '--'}
                </Text>
                <Text style={styles.valueUnit}>mg/dL</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOpenEdit(item)}
                style={styles.editBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Edit Observation"
              >
                <Edit3 size={moderateScale(13)} color="#7D3BFF" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* 2. Primary Information: Date and Time */}
            <View style={styles.metaRow}>
              <Calendar size={moderateScale(14)} color="#7D3BFF" style={styles.metaIcon} />
              <Text style={styles.dateTimeText}>
                {formatObservationDateTime(item.timestamp)}
              </Text>
            </View>

            {/* 3. Primary Information: Taken By */}
            <View style={[styles.metaRow, { marginTop: moderateScale(6) }]}>
              <User size={moderateScale(14)} color="#64748B" style={styles.metaIcon} />
              <Text style={styles.takenByText}>
                {item.observerName
                  ? `Recorded by: ${item.observerName}`
                  : 'Recorded by: Unknown'}
              </Text>
            </View>

            {/* Optional clinical notes */}
            {!!item.clinicalNotes && (
              <Text style={styles.notesText}>{item.clinicalNotes}</Text>
            )}

            {/* 4. Secondary Information: Measurement Site as subtle, muted chip */}
            <View style={styles.siteRow}>
              <View style={styles.siteChip}>
                <Text style={styles.siteChipText}>
                  Site: {item.site || 'Standard'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Add / Edit Observation Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.editModalOverlay}
        >
          <View style={styles.editModalContent}>
            <ScrollView
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>
                  {isAddingNew ? 'Add Observation' : 'Edit Observation'}
                </Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.editCloseBtn}>
                  <X size={moderateScale(20)} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Bilirubin Value (0 - 30 mg/dL) *</Text>
              <TextInput
                style={[styles.textInput, !!obsError && { borderColor: '#FC3949' }]}
                value={obsValue}
                onChangeText={handleObsValueChange}
                keyboardType="decimal-pad"
                placeholder="e.g. 12.5"
                autoFocus
              />
              {!!obsError && <Text style={styles.obsErrorText}>{obsError}</Text>}

              <Text style={[styles.inputLabel, { marginTop: moderateScale(14) }]}>Measurement Site</Text>
              {OBS_SITES.map((s) => {
                const sel = obsSite === s;
                return (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.7}
                    onPress={() => setObsSite(s)}
                    style={styles.radioRow}
                  >
                    <View style={[styles.radioOuter, sel && styles.radioOuterActive]}>
                      {sel && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{s}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveBtnText}>
                    {isAddingNew ? 'Add Observation' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7D3BFF',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(14),
    gap: 4,
  },
  headerAddBtnText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  valueNumber: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#0F172A',
  },
  valueUnit: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(12),
  },
  editBtnText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: moderateScale(10),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIcon: {
    opacity: 0.9,
  },
  dateTimeText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#1E293B',
  },
  takenByText: {
    fontSize: fontScale(13),
    fontWeight: '500',
    color: '#64748B',
  },
  notesText: {
    fontSize: fontScale(13),
    color: '#475569',
    lineHeight: 18,
    marginTop: moderateScale(8),
    backgroundColor: '#F8FAFC',
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
  },
  siteRow: {
    marginTop: moderateScale(12),
    flexDirection: 'row',
  },
  siteChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  siteChipText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(48),
    paddingHorizontal: moderateScale(24),
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: '700',
    color: '#334155',
    marginBottom: moderateScale(6),
  },
  emptySub: {
    fontSize: fontScale(13),
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modal styles
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '85%',
    padding: moderateScale(20),
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: moderateScale(14),
    marginBottom: moderateScale(14),
  },
  editModalTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  editCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    height: moderateScale(44),
    paddingHorizontal: moderateScale(12),
    fontSize: fontScale(14),
    color: '#0F172A',
  },
  obsErrorText: {
    fontSize: fontScale(12),
    color: '#FC3949',
    marginTop: 4,
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    gap: 10,
  },
  radioOuter: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#7D3BFF',
  },
  radioInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#7D3BFF',
  },
  radioLabel: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#334155',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  cancelBtn: {
    flex: 1,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
