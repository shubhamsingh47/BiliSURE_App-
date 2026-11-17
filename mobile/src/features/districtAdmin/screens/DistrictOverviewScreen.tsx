import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { COLORS } from '../../../theme/colors';
import { moderateScale, fontScale, SPACING } from '../../../theme/responsive';

interface DistrictOverviewScreenProps {
  onExportPress?: () => void;
  onSelectHospital?: (hospitalId: string) => void;
}

export const DistrictOverviewScreen: React.FC<DistrictOverviewScreenProps> = ({
  onExportPress,
  onSelectHospital,
}) => {
  const { hospitals, referrals, districtMetrics } = useNetworkStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'Total' | 'Admits'>('Total');

  const receivingHospitals = hospitals.filter((h) => h.type === 'receiving_hospital');
  const referringCentres = hospitals.filter((h) => h.type === 'referring_centre');

  const totalPT = receivingHospitals.reduce((acc, h) => acc + h.totalPTStations, 0);
  const occupiedPT = receivingHospitals.reduce((acc, h) => acc + h.occupiedPTStations, 0);
  const availablePT = receivingHospitals.reduce((acc, h) => acc + h.availablePTStations, 0);

  // Video-faithful Donut Chart dimensions (SCR-12)
  const size = 180;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Multi-segment percentages: In Observation (50%), In Phototherapy (33%), Critical (17%)
  const stroke1 = circumference * 0.5;
  const stroke2 = circumference * 0.33;
  const stroke3 = circumference * 0.17;

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: 8, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>District Health Network</Text>
            <Text style={styles.headerSubtitle}>Central District Neonatal Command • {user.name}</Text>
          </View>
          {onExportPress && (
            <TouchableOpacity onPress={onExportPress} style={styles.exportBtn}>
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab switch Total vs Admits */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            onPress={() => setActiveTab('Total')}
            style={[styles.segmentBtn, activeTab === 'Total' && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, activeTab === 'Total' && styles.segmentTextActive]}>
              Total Network
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('Admits')}
            style={[styles.segmentBtn, activeTab === 'Admits' && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, activeTab === 'Admits' && styles.segmentTextActive]}>
              Admissions & Discharge
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Video-Faithful SUMMARY TOTAL Card with Donut Chart (SCR-12) */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>SUMMARY TOTAL</Text>

        <View style={styles.chartWrapper}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              {/* Background Ring */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Segment 1: In Observation (Amber) */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#F59E0B"
                strokeWidth={strokeWidth}
                strokeDasharray={`${stroke1} ${circumference}`}
                fill="none"
              />
              {/* Segment 2: In Phototherapy (Purple) */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#7D3BFF"
                strokeWidth={strokeWidth}
                strokeDasharray={`${stroke2} ${circumference}`}
                strokeDashoffset={-stroke1}
                fill="none"
              />
              {/* Segment 3: Critical (Coral Red) */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#FC3949"
                strokeWidth={strokeWidth}
                strokeDasharray={`${stroke3} ${circumference}`}
                strokeDashoffset={-(stroke1 + stroke2)}
                fill="none"
              />
            </G>
          </Svg>

          {/* Center Text inside Donut */}
          <View style={styles.donutCenter}>
            <Text style={styles.donutCount}>24</Text>
            <Text style={styles.donutLabel}>Total Infants</Text>
          </View>
        </View>

        {/* Video SCR-12 Breakdown Progress Bars */}
        <View style={styles.progressSection}>
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <View style={[styles.colorDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statName}>In Observation</Text>
            </View>
            <Text style={styles.statValue}>12 (50%)</Text>
          </View>
          <View style={styles.trackBar}>
            <View style={[styles.fillBar, { width: '50%', backgroundColor: '#F59E0B' }]} />
          </View>

          <View style={[styles.statRow, { marginTop: 10 }]}>
            <View style={styles.statLeft}>
              <View style={[styles.colorDot, { backgroundColor: '#7D3BFF' }]} />
              <Text style={styles.statName}>In Phototherapy</Text>
            </View>
            <Text style={styles.statValue}>8 (33%)</Text>
          </View>
          <View style={styles.trackBar}>
            <View style={[styles.fillBar, { width: '33%', backgroundColor: '#7D3BFF' }]} />
          </View>

          <View style={[styles.statRow, { marginTop: 10 }]}>
            <View style={styles.statLeft}>
              <View style={[styles.colorDot, { backgroundColor: '#FC3949' }]} />
              <Text style={styles.statName}>Critical / Transferred</Text>
            </View>
            <Text style={styles.statValue}>4 (17%)</Text>
          </View>
          <View style={styles.trackBar}>
            <View style={[styles.fillBar, { width: '17%', backgroundColor: '#FC3949' }]} />
          </View>
        </View>
      </View>

      {/* Mandatory Feature: De-Identified Bhutani Risk Distribution */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>DE-IDENTIFIED BHUTANI RISK DISTRIBUTION</Text>
        <Text style={styles.cardSub}>District-level hour-specific neonatal bilirubin risk zones</Text>

        <View style={styles.riskGrid}>
          <View style={[styles.riskCard, { backgroundColor: '#F0FDF4', borderColor: '#00A569' }]}>
            <Text style={[styles.riskVal, { color: '#00A569' }]}>45%</Text>
            <Text style={styles.riskLabel}>Low Risk</Text>
            <Text style={styles.riskSub}>&lt; 40th %tile</Text>
          </View>

          <View style={[styles.riskCard, { backgroundColor: '#FEFCE8', borderColor: '#84CC16' }]}>
            <Text style={[styles.riskVal, { color: '#65A30D' }]}>30%</Text>
            <Text style={styles.riskLabel}>Low-Int Risk</Text>
            <Text style={styles.riskSub}>40th–75th %tile</Text>
          </View>

          <View style={[styles.riskCard, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]}>
            <Text style={[styles.riskVal, { color: '#D97706' }]}>17.5%</Text>
            <Text style={styles.riskLabel}>High-Int Risk</Text>
            <Text style={styles.riskSub}>75th–95th %tile</Text>
          </View>

          <View style={[styles.riskCard, { backgroundColor: '#FFF1F2', borderColor: '#FC3949' }]}>
            <Text style={[styles.riskVal, { color: '#FC3949' }]}>7.5%</Text>
            <Text style={styles.riskLabel}>High Risk</Text>
            <Text style={styles.riskSub}>&gt; 95th %tile</Text>
          </View>
        </View>
        <Text style={styles.deidentifiedNote}>
          🔒 De-identified aggregate statistics only. Patient identifiable data is restricted from district view per healthcare privacy standards.
        </Text>
      </View>

      {/* Hospital-Wise PT Station Availability Grid */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>HOSPITAL PT CAPACITY GRID</Text>
        <Text style={styles.cardSub}>District PT Stations: {occupiedPT} Occupied of {totalPT} Total ({availablePT} Available)</Text>

        {receivingHospitals.map((hosp) => (
          <View key={hosp.id} style={styles.hospGridItem}>
            <View style={styles.hospGridLeft}>
              <Text style={styles.hospGridName}>{hosp.name}</Text>
              <Text style={styles.hospGridSub}>
                {hosp.operationalPTStations} Operational • {hosp.occupiedPTStations} In Use
              </Text>
            </View>
            <View style={[styles.availBadge, hosp.availablePTStations === 0 && styles.availBadgeFull]}>
              <Text style={[styles.availBadgeText, hosp.availablePTStations === 0 && styles.availBadgeTextFull]}>
                {hosp.availablePTStations} Available
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Participating Facilities Summary */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>PARTICIPATING FACILITIES</Text>
        <View style={styles.facilitiesRow}>
          <View style={styles.facBox}>
            <Text style={styles.facVal}>{receivingHospitals.length}</Text>
            <Text style={styles.facLbl}>Receiving Hospitals</Text>
          </View>
          <View style={styles.facBox}>
            <Text style={[styles.facVal, { color: '#7D3BFF' }]}>{referringCentres.length}</Text>
            <Text style={styles.facLbl}>Referring CHCs/PHCs</Text>
          </View>
          <View style={styles.facBox}>
            <Text style={[styles.facVal, { color: '#00A569' }]}>{referrals.length}</Text>
            <Text style={styles.facLbl}>Total Referrals</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#7D3BFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  segmentTextActive: {
    color: '#7D3BFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 14,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#181829',
  },
  donutLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: -2,
  },
  progressSection: {
    marginTop: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statName: {
    fontSize: 12,
    color: '#181829',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#181829',
  },
  trackBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fillBar: {
    height: 6,
    borderRadius: 3,
  },
  riskGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  riskCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  riskVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  riskLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#181829',
    marginTop: 2,
  },
  riskSub: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 1,
  },
  deidentifiedNote: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  hospGridItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  hospGridLeft: {
    flex: 1,
  },
  hospGridName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#181829',
  },
  hospGridSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  availBadge: {
    backgroundColor: '#F2FDEF',
    borderColor: '#00A569',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availBadgeFull: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FC3949',
  },
  availBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00A569',
  },
  availBadgeTextFull: {
    color: '#FC3949',
  },
  facilitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  facBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 3,
  },
  facVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181829',
  },
  facLbl: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
});
