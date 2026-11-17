import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit3 } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Baby, BilirubinReading } from '../types';
import { moderateScale, fontScale, SPACING } from '../theme/responsive';

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

const formatRegistrationDateTime = (baby: Baby): string => {
  const ts = baby.updatedAt || baby.dateOfBirth;
  if (!ts) return baby.exactTimeOfBirth || '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return baby.exactTimeOfBirth || '';

  const dateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  let timeStr = '';
  if (baby.exactTimeOfBirth && (baby.exactTimeOfBirth.includes('AM') || baby.exactTimeOfBirth.includes('PM'))) {
    timeStr = baby.exactTimeOfBirth;
  } else if (baby.exactTimeOfBirth && baby.exactTimeOfBirth.includes(':')) {
    const parts = baby.exactTimeOfBirth.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    timeStr = `${h}:${m} ${ampm}`;
  } else {
    timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return `${dateStr}, ${timeStr}`;
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
  const registrationDateTime = formatRegistrationDateTime(baby);

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
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: severity.color }]}>
            {severity.label}
          </Text>
          {baby.status === 'discharged' && (
            <View style={styles.dischargedBadge}>
              <Text style={styles.dischargedBadgeText}>DISCHARGED</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {sample?.value != null && (
          <Text style={[styles.sampleValueText, { color: severity.color }]}>
            {sample.value.toFixed(1)} mg/dL
          </Text>
        )}
        {!!registrationDateTime && (
          <Text style={styles.readingTime}>{registrationDateTime}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(18),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    marginBottom: moderateScale(10),
    minHeight: moderateScale(68),
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
    width: moderateScale(62),
    height: moderateScale(46),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uhidText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  middleSection: {
    flex: 1,
    marginLeft: moderateScale(12),
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  babyName: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  editIconBtn: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(6),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginTop: moderateScale(2),
  },
  statusText: {
    fontSize: fontScale(12),
    fontWeight: '600',
  },
  dischargedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dischargedBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: moderateScale(8),
    minWidth: moderateScale(68),
  },
  sampleValueText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    marginBottom: moderateScale(2),
  },
  readingTime: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },
});
