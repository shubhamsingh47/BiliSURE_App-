import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, Paperclip, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { usePatientStore } from '../../../store/usePatientStore';

interface NewRegistrationScreenProps {
  onBack: () => void;
  onSuccess: (uhid: string) => void;
}

export const NewRegistrationScreen: React.FC<NewRegistrationScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [patientName, setPatientName] = useState('Baby 4');
  const [parentsName, setParentsName] = useState('Jane Doe');
  const [dob, setDob] = useState('16/11/2026 09:41 AM');
  const [uhid, setUhid] = useState('M1A2N3S4I5');
  const [facility, setFacility] = useState('General Hospital');
  const [doctor, setDoctor] = useState('Dr. XYZ');
  const [repeatTransaction, setRepeatTransaction] = useState(false);
  const [hasAttachment, setHasAttachment] = useState(false);
  const [loading, setLoading] = useState(false);

  const { registerBaby } = usePatientStore();

  const handleContinue = async () => {
    setLoading(true);
    try {
      const created = await registerBaby({
        name: patientName,
        parentsName,
        uhid: uhid || `M1A2N3S4I5`,
        assignedDoctor: doctor,
        facility,
        severityState: 'moderate',
      });
      onSuccess(created.uhid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Coral / Red Header from Frame 12 */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New registration</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.contentCard} showsVerticalScrollIndicator={false}>
        <CustomInput
          placeholder="Patient’s Name"
          value={patientName}
          onChangeText={setPatientName}
        />

        <CustomInput
          placeholder="Parents’ name"
          value={parentsName}
          onChangeText={setParentsName}
        />

        <CustomInput
          placeholder="Date and time of birth"
          value={dob}
          onChangeText={setDob}
        />

        <CustomInput
          placeholder="UHID"
          value={uhid}
          onChangeText={setUhid}
          autoCapitalize="characters"
        />

        {/* Dropdowns */}
        <TouchableOpacity activeOpacity={0.7} style={styles.dropdownBox}>
          <View>
            <Text style={styles.dropdownLabel}>Select Facility</Text>
            <Text style={styles.dropdownSub}>{facility}</Text>
          </View>
          <ChevronDown size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={styles.dropdownBox}>
          <View>
            <Text style={styles.dropdownLabel}>Select Healthcare Provider</Text>
            <Text style={styles.dropdownSub}>{doctor}</Text>
          </View>
          <ChevronDown size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Repeat Toggle */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Repeat</Text>
            <Text style={styles.switchSub}>Repeat transaction</Text>
          </View>
          <Switch
            value={repeatTransaction}
            onValueChange={setRepeatTransaction}
            trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
            thumbColor={repeatTransaction ? '#7C3AED' : '#FFFFFF'}
          />
        </View>

        {/* Dashed Attachment Box */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setHasAttachment(!hasAttachment)}
          style={[styles.attachmentBox, hasAttachment && styles.attachmentActive]}
        >
          <Paperclip size={20} color={hasAttachment ? '#7C3AED' : '#94A3B8'} />
          <Text style={[styles.attachmentText, hasAttachment && { color: '#7C3AED' }]}>
            {hasAttachment ? 'Attachment Added: medical_chart.pdf' : 'Add attachment'}
          </Text>
        </TouchableOpacity>

        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          style={styles.continueBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EF4444',
  },
  headerSafeArea: {
    backgroundColor: '#EF4444',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    paddingBottom: 40,
    minHeight: '100%',
  },
  dropdownBox: {
    height: 60,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dropdownSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  switchSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  attachmentBox: {
    height: 56,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    backgroundColor: '#F8FAFC',
  },
  attachmentActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  attachmentText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  continueBtn: {
    marginTop: 10,
    backgroundColor: '#7C3AED',
  },
});
