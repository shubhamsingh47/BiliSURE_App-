import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit3 } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Baby, BilirubinReading } from '../types';

interface BabyCardProps {
  baby: Baby;
  latestReading?: BilirubinReading;
  latestSample?: {
    value?: number;
    timestamp?: string;
  } | null;
  onPress: () => void;
  onEditPress?: () => void;
  pillColor?: string;
}

const formatRegistrationTime = (baby: Baby): string => {
  if (baby.exactTimeOfBirth) {
    if (baby.exactTimeOfBirth.includes('AM') || baby.exactTimeOfBirth.includes('PM')) {
      return baby.exactTimeOfBirth;
    }
    const parts = baby.exactTimeOfBirth.split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }
    return baby.exactTimeOfBirth;
  }
  if (baby.dateOfBirth) {
    const d = new Date(baby.dateOfBirth);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  if (baby.updatedAt) {
    const d = new Date(baby.updatedAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  return '';
};

export const BabyCard: React.FC<BabyCardProps> = ({
  baby,
  latestReading,
  latestSample,
  onPress,
  onEditPress,
  pillColor = COLORS.pillBeige,
}) => {
  const getSeverityInfo = (state?: string) => {
    switch (state) {
      case 'critical':
        return { label: 'Critical', color: COLORS.critical };
      case 'moderate':
        return { label: 'Moderate', color: COLORS.moderate };
      case 'normal':
      default:
        return { label: 'Normal', color: COLORS.normal };
    }
  };

  const severity = getSeverityInfo(baby.severityState);
  const sample = latestSample !== undefined
    ? latestSample
    : latestReading
    ? { value: latestReading.value, timestamp: latestReading.timestamp }
    : null;
  const registrationTime = formatRegistrationTime(baby);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}
    >
      <View style={[styles.uhidPill, { backgroundColor: pillColor }]}>
        <Text style={styles.uhidText}>UHID</Text>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.nameRow}>
          <Text style={styles.babyName} numberOfLines={1}>
            {baby.parentsName?.trim() || baby.name}
          </Text>
          {onEditPress && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEditPress}
              style={styles.editIconBtn}
              accessibilityLabel={`Edit ${baby.parentsName || baby.name}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={13} color="#7D3BFF" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.statusText, { color: severity.color }]}>
          {severity.label}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {sample?.value != null && (
          <Text style={[styles.sampleValueText, { color: severity.color }]}>
            {sample.value.toFixed(1)} mg/dL
          </Text>
        )}
        {!!registrationTime && (
          <Text style={styles.readingTime}>{registrationTime}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  uhidPill: {
    width: 66,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uhidText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  middleSection: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  babyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  editIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  sampleValueText: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  readingTime: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
