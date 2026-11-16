import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { ReferralStatus } from '../types';

interface TimelineStep {
  key: string;
  label: string;
  sublabel?: string;
  completed: boolean;
  current: boolean;
}

interface ReferralTimelineCardProps {
  referralId: string;
  babyName: string;
  uhid: string;
  referringFacility: string;
  receivingHospital: string;
  status: ReferralStatus;
  urgency?: 'routine' | 'urgent' | 'emergency';
  createdAt?: string;
  style?: ViewStyle;
}

export const ReferralTimelineCard: React.FC<ReferralTimelineCardProps> = ({
  referralId,
  babyName,
  uhid,
  referringFacility,
  receivingHospital,
  status,
  urgency = 'routine',
  createdAt,
  style,
}) => {
  const steps: TimelineStep[] = [
    {
      key: 'created',
      label: 'Referral Initiated',
      sublabel: referringFacility,
      completed: true,
      current: status === 'pending',
    },
    {
      key: 'decision',
      label: status === 'rejected' ? 'Declined by Hospital' : 'Hospital Review & Decision',
      sublabel: receivingHospital,
      completed: status === 'accepted' || status === 'completed',
      current: status === 'pending',
    },
    {
      key: 'arrival',
      label: 'Baby Physical Arrival',
      sublabel: 'NICU / Ward Intake',
      completed: status === 'completed',
      current: status === 'accepted',
    },
    {
      key: 'treatment',
      label: 'Station Allocation & PT',
      sublabel: 'Phototherapy Started',
      completed: status === 'completed',
      current: false,
    },
  ];

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.refId}>{referralId}</Text>
          <Text style={styles.babyInfo}>{babyName} (ID: {uhid})</Text>
        </View>
        <View style={[styles.urgencyBadge, urgency === 'emergency' && styles.urgencyEmergency]}>
          <Text style={[styles.urgencyText, urgency === 'emergency' && styles.urgencyTextEmergency]}>
            {urgency.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.facilityFlow}>
        <Text style={styles.facilityText} numberOfLines={1}>{referringFacility}</Text>
        <ArrowRight size={13} color={COLORS.primary} />
        <Text style={[styles.facilityText, styles.facilityTextBold]} numberOfLines={1}>
          {receivingHospital}
        </Text>
      </View>

      {/* Stepper Timeline */}
      <View style={styles.timeline}>
        {steps.map((step, idx) => (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.stepIndicatorCol}>
              <View
                style={[
                  styles.circle,
                  step.completed && styles.circleCompleted,
                  step.current && styles.circleCurrent,
                ]}
              >
                {step.completed ? (
                  <CheckCircle2 size={14} color={COLORS.white} />
                ) : step.current ? (
                  <Clock size={12} color={COLORS.primary} />
                ) : (
                  <View style={styles.dot} />
                )}
              </View>
              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.line,
                    step.completed && styles.lineCompleted,
                  ]}
                />
              )}
            </View>

            <View style={styles.stepContentCol}>
              <Text
                style={[
                  styles.stepLabel,
                  step.completed && styles.stepLabelCompleted,
                  step.current && styles.stepLabelCurrent,
                ]}
              >
                {step.label}
              </Text>
              {step.sublabel && (
                <Text style={styles.stepSublabel}>{step.sublabel}</Text>
              )}
            </View>
          </View>
        ))}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  babyInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyEmergency: {
    backgroundColor: COLORS.criticalLight,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  urgencyTextEmergency: {
    color: COLORS.critical,
  },
  facilityFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginVertical: 12,
    gap: 8,
  },
  facilityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  facilityTextBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timeline: {
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: COLORS.normal,
  },
  circleCurrent: {
    backgroundColor: COLORS.primaryBg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  lineCompleted: {
    backgroundColor: COLORS.normal,
  },
  stepContentCol: {
    flex: 1,
    paddingBottom: 10,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  stepLabelCompleted: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  stepSublabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
