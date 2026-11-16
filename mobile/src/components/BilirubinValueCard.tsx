import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Activity, Clock, ShieldAlert } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { StatusBadge, StatusVariant } from './StatusBadge';

interface BilirubinValueCardProps {
  value: number;
  unit?: 'mg/dL' | 'µmol/L';
  method?: 'TSB' | 'TcB';
  riskZone?: 'low' | 'low_intermediate' | 'high_intermediate' | 'high';
  measurementSite?: string;
  postnatalAgeHours?: number;
  timestamp?: string;
  onPressRecommendation?: () => void;
  style?: ViewStyle;
}

export const BilirubinValueCard: React.FC<BilirubinValueCardProps> = ({
  value,
  unit = 'mg/dL',
  method = 'TSB',
  riskZone = 'low',
  measurementSite = 'Palms and soles',
  postnatalAgeHours,
  timestamp,
  onPressRecommendation,
  style,
}) => {
  const getRiskVariant = (): StatusVariant => {
    switch (riskZone) {
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

  const getRiskLabel = () => {
    switch (riskZone) {
      case 'high':
        return 'High Risk Zone (>95th)';
      case 'high_intermediate':
        return 'High-Int Zone (75-95th)';
      case 'low_intermediate':
        return 'Low-Int Zone (40-75th)';
      case 'low':
      default:
        return 'Low Risk Zone (<40th)';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.methodTag}>
          <Activity size={14} color={COLORS.primary} />
          <Text style={styles.methodText}>{method} Reading</Text>
        </View>
        <StatusBadge label={getRiskLabel()} variant={getRiskVariant()} />
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueNumber}>{value.toFixed(1)}</Text>
        <Text style={styles.valueUnit}>{unit}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>Site: <Text style={styles.metaBold}>{measurementSite}</Text></Text>
        {postnatalAgeHours !== undefined && (
          <Text style={styles.metaItem}>Age: <Text style={styles.metaBold}>{postnatalAgeHours}h</Text></Text>
        )}
      </View>

      {timestamp && (
        <View style={styles.timeRow}>
          <Clock size={12} color={COLORS.textSecondary} />
          <Text style={styles.timeText}>{timestamp}</Text>
        </View>
      )}

      {onPressRecommendation && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPressRecommendation}
          style={styles.actionBtn}
        >
          <ShieldAlert size={14} color={COLORS.white} />
          <Text style={styles.actionBtnText}>View Clinical Recommendations</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  methodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 6,
  },
  valueNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  valueUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  metaBold: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
