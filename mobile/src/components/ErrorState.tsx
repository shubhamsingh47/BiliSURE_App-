import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load data',
  onRetry,
}) => (
  <View style={styles.container}>
    <AlertTriangle size={48} color={COLORS.critical} />
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <PrimaryButton
        title="Retry"
        onPress={onRetry}
        style={styles.retryBtn}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  message: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    height: 46,
    paddingHorizontal: 24,
  },
});
