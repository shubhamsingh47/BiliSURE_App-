import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, Bell, User } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { ChartCard } from '../../../components/ChartCard';
import { usePatientStore } from '../../../store/usePatientStore';
import { Baby } from '../../../types';

interface PatientTrendsScreenProps {
  onBackToDashboard: () => void;
  onOpenReadingDetail: (readingVal: number, site: string) => void;
  onSeeAllObservations: () => void;
}

export const PatientTrendsScreen: React.FC<PatientTrendsScreenProps> = ({
  onBackToDashboard,
  onOpenReadingDetail,
  onSeeAllObservations,
}) => {
  const { babies, selectedBaby, selectBaby, observations } = usePatientStore();
  const activeBaby: Baby = selectedBaby || babies[0];

  const [babyDropdownOpen, setBabyDropdownOpen] = useState(false);

  const cycleBaby = () => {
    const nextIdx = (babies.findIndex(b => b.id === activeBaby.id) + 1) % babies.length;
    selectBaby(babies[nextIdx]);
  };

  const initialVal = activeBaby.initialValue || 10.0;
  const dischargeVal = activeBaby.dischargeValue || 5.0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header Row from Frame 27 */}
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={onBackToDashboard} style={styles.avatarCircle}>
            <User size={22} color="#7C3AED" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={cycleBaby} style={styles.babyDropdownPill}>
            <ChevronDown size={18} color="#7C3AED" />
            <Text style={styles.babyDropdownText}>{activeBaby.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.bellBtn}>
            <Bell size={22} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {/* Present State */}
        <View style={styles.presentStateContainer}>
          <Text style={styles.presentStateLabel}>Present State</Text>
          <Text style={styles.presentStateVal}>
            {activeBaby.severityState ? activeBaby.severityState.charAt(0).toUpperCase() + activeBaby.severityState.slice(1) : 'Moderate'}
          </Text>
        </View>

        {/* Two Big Stat Cards from Frame 27 */}
        <View style={styles.statCardsRow}>
          {/* Initial Value Card (Green) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenReadingDetail(initialVal, 'Palms and soles')}
            style={[styles.statCard, { backgroundColor: '#059669' }]}
          >
            <Text style={styles.statCardLabel}>Initial Value</Text>
            <Text style={styles.statCardValue}>{initialVal.toFixed(1)}g/dL</Text>
          </TouchableOpacity>

          {/* Discharge Value Card (Red/Coral) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenReadingDetail(dischargeVal, 'Forehead')}
            style={[styles.statCard, { backgroundColor: '#EF4444' }]}
          >
            <Text style={styles.statCardLabel}>Discharge Value</Text>
            <Text style={styles.statCardValue}>{dischargeVal.toFixed(1)}g/dL</Text>
          </TouchableOpacity>
        </View>

        {/* Bilirubin Readings Spline Chart */}
        <ChartCard
          initialValue={initialVal}
          dischargeValue={dischargeVal}
        />

        {/* Recent Observations Section */}
        <View style={styles.obsHeaderRow}>
          <Text style={styles.obsSectionTitle}>Recent Observations</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSeeAllObservations}
            style={styles.seeAllPill}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Observation Card from Frame 27 */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenReadingDetail(18.0, 'Face')}
          style={styles.obsCard}
        >
          <View>
            <Text style={styles.obsTitle}>{activeBaby.name}: Face</Text>
            <Text style={styles.obsSub}>Readings By Nurse A</Text>
          </View>
          <View style={styles.obsRight}>
            <Text style={styles.obsReadingVal}>18.0g/dL</Text>
            <Text style={styles.obsTime}>10:00 AM 16/11/26</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  babyDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  babyDropdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
    marginLeft: 6,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentStateContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  presentStateLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  presentStateVal: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F172A',
  },
  statCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    flex: 0.48,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 6,
  },
  statCardValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  obsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 14,
  },
  obsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllPill: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  seeAllText: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '700',
  },
  obsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  obsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  obsSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  obsRight: {
    alignItems: 'flex-end',
  },
  obsReadingVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  obsTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
});
