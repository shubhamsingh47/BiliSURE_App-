import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Building2, MapPin, Zap, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

interface HospitalAvailabilityCardProps {
  name: string;
  type: string;
  address?: string;
  distanceKm?: number;
  totalStations: number;
  availableStations: number;
  occupiedStations: number;
  cleaningStations?: number;
  onSelect?: () => void;
  selected?: boolean;
  style?: ViewStyle;
}

export const HospitalAvailabilityCard: React.FC<HospitalAvailabilityCardProps> = ({
  name,
  type,
  address,
  distanceKm,
  totalStations,
  availableStations,
  occupiedStations,
  cleaningStations = 0,
  onSelect,
  selected = false,
  style,
}) => {
  const isAvailable = availableStations > 0;

  return (
    <View
      style={[
        styles.card,
        selected && styles.cardSelected,
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Building2 size={20} color={COLORS.primary} />
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.type}>{type}</Text>
        </View>
        {distanceKm !== undefined && (
          <View style={styles.distanceBadge}>
            <MapPin size={11} color={COLORS.textSecondary} />
            <Text style={styles.distanceText}>{distanceKm} km</Text>
          </View>
        )}
      </View>

      {address && (
        <Text style={styles.address} numberOfLines={1}>
          {address}
        </Text>
      )}

      {/* Live PT Station Capacity Strip */}
      <View style={styles.capacityStrip}>
        <View style={styles.capacityCol}>
          <Text style={styles.capacityLabel}>Available PT</Text>
          <View style={[styles.pill, isAvailable ? styles.pillAvailable : styles.pillFull]}>
            <Zap size={13} color={isAvailable ? COLORS.normal : COLORS.critical} />
            <Text style={[styles.pillNumber, { color: isAvailable ? COLORS.normal : COLORS.critical }]}>
              {availableStations}
            </Text>
          </View>
        </View>

        <View style={styles.capacityCol}>
          <Text style={styles.capacityLabel}>Occupied</Text>
          <View style={[styles.pill, styles.pillNeutral]}>
            <Text style={[styles.pillNumber, { color: COLORS.critical }]}>{occupiedStations}</Text>
          </View>
        </View>

        <View style={styles.capacityCol}>
          <Text style={styles.capacityLabel}>Total Fleet</Text>
          <View style={[styles.pill, styles.pillNeutral]}>
            <Text style={[styles.pillNumber, { color: COLORS.textPrimary }]}>{totalStations}</Text>
          </View>
        </View>
      </View>

      {onSelect && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onSelect}
          disabled={!isAvailable && !selected}
          style={[
            styles.selectBtn,
            selected && styles.selectBtnActive,
            !isAvailable && !selected && styles.selectBtnDisabled,
          ]}
        >
          <Text style={[styles.selectBtnText, selected && styles.selectBtnTextActive]}>
            {selected ? 'Hospital Selected' : isAvailable ? 'Select Hospital for Referral' : 'No Stations Available'}
          </Text>
          {isAvailable && <ArrowRight size={15} color={selected ? COLORS.white : COLORS.primary} />}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAF5FF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleArea: {
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
    marginTop: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  distanceText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  capacityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  capacityCol: {
    alignItems: 'center',
  },
  capacityLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  pillAvailable: {
    backgroundColor: COLORS.normalLight,
  },
  pillFull: {
    backgroundColor: COLORS.criticalLight,
  },
  pillNeutral: {
    backgroundColor: COLORS.white,
  },
  pillNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBg,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 6,
  },
  selectBtnActive: {
    backgroundColor: COLORS.primary,
  },
  selectBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectBtnTextActive: {
    color: COLORS.white,
  },
});
