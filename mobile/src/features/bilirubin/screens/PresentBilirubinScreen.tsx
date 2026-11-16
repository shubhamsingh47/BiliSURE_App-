import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { usePatientStore } from '../../../store/usePatientStore';

interface PresentBilirubinScreenProps {
  onBack: () => void;
  onContinue: () => void;
  readingValue?: number;
  measurementSite?: string;
}

export const PresentBilirubinScreen: React.FC<PresentBilirubinScreenProps> = ({
  onBack,
  onContinue,
  readingValue = 10.0,
  measurementSite = 'Palms and soles',
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const { readings } = usePatientStore();

  const formattedDate = '12:00 AM 16/11/26';

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Present Bilirubin Value</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Big Reading Display Area */}
        <View style={styles.readingHero}>
          <Text style={styles.readingSource}>BiliSURE Readings</Text>
          <Text style={styles.readingTime}>{formattedDate}</Text>
          <Text style={styles.readingNumber}>{readingValue.toFixed(1)}mg/dL</Text>
          <Text style={styles.readingSite}>Site: {measurementSite}</Text>
        </View>
      </SafeAreaView>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomCard}>
        <CustomInput
          placeholder="Other symptoms"
          value={symptoms}
          onChangeText={setSymptoms}
        />

        {/* "See history" Accordion */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowHistory(!showHistory)}
          style={styles.historyDropdown}
        >
          <Text style={styles.historyTitle}>See history</Text>
          <ChevronDown
            size={20}
            color="#94A3B8"
            style={showHistory ? { transform: [{ rotate: '180deg' }] } : undefined}
          />
        </TouchableOpacity>

        {showHistory && (
          <ScrollView style={styles.historyList} nestedScrollEnabled>
            {readings.map((r, idx) => (
              <View key={r.id || idx} style={styles.historyItem}>
                <Text style={styles.historyVal}>{r.value} mg/dL</Text>
                <Text style={styles.historySite}>{r.measurementSite}</Text>
                <Text style={styles.historyDate}>
                  {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={{ flex: 1 }} />

        <PrimaryButton
          title="Continue to recommendations"
          onPress={onContinue}
          style={styles.continueBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#7C3AED',
  },
  topSafeArea: {
    backgroundColor: '#7C3AED',
    paddingBottom: 24,
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
  readingHero: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  readingSource: {
    color: '#EDE9FE',
    fontSize: 16,
    fontWeight: '500',
  },
  readingTime: {
    color: '#DDD6FE',
    fontSize: 14,
    marginTop: 2,
    marginBottom: 8,
  },
  readingNumber: {
    fontSize: 54,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
  },
  readingSite: {
    color: '#EDE9FE',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  bottomCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
  },
  historyDropdown: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  historyList: {
    maxHeight: 120,
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyVal: {
    fontWeight: '700',
    color: '#1E1B4B',
  },
  historySite: {
    color: '#64748B',
    fontSize: 13,
  },
  historyDate: {
    color: '#94A3B8',
    fontSize: 12,
  },
  continueBtn: {
    marginBottom: 10,
  },
});
