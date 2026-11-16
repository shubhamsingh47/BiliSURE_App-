import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SeverityState } from '../types';

interface StatusIndicatorProps {
  status: SeverityState | string;
  size?: 'small' | 'medium';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'small' }) => {
  const normalized = (status || 'normal').toLowerCase();

  let textColor = COLORS.normal;
  let label = 'Normal';

  if (normalized === 'critical' || normalized === 'high') {
    textColor = COLORS.critical;
    label = 'Critical';
  } else if (normalized === 'moderate' || normalized === 'intermediate') {
    textColor = COLORS.moderate;
    label = 'Moderate';
  }

  return (
    <Text style={[styles.text, { color: textColor }, size === 'medium' && styles.textMedium]}>
      {label}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textMedium: {
    fontSize: 16,
    fontWeight: '700',
  },
});
