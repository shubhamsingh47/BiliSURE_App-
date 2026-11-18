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

// Shows the baby's persisted registration timestamp (MongoDB `createdAt`).
// Never derived from sample/reading timestamps, `updatedAt`, or birth-time defaults.
const formatRegistrationDateTime = (baby: Baby): string => {
  const ts = baby.createdAt || baby.registeredAt;
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';

  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr}, ${timeStr}`;
};

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

const getDisplayName = (baby: Baby): string => {
  const pName = baby.parentsName?.trim();
  const bName = baby.name?.trim();
  const isInvalid = (val?: string) => !val || ['baby 1', 'baby 2', 'baby', 'baby1', 'baby2'].includes(val.toLowerCase());
  if (pName && !isInvalid(pName)) return pName;
  if (bName && !isInvalid(bName)) return bName;
  return 'Newborn Patient';
};

export const BabyCard: React.FC<BabyCardProps> = ({
  baby,
  latestReading,
  latestSample,
  onPress,
  onEditPress,
  pillColor = COLORS.pillBeige,
}) => {
  const severity = getSeverityInfo(baby.severityState);
  const sample = latestSample !== undefined
    ? latestSample
    : latestReading
    ? { value: latestReading.value, timestamp: latestReading.timestamp }
    : null;
  const registrationDateTime = formatRegistrationDateTime(baby);
  const displayName = getDisplayName(baby);

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
            {displayName}
          </Text>
          {onEditPress && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEditPress}
              accessibilityLabel={`Edit ${displayName}`}
              style={styles.editIconBtn}
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
