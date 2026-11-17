import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { moderateScale, fontScale, SPACING } from '../theme/responsive';

interface ChartCardProps {
  initialValue?: number;
  dischargeValue?: number;
  points?: number[]; // observation values, oldest -> newest (0-30 mg/dL)
  onRangeChange?: (range: string) => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  initialValue = 10.0,
  dischargeValue = 5.0,
  points,
  onRangeChange,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [selectedRange, setSelectedRange] = useState('1hr');
  const ranges = ['1hr', '8hr', '16hr', '24hr'];

  const handleSelect = (r: string) => {
    setSelectedRange(r);
    onRangeChange?.(r);
  };

  // SVG curved path representing the wave trend in the video
  const width = Math.max(260, Math.min(windowWidth - 48, 560));
  const height = moderateScale(140);

  // Spline wave matching frame 27
  let pathD = `
    M 0 60
    C ${width * 0.15} 65, ${width * 0.22} 125, ${width * 0.28} 125
    C ${width * 0.35} 125, ${width * 0.45} 60, ${width * 0.55} 60
    C ${width * 0.65} 60, ${width * 0.68} 80, ${width * 0.72} 80
    C ${width * 0.78} 80, ${width * 0.82} 45, ${width * 0.86} 45
    C ${width * 0.92} 45, ${width * 0.96} 70, ${width} 60
  `;

  // Data-driven curve when observation values are available
  if (points && points.length > 0) {
    const pad = 14;
    const toY = (v: number) =>
      height - pad - (Math.max(0, Math.min(30, v)) / 30) * (height - pad * 2);
    if (points.length === 1) {
      const y = toY(points[0]);
      pathD = `M 0 ${y} L ${width} ${y}`;
    } else {
      const step = width / (points.length - 1);
      pathD = `M 0 ${toY(points[0])}`;
      for (let i = 1; i < points.length; i++) {
        const x0 = (i - 1) * step;
        const x1 = i * step;
        const mid = (x0 + x1) / 2;
        pathD += ` C ${mid} ${toY(points[i - 1])}, ${mid} ${toY(points[i])}, ${x1} ${toY(points[i])}`;
      }
    }
  }

  const fillD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>BiliSURE Bilirubin Readings</Text>

      <View style={styles.chartBox}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          <Path d={fillD} fill="url(#waveGradient)" />
          <Path d={pathD} fill="none" stroke="#7C3AED" strokeWidth={4} strokeLinecap="round" />
        </Svg>
      </View>

      <View style={styles.filterRow}>
        {ranges.map((r) => {
          const isActive = selectedRange === r;
          return (
            <TouchableOpacity
              key={r}
              activeOpacity={0.7}
              onPress={() => handleSelect(r)}
              style={[
                styles.rangePill,
                isActive && styles.rangePillActive,
              ]}
            >
              <Text
                style={[
                  styles.rangeText,
                  isActive && styles.rangeTextActive,
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(22),
    padding: SPACING.lg,
    marginTop: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chartTitle: {
    fontSize: fontScale(17),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  chartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xs,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingHorizontal: 4,
  },
  rangePill: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: 'transparent',
  },
  rangePillActive: {
    backgroundColor: '#FEF3C7', // soft beige active pill from video
  },
  rangeText: {
    fontSize: fontScale(13),
    fontWeight: '600',
    color: '#94A3B8',
  },
  rangeTextActive: {
    color: '#D97706',
    fontWeight: '700',
  },
});
