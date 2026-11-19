import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { fontScale, getScreenTopPadding, moderateScale } from '../theme/responsive';

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
  const insets = useSafeAreaInsets();
  const dynamicTopPadding = getScreenTopPadding(insets, 4);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: dynamicTopPadding,
          minHeight: 56 + dynamicTopPadding,
        },
        style,
      ]}
    >
      {/* Left Back Action */}
      {onBack ? (
        <View style={styles.leftContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={textColor} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.spacer} />
      )}

      {/* Dynamic Title (no wasted whitespace, no overflow) */}
      <Text
        style={[styles.title, { color: textColor }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>

      {/* Right Action Container (auto-sized to content, never clipped) */}
      {rightAction ? (
        <View style={styles.rightContainer}>{rightAction}</View>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10),
  },
  leftContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  title: {
    flex: 1,
    fontSize: fontScale(17),
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  spacer: {
    width: moderateScale(12),
  },
});
