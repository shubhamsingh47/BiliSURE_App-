import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { BhutaniNomogramChart } from '../../../components/BhutaniNomogramChart';
import { usePatientStore } from '../../../store/usePatientStore';

interface RiskScreenProps {
  onBack: () => void;
  onContinue: () => void;
  riskLevel?: string;
  referenceText?: string;
}

export const RiskScreen: React.FC<RiskScreenProps> = ({
  onBack,
  onContinue,
  riskLevel = 'High-Intermediate',
  referenceText = 'AAP 2022 Guidelines: Serum Bilirubin is in the hour-specific High-Intermediate risk zone (75th–95th percentile). Surveillance and phototherapy indication threshold assessment indicated.',
}) => {
  const { readings, selectedBaby } = usePatientStore();
  const insets = useSafeAreaInsets();

  const getRiskColor = () => {
    const lower = riskLevel.toLowerCase();
    if (lower.includes('high') && !lower.includes('intermediate')) return '#FC3949';
    if (lower.includes('high-intermediate') || lower.includes('intermediate') || lower.includes('moderate')) return '#F59E0B';
    return '#00A569';
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.contentSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Risk</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.mainContent}>
            <Text style={styles.riskLabel}>
              Risk level: <Text style={{ color: getRiskColor() }}>{riskLevel}</Text>
            </Text>

            {/* Embedded Bhutani Nomogram Curve */}
            <BhutaniNomogramChart
              readings={readings as any}
              gestationalAgeWeeks={selectedBaby?.gestationalAgeWeeks || 38}
              compact={false}
              height={230}
            />

            <View style={styles.referenceContainer}>
              <Text style={styles.referenceTitle}>Reference:</Text>
              <Text style={styles.referenceBody}>{referenceText}</Text>
            </View>
          </View>
        </ScrollView>
      </View>

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
    backgroundColor: '#7D3BFF',
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
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  scroll: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  riskLabel: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  referenceContainer: {
    marginTop: 10,
  },
  referenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  referenceBody: {
    fontSize: 13,
    color: '#DDD6FE',
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
