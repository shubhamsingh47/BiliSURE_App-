import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, SlidersHorizontal, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { BabyCard } from '../../../components/BabyCard';
import { usePatientStore } from '../../../store/usePatientStore';
import { Baby } from '../../../types';

interface DashboardScreenProps {
  onSelectBaby: (baby: Baby) => void;
  onOpenReportStories: () => void;
  onOpenNewRegistration: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSelectBaby,
  onOpenReportStories,
  onOpenNewRegistration,
}) => {
  const { babies, selectedDepartment, setSelectedDepartment, loadBabies } = usePatientStore();
  const [activeDept, setActiveDept] = useState(selectedDepartment || 'Deppt');

  useEffect(() => {
    loadBabies();
  }, []);

  const departments = ['Deppt', 'NICU', 'Maternity', 'Pediatrics'];

  const cycleDept = () => {
    const nextIdx = (departments.indexOf(activeDept) + 1) % departments.length;
    const next = departments[nextIdx];
    setActiveDept(next);
    setSelectedDepartment(next);
  };

  // Split babies for "Today" and "Yesterday" sections
  const todayBabies = babies.slice(0, 3);
  const yesterdayBabies = babies.length > 3 ? babies.slice(3) : babies.slice(0, 2);

  const getPillColor = (idx: number) => {
    const colors = [COLORS.pillBeige, COLORS.pillBeige, COLORS.pillPink, COLORS.pillGreen, COLORS.pillBlue];
    return colors[idx % colors.length];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity activeOpacity={0.7} onPress={cycleDept} style={styles.deptDropdown}>
          <ChevronDown size={18} color="#7C3AED" />
          <Text style={styles.deptText}>{activeDept}</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={styles.filterBtn}>
          <SlidersHorizontal size={20} color="#1E1B4B" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* "See Report >" Banner Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenReportStories}
          style={styles.reportBanner}
        >
          <Text style={styles.reportBannerText}>See Report</Text>
          <ChevronRight size={20} color="#7C3AED" />
        </TouchableOpacity>

        {/* Section: Today */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
        </View>

        {todayBabies.map((baby, idx) => (
          <BabyCard
            key={baby.id + '_today_' + idx}
            baby={baby}
            pillColor={getPillColor(idx)}
            onPress={() => onSelectBaby(baby)}
          />
        ))}

        {/* Section: Yesterday */}
        <View style={[styles.sectionHeader, { marginTop: 18 }]}>
          <Text style={styles.sectionTitle}>Yesterday</Text>
        </View>

        {yesterdayBabies.map((baby, idx) => (
          <BabyCard
            key={baby.id + '_yesterday_' + idx}
            baby={baby}
            pillColor={getPillColor(idx + 3)}
            onPress={() => onSelectBaby(baby)}
          />
        ))}

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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  deptDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
    marginLeft: 6,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#7C3AED',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  reportBanner: {
    backgroundColor: '#F3E8FF',
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  reportBannerText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
});
