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
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronDown, ArrowLeft, Check, Edit3, X, Plus } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { ChartCard, GraphReading } from '../../../components/ChartCard';
import { BhutaniNomogramChart } from '../../../components/BhutaniNomogramChart';
import { calculatePostnatalAgeHours, evaluateBhutaniRisk } from '../../../services/bhutani.service';
import { usePatientStore } from '../../../store/usePatientStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Baby, ClinicalObservation, BilirubinReading } from '../../../types';
import { moderateScale, fontScale, SPACING, getScreenTopPadding } from '../../../theme/responsive';

const OBS_SITES = ['Forehead', 'Sternum'];

interface PatientTrendsScreenProps {
  onBackToDashboard: () => void;
  onOpenReadingDetail: (readingVal: number, site: string) => void;
  onSeeAllObservations: () => void;
  onOpenReferral?: () => void;
  onSendToPhototherapy?: (baby?: Baby) => void;
}

export const PatientTrendsScreen: React.FC<PatientTrendsScreenProps> = ({
  onBackToDashboard,
  onOpenReadingDetail,
  onSeeAllObservations,
  onOpenReferral,
  onSendToPhototherapy,
}) => {
  const insets = useSafeAreaInsets();
  const { babies, selectedBaby, selectBaby, updateBaby, observations, readings, addObservation, updateObservation } = usePatientStore();
  const { user } = useAuthStore();
  const { referrals, admissions } = useNetworkStore();
  const activeBaby: Baby = selectedBaby || babies[0];

  const activeReferral = referrals.find(
    (r) =>
      (r.babyUhid === activeBaby?.uhid || r.babyId === activeBaby?.id) &&
      r.status !== 'rejected' &&
      r.status !== 'completed'
  );

  const activeAdmission = admissions.find(
    (a) =>
      (a.babyUhid === activeBaby?.uhid || a.babyId === activeBaby?.id) &&
      a.admissionStatus !== 'discharged'
  );

  // Only show active treatment banner if baby is actively undergoing phototherapy on a station
  const isPhototherapyActive = activeAdmission?.admissionStatus === 'under_treatment' && !!activeAdmission?.ptStationId;
  const [showBabyDropdown, setShowBabyDropdown] = useState(false);

  // Observation add/edit state
  const [showObsModal, setShowObsModal] = useState(false);
  const [editingObs, setEditingObs] = useState<ClinicalObservation | null>(null);
  const [obsValue, setObsValue] = useState('');
  const [obsSite, setObsSite] = useState(OBS_SITES[0]);
  const [obsError, setObsError] = useState('');

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
    const mName = activeBaby.parentsName?.trim() || activeBaby.name;
    setEditName(mName);
    setEditParentsName(mName);
    setEditGestationalAge(
      activeBaby.gestationalAgeWeeks ? String(activeBaby.gestationalAgeWeeks) : '38'
    );
    setEditWeight(activeBaby.weight ? String(activeBaby.weight) : '3.1');
    setEditSeverity(activeBaby.severityState || 'normal');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', "Mother's name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateBaby(activeBaby.id, {
        name: editName.trim(),
        parentsName: editName.trim(),
        gestationalAgeWeeks: parseInt(editGestationalAge, 10) || 38,
        weight: parseFloat(editWeight) || 3.1,
        severityState: editSeverity,
      });
      setShowEditModal(false);
      Alert.alert('Updated', `Details for ${editName.trim()} have been updated.`);
    } catch {
      Alert.alert('Error', 'Failed to update patient details');
    } finally {
      setIsSaving(false);
    }
  };

  // Initial = first value entered for this baby; Discharge = set via Discharge button
  const babyObservations = observations
    .filter((o) => o.babyId === activeBaby.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const initialVal: number | null =
    babyObservations.length > 0 ? babyObservations[babyObservations.length - 1].bilirubinValue : null;
  const isDischarged = activeBaby.status === 'discharged';
  const dischargeVal: number | null = isDischarged && activeBaby.dischargeValue ? activeBaby.dischargeValue : null;

  const handleDischarge = async () => {
    if (babyObservations.length === 0) {
      Alert.alert('No readings', 'Add an observation before discharging.');
      return;
    }
    const lastVal = babyObservations[0].bilirubinValue;
    await updateBaby(activeBaby.id, {
      status: 'discharged',
      dischargeValue: lastVal,
    });
    Alert.alert('Discharged', `${activeBaby.name} has been discharged with value ${lastVal.toFixed(1)} mg/dL.`);
  };

  const recentObservations = babyObservations.slice(0, 4);
  // Chart points oldest -> newest
  const chartPoints = [...babyObservations].reverse().map((o) => o.bilirubinValue);

  // Real data-driven readings for 24-hour Bilirubin Readings chart
  const chartReadings: GraphReading[] = React.useMemo(() => {
    const babyReadings = readings.filter((r) => r.babyId === activeBaby.id);
    const existingObsIds = new Set(babyObservations.map((o) => o.id));

    const obsList: GraphReading[] = babyObservations.map((o) => {
      const rawAge = calculatePostnatalAgeHours(
        activeBaby.dateOfBirth,
        activeBaby.exactTimeOfBirth || '08:00',
        o.timestamp
      );
      return {
        id: o.id,
        value: o.bilirubinValue,
        timestamp: o.timestamp,
        site: o.site,
        postnatalAgeHours: rawAge,
      };
    });

    const rdgList: GraphReading[] = babyReadings
      .filter((r) => !existingObsIds.has(r.id))
      .map((r) => {
        const rawAge = calculatePostnatalAgeHours(
          activeBaby.dateOfBirth,
          activeBaby.exactTimeOfBirth || '08:00',
          r.sampleTimestamp || r.timestamp
        );
        return {
          id: r.id,
          value: r.value,
          timestamp: r.sampleTimestamp || r.timestamp,
          site: r.measurementSite || 'Forehead',
          postnatalAgeHours: r.postnatalAgeHours ?? rawAge,
        };
      });

    return [...obsList, ...rdgList].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [babyObservations, readings, activeBaby]);

  // Merge baby readings and observations dynamically so Bhutani Nomogram plots every single observation
  const combinedBhutaniReadings: BilirubinReading[] = React.useMemo(() => {
    const babyReadings = readings.filter((r) => r.babyId === activeBaby.id);
    const existingIds = new Set(babyReadings.map((r) => r.id));

    const obsAsReadings: BilirubinReading[] = babyObservations
      .filter((o) => !existingIds.has(o.id))
      .map((o) => {
        const rawAge = calculatePostnatalAgeHours(
          activeBaby.dateOfBirth,
          activeBaby.exactTimeOfBirth || '08:00',
          o.timestamp
        );
        const evalRisk = evaluateBhutaniRisk({
          dateOfBirth: activeBaby.dateOfBirth,
          exactTimeOfBirth: activeBaby.exactTimeOfBirth,
          sampleTimestamp: o.timestamp,
          value: o.bilirubinValue,
          unit: 'mg/dL',
          method: o.site === 'Forehead' || o.site === 'Sternum' ? 'TcB' : 'TSB',
          gestationalAgeWeeks: activeBaby.gestationalAgeWeeks || 38,
        });

        return {
          id: o.id,
          clientOperationId: o.clientOperationId || ('op_' + o.id),
          babyId: activeBaby.id,
          babyUhid: activeBaby.uhid,
          value: o.bilirubinValue,
          unit: 'mg/dL',
          method: o.site === 'Forehead' || o.site === 'Sternum' ? 'TcB' : 'TSB',
          sampleTimestamp: o.timestamp,
          postnatalAgeHours: rawAge,
          bhutaniZone: evalRisk.zone,
          bhutaniPercentileApprox: evalRisk.percentileApprox,
          phototherapyPhase:
            activeBaby.status === 'under_treatment'
              ? 'during_phototherapy'
              : 'pre_phototherapy',
          measurementSite: o.site,
          source: 'manual_entry',
          operatorName: o.observerName,
          riskLevel:
            evalRisk.zone === 'high'
              ? 'high'
              : evalRisk.zone.includes('intermediate')
              ? 'intermediate'
              : 'low',
          timestamp: o.timestamp,
        };
      });

    // Ensure direct baby readings also use true continuous postnatal age for the nomogram
    const directBabyReadings = babyReadings.map((r) => {
      const rawAge = r.sampleTimestamp
        ? calculatePostnatalAgeHours(
            activeBaby.dateOfBirth,
            activeBaby.exactTimeOfBirth || '08:00',
            r.sampleTimestamp
          )
        : r.postnatalAgeHours ?? 12;
      return {
        ...r,
        postnatalAgeHours: rawAge,
      };
    });

    const all = [...directBabyReadings, ...obsAsReadings];
    return all.sort((a, b) => {
      const diff = (a.postnatalAgeHours || 0) - (b.postnatalAgeHours || 0);
      if (Math.abs(diff) > 0.05) return diff;
      return new Date(a.sampleTimestamp || a.timestamp).getTime() - new Date(b.sampleTimestamp || b.timestamp).getTime();
    });
  }, [readings, babyObservations, activeBaby]);

  const handleOpenAddObs = () => {
    setEditingObs(null);
    setObsValue('');
    setObsSite(OBS_SITES[0]);
    setObsError('');
    setShowObsModal(true);
  };

  const handleOpenEditObs = (obs: ClinicalObservation) => {
    setEditingObs(obs);
    setObsValue(String(obs.bilirubinValue));
    setObsSite(obs.site);
    setObsError('');
    setShowObsModal(true);
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

  const handleSaveObs = () => {
    Keyboard.dismiss();
    const num = parseFloat(obsValue);
    if (obsValue.trim() === '' || isNaN(num) || num < 0 || num > 30) {
      setObsError('Enter a value between 0 and 30');
      return;
    }

    if (editingObs) {
      updateObservation(editingObs.id, {
        bilirubinValue: num,
        site: obsSite,
      });
    } else {
      addObservation(
        activeBaby.id,
        obsSite,
        num,
        user?.name || 'Nurse A',
        new Date().toISOString()
      );
    }
    setShowObsModal(false);
  };

  return (
    <View style={[styles.safeArea, { paddingTop: getScreenTopPadding(insets, 8) }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
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
            <ChevronDown size={16} color="#7D3BFF" />
            <Text style={styles.babyDropdownText} numberOfLines={1} ellipsizeMode="tail">
              {activeBaby.parentsName || activeBaby.name}
            </Text>
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
                          {baby.parentsName || baby.name}
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

              <ScrollView
                style={styles.editModalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
              >
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
            onPress={() => initialVal !== null && onOpenReadingDetail(initialVal, 'Palms and soles')}
            style={[styles.statCard, { backgroundColor: '#00A569' }]}
          >
            <Text style={styles.statCardLabel}>Initial Value</Text>
            <Text style={styles.statCardValue}>{initialVal !== null ? `${initialVal.toFixed(1)}mg/dL` : '--'}</Text>
          </TouchableOpacity>

          {/* Discharge Value Card (Red/Coral) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => dischargeVal !== null && onOpenReadingDetail(dischargeVal, 'Forehead')}
            style={[styles.statCard, { backgroundColor: '#FC3949' }]}
          >
            <Text style={styles.statCardLabel}>Discharge Value</Text>
            <Text style={styles.statCardValue}>{dischargeVal !== null ? `${dischargeVal.toFixed(1)}mg/dL` : '--'}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Observations Table */}
        <View style={styles.obsHeaderRow}>
          <Text style={styles.obsSectionTitle}>Recent Observations</Text>
          <View style={styles.obsHeaderActions}>
            {!isDischarged && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleOpenAddObs}
                style={styles.addObsPill}
                accessibilityLabel="Add Observation"
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.addObsText}>Add</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSeeAllObservations}
              style={styles.seeAllPill}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.obsTable}>
          <View style={styles.obsTableHead}>
            <Text style={[styles.obsHeadText, { flex: 1.2 }]}>Site</Text>
            <Text style={[styles.obsHeadText, { flex: 1 }]}>Value</Text>
            <Text style={[styles.obsHeadText, { flex: 1.6 }]}>Date & Time</Text>
            <View style={{ width: 28 }} />
          </View>
          {recentObservations.length === 0 ? (
            <Text style={styles.obsEmptyText}>No observations recorded</Text>
          ) : (
            recentObservations.map((o) => (
              <TouchableOpacity
                key={o.id}
                activeOpacity={0.8}
                onPress={() => onOpenReadingDetail(o.bilirubinValue, o.site)}
                style={styles.obsRowItem}
              >
                <Text style={[styles.obsCell, { flex: 1.2 }]} numberOfLines={1}>
                  {o.site}
                </Text>
                <Text style={[styles.obsCell, styles.obsCellVal, { flex: 1 }]}>
                  {o.bilirubinValue.toFixed(1)}
                </Text>
                <Text style={[styles.obsCellTime, { flex: 1.6 }]} numberOfLines={2}>
                  {new Date(o.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  {', '}
                  {new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <TouchableOpacity
                  onPress={() => handleOpenEditObs(o)}
                  style={styles.obsEditBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Edit Observation"
                >
                  <Edit3 size={14} color="#7D3BFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bilirubin Readings Spline Chart - driven by observation data */}
        <ChartCard
          initialValue={initialVal ?? undefined}
          dischargeValue={dischargeVal ?? undefined}
          readings={chartReadings}
          points={chartPoints}
          babyRegistrationTime={activeBaby.registeredAt || activeBaby.createdAt || activeBaby.dateOfBirth}
          babyDateOfBirth={activeBaby.dateOfBirth}
          babyExactTimeOfBirth={activeBaby.exactTimeOfBirth}
        />

        {/* Action Button: Send to Phototherapy / Active PT Status */}
        {(onSendToPhototherapy || onOpenReferral) && (
          isPhototherapyActive ? (
            <TouchableOpacity
              onPress={() => (onSendToPhototherapy ? onSendToPhototherapy(activeBaby) : onOpenReferral?.())}
              style={[styles.referralActiveStatusCard, { marginTop: 16 }]}
              activeOpacity={0.8}
            >
              <View style={styles.referralActiveHeader}>
                <View style={styles.referralActivePulseDot} />
                <Text style={styles.referralActiveTitle}>
                  {activeAdmission?.admissionStatus === 'under_treatment'
                    ? 'Phototherapy in Progress'
                    : activeReferral?.status === 'accepted' || activeReferral?.status === 'arrived'
                    ? 'Referral Accepted • Admitted'
                    : 'Phototherapy Active'}
                </Text>
              </View>
              <Text style={styles.referralActiveSub}>
                {activeAdmission?.ptStationName
                  ? `Station: ${activeAdmission.ptStationName} (${activeAdmission.hospitalName || 'Ward Station'})`
                  : activeReferral?.receivingHospitalName
                  ? `Destination: ${activeReferral.receivingHospitalName} (${(activeReferral.status || '').toUpperCase()})`
                  : 'Active under phototherapy / hospital care.'}
              </Text>
              <Text style={styles.referralActiveHint}>
                Tap to monitor active phototherapy in Ward & Stations →
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => (onSendToPhototherapy ? onSendToPhototherapy(activeBaby) : onOpenReferral?.())}
              style={[styles.referralCalloutBtn, { marginTop: 16 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.referralCalloutText}>Send to Phototherapy →</Text>
            </TouchableOpacity>
          )
        )}

        {/* Mandatory Feature: Bhutani Bilirubin Risk Assessment Section (last) */}
        <View style={styles.nomogramSection}>
          <BhutaniNomogramChart
            readings={combinedBhutaniReadings}
            gestationalAgeWeeks={activeBaby.gestationalAgeWeeks || 38}
            compact={false}
            height={260}
          />
        </View>

        {/* Add / Edit Observation Modal */}
        <Modal visible={showObsModal} transparent animationType="slide">
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
                    {editingObs ? 'Edit Observation' : 'Add Observation'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowObsModal(false)} style={styles.editCloseBtn}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Bilirubin Value (0 - 30 mg/dL) *</Text>
                <TextInput
                  style={[styles.textInput, !!obsError && { borderColor: '#FC3949' }]}
                  value={obsValue}
                  onChangeText={handleObsValueChange}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 12.5"
                />
                {!!obsError && <Text style={styles.obsErrorText}>{obsError}</Text>}

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Site</Text>
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
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowObsModal(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveObs}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveBtnText}>{editingObs ? 'Save Changes' : 'Add Observation'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Discharge Button */}
        {!isDischarged ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDischarge}
            style={styles.dischargeBtn}
            accessibilityLabel="Discharge"
          >
            <Text style={styles.dischargeBtnText}>Discharge</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.dischargeBtn, { backgroundColor: '#E2E8F0' }]}>
            <Text style={[styles.dischargeBtnText, { color: '#64748B' }]}>Patient Discharged</Text>
          </View>
        )}

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
    paddingHorizontal: SPACING.lg,
    paddingTop: moderateScale(8),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  backBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
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
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(20),
    maxWidth: '65%',
    flexShrink: 1,
  },
  babyDropdownText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#181829',
    marginLeft: moderateScale(4),
    flexShrink: 1,
  },
  presentStateContainer: {
    backgroundColor: '#FDF4E5',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: moderateScale(16),
    marginBottom: SPACING.md,
  },
  presentStateLabel: {
    fontSize: fontScale(12),
    color: '#D97706',
    fontWeight: '600',
  },
  presentStateVal: {
    fontSize: fontScale(26),
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2,
  },
  statCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minHeight: moderateScale(68),
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    justifyContent: 'space-between',
  },
  statCardLabel: {
    color: '#FFFFFF',
    fontSize: fontScale(11),
    fontWeight: '600',
    opacity: 0.9,
  },
  statCardValue: {
    color: '#FFFFFF',
    fontSize: fontScale(17),
    fontWeight: '800',
  },
  dischargeBtn: {
    backgroundColor: '#FC3949',
    borderRadius: moderateScale(14),
    minHeight: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  dischargeBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontWeight: '700',
  },
  obsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  addObsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7D3BFF',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(14),
    gap: 4,
  },
  addObsText: {
    color: '#FFFFFF',
    fontSize: fontScale(12),
    fontWeight: '700',
  },
  obsTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    marginBottom: 4,
  },
  obsTableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  obsHeadText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  obsRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  obsCell: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#0F172A',
  },
  obsCellVal: {
    fontWeight: '800',
    color: '#7D3BFF',
  },
  obsCellTime: {
    fontSize: fontScale(11),
    color: '#64748B',
  },
  obsEditBtn: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  obsEmptyText: {
    fontSize: fontScale(13),
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: moderateScale(16),
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
  },
  radioOuter: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
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
    fontSize: fontScale(13),
    color: '#0F172A',
    fontWeight: '600',
  },
  nomogramSection: {
    marginVertical: SPACING.sm,
  },
  referralCalloutBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: moderateScale(14),
    minHeight: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  referralCalloutText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  referralActiveStatusCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: SPACING.md,
  },
  referralActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  referralActivePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7D3BFF',
    marginRight: 8,
  },
  referralActiveTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#6D28D9',
  },
  referralActiveSub: {
    fontSize: fontScale(12),
    color: '#4C1D95',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
  },
  referralActiveHint: {
    fontSize: fontScale(11),
    color: '#7C3AED',
    fontStyle: 'italic',
  },
  obsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  obsSectionTitle: {
    fontSize: fontScale(17),
    fontWeight: '700',
    color: '#181829',
  },
  seeAllPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  seeAllText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  obsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
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
    fontSize: fontScale(15),
    fontWeight: '700',
    color: '#181829',
  },
  obsSub: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 3,
  },
  obsRight: {
    alignItems: 'flex-end',
  },
  obsReadingVal: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#181829',
  },
  obsTime: {
    fontSize: fontScale(11),
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
