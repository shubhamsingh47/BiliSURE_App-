import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { X as CloseIcon } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { moderateScale, fontScale, SPACING } from '../theme/responsive';
import {
  GraphReading,
  computeReadingHour,
  calculateElapsedHoursFromRegistration,
  isReadingWithinMaxHours,
  generateBilirubinTrendPaths,
} from '../services/chartTimeline.service';

export type { GraphReading };
export {
  computeReadingHour,
  calculateElapsedHoursFromRegistration,
  isReadingWithinMaxHours,
  generateBilirubinTrendPaths,
};

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ChartCardProps {
  initialValue?: number;
  dischargeValue?: number;
  readings?: GraphReading[];
  points?: number[]; // fallback if only numerical points passed
  babyRegistrationTime?: string | number | Date;
  babyDateOfBirth?: string | Date;
  babyExactTimeOfBirth?: string;
  onRangeChange?: (range: string) => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  initialValue = 0,
  readings,
  points,
  babyRegistrationTime,
  babyDateOfBirth,
  babyExactTimeOfBirth,
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 72);

  // Fixed 48-hour timeline with clean 8-hour blocks (0h to 48h)
  const maxHours = 48;
  const xTicks = [0, 8, 16, 24, 32, 40, 48];

  // Fixed internal Y-axis scale: 0 to 24 mg/dL with intervals of 4
  const Y_MIN = 0;
  const Y_MAX = 24;
  const Y_GRID_INTERVALS = [0, 4, 8, 12, 16, 20, 24];

  const cardWidth = containerWidth > 0 ? containerWidth : SCREEN_WIDTH - 72;
  const chartHeight = 175;
  const paddingTop = 16;
  const paddingBottom = 30; // Dedicated space for single clear X-axis
  const paddingLeft = 24;
  const paddingRight = 24;
  const plotWidth = Math.max(10, cardWidth - paddingLeft - paddingRight);
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Normalized list of actual readings sorted ascending by timestamp,
  // restricted strictly to the acute 48-hour monitoring window (first 2 days)
  const sortedReadings: GraphReading[] = useMemo(() => {
    const regTime = babyRegistrationTime || babyDateOfBirth;
    if (readings && readings.length > 0) {
      return [...readings]
        .filter((r) => isReadingWithinMaxHours(r, regTime, maxHours))
        .sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    }
    // Fallback if only points (values) were passed
    if (points && points.length > 0) {
      const now = Date.now();
      return points.map((val, idx) => ({
        id: `point_${idx}`,
        value: val,
        timestamp: new Date(now).toISOString(),
        site: 'Forehead',
        postnatalAgeHours: (idx + 1) * 8,
      }));
    }
    return [];
  }, [readings, points, maxHours, babyRegistrationTime, babyDateOfBirth]);

  // Compute the reading's elapsed hours from baby registration time
  // e.g. Baby registered at 2:00 PM, Data taken at 4:30 PM -> 2.5 hours
  const getReadingHour = (r: GraphReading): number => {
    const regTime = babyRegistrationTime || babyDateOfBirth;
    return computeReadingHour(r, regTime, maxHours);
  };

  // Map value to Y coordinate
  const getY = (val: number) => {
    const clamped = Math.max(Y_MIN, Math.min(Y_MAX, val));
    return paddingTop + (1 - clamped / Y_MAX) * plotHeight;
  };

  // Map hour (0 to 24h) to X coordinate
  const getX = (hourVal: number) => {
    const clamped = Math.max(0, Math.min(maxHours, hourVal));
    return paddingLeft + (clamped / maxHours) * plotWidth;
  };

  // Plotted points: placed precisely at their true elapsed hour from registration
  const plottedPoints = useMemo(() => {
    return sortedReadings.map((r) => {
      const hour = getReadingHour(r);
      const x = getX(hour);
      const y = getY(r.value);
      return {
        ...r,
        hour,
        x,
        y,
      };
    });
  }, [sortedReadings, maxHours, plotWidth, plotHeight, cardWidth, babyRegistrationTime, babyDateOfBirth]);

  // Generate continuous trend spline starting from 0, area fill, and session indicator
  const { linePath, areaPath, projectionPath, sessionLine } = useMemo(() => {
    return generateBilirubinTrendPaths({
      plottedPoints,
      paddingLeft,
      paddingRight,
      cardWidth,
      paddingTop,
      plotHeight,
      initialValue,
    });
  }, [plottedPoints, paddingLeft, paddingRight, cardWidth, paddingTop, plotHeight, initialValue]);

  // Multi-site session indicators (e.g. Forehead + Sternum at the same timestamp)
  const sessionConnectors = useMemo(() => {
    const groups = new Map<number, typeof plottedPoints>();
    plottedPoints.forEach((pt) => {
      const key = Math.round(pt.hour * 10) / 10;
      const g = groups.get(key) || [];
      g.push(pt);
      groups.set(key, g);
    });
    const connectors: { x: number; y1: number; y2: number }[] = [];
    groups.forEach((g) => {
      if (g.length > 1) {
        const yVals = g.map((p) => p.y);
        const minY = Math.min(...yVals);
        const maxY = Math.max(...yVals);
        if (maxY - minY > 4) {
          connectors.push({ x: g[0].x, y1: minY, y2: maxY });
        }
      }
    });
    return connectors;
  }, [plottedPoints]);

  const activePoint =
    selectedPointIndex !== null && plottedPoints[selectedPointIndex]
      ? plottedPoints[selectedPointIndex]
      : null;

  const formatDate = (ts: string | number | Date) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatTime = (ts: string | number | Date) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.chartTitle}>BiliSURE Bilirubin Readings</Text>
        <Text style={styles.chartSubtitle}>Timeline from Registration (0h – 48h)</Text>
      </View>

      {/* Chart Canvas with tap-away dismissal */}
      <TouchableWithoutFeedback onPress={() => setSelectedPointIndex(null)}>
        <View
          style={[styles.chartBox, { width: cardWidth, height: chartHeight }]}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - containerWidth) > 1) {
              setContainerWidth(w);
            }
          }}
        >
          <Svg width={cardWidth} height={chartHeight} viewBox={`0 0 ${cardWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="purpleAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#7D3BFF" stopOpacity="0.22" />
                <Stop offset="100%" stopColor="#7D3BFF" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Vertical Time Grid Lines for Hour Ticks */}
            {xTicks.map((tick) => {
              const tx = getX(tick);
              return (
                <Line
                  key={`vtick_${tick}`}
                  x1={tx}
                  y1={paddingTop}
                  x2={tx}
                  y2={paddingTop + plotHeight}
                  stroke="#F8FAFC"
                  strokeWidth={1}
                />
              );
            })}

            {/* Horizontal Grid Lines corresponding to 0, 4, 8, 12, 16, 20, 24 mg/dL */}
            {Y_GRID_INTERVALS.map((gridVal) => {
              const gy = getY(gridVal);
              return (
                <Line
                  key={`grid_${gridVal}`}
                  x1={paddingLeft}
                  y1={gy}
                  x2={cardWidth - paddingRight}
                  y2={gy}
                  stroke={gridVal === 0 ? '#CBD5E1' : '#F1F5F9'}
                  strokeDasharray={gridVal === 0 ? undefined : '4 4'}
                  strokeWidth={gridVal === 0 ? 1.5 : 1}
                />
              );
            })}

            {/* Subtle Gradient Area Fill beneath curve */}
            {areaPath.length > 0 && <Path d={areaPath} fill="url(#purpleAreaGradient)" />}

            {/* Continuous Trend Line Starting from 0 */}
            {linePath.length > 0 && (
              <Path
                d={linePath}
                fill="none"
                stroke="#7D3BFF"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            )}

            {/* Subtle projection line to right edge from latest observation */}
            {projectionPath.length > 0 && (
              <Path
                d={projectionPath}
                fill="none"
                stroke="#7D3BFF"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                strokeLinecap="round"
                opacity={0.35}
              />
            )}

            {/* Vertical session indicators when multiple readings exist at the same session */}
            {sessionConnectors.map((c, i) => (
              <Line
                key={`session_bar_${i}`}
                x1={c.x}
                y1={c.y1}
                x2={c.x}
                y2={c.y2}
                stroke="#7D3BFF"
                strokeWidth={2}
                strokeDasharray="3 3"
                opacity={0.8}
              />
            ))}

            {/* Single Clear X-Axis Baseline */}
            <Line
              x1={paddingLeft}
              y1={paddingTop + plotHeight}
              x2={cardWidth - paddingRight}
              y2={paddingTop + plotHeight}
              stroke="#CBD5E1"
              strokeWidth={1.5}
            />

            {/* X-Axis Tick Marks and Labels: 0h, 4h, 8h, 12h, 16h, 20h, 24h */}
            {xTicks.map((tick) => {
              const tx = getX(tick);
              return (
                <G key={`xaxis_${tick}`}>
                  {/* Tick notch */}
                  <Line
                    x1={tx}
                    y1={paddingTop + plotHeight}
                    x2={tx}
                    y2={paddingTop + plotHeight + 4}
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                  />
                  {/* Tick label */}
                  <SvgText
                    x={tx}
                    y={paddingTop + plotHeight + 17}
                    fontSize={11}
                    fontWeight="700"
                    fill="#64748B"
                    textAnchor="middle"
                  >
                    {tick}h
                  </SvgText>
                </G>
              );
            })}

            {/* Plotted Visible Data Points: exactly aligned at their true hour from registration */}
            {plottedPoints.map((pt, idx) => {
              const isSelected = selectedPointIndex === idx;
              return (
                <G key={pt.id || `pt_${idx}`}>
                  {/* Outer selection ring */}
                  {isSelected && (
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={11}
                      fill="#7D3BFF"
                      opacity={0.25}
                    />
                  )}
                  {/* Visible Point Dot */}
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6.5 : 4.5}
                    fill="#7D3BFF"
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 2.5 : 2}
                  />
                </G>
              );
            })}
          </Svg>

          {/* Interactive touch targets positioned over points for easy tapping */}
          {plottedPoints.map((pt, idx) => (
            <TouchableOpacity
              key={`touch_${pt.id || idx}`}
              style={[
                styles.pointTouchTarget,
                {
                  left: pt.x - 20,
                  top: pt.y - 20,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedPointIndex(idx)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={`Reading ${pt.value.toFixed(1)} mg/dL`}
            />
          ))}

          {/* Empty state overlay when no readings exist */}
          {plottedPoints.length === 0 && (
            <View style={styles.emptyOverlay}>
              <Text style={styles.emptyText}>
                No readings recorded yet for this patient
              </Text>
            </View>
          )}

          {/* Reading Tooltip Popup */}
          {activePoint && (
            <View
              style={[
                styles.tooltipContainer,
                {
                  left: Math.max(
                    4,
                    Math.min(cardWidth - 148, activePoint.x - 72)
                  ),
                  top: Math.max(
                    4,
                    activePoint.y > 65 ? activePoint.y - 74 : activePoint.y + 16
                  ),
                },
              ]}
            >
              <View style={styles.tooltipHeader}>
                <Text style={styles.tooltipValue}>
                  {activePoint.value.toFixed(1)} mg/dL
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedPointIndex(null)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <CloseIcon size={12} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.tooltipMeta}>
                +{activePoint.hour.toFixed(1)}h from Registration • {formatDate(activePoint.timestamp)}, {formatTime(activePoint.timestamp)}
              </Text>
              {!!activePoint.site && (
                <Text style={styles.tooltipSite}>Site: {activePoint.site}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
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
    overflow: 'hidden',
  },
  titleRow: {
    marginBottom: SPACING.xs,
    paddingHorizontal: 4,
  },
  chartTitle: {
    fontSize: fontScale(17),
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chartSubtitle: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  chartBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: SPACING.xs,
  },
  pointTouchTarget: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  emptyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: fontScale(13),
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
  tooltipContainer: {
    position: 'absolute',
    width: 148,
    backgroundColor: '#1E1B4B',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltipValue: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tooltipMeta: {
    fontSize: fontScale(10),
    color: '#C7D2FE',
    marginTop: 2,
    fontWeight: '500',
  },
  tooltipSite: {
    fontSize: fontScale(10),
    color: '#A5B4FC',
    marginTop: 1,
    fontWeight: '600',
  },
});
