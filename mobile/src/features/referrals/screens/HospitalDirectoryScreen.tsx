import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { Hospital } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { moderateScale, fontScale, SPACING } from '../../../theme/responsive';

interface HospitalDirectoryScreenProps {
  onSelectHospital: (hospital: Hospital) => void;
  onBack?: () => void;
  isTab?: boolean;
}

export const HospitalDirectoryScreen: React.FC<HospitalDirectoryScreenProps> = ({
  onSelectHospital,
  onBack,
  isTab = false,
}) => {
  const { hospitals } = useNetworkStore();
  const { selectedBaby } = usePatientStore();
  const [search, setSearch] = useState('');

  const receivingHospitals = hospitals.filter(
    (h) => h.type === 'receiving_hospital' && h.name.toLowerCase().includes(search.toLowerCase())
  );

  const insets = useSafeAreaInsets();
  const dynamicTopPadding = isTab ? 10 : insets.top + 10;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: dynamicTopPadding }]}>
        <View style={styles.headerTop}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>District PT Network</Text>
            <Text style={styles.headerSubtitle}>Live Phototherapy Capacity Directory</Text>
          </View>
        </View>

        {selectedBaby && (
          <View style={styles.patientBanner}>
            <Text style={styles.patientBannerLabel}>Referring Patient:</Text>
            <Text style={styles.patientBannerName}>
              {selectedBaby.name} ({selectedBaby.uhid})
            </Text>
          </View>
        )}

        {/* Search box */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search district hospital or facility..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Hospital List */}
      <FlatList
        data={receivingHospitals}
        keyExtractor={(item) => item.id || item.code}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        renderItem={({ item }) => {
          const isFull = item.availablePTStations === 0;

          return (
            <View style={styles.hospitalCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.hospInfo}>
                  <Text style={styles.hospitalName}>{item.name}</Text>
                  <Text style={styles.hospitalAddress}>{item.address}</Text>
                  <Text style={styles.hospitalContact}>📞 {item.contactNumber}</Text>
                </View>

                {/* Capacity Pill */}
                <View
                  style={[
                    styles.capacityPill,
                    isFull ? styles.capacityPillFull : styles.capacityPillAvailable,
                  ]}
                >
                  <Text
                    style={[
                      styles.capacityPillNumber,
                      isFull ? styles.capacityPillTextFull : styles.capacityPillTextAvailable,
                    ]}
                  >
                    {item.availablePTStations}
                  </Text>
                  <Text
                    style={[
                      styles.capacityPillSub,
                      isFull ? styles.capacityPillTextFull : styles.capacityPillTextAvailable,
                    ]}
                  >
                    Available
                  </Text>
                </View>
              </View>

              {/* Station metrics row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{item.totalPTStations}</Text>
                  <Text style={styles.metricLbl}>Total Units</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{item.operationalPTStations}</Text>
                  <Text style={styles.metricLbl}>Operational</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: '#FC3949' }]}>{item.occupiedPTStations}</Text>
                  <Text style={styles.metricLbl}>Occupied</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: '#00A569' }]}>{item.availablePTStations}</Text>
                  <Text style={styles.metricLbl}>Vacant</Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                onPress={() => onSelectHospital(item)}
                style={[styles.referBtn, isFull && styles.referBtnDisabled]}
                disabled={isFull}
                activeOpacity={0.8}
              >
                <Text style={styles.referBtnText}>
                  {isFull ? 'Station Capacity Full' : 'Select for Phototherapy Referral →'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#7D3BFF',
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
  },
  backBtnText: {
    fontSize: fontScale(20),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: fontScale(20),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: fontScale(12),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  patientBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientBannerLabel: {
    fontSize: fontScale(11),
    color: 'rgba(255, 255, 255, 0.75)',
    marginRight: 6,
  },
  patientBannerName: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    minHeight: moderateScale(44),
    paddingHorizontal: SPACING.lg,
    fontSize: fontScale(13),
    color: '#181829',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  hospitalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  hospInfo: {
    flex: 1,
    paddingRight: 12,
  },
  hospitalName: {
    fontSize: fontScale(15),
    fontWeight: '700',
    color: '#181829',
    marginBottom: 4,
  },
  hospitalAddress: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginBottom: 4,
  },
  hospitalContact: {
    fontSize: fontScale(11),
    color: '#7D3BFF',
    fontWeight: '600',
  },
  capacityPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(14),
    minWidth: moderateScale(68),
  },
  capacityPillAvailable: {
    backgroundColor: '#F2FDEF',
    borderColor: '#00A569',
    borderWidth: 1,
  },
  capacityPillFull: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FC3949',
    borderWidth: 1,
  },
  capacityPillNumber: {
    fontSize: fontScale(19),
    fontWeight: '800',
  },
  capacityPillSub: {
    fontSize: fontScale(10),
    fontWeight: '700',
  },
  capacityPillTextAvailable: {
    color: '#00A569',
  },
  capacityPillTextFull: {
    color: '#FC3949',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: SPACING.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#181829',
  },
  metricLbl: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    marginTop: 2,
  },
  referBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: moderateScale(14),
    minHeight: moderateScale(46),
    alignItems: 'center',
    justifyContent: 'center',
  },
  referBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  referBtnText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
