import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Search,
  User,
  Edit3,
  TrendingUp,
  Plus,
  X,
  Check,
  Calendar,
  Weight,
  Activity,
} from 'lucide-react-native';
import { usePatientStore } from '../../../store/usePatientStore';
import { Baby, SeverityState } from '../../../types';
import { COLORS } from '../../../theme/colors';

interface PatientsScreenProps {
  onSelectBaby: (baby: Baby) => void;
  onRegisterNew: () => void;
}

export const PatientsScreen: React.FC<PatientsScreenProps> = ({
  onSelectBaby,
  onRegisterNew,
}) => {
  const { babies, updateBaby } = usePatientStore();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | SeverityState>('all');

  // Edit Modal State
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);
  const [editName, setEditName] = useState('');
  const [editParentsName, setEditParentsName] = useState('');
  const [editGestationalAge, setEditGestationalAge] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editSeverity, setEditSeverity] = useState<SeverityState>('normal');
  const [editDoctor, setEditDoctor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredBabies = babies.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.uhid.toLowerCase().includes(search.toLowerCase()) ||
      (b.parentsName && b.parentsName.toLowerCase().includes(search.toLowerCase()));

    const matchesSeverity =
      severityFilter === 'all' || b.severityState === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const handleOpenEdit = (baby: Baby) => {
    setEditingBaby(baby);
    const mName = baby.parentsName?.trim() || baby.name;
    setEditName(mName);
    setEditParentsName(mName);
    setEditGestationalAge(baby.gestationalAgeWeeks ? String(baby.gestationalAgeWeeks) : '38');
    setEditWeight(baby.weight ? String(baby.weight) : '3.1');
    setEditHeight(baby.height ? String(baby.height) : '48');
    setEditSeverity(baby.severityState || 'normal');
    setEditDoctor(baby.assignedDoctor || 'Dr. Priya Sharma');
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
        height: parseFloat(editHeight) || 48.0,
        severityState: editSeverity,
        assignedDoctor: editDoctor.trim(),
      });
      setEditingBaby(null);
      Alert.alert('Updated', `Details for ${editName.trim()} have been updated.`);
    } catch {
      Alert.alert('Error', 'Failed to update patient details');
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityBadge = (state?: SeverityState) => {
    switch (state) {
      case 'critical':
        return { label: 'CRITICAL RISK', bg: '#FFF1F2', text: '#E11D48' };
      case 'moderate':
        return { label: 'MODERATE RISK', bg: '#FFFBEB', text: '#D97706' };
      default:
        return { label: 'LOW RISK / NORMAL', bg: '#ECFDF5', text: '#059669' };
    }
  };

  const formatAgeHours = (dobString: string) => {
    const diffMs = Date.now() - new Date(dobString).getTime();
    const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
    if (hours < 48) return `${hours} hrs old`;
    const days = Math.floor(hours / 24);
    return `${days} days old (${hours}h)`;
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Patients Directory</Text>
          <Text style={styles.subtitle}>
            {filteredBabies.length} Patients • Referring Centre
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onRegisterNew}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={3} />
          <Text style={styles.addBtnText}>New Patient</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Search size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Mother's Name, UHID..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Severity Filter Pills */}
      <View style={styles.filterRow}>
        {(['all', 'critical', 'moderate', 'normal'] as const).map((filter) => {
          const isActive = severityFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setSeverityFilter(filter)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive,
                ]}
              >
                {filter === 'all'
                  ? 'All Patients'
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Patients List */}
      <FlatList
        data={filteredBabies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Patients Found</Text>
            <Text style={styles.emptySub}>
              No patient records match your search or filter criteria.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = getSeverityBadge(item.severityState);
          const motherName = item.parentsName?.trim() || item.name;
          return (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onSelectBaby(item)}
              style={styles.patientCard}
            >
              {/* Card Header: Mother Name + UHID on left, Risk Badge + Pencil Edit on right */}
              <View style={styles.cardHeader}>
                <View style={styles.nameBlock}>
                  <Text style={styles.babyName} numberOfLines={1}>
                    {motherName}
                  </Text>
                  <View style={styles.uhidBadge}>
                    <Text style={styles.uhidText}>{item.uhid}</Text>
                  </View>
                </View>

                <View style={styles.headerRightGroup}>
                  <View style={[styles.riskBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.riskBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pencilEditBtn}
                    onPress={() => handleOpenEdit(item)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={`Edit ${motherName}`}
                  >
                    <Edit3 size={15} color="#7D3BFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Patient Meta Details */}
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color="#64748B" />
                  <Text style={styles.metaText}>
                    {formatAgeHours(item.dateOfBirth)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Activity size={14} color="#64748B" />
                  <Text style={styles.metaText}>
                    {item.gestationalAgeWeeks || 38} weeks
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Weight size={14} color="#64748B" />
                  <Text style={styles.metaText}>
                    {item.weight || 3.1} kg
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Edit Baby Modal */}
      <Modal visible={!!editingBaby} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Patient Information</Text>
                <Text style={styles.modalSub}>UHID: {editingBaby?.uhid}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditingBaby(null)}
                style={styles.closeBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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

              <Text style={styles.inputLabel}>Assigned Attending Doctor</Text>
              <TextInput
                style={styles.textInput}
                value={editDoctor}
                onChangeText={setEditDoctor}
                placeholder="Dr. Priya Sharma"
              />

              <Text style={styles.inputLabel}>Clinical Risk Status</Text>
              <View style={styles.severityOptionsRow}>
                {(['normal', 'moderate', 'critical'] as SeverityState[]).map((st) => {
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
  container: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7D3BFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#7D3BFF',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  babyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  uhidBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  uhidText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pencilEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  motherText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  motherBold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 12,
    gap: 10,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    height: 38,
    borderRadius: 10,
    gap: 6,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  trendsBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7D3BFF',
    height: 38,
    borderRadius: 10,
    gap: 6,
  },
  trendsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#7D3BFF',
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
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
