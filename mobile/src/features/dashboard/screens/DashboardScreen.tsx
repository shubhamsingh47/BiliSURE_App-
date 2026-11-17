import React, { useEffect, useState } from 'react';
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
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { BabyCard } from '../../../components/BabyCard';
import { usePatientStore } from '../../../store/usePatientStore';
import { Baby } from '../../../types';

interface DashboardScreenProps {
  onSelectBaby: (baby: Baby) => void;
  onOpenReportStories: () => void;
  onOpenNewRegistration: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSelectBaby,
  onOpenReportStories,
  onOpenNewRegistration,
}) => {
  const { babies, selectedDepartment, setSelectedDepartment, loadBabies, updateBaby, observations, readings } = usePatientStore();
  const [activeDept, setActiveDept] = useState(selectedDepartment || 'Deppt');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // Edit Baby Modal State
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);
  const [editName, setEditName] = useState('');
  const [editParentsName, setEditParentsName] = useState('');
  const [editGestationalAge, setEditGestationalAge] = useState('38');
  const [editWeight, setEditWeight] = useState('3.1');
  const [editSeverity, setEditSeverity] = useState<any>('normal');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (baby: Baby) => {
    setEditingBaby(baby);
    const mName = baby.parentsName?.trim() || baby.name;
    setEditName(mName);
    setEditParentsName(mName);
    setEditGestationalAge(baby.gestationalAgeWeeks ? String(baby.gestationalAgeWeeks) : '38');
    setEditWeight(baby.weight ? String(baby.weight) : '3.1');
    setEditSeverity(baby.severityState || 'normal');
  };

  const handleSaveEdit = async () => {
    if (!editingBaby) return;
    if (!editName.trim()) {
      Alert.alert('Required', "Mother's name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateBaby(editingBaby.id, {
        name: editName.trim(),
        parentsName: editName.trim(),
        gestationalAgeWeeks: parseInt(editGestationalAge, 10) || 38,
        weight: parseFloat(editWeight) || 3.1,
        severityState: editSeverity,
      });
      setEditingBaby(null);
      Alert.alert('Updated', `Details for ${editName.trim()} have been updated.`);
    } catch {
      Alert.alert('Error', 'Failed to update patient details');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadBabies();
  }, []);

  const departments = ['Deppt', 'NICU', 'Maternity', 'Pediatrics'];

  const handleSelectDept = (dept: string) => {
    setActiveDept(dept);
    setSelectedDepartment(dept);
    setShowDeptDropdown(false);
  };

  const getBabyTimestamp = (baby: Baby): number => {
    if (baby.dateOfBirth) {
      const parsed = new Date(baby.dateOfBirth).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    if (baby.updatedAt) {
      const parsed = new Date(baby.updatedAt).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Filter by selected department if not 'Deppt'
  const filteredBabies = babies.filter((b) => {
    if (!activeDept || activeDept === 'Deppt') return true;
    return b.department === activeDept;
  });

  // Sort newest first by date and time
  const sortedBabies = [...filteredBabies].sort(
    (a, b) => getBabyTimestamp(b) - getBabyTimestamp(a)
  );

  // Split strictly by date and time:
  // Today = registered/born on or after start of today
  // Yesterday = registered/born before start of today
  const todayBabies = sortedBabies.filter((b) => getBabyTimestamp(b) >= startOfToday);
  const yesterdayBabies = sortedBabies.filter((b) => getBabyTimestamp(b) < startOfToday);

  const getPillColor = (idx: number) => {
    const colors = [COLORS.pillBeige, COLORS.pillBeige, COLORS.pillPink, COLORS.pillGreen, COLORS.pillBlue];
    return colors[idx % colors.length];
  };

  const getLatestSample = (babyId: string) => {
    const babyObs = observations
      .filter((o) => o.babyId === babyId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const babyRdgs = readings
      .filter((r) => r.babyId === babyId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const latestObs = babyObs[0];
    const latestRdg = babyRdgs[0];

    if (latestObs && latestRdg) {
      if (new Date(latestObs.timestamp).getTime() >= new Date(latestRdg.timestamp).getTime()) {
        return {
          value: latestObs.bilirubinValue,
          timestamp: latestObs.timestamp,
        };
      }
      return {
        value: latestRdg.value,
        timestamp: latestRdg.timestamp,
      };
    }

    if (latestObs) {
      return {
        value: latestObs.bilirubinValue,
        timestamp: latestObs.timestamp,
      };
    }

    if (latestRdg) {
      return {
        value: latestRdg.value,
        timestamp: latestRdg.timestamp,
      };
    }

    return null;
  };

  return (
    <View style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowDeptDropdown(true)}
          style={styles.deptDropdown}
          accessibilityLabel="Select Department Filter"
        >
          <Text style={styles.deptText}>{activeDept}</Text>
          <ChevronDown size={16} color="#7C3AED" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Department Dropdown Modal */}
      <Modal visible={showDeptDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setShowDeptDropdown(false)}
        >
          <View style={styles.dropdownCard}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Department</Text>
              <TouchableOpacity onPress={() => setShowDeptDropdown(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.dropdownClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {departments.map((dept) => {
              const isSelected = activeDept === dept;
              return (
                <TouchableOpacity
                  key={dept}
                  style={[styles.dropdownOption, isSelected && styles.dropdownOptionActive]}
                  onPress={() => handleSelectDept(dept)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextActive]}>
                    {dept === 'Deppt' ? 'All Departments (Deppt)' : dept}
                  </Text>
                  {isSelected && <Check size={18} color="#7C3AED" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* "See Report >" Banner Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenReportStories}
          style={styles.reportBanner}
        >
          <Text style={styles.reportBannerText}>See Report</Text>
          <ChevronRight size={20} color="#7C3AED" />
        </TouchableOpacity>

        {/* Section: Today */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
        </View>

        {todayBabies.length > 0 ? (
          todayBabies.map((baby, idx) => (
            <BabyCard
              key={baby.id + '_today_' + idx}
              baby={baby}
              latestSample={getLatestSample(baby.id)}
              pillColor={getPillColor(idx)}
              onPress={() => onSelectBaby(baby)}
              onEditPress={() => handleOpenEdit(baby)}
            />
          ))
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No patients registered today</Text>
          </View>
        )}

        {/* Section: Yesterday */}
        <View style={[styles.sectionHeader, { marginTop: 18 }]}>
          <Text style={styles.sectionTitle}>Yesterday</Text>
        </View>

        {yesterdayBabies.length > 0 ? (
          yesterdayBabies.map((baby, idx) => (
            <BabyCard
              key={baby.id + '_yesterday_' + idx}
              baby={baby}
              latestSample={getLatestSample(baby.id)}
              pillColor={getPillColor(idx + 3)}
              onPress={() => onSelectBaby(baby)}
              onEditPress={() => handleOpenEdit(baby)}
            />
          ))
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No previous patient records</Text>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Edit Baby Modal */}
      <Modal visible={!!editingBaby} transparent animationType="slide">
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <View>
                <Text style={styles.editModalTitle}>Edit Patient Information</Text>
                <Text style={styles.editModalSub}>UHID: {editingBaby?.uhid}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingBaby(null)} style={styles.editCloseBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Mother's Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Mother's name"
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
                  onPress={() => setEditingBaby(null)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  deptDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
    marginLeft: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  reportBanner: {
    backgroundColor: '#F3E8FF',
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  reportBannerText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySection: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptySectionText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
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
    maxWidth: 320,
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
  dropdownOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  dropdownOptionTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
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
