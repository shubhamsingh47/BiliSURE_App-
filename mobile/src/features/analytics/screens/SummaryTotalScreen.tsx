import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, Network, PieChart, ArrowUpDown, ArrowLeft } from 'lucide-react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS } from '../../../theme/colors';

interface SummaryTotalScreenProps {
  onBack: () => void;
  onExport: () => void;
}

export const SummaryTotalScreen: React.FC<SummaryTotalScreenProps> = ({ onBack, onExport }) => {
  const [activeTab, setActiveTab] = useState<'total' | 'admits'>('total');
  const [period, setPeriod] = useState('Day');

  const cyclePeriod = () => {
    const list = ['Day', 'Week', 'Month'];
    const next = list[(list.indexOf(period) + 1) % list.length];
    setPeriod(next);
  };

  const isTotal = activeTab === 'total';

  // Donut chart math (Radius 64, circumference ~ 402)
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Segment strokeDasharrays for Total Infants: 12 Obs (50%), 8 Photo (33%), 4 Crit (17%)
  const obsDash = `${circumference * 0.5} ${circumference * 0.5}`;
  const photoDash = `${circumference * 0.33} ${circumference * 0.67}`;
  const critDash = `${circumference * 0.17} ${circumference * 0.83}`;

  // Segment strokeDasharrays for Discharge Admits: 500 Discharged (83%), 100 Under Treatment (17%)
  const dischDash = `${circumference * 0.83} ${circumference * 0.17}`;
  const treatDash = `${circumference * 0.17} ${circumference * 0.83}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isTotal ? 'SUMMARY TOTAL' : 'Discharge'}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onExport} style={styles.exportPill}>
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Subheader: Period dropdown and view mode toggle */}
        <View style={styles.subHeader}>
          <TouchableOpacity activeOpacity={0.7} onPress={cyclePeriod} style={styles.periodDropdown}>
            <ChevronDown size={18} color="#7C3AED" />
            <Text style={styles.periodText}>{period}</Text>
          </TouchableOpacity>

          <View style={styles.viewToggleGroup}>
            <TouchableOpacity style={styles.toggleBtn}>
              <Network size={20} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, styles.toggleBtnActive]}>
              <PieChart size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Donut Chart Component */}
        <View style={styles.chartContainer}>
          <Svg width={200} height={200} viewBox="0 0 200 200">
            <G rotation="-90" origin="100, 100">
              {isTotal ? (
                <>
                  {/* Yellow: In Observation */}
                  <Circle
                    cx="100"
                    cy="100"
                    r={radius}
                    stroke="#F59E0B"
                    strokeWidth={strokeWidth}
                    strokeDasharray={obsDash}
                    strokeDashoffset={0}
                    fill="none"
                  />
                  {/* Purple: In Phototherapy */}
                  <Circle
                    cx="100"
                    cy="100"
                    r={radius}
                    stroke="#8B5CF6"
                    strokeWidth={strokeWidth}
                    strokeDasharray={photoDash}
                    strokeDashoffset={-circumference * 0.5}
                    fill="none"
                  />
                  {/* Red: Critical */}
                  <Circle
                    cx="100"
                    cy="100"
                    r={radius}
                    stroke="#EF4444"
                    strokeWidth={strokeWidth}
                    strokeDasharray={critDash}
                    strokeDashoffset={-circumference * 0.83}
                    fill="none"
                  />
                </>
              ) : (
                <>
                  {/* Green: Discharged */}
                  <Circle
                    cx="100"
                    cy="100"
                    r={radius}
                    stroke="#10B981"
                    strokeWidth={strokeWidth}
                    strokeDasharray={dischDash}
                    strokeDashoffset={0}
                    fill="none"
                  />
                  {/* Dark: Under Treatment */}
                  <Circle
                    cx="100"
                    cy="100"
                    r={radius}
                    stroke="#1E1B4B"
                    strokeWidth={strokeWidth}
                    strokeDasharray={treatDash}
                    strokeDashoffset={-circumference * 0.83}
                    fill="none"
                  />
                </>
              )}
            </G>
          </Svg>

          <View style={styles.donutCenterLabel}>
            <Text style={styles.centerTitle}>{isTotal ? 'Total\nInfants' : 'Discharge'}</Text>
          </View>
        </View>

        {/* Segmented Control / Tabs: Total vs Admits */}
        <View style={styles.tabGroup}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('total')}
            style={[styles.tabButton, isTotal && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, isTotal && styles.tabTextActive]}>Total</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('admits')}
            style={[styles.tabButton, !isTotal && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, !isTotal && styles.tabTextActive]}>Admits</Text>
          </TouchableOpacity>
        </View>

        {/* Filter / Sort Row */}
        <View style={styles.filterRow}>
          <TouchableOpacity activeOpacity={0.7} style={styles.categoryDropdown}>
            <ChevronDown size={18} color="#7C3AED" />
            <Text style={styles.categoryText}>Category</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.sortBtn}>
            <ArrowUpDown size={18} color="#1E1B4B" />
          </TouchableOpacity>
        </View>

        {/* Stat Progress Bars */}
        {isTotal ? (
          <>
            {/* Observation: 12 */}
            <View style={styles.statItem}>
              <View style={styles.statTitleRow}>
                <View style={styles.statPill}>
                  <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.statPillText}>In Observation</Text>
                </View>
                <Text style={styles.statCount}>12</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: '50%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>

            {/* In Phototherapy: 8 */}
            <View style={styles.statItem}>
              <View style={styles.statTitleRow}>
                <View style={styles.statPill}>
                  <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={styles.statPillText}>In Phototherapy</Text>
                </View>
                <Text style={styles.statCount}>8</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: '33%', backgroundColor: '#8B5CF6' }]} />
              </View>
            </View>

            {/* Critical: 4 */}
            <View style={styles.statItem}>
              <View style={styles.statTitleRow}>
                <View style={styles.statPill}>
                  <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.statPillText}>Critical</Text>
                </View>
                <Text style={styles.statCount}>4</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: '17%', backgroundColor: '#EF4444' }]} />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Discharged: 500 */}
            <View style={styles.statItem}>
              <View style={styles.statTitleRow}>
                <View style={styles.statPill}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.statPillText}>Discharged</Text>
                </View>
                <Text style={[styles.statCount, { color: '#10B981' }]}>500</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: '83%', backgroundColor: '#10B981' }]} />
              </View>
            </View>

            {/* Under Treatment: 100 */}
            <View style={styles.statItem}>
              <View style={styles.statTitleRow}>
                <View style={styles.statPill}>
                  <View style={[styles.dot, { backgroundColor: '#1E1B4B' }]} />
                  <Text style={styles.statPillText}>Under Treatment</Text>
                </View>
                <Text style={[styles.statCount, { color: '#10B981' }]}>100</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: '17%', backgroundColor: '#1E1B4B' }]} />
              </View>
            </View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  exportPill: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  exportText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  periodDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  periodText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 6,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    overflow: 'hidden',
  },
  toggleBtn: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  toggleBtnActive: {
    backgroundColor: '#7C3AED',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 14,
  },
  donutCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 28,
  },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 4,
    marginVertical: 20,
  },
  tabButton: {
    flex: 1,
    height: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 6,
  },
  sortBtn: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    marginBottom: 20,
  },
  statTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  statCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
  },
  track: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
