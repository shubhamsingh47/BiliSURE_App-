import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  StyleProp,
  TextStyle,
  ViewStyle,
  Platform,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { fontScale, moderateScale } from '../theme/responsive';

interface CustomInputProps extends TextInputProps {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  compactPlaceholder?: string;
  compactThresholdWidth?: number;
  error?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  labelStyle,
  containerStyle,
  inputContainerStyle,
  compactPlaceholder,
  compactThresholdWidth = 110,
  error,
  style,
  placeholder,
  ...props
}) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Dynamic placeholder selection based on measured box width
  const isNarrowBox = containerWidth > 0 && containerWidth < compactThresholdWidth;
  const resolvedPlaceholder =
    isNarrowBox && compactPlaceholder ? compactPlaceholder : placeholder;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[styles.label, labelStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {label}
        </Text>
      )}
      <View
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        style={[
          styles.inputContainer,
          isNarrowBox && styles.inputContainerNarrow,
          error ? styles.inputError : null,
          inputContainerStyle,
        ]}
      >
        <TextInput
          placeholder={resolvedPlaceholder}
          placeholderTextColor={COLORS.textMuted}
          style={[styles.input, isNarrowBox && styles.inputNarrow, style]}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(14),
  },
  label: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: moderateScale(6),
    letterSpacing: -0.1,
  },
  inputContainer: {
    minHeight: moderateScale(52),
    height: moderateScale(52),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(16),
    backgroundColor: COLORS.white,
    paddingHorizontal: moderateScale(14),
    justifyContent: 'center',
  },
  inputContainerNarrow: {
    paddingHorizontal: moderateScale(8),
  },
  inputError: {
    borderColor: COLORS.critical,
  },
  input: {
    fontSize: fontScale(15),
    color: COLORS.textPrimary,
    paddingVertical: Platform.OS === 'android' ? 4 : 0,
  },
  inputNarrow: {
    fontSize: fontScale(14),
  },
  errorText: {
    color: COLORS.critical,
    fontSize: fontScale(12),
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
});
