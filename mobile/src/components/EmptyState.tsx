import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  message = 'There are no active records in this view.',
}) => (
  <View style={styles.container}>
    <Inbox size={48} color={COLORS.textMuted} />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  message: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
