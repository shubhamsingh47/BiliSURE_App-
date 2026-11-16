import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Sparkles, AlertCircle, Wrench, CheckCircle, Shield } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { StatusBadge, StatusVariant } from './StatusBadge';
import { PTStationStatus } from '../types';

interface PTStationStatusCardProps {
  stationId: string;
  stationName: string;
  stationType: string;
  status: PTStationStatus;
  currentPatientName?: string;
  currentPatientUhid?: string;
  onAllocate?: () => void;
  onSanitizeComplete?: () => void;
  onToggleMaintenance?: () => void;
  style?: ViewStyle;
}

export const PTStationStatusCard: React.FC<PTStationStatusCardProps> = ({
  stationId,
  stationName,
  stationType,
  status,
  currentPatientName,
  currentPatientUhid,
  onAllocate,
  onSanitizeComplete,
  onToggleMaintenance,
  style,
}) => {
  const getBadgeVariant = (): StatusVariant => {
    switch (status) {
      case 'available':
        return 'normal';
      case 'occupied':
        return 'critical';
      case 'cleaning_prep':
        return 'moderate';
      case 'maintenance':
      case 'out_of_service':
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'cleaning_prep':
        return 'Sanitizing';
      case 'maintenance':
        return 'Maintenance';
      case 'out_of_service':
        return 'Out of Service';
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={styles.idContainer}>
          <Text style={styles.stationId}>{stationId}</Text>
          <Text style={styles.stationType}>{stationType}</Text>
        </View>
        <StatusBadge label={getStatusLabel()} variant={getBadgeVariant()} />
      </View>

      <Text style={styles.stationName}>{stationName}</Text>

      {status === 'occupied' && currentPatientName && (
        <View style={styles.patientStrip}>
          <Text style={styles.patientLabel}>Current Infant:</Text>
          <Text style={styles.patientName}>{currentPatientName}</Text>
          {currentPatientUhid && (
            <Text style={styles.patientUhid}>({currentPatientUhid})</Text>
          )}
        </View>
      )}

      {/* Action Triggers */}
      <View style={styles.actionsRow}>
        {status === 'available' && onAllocate && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAllocate}
            style={[styles.btn, styles.btnAllocate]}
          >
            <CheckCircle size={14} color={COLORS.white} />
            <Text style={styles.btnTextWhite}>Allocate Station</Text>
          </TouchableOpacity>
        )}

        {status === 'cleaning_prep' && onSanitizeComplete && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onSanitizeComplete}
            style={[styles.btn, styles.btnSanitize]}
          >
            <Sparkles size={14} color={COLORS.white} />
            <Text style={styles.btnTextWhite}>Confirm Sanitized</Text>
          </TouchableOpacity>
        )}

        {onToggleMaintenance && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleMaintenance}
            style={[styles.btn, styles.btnMaintenance]}
          >
            <Wrench size={13} color={COLORS.textSecondary} />
            <Text style={styles.btnTextSecondary}>
              {status === 'maintenance' ? 'Return to Service' : 'Set Maintenance'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationId: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stationType: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  patientStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF1F2',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  patientLabel: {
    fontSize: 12,
    color: COLORS.critical,
    fontWeight: '600',
  },
  patientName: {
    fontSize: 12,
    color: COLORS.critical,
    fontWeight: '700',
  },
  patientUhid: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnAllocate: {
    backgroundColor: COLORS.primary,
    flex: 1,
  },
  btnSanitize: {
    backgroundColor: COLORS.moderate,
    flex: 1,
  },
  btnMaintenance: {
    backgroundColor: '#F1F5F9',
  },
  btnTextWhite: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  btnTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
