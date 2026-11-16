import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { Baby, BilirubinReading } from '../types';

interface BabyCardProps {
  baby: Baby;
  latestReading?: BilirubinReading;
  onPress: () => void;
  pillColor?: string;
}

export const BabyCard: React.FC<BabyCardProps> = ({
  baby,
  latestReading,
  onPress,
  pillColor = COLORS.pillBeige,
}) => {
  const isCritical = baby.severityState === 'critical';
  const readingVal = latestReading?.value ?? baby.initialValue ?? 10.0;
  const readingTime = latestReading?.timestamp
    ? new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '10:00 AM';

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
        <Text style={styles.babyName}>{baby.name}</Text>
        <Text style={[styles.statusText, { color: isCritical ? COLORS.critical : COLORS.normal }]}>
          {isCritical ? 'Critical' : 'Normal'}
        </Text>
        <Text style={styles.seeMore}>See more</Text>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.readingLabel, { color: isCritical ? COLORS.critical : COLORS.normal }]}>
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
    borderRadius: 22,
    padding: 16,
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
    width: 68,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uhidText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  middleSection: {
    flex: 1,
    marginLeft: 14,
  },
  babyName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
    marginTop: 4,
  },
});
