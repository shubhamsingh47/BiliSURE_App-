import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { getScreenTopPadding } from '../../../theme/responsive';

interface RecommendationsScreenProps {
  onBack: () => void;
  onContinue: () => void;
  bilisureAction?: string;
  bilisureFrequency?: string;
  providerAction?: string;
  providerFrequency?: string;
}

export const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({
  onBack,
  onContinue,
  bilisureAction = 'Suggested:\nPhototherapy',
  bilisureFrequency = 'Continuous 4hr phototherapy cycle',
  providerAction = 'Suggested:\nPhototherapy',
  providerFrequency = 'Blue LED irradiance (> 30 uW/cm2/nm)',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.contentSafeArea, { paddingTop: getScreenTopPadding(insets, 4) }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recommendations</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section 1: BiliSURE recommendations */}
          <Text style={styles.sectionHeader}>BiliSURE recommendations</Text>
          <View style={styles.card}>
            <Text style={styles.cardMain}>{bilisureAction}</Text>
            <Text style={styles.cardFreqLabel}>Frequency: {bilisureFrequency}</Text>
          </View>

          {/* Section 2: Healthcare Provider’s recommendations */}
          <Text style={[styles.sectionHeader, { marginTop: 28 }]}>Healthcare Provider’s recommendations</Text>
          <View style={styles.card}>
            <Text style={styles.cardMain}>{providerAction}</Text>
            <Text style={styles.cardFreqLabel}>Frequency: {providerFrequency}</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EDE9FE',
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardMain: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 32,
  },
  cardFreqLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 14,
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
});
