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
import { ArrowLeft, Paperclip, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { usePatientStore } from '../../../store/usePatientStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { SeverityState } from '../../../types';
import { moderateScale, fontScale, SPACING, getScreenTopPadding } from '../../../theme/responsive';

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

const parseInputDateTime = (inputStr: string): { isoDate: string; timeStr: string } => {
  const now = new Date();
  if (!inputStr || !inputStr.trim()) {
    return {
      isoDate: now.toISOString(),
      timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  const str = inputStr.trim();
  // Support DD/MM/YYYY HH:MM AM/PM or DD-MM-YYYY or standard formats
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?)?/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    let hours = match[4] ? parseInt(match[4], 10) : 0;
    const minutes = match[5] ? parseInt(match[5], 10) : 0;
    const ampm = match[6]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const parsedDate = new Date(year, month, day, hours, minutes, 0, 0);
    if (!isNaN(parsedDate.getTime())) {
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      return {
        isoDate: parsedDate.toISOString(),
        timeStr,
      };
    }
  }

  // Fallback to standard Date parse
  const directDate = new Date(str);
  if (!isNaN(directDate.getTime())) {
    return {
      isoDate: directDate.toISOString(),
      timeStr: `${String(directDate.getHours()).padStart(2, '0')}:${String(directDate.getMinutes()).padStart(2, '0')}`,
    };
  }

  return {
    isoDate: now.toISOString(),
    timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

export const NewRegistrationScreen: React.FC<NewRegistrationScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState(formatCurrentDateTime());
  const [uhid, setUhid] = useState('');
  const [gestationalAge, setGestationalAge] = useState('');
  const [gestationalDays, setGestationalDays] = useState('');
  const [birthWeight, setBirthWeight] = useState('');
  const [facility, setFacility] = useState(user?.facility || 'North Community Health Centre (CHC)');
  const [doctor, setDoctor] = useState(user?.name || 'Dr. Priya Sharma');
  const severity: SeverityState = 'normal';
  const [repeatTransaction, setRepeatTransaction] = useState(false);
  const [hasAttachment, setHasAttachment] = useState(false);
  const [loading, setLoading] = useState(false);

  const { registerBaby } = usePatientStore();
  const insets = useSafeAreaInsets();

  const generateUhid = () => {
    const rawFac = (user?.facility || facility || 'PGI').toUpperCase();
    const prefix = rawFac.includes('KGMU') ? 'KGMU' : rawFac.includes('RML') ? 'RML' : 'PGI';
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setUhid(`${prefix}-${randomSuffix}`);
  };

  const handleContinue = async () => {
    if (!motherName.trim()) {
      Alert.alert('Required Field', "Please enter the mother's name");
      return;
    }

    if (!gestationalAge.trim()) {
      Alert.alert('Required Field', 'Please enter gestational age in weeks.');
      return;
    }

    const parsedGestAge = parseInt(gestationalAge.trim(), 10);
    if (isNaN(parsedGestAge) || parsedGestAge < 20 || parsedGestAge > 46) {
      Alert.alert('Invalid Gestational Age', 'Please enter a valid gestational age between 20 and 46 weeks.');
      return;
    }

    let parsedGestDays: number | undefined = undefined;
    if (gestationalDays.trim()) {
      const daysTrimmed = gestationalDays.trim();
      if (!/^[0-6]$/.test(daysTrimmed)) {
        Alert.alert('Invalid Gestational Days', 'Days must be a whole number between 0 and 6.');
        return;
      }
      parsedGestDays = parseInt(daysTrimmed, 10);
    }

    if (!birthWeight.trim()) {
      Alert.alert('Required Field', 'Please enter birth weight in kg.');
      return;
    }

    const parsedWeight = parseFloat(birthWeight.trim());
    if (isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 10) {
      Alert.alert('Invalid Birth Weight', 'Please enter a valid birth weight in kg (e.g. 3.1).');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const parsedBirth = parseInputDateTime(dob);
      const rawFac = (user?.facility || facility || 'PGI').toUpperCase();
      const defaultPrefix = rawFac.includes('KGMU') ? 'KGMU' : rawFac.includes('RML') ? 'RML' : 'PGI';
      let finalUhid = uhid.trim();
      if (!finalUhid) {
        finalUhid = `${defaultPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;
      } else if (finalUhid.startsWith('BS-') || !finalUhid.startsWith(`${defaultPrefix}-`)) {
        const suffix = finalUhid.includes('-') ? finalUhid.split('-').slice(1).join('-') : finalUhid;
        finalUhid = `${defaultPrefix}-${suffix}`;
      }

      const created = await registerBaby({
        name: motherName.trim(),
        parentsName: motherName.trim(),
        uhid: finalUhid,
        assignedDoctor: doctor,
        facility,
        severityState: 'normal',
        gestationalAgeWeeks: parsedGestAge,
        ...(parsedGestDays !== undefined ? { gestationalAgeDays: parsedGestDays } : {}),
        weight: parsedWeight,
        dateOfBirth: parsedBirth.isoDate,
        exactTimeOfBirth: parsedBirth.timeStr,
        registeredAt: now.toISOString(),
        createdAt: now.toISOString(),
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
      <View style={[styles.headerSafeArea, { paddingTop: getScreenTopPadding(insets, 4) }]}>
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
          label="Mother's name"
          placeholder="e.g. Sunita Devi"
          value={motherName}
          onChangeText={setMotherName}
        />

        <CustomInput
          label="Date and time of birth"
          placeholder="Date and time of birth"
          value={dob}
          onChangeText={setDob}
        />

        {/* Gestational Age & Birth Weight Row */}
        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <View style={styles.gestationSplitRow}>
              <View style={styles.splitInputCol}>
                <CustomInput
                  label="Weeks"
                  labelStyle={styles.splitLabel}
                  placeholder="e.g. 36"
                  value={gestationalAge}
                  onChangeText={setGestationalAge}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={styles.splitInputCol}>
                <CustomInput
                  label="Days (Optional)"
                  labelStyle={styles.splitLabel}
                  placeholder="0-6"
                  value={gestationalDays}
                  onChangeText={setGestationalDays}
                  keyboardType="numeric"
                  maxLength={1}
                />
              </View>
            </View>
          </View>
          <View style={styles.colHalfRight}>
            <CustomInput
              label="Birth weight (kg)"
              placeholder="e.g. 3.1"
              value={birthWeight}
              onChangeText={setBirthWeight}
              keyboardType="decimal-pad"
              maxLength={5}
            />
          </View>
        </View>

        <View style={styles.uhidRow}>
          <View style={{ flex: 1 }}>
            <CustomInput
              label="UHID / Patient ID"
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
    minHeight: moderateScale(56),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '700',
    color: COLORS.white,
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
  },
  colHalf: {
    flex: 1,
  },
  gestationSplitRow: {
    flexDirection: 'row',
    gap: moderateScale(6),
  },
  splitInputCol: {
    flex: 1,
  },
  splitLabel: {
    fontSize: fontScale(11),
  },
  colHalfRight: {
    flex: 1,
  },
  uhidRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: moderateScale(8),
  },
  genBtn: {
    height: 56,
    paddingHorizontal: moderateScale(14),
    backgroundColor: COLORS.primaryBg,
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    marginBottom: 16,
  },
  genBtnText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: COLORS.primary,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(32),
    borderTopRightRadius: moderateScale(32),
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
    minHeight: '100%',
  },
  dropdownBox: {
    minHeight: moderateScale(56),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(16),
    paddingHorizontal: SPACING.md,
    paddingVertical: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dropdownLabel: {
    fontSize: fontScale(13),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dropdownSub: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: fontScale(15),
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  switchSub: {
    fontSize: fontScale(12),
    color: '#94A3B8',
    marginTop: 2,
  },
  attachmentBox: {
    minHeight: moderateScale(52),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: SPACING.md,
  },
  attachmentActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  attachmentText: {
    marginLeft: 8,
    fontSize: fontScale(13),
    fontWeight: '600',
    color: '#64748B',
  },
  continueBtn: {
    marginTop: SPACING.sm,
    backgroundColor: '#7C3AED',
  },
});
