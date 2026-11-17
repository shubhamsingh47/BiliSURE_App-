import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Building2, ShieldCheck, MapPin, Users, Plus } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { PurpleHeader } from '../../../components/PurpleHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { useNetworkStore } from '../../../store/useNetworkStore';

interface FacilityUserManagementScreenProps {
  onBack: () => void;
}

export const FacilityUserManagementScreen: React.FC<FacilityUserManagementScreenProps> = ({ onBack }) => {
  const { hospitals } = useNetworkStore();
  const [filter, setFilter] = useState<'all' | 'hospital' | 'referring'>('all');

  const filteredHospitals = hospitals.filter((h) => {
    if (filter === 'hospital') return h.type.toLowerCase().includes('hospital');
    if (filter === 'referring') return h.type.toLowerCase().includes('chc') || h.type.toLowerCase().includes('phc') || h.type.toLowerCase().includes('centre');
    return true;
  });

  return (
    <View style={styles.safeArea}>
      <PurpleHeader
        title="District Facilities & Users"
        subtitle="Healthcare Network Governance"
        onBack={onBack}
      />

      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[styles.tabChip, filter === 'all' && styles.tabChipActive]}
        >
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>All ({hospitals.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('hospital')}
          style={[styles.tabChip, filter === 'hospital' && styles.tabChipActive]}
        >
          <Text style={[styles.tabText, filter === 'hospital' && styles.tabTextActive]}>Hospitals</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('referring')}
          style={[styles.tabChip, filter === 'referring' && styles.tabChipActive]}
        >
          <Text style={[styles.tabText, filter === 'referring' && styles.tabTextActive]}>Referring Centres</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredHospitals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.iconCircle}>
                <Building2 size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.type}>{item.type}</Text>
              </View>
              <StatusBadge
                label="Active Network"
                variant="normal"
              />
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MapPin size={12} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{item.district}</Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={12} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{item.totalPTStations || 0} Registered PT Units</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabChipActive: {
    backgroundColor: COLORS.primaryBg,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  type: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
