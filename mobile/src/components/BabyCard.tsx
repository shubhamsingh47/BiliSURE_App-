import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit3, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Baby, BilirubinReading } from '../types';
import { moderateScale, fontScale, SPACING } from '../theme/responsive';
import { formatCardDateTime } from '../services/dateTime.service';

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
  referralSentAt?: string | null;
}

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
  referralSentAt,
}) => {
  const severity = getSeverityInfo(baby.severityState);
  const sample = latestSample !== undefined
    ? latestSample
    : latestReading
    ? { value: latestReading.value, timestamp: latestReading.timestamp }
    : null;

  const displayName = getDisplayName(baby);
  // A baby card is greyed out and marked non-clickable if it is pending referral OR was referred/transferred to another hospital
  const targetHospital = referredToHospital || baby.referredToHospitalName || null;
  const isTransferred = baby.isTransferredOut || baby.isHistoricalOnly || false;
  const isPendingReferral = baby.referralStatus === 'pending' && !!targetHospital;
  const isReferred = isPendingReferral || isTransferred || !!referredToHospital;

  // Always display "Referred to [Hospital Name]" dynamically
  const badgeLabel = targetHospital ? `Referred to ${targetHospital}` : 'Referred';

  // Sent timestamp for the referred baby
  const sentTimestamp = referralSentAt || baby.referralSentAt || null;
  const referralSentFormatted = formatCardDateTime(sentTimestamp);

  // For active non-referred babies: show actual acceptance timestamp (if accepted) or registration timestamp
  const activeBabyTimestamp = baby.referralAcceptedAt || baby.acceptedAt || baby.createdAt || baby.registeredAt;
  const activeBabyDateTime = formatCardDateTime(activeBabyTimestamp);

  // Phototherapy & Discharge status
  const isBabyInPt = phototherapyInfo?.status === 'in_treatment' || baby.status === 'under_treatment';
  const isBabyPtConcluded = phototherapyInfo?.status === 'concluded' || (!isBabyInPt && !!baby.dischargeValue);
  const isBabyDischarged = baby.status === 'discharged';
  const dischargeTimeStr = isBabyDischarged ? formatDischargeDateTime(baby) : '';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isReferred}
      style={[styles.card, isReferred && styles.cardReferred]}
      accessibilityRole="button"
      accessibilityLabel={
        isReferred
          ? `${displayName}, ${badgeLabel}`
          : `${displayName}, ${severity.label}`
      }
    >
      <View style={[styles.uhidPill, isReferred ? styles.uhidPillReferred : { backgroundColor: pillColor }]}>
        <Text style={[styles.uhidText, isReferred && styles.uhidTextReferred]}>UHID</Text>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.nameRow}>
          <Text style={[styles.babyName, isReferred && styles.babyNameReferred]} numberOfLines={1}>
            {displayName}
          </Text>
          {!isReferred && !isBabyDischarged && onEditPress && (
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
            </>
          )}
        </View>
      </View>

      <View style={[styles.rightSection, isReferred && styles.rightSectionReferred]}>
        {isReferred ? (
          /* Referred / Transferred State: Replace bilirubin reading with badge and sent timestamp */
          <View style={styles.referredRightCol}>
            <View style={[styles.referredTagBadge, isTransferred && styles.transferredTagBadge]}>
              <Text style={[styles.referredTagText, isTransferred && styles.transferredTagText]} numberOfLines={1}>
                {badgeLabel}
              </Text>
            </View>
            {!!referralSentFormatted && (
              <Text style={styles.referralSentDateText}>{referralSentFormatted}</Text>
            )}
          </View>
        ) : isBabyDischarged ? (
          <View style={styles.dischargedChevronCircle}>
            <ChevronRight size={16} color="#94A3B8" />
          </View>
        ) : (
          /* Normal Active State: Bilirubin reading with acceptance/registration timestamp below */
          <View style={styles.normalRightCol}>
            {sample?.value != null && (
              <Text style={[styles.sampleValueText, { color: severity.color }]}>
                {sample.value.toFixed(1)} mg/dL
              </Text>
            )}
            {!!activeBabyDateTime && (
              <Text style={styles.readingTime}>{activeBabyDateTime}</Text>
            )}
          </View>
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
    backgroundColor: '#F8FAFC',
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
    color: '#475569',
  },
  rightSectionReferred: {
    minWidth: moderateScale(130),
    alignItems: 'flex-end',
  },
  referredRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  referredTagBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: moderateScale(3),
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
  referredTagText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  transferredTagBadge: {
    backgroundColor: '#E2E8F0',
    borderColor: '#94A3B8',
  },
  transferredTagText: {
    color: '#1E293B',
  },
  referralSentDateText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  normalRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
