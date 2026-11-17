import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { Admission } from '../../../types';
import { BhutaniNomogramChart } from '../../../components/BhutaniNomogramChart';
import { COLORS } from '../../../theme/colors';

interface DischargeApprovalScreenProps {
  admission: Admission;
  onSuccess: () => void;
  onBack: () => void;
}

export const DischargeApprovalScreen: React.FC<DischargeApprovalScreenProps> = ({
  admission,
  onSuccess,
  onBack,
}) => {
  const { approveDischarge } = useNetworkStore();
  const { user } = useAuthStore();

  const [dischargeVal, setDischargeVal] = useState('7.2');
  const [dischargeNotes, setDischargeNotes] = useState(
    'Bilirubin successfully declined below AAP phototherapy threshold. Baby feeds well with good urine output and active alertness.'
  );
  const [followUpPlan, setFollowUpPlan] = useState(
    'Recheck transcutaneous bilirubin (TcB) at referring CHC in 48 hours for rebound jaundice surveillance.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total phototherapy duration calculation
  const totalDurationMinutes = admission.treatmentSessions.reduce(
    (acc, s) => acc + (s.durationMinutes || 0),
    0
  );
  const totalHours = (totalDurationMinutes / 60).toFixed(1);

  const handleApproveDischarge = async () => {
    const valNum = parseFloat(dischargeVal);
    if (isNaN(valNum) || valNum <= 0) {
      Alert.alert('Invalid Reading', 'Please enter a valid discharge bilirubin concentration.');
      return;
    }

    setIsSubmitting(true);
    try {
      await approveDischarge(admission.id || admission.admissionId, {
        doctorName: user.name,
        dischargeBilirubinValue: valNum,
        dischargeNotes,
        followUpPlan,
      });

      Alert.alert(
        'Discharge Approved!',
        `Discharge finalized for Baby ${admission.babyName}. PT Station ${admission.ptStationName || ''} has been released to Cleaning & Preparation pool.`,
        [{ text: 'Done', onPress: onSuccess }]
      );
    } catch {
      Alert.alert('Error', 'Failed to approve discharge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Discharge Approval</Text>
          <Text style={styles.headerSubtitle}>Complete Care Episode & Release PT Station</Text>
        </View>
      </View>

      {/* Patient Episode Overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{admission.babyName} ({admission.babyUhid})</Text>
        <Text style={styles.subText}>Admission ID: {admission.admissionId}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{admission.initialAdmissionBilirubin || 14.8} mg/dL</Text>
            <Text style={styles.statLbl}>Initial TSB</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#00A569' }]}>{totalHours} hrs</Text>
            <Text style={styles.statLbl}>Total PT Duration</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#7D3BFF' }]}>{admission.treatmentSessions.length}</Text>
            <Text style={styles.statLbl}>PT Sessions</Text>
          </View>
        </View>
      </View>

      {/* Discharge Bilirubin Entry */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Discharge Bilirubin Reading</Text>
        <Text style={styles.fieldDesc}>
          Enter the post-phototherapy confirmation serum or transcutaneous reading.
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.valInput}
            keyboardType="decimal-pad"
            value={dischargeVal}
            onChangeText={setDischargeVal}
          />
          <View style={styles.unitPill}>
            <Text style={styles.unitText}>mg/dL</Text>
          </View>
        </View>
      </View>

      {/* Clinical Notes & Follow-up */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Clinical Summary & Progress</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={3}
          value={dischargeNotes}
          onChangeText={setDischargeNotes}
          placeholder="Clinical status at discharge..."
          placeholderTextColor="#94A3B8"
        />

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Post-Discharge Follow-Up Plan</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={2}
          value={followUpPlan}
          onChangeText={setFollowUpPlan}
          placeholder="Rebound surveillance and pediatric follow-up..."
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Station Release Warning Notice */}
      <View style={styles.releaseNotice}>
        <Text style={styles.releaseNoticeText}>
          ⚡ Upon discharge approval, PT Station ({admission.ptStationName || 'Allocated Station'}) will immediately transition to 'Cleaning & Preparation' to ensure proper sanitization before next neonate allocation.
        </Text>
      </View>

      {/* Approve Button */}
      <TouchableOpacity
        onPress={handleApproveDischarge}
        style={[styles.approveBtn, isSubmitting && styles.approveBtnDisabled]}
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        <Text style={styles.approveBtnText}>
          {isSubmitting ? 'Finalizing Discharge...' : '✓ Approve Discharge & Release Station'}
        </Text>
      </TouchableOpacity>
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
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
  },
  backBtnText: {
    fontSize: 22,
    color: '#181829',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#181829',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181829',
  },
  subText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#181829',
  },
  statLbl: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#181829',
    marginBottom: 4,
  },
  fieldDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '800',
    color: '#181829',
  },
  unitPill: {
    backgroundColor: '#F3E8FF',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 12,
    color: '#181829',
    textAlignVertical: 'top',
    marginTop: 6,
  },
  releaseNotice: {
    backgroundColor: '#FDF4E5',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  releaseNoticeText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  approveBtn: {
    backgroundColor: '#00A569',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnDisabled: {
    backgroundColor: '#6EE7B7',
  },
  approveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
