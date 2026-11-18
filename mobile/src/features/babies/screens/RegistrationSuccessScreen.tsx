import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { getScreenTopPadding } from '../../../theme/responsive';

interface RegistrationSuccessScreenProps {
  uhid?: string;
  doctor?: string;
  onContinue: () => void;
}

export const RegistrationSuccessScreen: React.FC<RegistrationSuccessScreenProps> = ({
  uhid = 'M1A2N3S4I5',
  doctor = 'Dr. XYZ',
  onContinue,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: getScreenTopPadding(insets, 16), paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.topInfo}>
        <Text style={styles.mainHeading}>The Kiddo has been registered!!!</Text>
        <Text style={styles.metaText}>UHID: {uhid}</Text>
        <Text style={styles.metaText}>Under the supervision of {doctor}</Text>
      </View>

      <View style={styles.centerBadgeContainer}>
        <View style={styles.checkCircle}>
          <Check size={52} color={COLORS.white} strokeWidth={3.5} />
        </View>
        <Text style={styles.setHeading}>You are set!</Text>
      </View>

      <View style={styles.bottomBar}>
        <PrimaryButton title="Let’s go" onPress={onContinue} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 56,
    justifyContent: 'space-between',
  },
  topInfo: {
    marginTop: 20,
  },
  mainHeading: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 42,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
    marginTop: 4,
  },
  centerBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#059669', // Emerald check circle from Frame 14
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  setHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 24,
  },
  bottomBar: {
    marginBottom: 10,
  },
});
