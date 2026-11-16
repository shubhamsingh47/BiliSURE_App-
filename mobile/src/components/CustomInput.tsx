import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '../theme/colors';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <TextInput
          placeholderTextColor={COLORS.textMuted}
          style={[styles.input, style]}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: COLORS.critical,
  },
  input: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.critical,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
