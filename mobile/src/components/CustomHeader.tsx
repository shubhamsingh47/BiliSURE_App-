import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

interface CustomHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  onBack,
  rightAction,
  backgroundColor = 'transparent',
  textColor = COLORS.textPrimary,
  style,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View style={styles.leftContainer}>
        {onBack && (
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={textColor} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightContainer}>{rightAction}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftContainer: {
    width: 44,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
});
