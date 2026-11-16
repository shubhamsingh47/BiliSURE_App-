import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { COLORS } from '../../../theme/colors';
import { PrimaryButton } from '../../../components/PrimaryButton';

interface OnboardingScreenProps {
  onContinue: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onContinue }) => {
  return (
    <View style={styles.container}>
      <View style={styles.illustrationContainer}>
        {/* 3D Clipboard Illustration with purple clip and orange checkmark */}
        <Svg width={220} height={260} viewBox="0 0 220 260">
          {/* Clipboard body tilted */}
          <Rect
            x="30"
            y="40"
            width="160"
            height="210"
            rx="16"
            fill="#FFFFFF"
            stroke="#C4B5FD"
            strokeWidth="8"
          />
          {/* Purple clip at top */}
          <Rect
            x="60"
            y="25"
            width="100"
            height="32"
            rx="12"
            fill="#7C3AED"
          />
          {/* Handwritten PLAN text */}
          <Path
            d="M 65 90 L 80 90 M 72 90 L 72 110 M 90 90 L 90 110 L 105 110 M 115 110 L 125 90 L 135 110 M 145 110 L 145 90 L 160 100 L 160 110"
            stroke="#1E1B4B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Checkbox 1 with orange checkmark */}
          <Rect x="55" y="125" width="22" height="22" rx="4" fill="none" stroke="#64748B" strokeWidth="2.5" />
          <Path d="M 52 135 L 63 148 L 86 118" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M 90 135 Q 115 130, 155 135" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" />

          {/* Checkbox 2 */}
          <Rect x="60" y="165" width="22" height="22" rx="4" fill="none" stroke="#64748B" strokeWidth="2.5" />
          <Path d="M 95 175 Q 120 170, 160 175" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" />

          {/* Checkbox 3 */}
          <Rect x="65" y="200" width="22" height="22" rx="4" fill="none" stroke="#64748B" strokeWidth="2.5" />
          <Path d="M 100 210 Q 125 205, 165 210" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" />
        </Svg>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Planning ahead</Text>
        <Text style={styles.subtitle}>Setup your treatment Plan</Text>
      </View>

      <View style={styles.buttonContainer}>
        <PrimaryButton title="Get Started" onPress={onContinue} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 48,
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 20,
  },
});
