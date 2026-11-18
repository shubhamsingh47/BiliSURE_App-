import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { BhutaniNomogramChart } from '../../../components/BhutaniNomogramChart';
import { usePatientStore } from '../../../store/usePatientStore';
import { evaluateBhutaniRisk, mgDlToUmolL } from '../../../services/bhutani.service';
import { moderateScale, fontScale, SPACING, getScreenTopPadding } from '../../../theme/responsive';

interface PresentBilirubinScreenProps {
  onBack: () => void;
  onContinue: () => void;
  readingValue?: number;
  measurementSite?: string;
  testMethod?: 'TSB' | 'TcB';
}

export const PresentBilirubinScreen: React.FC<PresentBilirubinScreenProps> = ({
  onBack,
  onContinue,
  readingValue = 14.8,
  measurementSite = 'Palms and soles',
  testMethod = 'TSB',
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showNomogram, setShowNomogram] = useState(true);
  const { readings, selectedBaby } = usePatientStore();
  const insets = useSafeAreaInsets();

  const formattedDate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();

  const assessment = evaluateBhutaniRisk({
    dateOfBirth: selectedBaby?.dateOfBirth || new Date(Date.now() - 3600000 * 40).toISOString(),
    exactTimeOfBirth: selectedBaby?.exactTimeOfBirth || '08:00',
    value: readingValue,
    unit: 'mg/dL',
    method: testMethod,
    gestationalAgeWeeks: selectedBaby?.gestationalAgeWeeks || 38,
  });

  return (
    <View style={styles.screen}>
      <View style={[styles.topSafeArea, { paddingTop: getScreenTopPadding(insets, 4) }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Present Bilirubin Value</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Big Reading Display Area */}
        <View style={styles.readingHero}>
          <View style={styles.heroTopRow}>
            <Text style={styles.readingSource}>BiliSURE {testMethod} Reading</Text>
            {/* Bhutani Risk Zone Badge */}
            <View
              style={[
                styles.zoneBadge,
                { backgroundColor: assessment.zoneBgColor, borderColor: assessment.zoneColor },
              ]}
            >
              <Text style={[styles.zoneBadgeText, { color: assessment.zoneColor }]}>
                {assessment.zone.replace('_', ' ').toUpperCase()} ZONE
              </Text>
            </View>
          </View>

          <Text style={styles.readingTime}>{formattedDate} • {assessment.postnatalAgeHours}h Age</Text>
          <View style={styles.valRow}>
            <Text style={styles.readingNumber}>{readingValue.toFixed(1)}</Text>
            <Text style={styles.readingUnit}>mg/dL</Text>
            <Text style={styles.umolText}>({mgDlToUmolL(readingValue)} µmol/L)</Text>
          </View>
          <Text style={styles.readingSite}>Site: {measurementSite}</Text>
        </View>
      </View>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 28) }}
        >
          {/* Bhutani Curve Preview */}
          <TouchableOpacity
            onPress={() => setShowNomogram(!showNomogram)}
            style={styles.nomogramToggle}
          >
            <Text style={styles.nomogramToggleTitle}>Bhutani Risk Nomogram</Text>
            <Text style={styles.nomogramToggleAction}>{showNomogram ? 'Hide Chart ▲' : 'Show Chart ▼'}</Text>
          </TouchableOpacity>

          {showNomogram && (
            <BhutaniNomogramChart
              readings={readings as any}
              gestationalAgeWeeks={selectedBaby?.gestationalAgeWeeks || 38}
              compact={false}
              height={220}
            />
          )}

          <CustomInput
            placeholder="Other clinical symptoms (e.g., lethargy, poor suckling)"
            value={symptoms}
            onChangeText={setSymptoms}
          />

          {/* "See history" Accordion */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowHistory(!showHistory)}
            style={styles.historyDropdown}
          >
            <Text style={styles.historyTitle}>See Bilirubin History ({readings.length})</Text>
            <ChevronDown
              size={20}
              color="#94A3B8"
              style={showHistory ? { transform: [{ rotate: '180deg' }] } : undefined}
            />
          </TouchableOpacity>

          {showHistory && (
            <View style={styles.historyList}>
              {readings.map((r, idx) => (
                <View key={r.id || idx} style={styles.historyItem}>
                  <View>
                    <Text style={styles.historyVal}>{r.value} mg/dL</Text>
                    <Text style={styles.historySite}>{r.measurementSite} • {r.bhutaniZone?.replace('_', ' ') || 'evaluated'}</Text>
                  </View>
                  <Text style={styles.historyDate}>
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <PrimaryButton
            title="Continue to recommendations"
            onPress={onContinue}
            style={styles.continueBtn}
          />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#7D3BFF',
  },
  topSafeArea: {
    backgroundColor: '#7D3BFF',
    paddingBottom: moderateScale(12),
  },
  header: {
    minHeight: moderateScale(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 2,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '700',
    color: COLORS.white,
  },
  readingHero: {
    paddingHorizontal: SPACING.lg,
    marginTop: moderateScale(4),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  readingSource: {
    color: '#EDE9FE',
    fontSize: fontScale(14),
    fontWeight: '600',
  },
  zoneBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    borderWidth: 1,
  },
  zoneBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
  },
  readingTime: {
    color: '#DDD6FE',
    fontSize: fontScale(11),
    marginBottom: 4,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  readingNumber: {
    fontSize: fontScale(44),
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  readingUnit: {
    fontSize: fontScale(16),
    fontWeight: '700',
    color: '#DDD6FE',
    marginLeft: 6,
  },
  umolText: {
    fontSize: fontScale(11),
    color: '#EDE9FE',
    marginLeft: 8,
  },
  readingSite: {
    color: '#EDE9FE',
    fontSize: fontScale(12),
    fontWeight: '600',
    marginTop: 4,
  },
  bottomCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(32),
    borderTopRightRadius: moderateScale(32),
    padding: SPACING.lg,
  },
  nomogramToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nomogramToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#181829',
  },
  nomogramToggleAction: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7D3BFF',
  },
  historyDropdown: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  historyList: {
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyVal: {
    fontWeight: '700',
    color: '#181829',
    fontSize: 14,
  },
  historySite: {
    color: '#64748B',
    fontSize: 11,
  },
  historyDate: {
    color: '#94A3B8',
    fontSize: 11,
  },
  continueBtn: {
    marginTop: 10,
    marginBottom: 20,
  },
});
