import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ChartCardProps {
  initialValue?: number;
  dischargeValue?: number;
  onRangeChange?: (range: string) => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  initialValue = 10.0,
  dischargeValue = 5.0,
  onRangeChange,
}) => {
  const [selectedRange, setSelectedRange] = useState('1hr');
  const ranges = ['1hr', '8hr', '16hr', '24hr'];

  const handleSelect = (r: string) => {
    setSelectedRange(r);
    onRangeChange?.(r);
  };

  // SVG curved path representing the wave trend in the video
  const width = SCREEN_WIDTH - 48;
  const height = 150;

  // Spline wave matching frame 27
  const pathD = `
    M 0 60
    C ${width * 0.15} 65, ${width * 0.22} 125, ${width * 0.28} 125
    C ${width * 0.35} 125, ${width * 0.45} 60, ${width * 0.55} 60
    C ${width * 0.65} 60, ${width * 0.68} 80, ${width * 0.72} 80
    C ${width * 0.78} 80, ${width * 0.82} 45, ${width * 0.86} 45
    C ${width * 0.92} 45, ${width * 0.96} 70, ${width} 60
  `;

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
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  chartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 8,
  },
  rangePill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  rangePillActive: {
    backgroundColor: '#FEF3C7', // soft beige active pill from video
  },
  rangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  rangeTextActive: {
    color: '#D97706',
    fontWeight: '700',
  },
});
