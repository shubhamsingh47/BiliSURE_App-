import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Linear horizontal scale based on current window width.
 */
export const scale = (size: number): number => {
  const { width } = Dimensions.get('window');
  return Math.round((width / guidelineBaseWidth) * size);
};

/**
 * Linear vertical scale based on current window height.
 */
export const verticalScale = (size: number): number => {
  const { height } = Dimensions.get('window');
  return Math.round((height / guidelineBaseHeight) * size);
};

/**
 * Moderate scale with factor damping (default 0.5) to avoid extreme sizes
 * on small devices (<360px) or large tablets (>600px).
 * Perfect for paddings, margins, buttons, and card dimensions.
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  const { width } = Dimensions.get('window');
  const scaleRatio = width / guidelineBaseWidth;
  return Math.round(size + (scaleRatio * size - size) * factor);
};

/**
 * Responsive font scale that respects device typography while protecting
 * UI components from overlapping or clipping.
 */
export const fontScale = (size: number): number => {
  const fontMultiplier = PixelRatio.getFontScale();
  // Safe clamp between 0.85x and 1.25x so headings and buttons stay within visual bounds
  const clamped = Math.max(0.85, Math.min(1.25, fontMultiplier));
  return Math.round(moderateScale(size, 0.3) * clamped);
};

/**
 * Dynamic Spacing Tokens (scaled to screen density)
 */
export const SPACING = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  section: moderateScale(28),
};

/**
 * Universal safe top padding helper that ensures screens and headers
 * never render behind device camera cutouts, notches, or translucent status bars.
 */
export const getScreenTopPadding = (insets: { top: number }, extraPadding = 8): number => {
  const androidBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  return Math.max(insets.top || 0, androidBar) + extraPadding;
};
