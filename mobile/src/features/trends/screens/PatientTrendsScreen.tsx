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
import { BhutaniNomogramChart } from '../../../components/BhutaniNomogramChart';
import { usePatientStore } from '../../../store/usePatientStore';
import { Baby } from '../../../types';

interface PatientTrendsScreenProps {
  onBackToDashboard: () => void;
  onOpenReadingDetail: (readingVal: number, site: string) => void;
  onSeeAllObservations: () => void;
  onOpenReferral?: () => void;
}

export const PatientTrendsScreen: React.FC<PatientTrendsScreenProps> = ({
  onBackToDashboard,
  onOpenReadingDetail,
  onSeeAllObservations,
  onOpenReferral,
}) => {
  const { babies, selectedBaby, selectBaby, observations, readings } = usePatientStore();
  const activeBaby: Baby = selectedBaby || babies[0];

  const cycleBaby = () => {
    const nextIdx = (babies.findIndex((b) => b.id === activeBaby.id) + 1) % babies.length;
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
            <User size={22} color="#7D3BFF" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={cycleBaby} style={styles.babyDropdownPill}>
            <ChevronDown size={18} color="#7D3BFF" />
            <Text style={styles.babyDropdownText}>{activeBaby.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.bellBtn}>
            <Bell size={22} color="#7D3BFF" />
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
            style={[styles.statCard, { backgroundColor: '#00A569' }]}
          >
            <Text style={styles.statCardLabel}>Initial Value</Text>
            <Text style={styles.statCardValue}>{initialVal.toFixed(1)}mg/dL</Text>
          </TouchableOpacity>

          {/* Discharge Value Card (Red/Coral) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenReadingDetail(dischargeVal, 'Forehead')}
            style={[styles.statCard, { backgroundColor: '#FC3949' }]}
          >
            <Text style={styles.statCardLabel}>Discharge Value</Text>
            <Text style={styles.statCardValue}>{dischargeVal.toFixed(1)}mg/dL</Text>
          </TouchableOpacity>
        </View>

        {/* Bilirubin Readings Spline Chart (Video Frame 27) */}
        <ChartCard
          initialValue={initialVal}
          dischargeValue={dischargeVal}
        />

        {/* Mandatory Feature: Bhutani Bilirubin Risk Assessment Section */}
        <View style={styles.nomogramSection}>
          <BhutaniNomogramChart
            readings={readings as any}
            gestationalAgeWeeks={activeBaby.gestationalAgeWeeks || 38}
            compact={false}
            height={260}
          />
        </View>

        {/* Referral Action Callout Button */}
        {onOpenReferral && (
          <TouchableOpacity
            onPress={onOpenReferral}
            style={styles.referralCalloutBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.referralCalloutText}>Initiate District Phototherapy Referral →</Text>
          </TouchableOpacity>
        )}

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
            <Text style={styles.obsReadingVal}>18.0mg/dL</Text>
            <Text style={styles.obsTime}>10:00 AM</Text>
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
    marginBottom: 20,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#7D3BFF',
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  babyDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  babyDropdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181829',
    marginLeft: 6,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentStateContainer: {
    backgroundColor: '#FDF4E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  presentStateLabel: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: '600',
  },
  presentStateVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2,
  },
  statCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    height: 120,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    marginHorizontal: 4,
  },
  statCardLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  statCardValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  nomogramSection: {
    marginVertical: 10,
  },
  referralCalloutBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  referralCalloutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  obsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  obsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181829',
  },
  seeAllPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  obsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  obsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181829',
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
    fontSize: 17,
    fontWeight: '800',
    color: '#181829',
  },
  obsTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
