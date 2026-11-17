import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit3 } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { Baby, BilirubinReading } from '../types';

interface BabyCardProps {
  baby: Baby;
  latestReading?: BilirubinReading;
  onPress: () => void;
  onEditPress?: () => void;
  pillColor?: string;
}

export const BabyCard: React.FC<BabyCardProps> = ({
  baby,
  latestReading,
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
  const readingVal = latestReading?.value ?? baby.initialValue ?? 10.0;
  const readingTime = latestReading?.timestamp
    ? new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : baby.exactTimeOfBirth || '10:00 AM';

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
            {baby.name}
          </Text>
          {onEditPress && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEditPress}
              style={styles.editIconBtn}
              accessibilityLabel={`Edit ${baby.name}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={13} color="#7D3BFF" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.statusText, { color: severity.color }]}>
          {severity.label}
        </Text>
        <Text style={styles.seeMore}>See more</Text>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.readingLabel, { color: severity.color }]}>
          Bilirubin reading
        </Text>
        <Text style={styles.readingTime}>{readingTime}</Text>
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
  seeMore: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  readingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  readingTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
});
