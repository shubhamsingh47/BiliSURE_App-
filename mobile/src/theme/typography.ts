import { TextStyle } from 'react-native';
import { COLORS } from './colors';

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
  } as TextStyle,
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  } as TextStyle,
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  } as TextStyle,
  bodyLarge: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textMuted,
  } as TextStyle,
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textWhite,
  } as TextStyle,
};
