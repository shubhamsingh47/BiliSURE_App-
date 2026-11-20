import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronRight, Check, X, Search, User, Plus } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { BabyCard } from '../../../components/BabyCard';
import { usePatientStore } from '../../../store/usePatientStore';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { Baby } from '../../../types';
import { moderateScale, fontScale, SPACING, getScreenTopPadding } from '../../../theme/responsive';
import { AppAlert } from '../../../components';

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
  const { babies, selectedDepartment, setSelectedDepartment, loadBabies, updateBaby, observations, readings, isLoading } = usePatientStore();
  const { referrals, admissions, stations } = useNetworkStore();
  const { user, activeHospital } = useAuthStore();
  const currentHospital = (user?.facility || activeHospital || 'PGI').toUpperCase();

  const getReferredHospital = (baby: Baby): string | null => {
    // A baby is in the referred state on the sender's dashboard only while its outgoing referral is pending
    if (baby.referralStatus === 'pending' && baby.referredToHospitalName) {
      return baby.referredToHospitalName;
    }
    const outgoingRef = referrals.find(
      (r) =>
        (r.babyUhid === baby.uhid || r.babyId === baby.id) &&
        r.referringCentreName?.toUpperCase() === currentHospital &&
        r.status === 'pending'
    );
    return outgoingRef?.receivingHospitalName || null;
  };

  const getReferralSentAt = (baby: Baby): string | null => {
    if (baby.referralStatus === 'pending' && baby.referralSentAt) {
      return baby.referralSentAt;
    }
    const outgoingRef = referrals.find(
      (r) =>
        (r.babyUhid === baby.uhid || r.babyId === baby.id) &&
        r.referringCentreName?.toUpperCase() === currentHospital &&
        r.status === 'pending'
    );
    return outgoingRef?.createdAt || null;
  };
  const [activeDept, setActiveDept] = useState(selectedDepartment || 'Deppt');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Edit Baby Modal State
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);
  const [editName, setEditName] = useState('');
  const [editParentsName, setEditParentsName] = useState('');
  const [editGestationalAge, setEditGestationalAge] = useState('38');
  const [editWeight, setEditWeight] = useState('3.1');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (baby: Baby) => {
    if (baby.status === 'discharged') {
      AppAlert.warning('Record Locked', 'This patient has been discharged and their record is locked.');
      return;
    }
    if (baby.referralStatus === 'pending' || baby.referredToHospitalName || baby.isTransferredOut || baby.isHistoricalOnly) {
      AppAlert.warning('Record Locked', 'This patient has been referred to another facility and cannot be edited.');
      return;
    }
    setEditingBaby(baby);
    const mName = baby.parentsName?.trim() || baby.name;
    setEditName(mName);
    setEditParentsName(mName);
    setEditGestationalAge(baby.gestationalAgeWeeks ? String(baby.gestationalAgeWeeks) : '38');
    setEditWeight(baby.weight ? String(baby.weight) : '3.1');
  };

  const handleSaveEdit = async () => {
    if (!editingBaby) return;
    if (!editName.trim()) {
      AppAlert.warning('Required Field', "Mother's name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      await updateBaby(editingBaby.id, {
        name: editName.trim(),
        parentsName: editName.trim(),
        gestationalAgeWeeks: parseInt(editGestationalAge, 10) || 38,
        weight: parseFloat(editWeight) || 3.1,
        severityState: editingBaby.severityState || 'normal',
      });
      setEditingBaby(null);
      AppAlert.success('Updated', `Details for ${editName.trim()} have been updated.`);
    } catch {
      AppAlert.error('Error', 'Failed to update patient details.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadBabies();
  }, [currentHospital]);

  const departments = ['Deppt', 'NICU', 'Maternity', 'Pediatrics'];

  const handleSelectDept = (dept: string) => {
    setActiveDept(dept);
    setSelectedDepartment(dept);
    setShowDeptDropdown(false);
  };

  const parseDateSafe = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === 'number') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof val === 'string') {
      const str = val.trim();
      const direct = new Date(str);
      if (!isNaN(direct.getTime())) return direct;

      // Handle DD/MM/YYYY or DD-MM-YYYY formats with optional time
      const match = str.match(
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AaPp][Mm]))?)?/
      );
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        let hours = match[4] ? parseInt(match[4], 10) : 0;
        const minutes = match[5] ? parseInt(match[5], 10) : 0;
        const seconds = match[6] ? parseInt(match[6], 10) : 0;
        const ampm = match[7]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        const d = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return null;
  };

  const getBabyTimestamp = (baby: Baby): number => {
    // Referral acceptance timestamp takes precedence for referred babies so they appear in Today/Yesterday/Dated
    // based on acceptance date/time, then registration timestamp (registeredAt/createdAt/dateOfBirth)
    const candidates = [
      baby.referralAcceptedAt,
      baby.acceptedAt,
      baby.registeredAt,
      baby.createdAt,
      baby.dateOfBirth,
    ];
    for (const cand of candidates) {
      if (cand) {
        const d = parseDateSafe(cand);
        if (d) return d.getTime();
      }
    }
    return 0;
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0).getTime();

  // Strict hospital data isolation guard: only babies belonging to current hospital
  // or historical outgoing referrals from this hospital may be present
  const authorizedBabies = babies.filter((b) => {
    const babyHosp = (b.currentHospital || b.facility || '').toUpperCase();
    if (babyHosp && babyHosp !== currentHospital) {
      const isHistoricalOutgoing = Boolean(
        b.isTransferredOut || b.isHistoricalOnly || b.referralStatus === 'pending'
      );
      return isHistoricalOutgoing;
    }
    return true;
  });

  // Filter by selected department and search keyword
  const filteredBabies = authorizedBabies.filter((b) => {
    const matchesDept = !activeDept || activeDept === 'Deppt' || b.department === activeDept;
    const s = search.trim().toLowerCase();
    const matchesSearch =
      !s ||
      b.name.toLowerCase().includes(s) ||
      b.uhid.toLowerCase().includes(s) ||
      (b.parentsName && b.parentsName.toLowerCase().includes(s));

    return matchesDept && matchesSearch;
  });

  // Sort newest first by date and time
  const sortedBabies = [...filteredBabies].sort(
    (a, b) => getBabyTimestamp(b) - getBabyTimestamp(a)
  );

  interface PreviousDateGroup {
    dayKey: string;
    title: string;
    orderTimestamp: number;
    babies: Baby[];
  }

  // 1. Today = registered/born on or after start of today
  const todayBabies = sortedBabies.filter((b) => getBabyTimestamp(b) >= startOfToday);

  // 2. Yesterday = registered/born on or after start of yesterday and before start of today
  const yesterdayBabies = sortedBabies.filter((b) => {
    const ts = getBabyTimestamp(b);
    return ts >= startOfYesterday && ts < startOfToday;
  });

  // 3. Older dates = registered/born before start of yesterday, grouped by date (e.g. "15-11-2026")
  const olderBabies = sortedBabies.filter((b) => getBabyTimestamp(b) < startOfYesterday);

  const olderGroupsMap = new Map<string, PreviousDateGroup>();
  for (const baby of olderBabies) {
    const ts = getBabyTimestamp(baby);
    const d = ts > 0 ? new Date(ts) : now;
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const yearStr = d.getFullYear();
    const formattedTitle = `${dayStr}-${monthStr}-${yearStr}`;
    const dayKey = `date_${yearStr}_${monthStr}_${dayStr}`;
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();

    if (!olderGroupsMap.has(dayKey)) {
      olderGroupsMap.set(dayKey, {
        dayKey,
        title: formattedTitle,
        orderTimestamp: startOfDay,
        babies: [],
      });
    }
    olderGroupsMap.get(dayKey)!.babies.push(baby);
  }

  const previousDateGroups = Array.from(olderGroupsMap.values()).sort(
    (a, b) => b.orderTimestamp - a.orderTimestamp
  );

  const getPillColor = (idx: number) => {
    const colors = [COLORS.pillBeige, COLORS.pillBeige, COLORS.pillPink, COLORS.pillGreen, COLORS.pillBlue];
    return colors[idx % colors.length];
  };

  const getPhototherapyInfo = (baby: Baby) => {
    // 1. Direct match on active station occupied by this baby
    const occupiedStation = stations.find(
      (s) =>
        s.operationalStatus === 'occupied' &&
        ((baby.uhid && s.currentBabyUhid === baby.uhid) ||
         (baby.id && s.currentBabyId === baby.id) ||
         (baby.name && s.currentBabyName === (baby.parentsName?.trim() || baby.name)))
    );

    // 2. Admission match
    const adm = admissions.find(
      (a) =>
        (a.babyId && a.babyId === baby.id) ||
        (a.babyUhid && a.babyUhid === baby.uhid) ||
        (baby.uhid && a.admissionId === baby.uhid)
    );

    const isConcluded =
      adm?.stationReleased ||
      adm?.admissionStatus === 'in_observation' ||
      adm?.admissionStatus === 'discharged';
    const sessions = adm?.treatmentSessions || [];
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Station referenced by admission
    const admStation = adm?.ptStationId
      ? stations.find((s) => s.id === adm.ptStationId || s.stationId === adm.ptStationId)
      : null;

    // Station referenced by baby.currentStationId
    const babyStation = baby.currentStationId
      ? stations.find(
          (s) =>
            s.id === baby.currentStationId ||
            s.stationId === baby.currentStationId ||
            s.name === baby.currentStationId
        )
      : null;

    // Resolve the real human-readable station name (never a generic placeholder)
    const resolvedStation =
      occupiedStation?.name ||
      admStation?.name ||
      babyStation?.name ||
      adm?.ptStationName ||
      baby.currentStationId ||
      occupiedStation?.stationId ||
      adm?.ptStationId;

    const isUnderTreatment =
      (!isConcluded && adm?.admissionStatus === 'under_treatment') ||
      !!occupiedStation ||
      baby.status === 'under_treatment';

    if (isUnderTreatment && resolvedStation) {
      return {
        status: 'in_treatment' as const,
        stationName: resolvedStation,
        hours: totalHours,
      };
    }

    if (sessions.length > 0 || isConcluded) {
      return {
        status: 'concluded' as const,
        hours: totalHours,
      };
    }

    if (baby.dischargeValue) {
      return {
        status: 'concluded' as const,
      };
    }

    return null;
  };

  const getLatestSample = (baby: Baby) => {
    const babyObs = observations
      .filter((o) => o.babyId === baby.id || (baby.uhid && (o as any).babyUhid === baby.uhid))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const babyRdgs = readings
      .filter((r) => r.babyId === baby.id || (baby.uhid && r.babyUhid === baby.uhid))
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
    <View style={[styles.safeArea, { paddingTop: getScreenTopPadding(insets, 8) }]}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        {/* Row 1: Screen Title, Patient Count & Register Button */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenTitle}>Patients</Text>
            <View style={styles.patientCountBadge}>
              <Text style={styles.patientCountText}>
                {filteredBabies.length} {filteredBabies.length === 1 ? 'Patient' : 'Patients'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenNewRegistration}
            style={styles.registerBabyBtn}
            accessibilityLabel="Register New Baby"
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.registerBabyBtnText}>Register Baby</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Ward Filter Dropdown & Search Bar */}
        <View style={styles.headerFilterRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDeptDropdown(true)}
            style={styles.deptDropdown}
            accessibilityLabel="Select Department Filter"
          >
            <Text style={styles.deptLabel}>Ward: </Text>
            <Text style={styles.deptText}>{activeDept === 'Deppt' ? 'All' : activeDept}</Text>
            <ChevronDown size={14} color="#7D3BFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <View style={styles.searchWrapper}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, UHID..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* "See Report >" Banner Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenReportStories}
          style={styles.reportBanner}
        >
          <Text style={styles.reportBannerText}>See Report</Text>
          <ChevronRight size={20} color="#7C3AED" />
        </TouchableOpacity>

        {isLoading && authorizedBabies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="small" color="#7D3BFF" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>Loading Patient Records...</Text>
            <Text style={styles.emptySub}>Fetching authorized data for {currentHospital}</Text>
          </View>
        ) : filteredBabies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <User size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Patients Found</Text>
            <Text style={styles.emptySub}>
              {search ? `No patient records match "${search}".` : `No patients recorded for ${currentHospital}.`}
            </Text>
          </View>
        ) : (
          <>
            {/* Section: Today */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today</Text>
            </View>

            {todayBabies.length > 0 ? (
              todayBabies.map((baby, idx) => (
                <BabyCard
                  key={baby.id + '_today_' + idx}
                  baby={baby}
                  latestSample={getLatestSample(baby)}
                  phototherapyInfo={getPhototherapyInfo(baby)}
                  pillColor={getPillColor(idx)}
                  referredToHospital={getReferredHospital(baby)}
                  referralSentAt={getReferralSentAt(baby)}
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
            {yesterdayBabies.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 18 }]}>
                  <Text style={styles.sectionTitle}>Yesterday</Text>
                </View>

                {yesterdayBabies.map((baby, idx) => (
                  <BabyCard
                    key={baby.id + '_yesterday_' + idx}
                    baby={baby}
                    latestSample={getLatestSample(baby)}
                    phototherapyInfo={getPhototherapyInfo(baby)}
                    pillColor={getPillColor(idx + 3)}
                    referredToHospital={getReferredHospital(baby)}
                    referralSentAt={getReferralSentAt(baby)}
                    onPress={() => onSelectBaby(baby)}
                    onEditPress={() => handleOpenEdit(baby)}
                  />
                ))}
              </>
            )}

            {/* Previous Dated Sections (e.g. 15-11-2026) */}
            {previousDateGroups.map((group, groupIdx) => (
              <View key={group.dayKey}>
                <View style={[styles.sectionHeader, { marginTop: 18 }]}>
                  <Text style={styles.sectionTitle}>{group.title}</Text>
                </View>

                {group.babies.map((baby, idx) => (
                  <BabyCard
                    key={baby.id + '_' + group.dayKey + '_' + idx}
                    baby={baby}
                    latestSample={getLatestSample(baby)}
                    phototherapyInfo={getPhototherapyInfo(baby)}
                    pillColor={getPillColor(groupIdx * 3 + idx + 1)}
                    referredToHospital={getReferredHospital(baby)}
                    referralSentAt={getReferralSentAt(baby)}
                    onPress={() => onSelectBaby(baby)}
                    onEditPress={() => handleOpenEdit(baby)}
                  />
                ))}
              </View>
            ))}
          </>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: moderateScale(4),
    paddingBottom: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: moderateScale(10),
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    gap: 8,
  },
  screenTitle: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#181829',
  },
  registerBabyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7D3BFF',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
    gap: 4,
  },
  registerBabyBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(12),
    fontWeight: '700',
  },
  headerFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deptDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptLabel: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },
  deptText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  patientCountBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  patientCountText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: moderateScale(10),
    paddingBottom: SPACING.xxl,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(10),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(13),
    color: '#0F172A',
    paddingVertical: moderateScale(4),
  },
  emptyContainer: {
    paddingVertical: SPACING.xxl * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: '700',
    color: '#334155',
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: fontScale(13),
    color: '#94A3B8',
    marginTop: SPACING.xs,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  reportBanner: {
    backgroundColor: '#F3E8FF',
    minHeight: moderateScale(52),
    borderRadius: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  reportBannerText: {
    color: '#7C3AED',
    fontSize: fontScale(15),
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySection: {
    paddingVertical: moderateScale(16),
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptySectionText: {
    fontSize: fontScale(13),
    color: '#94A3B8',
    fontWeight: '600',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(22),
  },
  dropdownCard: {
    width: '100%',
    maxWidth: moderateScale(320),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: moderateScale(8),
  },
  dropdownTitle: {
    fontSize: fontScale(16),
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownClose: {
    fontSize: fontScale(16),
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(12),
    marginTop: 4,
  },
  dropdownOptionActive: {
    backgroundColor: '#F3E8FF',
  },
  dropdownOptionText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: '#334155',
  },
  dropdownOptionTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(26),
    borderTopRightRadius: moderateScale(26),
    maxHeight: '85%',
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
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
  editModalSub: {
    fontSize: fontScale(12),
    color: '#7D3BFF',
    fontWeight: '700',
    marginTop: 2,
  },
  editCloseBtn: {
    padding: 4,
  },
  editModalBody: {
    marginBottom: moderateScale(10),
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    marginTop: moderateScale(8),
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
  inputRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  halfInput: {
    flex: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(16),
    marginBottom: moderateScale(20),
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
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1.5,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
