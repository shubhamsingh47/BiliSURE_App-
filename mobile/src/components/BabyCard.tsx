import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit3, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Baby, BilirubinReading } from '../types';
import { moderateScale, fontScale } from '../theme/responsive';
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

  // Reading date & time: if reading has timestamp, use that! Otherwise use baby registration/acceptance timestamp
  const readingTimeStr = sample?.timestamp
    ? formatCardDateTime(sample.timestamp)
    : activeBabyDateTime;

  // Phototherapy & Discharge status
  const activeStationName = phototherapyInfo?.stationName || baby.currentStationId || null;
  const isBabyInPt =
    (phototherapyInfo?.status === 'in_treatment' && !!activeStationName) ||
    (baby.status === 'under_treatment' && !!activeStationName);
  const isBabyPtConcluded = phototherapyInfo?.status === 'concluded' || (!isBabyInPt && !!baby.dischargeValue);
  const isBabyDischarged = baby.status === 'discharged';
  const dischargeTimeStr = isBabyDischarged ? formatDischargeDateTime(baby) : '';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, isReferred && styles.cardReferred]}
      accessibilityRole="button"
      accessibilityLabel={
        isReferred
          ? `${displayName}, ${badgeLabel}`
          : isBabyDischarged
          ? `${displayName}, Discharged`
          : isBabyInPt && activeStationName
          ? `${displayName}, PT, ${activeStationName}`
          : `${displayName}`
      }
    >
      {/* UHID Pill */}
      <View style={[styles.uhidPill, isReferred ? styles.uhidPillReferred : { backgroundColor: pillColor }]}>
        <Text style={[styles.uhidText, isReferred && styles.uhidTextReferred]}>UHID</Text>
      </View>

      {/* Middle Information Section */}
      <View style={styles.middleSection}>
        {/* Row 1: Baby / Mother Name + Edit Pencil */}
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

        {/* Row 2: Status Indicator (Clean & Uncrowded) */}
        <View style={styles.statusRow}>
          {isBabyDischarged ? (
            <View style={styles.dischargedTagPill}>
              <Text style={styles.dischargedTagPillText}>
                Discharged{dischargeTimeStr ? ` • ${dischargeTimeStr}` : ''}
              </Text>
            </View>
          ) : isBabyInPt && activeStationName ? (
            <View style={styles.inPtBadge}>
              <Text style={styles.inPtBadgeText}>
                PT • {activeStationName}
              </Text>
            </View>
          ) : isBabyPtConcluded ? (
            <View style={styles.concludedPtBadge}>
              <Text style={styles.concludedPtBadgeText} numberOfLines={1}>
                ✓ PT Completed{phototherapyInfo?.hours ? ` (${phototherapyInfo.hours}h)` : ''}
              </Text>
            </View>
          ) : isReferred ? (
            <Text style={styles.metaSubText} numberOfLines={1}>
              {badgeLabel}
            </Text>
          ) : (
            <Text style={styles.metaSubText} numberOfLines={1}>
              {baby.uhid ? `UHID: ${baby.uhid}` : ''}{baby.gestationalAgeWeeks ? ` • ${baby.gestationalAgeWeeks}w` : ''}
            </Text>
          )}
        </View>
      </View>

      {/* Right Information Section */}
      <View style={[styles.rightSection, isReferred && styles.rightSectionReferred]}>
        {isReferred ? (
          /* Referred / Transferred State: Badge and sent timestamp */
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
          /* Discharged State: Clean Chevron indicator */
          <View style={styles.dischargedChevronCircle}>
            <ChevronRight size={16} color="#94A3B8" />
          </View>
        ) : (
          /* Active / Under Treatment State: Latest Bilirubin Value & Timestamp */
          <View style={styles.normalRightCol}>
            {sample?.value != null ? (
              <Text style={styles.sampleValueText}>
                {sample.value.toFixed(1)} <Text style={styles.sampleValueUnit}>mg/dL</Text>
              </Text>
            ) : (
              <Text style={styles.sampleValueEmpty}>--</Text>
            )}
            {!!readingTimeStr && (
              <Text style={styles.readingTime}>{readingTimeStr}</Text>
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
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    marginBottom: moderateScale(10),
    minHeight: moderateScale(70),
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
    width: moderateScale(60),
    height: moderateScale(44),
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
    marginRight: moderateScale(8),
    minWidth: 0,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginBottom: moderateScale(3),
  },
  babyName: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  editIconBtn: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(6),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: moderateScale(2),
  },
  inPtBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  inPtBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.2,
    lineHeight: fontScale(15),
  },
  concludedPtBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2.5),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignSelf: 'flex-start',
  },
  concludedPtBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.2,
  },
  metaSubText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '500',
  },
  dischargedTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2.5),
    borderRadius: moderateScale(6),
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
    minWidth: moderateScale(72),
  },
  normalRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sampleValueText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sampleValueUnit: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  sampleValueEmpty: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#94A3B8',
  },
  readingTime: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
    marginTop: moderateScale(2),
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
});
