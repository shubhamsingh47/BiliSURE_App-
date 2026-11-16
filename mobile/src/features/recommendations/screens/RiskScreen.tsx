import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { PrimaryButton } from '../../../components/PrimaryButton';

interface RiskScreenProps {
  onBack: () => void;
  onContinue: () => void;
  riskLevel?: 'Low' | 'Moderate' | 'High';
  referenceText?: string;
}

export const RiskScreen: React.FC<RiskScreenProps> = ({
  onBack,
  onContinue,
  riskLevel = 'Low',
  referenceText = 'AAP 2022 Guidelines: Transcutaneous Bilirubin is in the low-risk zone (< 40th percentile) for post-natal age > 36 hours. Routine monitoring recommended.',
}) => {
  const getRiskColor = () => {
    if (riskLevel === 'High') return '#EF4444';
    if (riskLevel === 'Moderate') return '#F59E0B';
    return '#4ADE80'; // Bright light green from frame 20
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.contentSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Risk</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.riskLabel}>
            Risk level: <Text style={{ color: getRiskColor() }}>{riskLevel}</Text>
          </Text>

          <View style={styles.referenceContainer}>
            <Text style={styles.referenceTitle}>Reference:</Text>
            <Text style={styles.referenceBody}>{referenceText}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom White Bar */}
      <View style={styles.bottomBar}>
        <PrimaryButton title="Continue" onPress={onContinue} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#7C3AED',
    justifyContent: 'space-between',
  },
  contentSafeArea: {
    flex: 1,
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
  mainContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  riskLabel: {
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  referenceContainer: {
    marginTop: 48,
  },
  referenceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  referenceBody: {
    fontSize: 14,
    color: '#EDE9FE',
    lineHeight: 22,
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
});
