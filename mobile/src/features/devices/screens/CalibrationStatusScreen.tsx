import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';

interface CalibrationStatusScreenProps {
  onBack: () => void;
  onOpenAlert: () => void;
}

export const CalibrationStatusScreen: React.FC<CalibrationStatusScreenProps> = ({
  onBack,
  onOpenAlert,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.safeArea, { paddingTop: insets.top + 6 }]}>
        {/* Top Progress Step Bar */}
        <View style={styles.stepBar}>
          <View style={[styles.stepItem, styles.stepItemActive]} />
          <View style={[styles.stepItem, styles.stepItemActive]} />
          <View style={styles.stepItem} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Auto Calibration</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Center Main Text from Frame 50 */}
        <View style={styles.centerHero}>
          <Text style={styles.heroText}>
            The device is{'\n'}caliberated you are{'\n'}good to go
          </Text>
        </View>

        {/* Card 1: Tests Remaining */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenAlert}
            style={styles.whiteCard}
          >
            <View style={styles.blueDotPill}>
              <View style={styles.blueDot} />
              <Text style={styles.blueDotText}>Number of test remaining</Text>
            </View>

            <Text style={styles.testCountHeading}>Remaining Test 7500</Text>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '54%' }]} />
            </View>
            <Text style={styles.progressLabel}>7500 of 14000</Text>
          </TouchableOpacity>

          {/* Card 2: Share Report */}
          <View style={[styles.whiteCard, { marginTop: 14 }]}>
            <Text style={styles.shareReportTitle}>Share The Report</Text>

            <View style={styles.calibDonePill}>
              <View style={styles.doneIconBox}>
                <CheckCircle2 size={18} color="#059669" />
              </View>
              <Text style={styles.calibDoneText}>Calibration Done</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#059669', // Vibrant Green from Frame 50
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stepBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  stepItem: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
  },
  stepItemActive: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerHero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 20,
  },
  heroText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  whiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 20,
  },
  blueDotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginRight: 8,
  },
  blueDotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  testCountHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
  },
  shareReportTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 14,
  },
  calibDonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  doneIconBox: {
    marginRight: 8,
  },
  calibDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
});
