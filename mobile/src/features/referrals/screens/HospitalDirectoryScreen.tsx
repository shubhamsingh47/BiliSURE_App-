import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { Hospital } from '../../../types';
import { COLORS } from '../../../theme/colors';

interface HospitalDirectoryScreenProps {
  onSelectHospital: (hospital: Hospital) => void;
  onBack?: () => void;
}

export const HospitalDirectoryScreen: React.FC<HospitalDirectoryScreenProps> = ({
  onSelectHospital,
  onBack,
}) => {
  const { hospitals } = useNetworkStore();
  const { selectedBaby } = usePatientStore();
  const [search, setSearch] = useState('');

  const receivingHospitals = hospitals.filter(
    (h) => h.type === 'receiving_hospital' && h.name.toLowerCase().includes(search.toLowerCase())
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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
        contentContainerStyle={styles.listContent}
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
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
  },
  backBtnText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
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
  patientBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientBannerLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginRight: 6,
  },
  patientBannerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#181829',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  hospitalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
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
    marginBottom: 12,
  },
  hospInfo: {
    flex: 1,
    paddingRight: 12,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181829',
    marginBottom: 4,
  },
  hospitalAddress: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  hospitalContact: {
    fontSize: 11,
    color: '#7D3BFF',
    fontWeight: '600',
  },
  capacityPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 70,
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
    fontSize: 20,
    fontWeight: '800',
  },
  capacityPillSub: {
    fontSize: 10,
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
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#181829',
  },
  metricLbl: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  referBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  referBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
