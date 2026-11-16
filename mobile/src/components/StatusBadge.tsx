import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';

export type StatusVariant = 'normal' | 'moderate' | 'critical' | 'neutral' | 'purple';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  style?: ViewStyle;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'normal',
  style,
  showDot = true,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'critical':
        return { bg: COLORS.criticalLight, text: COLORS.critical, dot: COLORS.critical };
      case 'moderate':
        return { bg: COLORS.moderateLight, text: COLORS.moderate, dot: COLORS.moderate };
      case 'purple':
        return { bg: COLORS.primaryBg, text: COLORS.primary, dot: COLORS.primary };
      case 'neutral':
        return { bg: '#F1F5F9', text: COLORS.textSecondary, dot: COLORS.textSecondary };
      case 'normal':
      default:
        return { bg: COLORS.normalLight, text: COLORS.normal, dot: COLORS.normal };
    }
  };

  const { bg, text, dot } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {showDot && <View style={[styles.dot, { backgroundColor: dot }]} />}
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
