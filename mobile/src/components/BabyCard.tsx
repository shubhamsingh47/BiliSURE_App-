import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit3, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Baby, BilirubinReading } from '../types';
import { moderateScale, fontScale, SPACING } from '../theme/responsive';

export interface PhototherapyInfo {
  status: 'in_treatment' | 'concluded';
  hours?: number | string;
  stationName?: string;
}

interface BabyCardProps {
  baby: Baby;
  latestReading?: BilirubinReading;
  latestSample?: {
    value?: number;
    timestamp?: string;
  } | null;
  phototherapyInfo?: PhototherapyInfo | null;
  onPress: () => void;
  onEditPress?: () => void;
  pillColor?: string;
  referredToHospital?: string | null;
}

// Shows the baby's persisted registration timestamp (MongoDB `createdAt`)
// or the referral acceptance timestamp if received via accepted referral.
const formatRegistrationDateTime = (baby: Baby): string => {
  const ts = baby.referralAcceptedAt || baby.acceptedAt || baby.createdAt || baby.registeredAt;
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';

  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr}, ${timeStr}`;
};

const formatDischargeDateTime = (baby: Baby): string => {
  const ts = baby.dischargedAt || baby.updatedAt;
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
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
  phototherapyInfo,
  onPress,
  onEditPress,
  pillColor = COLORS.pillBeige,
  referredToHospital,
}) => {
  const severity = getSeverityInfo(baby.severityState);
  const sample = latestSample !== undefined
    ? latestSample
    : latestReading
    ? { value: latestReading.value, timestamp: latestReading.timestamp }
    : null;
  const registrationDateTime = formatRegistrationDateTime(baby);
  const displayName = getDisplayName(baby);
  const referredHospital = referredToHospital || baby.referredToHospitalName || null;
  const isReferred = !!referredHospital;
  const isBabyInPt = phototherapyInfo?.status === 'in_treatment' || baby.status === 'under_treatment';
  const isBabyPtConcluded = phototherapyInfo?.status === 'concluded' || (!isBabyInPt && !!baby.dischargeValue);
  const isBabyDischarged = baby.status === 'discharged';
  const dischargeTimeStr = isBabyDischarged ? formatDischargeDateTime(baby) : '';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, isReferred && styles.cardReferred]}
    >
      <View style={[styles.uhidPill, isReferred ? styles.uhidPillReferred : { backgroundColor: pillColor }]}>
        <Text style={[styles.uhidText, isReferred && styles.uhidTextReferred]}>UHID</Text>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.nameRow}>
          <Text style={[styles.babyName, isReferred && styles.babyNameReferred]} numberOfLines={1}>
            {displayName}
          </Text>
          {!isBabyDischarged && onEditPress && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEditPress}
              accessibilityLabel={`Edit ${displayName}`}
              style={styles.editIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={13} color={isReferred ? '#94A3B8' : '#7D3BFF'} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.statusRow}>
          {isBabyDischarged ? (
            <View style={styles.dischargedTagPill}>
              <Text style={styles.dischargedTagPillText}>
                Discharged{dischargeTimeStr ? ` • ${dischargeTimeStr}` : ''}
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.statusText, { color: isReferred ? '#64748B' : severity.color }]}>
                {severity.label}
              </Text>
              {isBabyInPt && (
                <View style={styles.inPtBadge}>
                  <Text style={styles.inPtBadgeText}>
                    ● IN PT{phototherapyInfo?.stationName ? ` (${phototherapyInfo.stationName})` : ''}
                  </Text>
                </View>
              )}
              {!isBabyInPt && isBabyPtConcluded && (
                <View style={styles.concludedPtBadge}>
                  <Text style={styles.concludedPtBadgeText}>
                    ✓ PT DONE{phototherapyInfo?.hours ? ` (${phototherapyInfo.hours}h)` : ''}
                  </Text>
                </View>
              )}
              {isReferred && (
                <View style={styles.referredBadge}>
                  <Text style={styles.referredBadgeText}>
                    Referred to {referredHospital}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {isBabyDischarged ? (
          <View style={styles.dischargedChevronCircle}>
            <ChevronRight size={16} color="#94A3B8" />
          </View>
        ) : (
          <>
            {sample?.value != null && (
              <Text style={[styles.sampleValueText, { color: isReferred ? '#64748B' : severity.color }]}>
                {sample.value.toFixed(1)} mg/dL
              </Text>
            )}
            {!!registrationDateTime && (
              <Text style={styles.readingTime}>{registrationDateTime}</Text>
            )}
          </>
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
  dischargedTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(7),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignSelf: 'flex-start',
  },
  dischargedTagPillText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.2,
  },
  dischargedChevronCircle: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardReferred: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    opacity: 0.88,
  },
  uhidPillReferred: {
    backgroundColor: '#E2E8F0',
  },
  uhidTextReferred: {
    color: '#64748B',
  },
  babyNameReferred: {
    color: '#334155',
  },
  referredBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  inPtBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  inPtBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  concludedPtBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  concludedPtBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.3,
  },
  referredBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
});
