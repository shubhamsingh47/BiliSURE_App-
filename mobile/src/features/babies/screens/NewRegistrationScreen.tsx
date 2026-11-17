import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ArrowLeft, Paperclip, ChevronDown, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { usePatientStore } from '../../../store/usePatientStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { SeverityState } from '../../../types';

interface NewRegistrationScreenProps {
  onBack: () => void;
  onSuccess: (uhid: string) => void;
}

const formatCurrentDateTime = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${day}/${month}/${year} ${timeStr}`;
};

export const NewRegistrationScreen: React.FC<NewRegistrationScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState(formatCurrentDateTime());
  const [uhid, setUhid] = useState('');
  const [facility, setFacility] = useState(user?.facility || 'North Community Health Centre (CHC)');
  const [doctor, setDoctor] = useState(user?.name || 'Dr. Priya Sharma');
  const [severity, setSeverity] = useState<SeverityState>('normal');
  const [repeatTransaction, setRepeatTransaction] = useState(false);
  const [hasAttachment, setHasAttachment] = useState(false);
  const [loading, setLoading] = useState(false);

  const { registerBaby } = usePatientStore();
  const insets = useSafeAreaInsets();

  const generateUhid = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setUhid(`BS-${randomSuffix}`);
  };

  const handleContinue = async () => {
    if (!motherName.trim()) {
      Alert.alert('Required Field', "Please enter the mother's name");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const finalUhid = uhid.trim() || `BS-${Math.floor(100000 + Math.random() * 900000)}`;
      const created = await registerBaby({
        name: motherName.trim(),
        parentsName: motherName.trim(),
        uhid: finalUhid,
        assignedDoctor: doctor,
        facility,
        severityState: severity,
        dateOfBirth: now.toISOString(),
        exactTimeOfBirth: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: now.toISOString(),
      });
      onSuccess(created.uhid);
    } catch {
      Alert.alert('Error', 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Coral / Red Header from Frame 12 with Dynamic Camera Inset */}
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New registration</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentCard} showsVerticalScrollIndicator={false}>
        <CustomInput
          placeholder="Mother's name"
          value={motherName}
          onChangeText={setMotherName}
        />

        <CustomInput
          placeholder="Date and time of birth"
          value={dob}
          onChangeText={setDob}
        />

        <View style={styles.uhidRow}>
          <View style={{ flex: 1 }}>
            <CustomInput
              placeholder="UHID / Patient ID"
              value={uhid}
              onChangeText={setUhid}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={generateUhid}
            style={styles.genBtn}
          >
            <Text style={styles.genBtnText}>Auto</Text>
          </TouchableOpacity>
        </View>

        {/* Severity / Risk Level Selector */}
        <View style={styles.severitySection}>
          <Text style={styles.severityLabel}>Clinical Risk Status</Text>
          <View style={styles.severityRow}>
            {(['normal', 'moderate', 'critical'] as const).map((level) => {
              const isSelected = severity === level;
              const colorMap = {
                normal: COLORS.normal,
                moderate: COLORS.moderate,
                critical: COLORS.critical,
              };
              const activeColor = colorMap[level];
              return (
                <TouchableOpacity
                  key={level}
                  activeOpacity={0.75}
                  onPress={() => setSeverity(level)}
                  style={[
                    styles.severityBtn,
                    isSelected && {
                      backgroundColor: activeColor,
                      borderColor: activeColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityBtnText,
                      isSelected && styles.severityBtnTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                  {isSelected && <Check size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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
    backgroundColor: COLORS.critical,
  },
  headerSafeArea: {
    backgroundColor: COLORS.critical,
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
  uhidRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  genBtn: {
    height: 54,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primaryBg,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  genBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
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
  severitySection: {
    marginBottom: 16,
    marginTop: 4,
  },
  severityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  severityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  severityBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  severityBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
