import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, G } from 'react-native-svg';
import { X as CloseIcon } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface GraphReading {
  id: string;
  value: number; // in mg/dL
  timestamp: string | number | Date;
  site?: string;
}

interface ChartCardProps {
  initialValue?: number;
  dischargeValue?: number;
  readings?: GraphReading[];
  points?: number[]; // fallback
  onRangeChange?: (range: string) => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  readings,
  points,
  onRangeChange,
}) => {
  const [selectedRange, setSelectedRange] = useState<'1hr' | '8hr' | '16hr' | '24hr'>('24hr');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 72);

  const ranges: ('1hr' | '8hr' | '16hr' | '24hr')[] = ['1hr', '8hr', '16hr', '24hr'];

  const handleSelectRange = (r: '1hr' | '8hr' | '16hr' | '24hr') => {
    setSelectedRange(r);
    setSelectedPointIndex(null);
    onRangeChange?.(r);
  };

  // Fixed internal Y-axis scale: 0 to 24 with intervals of 4
  // 0, 4, 8, 12, 16, 20, 24
  // NOTE: These values are strictly internal and never rendered as text numbers.
  const Y_MIN = 0;
  const Y_MAX = 24;
  const Y_GRID_INTERVALS = [0, 4, 8, 12, 16, 20, 24];

  const cardWidth = containerWidth > 0 ? containerWidth : SCREEN_WIDTH - 72;
  const chartHeight = 160;
  const paddingTop = 18;
  const paddingBottom = 18;
  const paddingLeft = 14;
  const paddingRight = 14;
  const plotWidth = Math.max(10, cardWidth - paddingLeft - paddingRight);
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Normalized list of actual readings sorted ascending by timestamp
  const sortedReadings: GraphReading[] = useMemo(() => {
    if (readings && readings.length > 0) {
      return [...readings].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }
    // Fallback if only points were passed
    if (points && points.length > 0) {
      const now = Date.now();
      const intervalMs = (4 * 3600 * 1000) / Math.max(1, points.length - 1);
      return points.map((val, idx) => ({
        id: `point_${idx}`,
        value: val,
        timestamp: new Date(now - (points.length - 1 - idx) * intervalMs).toISOString(),
        site: 'Forehead',
      }));
    }
    return [];
  }, [readings, points]);

  // Window calculation in milliseconds
  const windowMs = useMemo(() => {
    switch (selectedRange) {
      case '1hr':
        return 1 * 60 * 60 * 1000;
      case '8hr':
        return 8 * 60 * 60 * 1000;
      case '16hr':
        return 16 * 60 * 60 * 1000;
      case '24hr':
      default:
        return 24 * 60 * 60 * 1000;
    }
  }, [selectedRange]);

  // Filter actual readings within the selected window relative to the latest record
  const { filteredReadings, windowStart, windowEnd } = useMemo(() => {
    if (sortedReadings.length === 0) {
      const now = Date.now();
      return { filteredReadings: [], windowStart: now - windowMs, windowEnd: now };
    }

    const latestMs = new Date(
      sortedReadings[sortedReadings.length - 1].timestamp
    ).getTime();
    const now = Date.now();

    // If latest reading was taken within the last window, anchor to now, otherwise anchor to latest reading
    const anchorMs = now - latestMs < windowMs ? now : latestMs;
    const startMs = anchorMs - windowMs;

    const filtered = sortedReadings.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= startMs && t <= anchorMs + 1000;
    });

    return { filteredReadings: filtered, windowStart: startMs, windowEnd: anchorMs };
  }, [sortedReadings, windowMs]);

  // Map value (0-24) to Y coordinate (clamped so readings > 24 don't draw outside top)
  const getY = (val: number) => {
    const clamped = Math.max(Y_MIN, Math.min(Y_MAX, val));
    return paddingTop + (1 - clamped / Y_MAX) * plotHeight;
  };

  // Precompute plotted points dynamically spanning the card space logically
  const plottedPoints = useMemo(() => {
    const total = filteredReadings.length;
    if (total === 0) return [];

    if (total === 1) {
      const r = filteredReadings[0];
      return [{ ...r, x: cardWidth / 2, y: getY(r.value) }];
    }

    const tFirst = new Date(filteredReadings[0].timestamp).getTime();
    const tLast = new Date(filteredReadings[total - 1].timestamp).getTime();
    const timeSpan = tLast - tFirst;

    return filteredReadings.map((r, i) => {
      let ratio = i / (total - 1);
      if (timeSpan > 0) {
        const t = new Date(r.timestamp).getTime();
        ratio = (t - tFirst) / timeSpan;
      }
      const x = paddingLeft + ratio * (cardWidth - paddingLeft - paddingRight);
      const y = getY(r.value);
      return { ...r, x, y };
    });
  }, [filteredReadings, cardWidth, plotHeight, paddingLeft, paddingRight, paddingTop]);

  // Build SVG path: Monotone cubic spline (PCHIP / Fritsch-Carlson)
  // Subtle, gently curved line passing through actual readings with no artificial peaks/overshoots
  const { linePath, areaPath } = useMemo(() => {
    const baselineY = (paddingTop + plotHeight).toFixed(1);

    if (plottedPoints.length === 0) {
      return { linePath: '', areaPath: '' };
    }

    if (plottedPoints.length === 1) {
      const ptY = plottedPoints[0].y.toFixed(1);
      const lPath = `M 0 ${ptY} L ${cardWidth.toFixed(1)} ${ptY}`;
      const aPath = `${lPath} L ${cardWidth.toFixed(1)} ${baselineY} L 0 ${baselineY} Z`;
      return { linePath: lPath, areaPath: aPath };
    }

    const n = plottedPoints.length;
    const firstPt = plottedPoints[0];
    const lastPt = plottedPoints[n - 1];

    if (n === 2) {
      // Gentle, subtle curve between 2 points
      const p0 = plottedPoints[0];
      const p1 = plottedPoints[1];
      const dx = p1.x - p0.x;
      const cp1x = p0.x + dx / 3;
      const cp1y = p0.y;
      const cp2x = p1.x - dx / 3;
      const cp2y = p1.y;

      let lPath = `M 0 ${p0.y.toFixed(1)} L ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}`;
      lPath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      lPath += ` L ${cardWidth.toFixed(1)} ${p1.y.toFixed(1)}`;

      const aPath = `${lPath} L ${cardWidth.toFixed(1)} ${baselineY} L 0 ${baselineY} Z`;
      return { linePath: lPath, areaPath: aPath };
    }

    // Monotone cubic Hermite spline interpolation (PCHIP / Fritsch-Carlson)
    const dxs: number[] = [];
    const deltas: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = plottedPoints[i + 1].x - plottedPoints[i].x;
      const dy = plottedPoints[i + 1].y - plottedPoints[i].y;
      dxs.push(dx);
      deltas.push(dx > 0.001 ? dy / dx : 0);
    }

    const tangents: number[] = new Array(n).fill(0);
    tangents[0] = deltas[0];
    tangents[n - 1] = deltas[n - 2];

    for (let i = 1; i < n - 1; i++) {
      if (deltas[i - 1] * deltas[i] <= 0) {
        tangents[i] = 0; // Local extremum: derivative is zero, no artificial overshoot
      } else {
        tangents[i] = (2 * deltas[i - 1] * deltas[i]) / (deltas[i - 1] + deltas[i]);
      }
    }

    // Fritsch-Carlson monotonicity check & adjustment
    for (let i = 0; i < n - 1; i++) {
      const delta = deltas[i];
      if (Math.abs(delta) < 0.00001) {
        tangents[i] = 0;
        tangents[i + 1] = 0;
      } else {
        const alpha = tangents[i] / delta;
        const beta = tangents[i + 1] / delta;
        const dist = Math.hypot(alpha, beta);
        if (dist > 3) {
          const tau = 3 / dist;
          tangents[i] = tau * alpha * delta;
          tangents[i + 1] = tau * beta * delta;
        }
      }
    }

    // Connect from left edge to first point
    let lPath = `M 0 ${firstPt.y.toFixed(1)} L ${firstPt.x.toFixed(1)} ${firstPt.y.toFixed(1)}`;

    for (let i = 0; i < n - 1; i++) {
      const p0 = plottedPoints[i];
      const p1 = plottedPoints[i + 1];
      const h = dxs[i];

      if (h < 0.001) {
        lPath += ` L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
        continue;
      }

      const cp1x = p0.x + h / 3;
      const cp1y = p0.y + (h / 3) * tangents[i];
      const cp2x = p1.x - h / 3;
      const cp2y = p1.y - (h / 3) * tangents[i + 1];

      lPath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    // Connect from last point to right edge
    lPath += ` L ${cardWidth.toFixed(1)} ${lastPt.y.toFixed(1)}`;

    const aPath = `${lPath} L ${cardWidth.toFixed(1)} ${baselineY} L 0 ${baselineY} Z`;

    return { linePath: lPath, areaPath: aPath };
  }, [plottedPoints, cardWidth, paddingTop, plotHeight]);

  const activePoint =
    selectedPointIndex !== null && plottedPoints[selectedPointIndex]
      ? plottedPoints[selectedPointIndex]
      : null;

  const formatDate = (ts: string | number | Date) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (ts: string | number | Date) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>BiliSURE Bilirubin Readings</Text>

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

            {/* Internal Horizontal Grid Lines corresponding to 0, 4, 8, 12, 16, 20, 24 mg/dL */}
            {Y_GRID_INTERVALS.map((gridVal) => {
              const gy = getY(gridVal);
              return (
                <Line
                  key={`grid_${gridVal}`}
                  x1={paddingLeft}
                  y1={gy}
                  x2={cardWidth - paddingRight}
                  y2={gy}
                  stroke={gridVal === 0 ? '#E2E8F0' : '#F1F5F9'}
                  strokeDasharray={gridVal === 0 ? undefined : '4 4'}
                  strokeWidth={1}
                />
              );
            })}

            {/* Subtle Gradient Area Fill beneath gently curved trend line */}
            {areaPath.length > 0 && <Path d={areaPath} fill="url(#purpleAreaGradient)" />}

            {/* Gently Curved Trend Line passing through actual readings */}
            {linePath.length > 0 && (
              <Path
                d={linePath}
                fill="none"
                stroke="#7D3BFF"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Plotted Visible Data Points */}
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

          {/* Empty state overlay when no readings fall in selected time window */}
          {plottedPoints.length === 0 && (
            <View style={styles.emptyOverlay}>
              <Text style={styles.emptyText}>
                No readings recorded in the last {selectedRange}
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
                    Math.min(cardWidth - 144, activePoint.x - 70)
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
                {formatDate(activePoint.timestamp)} • {formatTime(activePoint.timestamp)}
              </Text>
              {!!activePoint.site && (
                <Text style={styles.tooltipSite}>Site: {activePoint.site}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Time Window Filters (1hr, 8hr, 16hr, 24hr) */}
      <View style={styles.filterRow}>
        {ranges.map((r) => {
          const isActive = selectedRange === r;
          return (
            <TouchableOpacity
              key={r}
              activeOpacity={0.75}
              onPress={() => handleSelectRange(r)}
              style={[styles.rangePill, isActive && styles.rangePillActive]}
            >
              <Text style={[styles.rangeText, isActive && styles.rangeTextActive]}>
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
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  chartBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
  tooltipContainer: {
    position: 'absolute',
    width: 140,
    backgroundColor: '#1E1B4B', // rich dark purple tooltip
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
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tooltipMeta: {
    fontSize: 10,
    color: '#C7D2FE',
    marginTop: 2,
    fontWeight: '500',
  },
  tooltipSite: {
    fontSize: 10,
    color: '#A5B4FC',
    marginTop: 1,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 6,
  },
  rangePill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  rangePillActive: {
    backgroundColor: '#FEF3C7', // soft active amber pill matching BiliSURE theme
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
