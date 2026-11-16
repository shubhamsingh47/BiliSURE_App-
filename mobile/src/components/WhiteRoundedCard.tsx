import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS } from '../theme/colors';

interface WhiteRoundedCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'flat' | 'bordered';
  padding?: number;
}

export const WhiteRoundedCard: React.FC<WhiteRoundedCardProps> = ({
  children,
  style,
  variant = 'bordered',
  padding = 16,
}) => {
  return (
    <View
      style={[
        styles.card,
        { padding },
        variant === 'bordered' && styles.bordered,
        variant === 'elevated' && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
});
