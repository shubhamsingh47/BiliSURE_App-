import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ChevronRight, User, Calendar, Scale } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { StatusBadge, StatusVariant } from './StatusBadge';

interface PatientInfoCardProps {
  name: string;
  uhid: string;
  postnatalAgeHours?: number;
  gestationalAgeWeeks?: number;
  birthWeightKg?: number;
  riskStatus?: 'low' | 'low_intermediate' | 'high_intermediate' | 'high';
  onPress?: () => void;
  style?: ViewStyle;
}

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  name,
  uhid,
  postnatalAgeHours,
  gestationalAgeWeeks,
  birthWeightKg,
  riskStatus = 'low',
  onPress,
  style,
}) => {
  const getBadgeVariant = (): StatusVariant => {
    switch (riskStatus) {
      case 'high':
        return 'critical';
      case 'high_intermediate':
      case 'low_intermediate':
        return 'moderate';
      case 'low':
      default:
        return 'normal';
    }
  };

  const formatRiskLabel = () => {
    switch (riskStatus) {
      case 'high':
        return 'High Risk';
      case 'high_intermediate':
        return 'High-Int Risk';
      case 'low_intermediate':
        return 'Low-Int Risk';
      case 'low':
      default:
        return 'Low Risk';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          <View style={styles.avatar}>
            <User size={18} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.uhid}>ID: {uhid}</Text>
          </View>
        </View>
        <StatusBadge label={formatRiskLabel()} variant={getBadgeVariant()} />
      </View>

      <View style={styles.metricsRow}>
        {postnatalAgeHours !== undefined && (
          <View style={styles.metricItem}>
            <Calendar size={13} color={COLORS.textSecondary} />
            <Text style={styles.metricText}>{postnatalAgeHours}h old</Text>
          </View>
        )}
        {gestationalAgeWeeks !== undefined && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>GA:</Text>
            <Text style={styles.metricText}>{gestationalAgeWeeks}w</Text>
          </View>
        )}
        {birthWeightKg !== undefined && (
          <View style={styles.metricItem}>
            <Scale size={13} color={COLORS.textSecondary} />
            <Text style={styles.metricText}>{birthWeightKg} kg</Text>
          </View>
        )}
      </View>

      {onPress && (
        <View style={styles.actionRow}>
          <Text style={styles.actionText}>View Trends & Profile</Text>
          <ChevronRight size={16} color={COLORS.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
    justifyContent: 'space-between',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  uhid: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 2,
  },
});
