import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Path, Line, Circle, Rect, Text as SvgText, G } from 'react-native-svg';
import { BHUTANI_NOMOGRAM_DATA } from '../services/bhutani.service';
import { BilirubinReading } from '../types';
import { COLORS } from '../theme/colors';

interface BhutaniNomogramChartProps {
  readings?: BilirubinReading[];
  activeReading?: BilirubinReading | null;
  gestationalAgeWeeks?: number;
  height?: number;
  compact?: boolean;
  onSelectReading?: (reading: BilirubinReading) => void;
}

export const BhutaniNomogramChart: React.FC<BhutaniNomogramChartProps> = ({
  readings = [],
  activeReading = null,
  gestationalAgeWeeks = 38,
  height = 280,
  compact = false,
  onSelectReading,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const sortedReadings = [...readings].sort(
    (a, b) => (a.postnatalAgeHours || 0) - (b.postnatalAgeHours || 0)
  );

  const [selectedPoint, setSelectedPoint] = useState<BilirubinReading | null>(
    activeReading || (sortedReadings.length > 0 ? sortedReadings[sortedReadings.length - 1] : null)
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);

  // Keep selectedPoint in sync with incoming readings
  useEffect(() => {
    if (sortedReadings.length > 0) {
      setSelectedPoint((prev) => {
        if (!prev) return sortedReadings[sortedReadings.length - 1];
        const match = sortedReadings.find((r) => r.id === prev.id);
        return match || sortedReadings[sortedReadings.length - 1];
      });
    }
  }, [readings.length]);

  // Dynamically scale chart width across any phone/tablet/orientation
  const chartWidth = Math.max(280, Math.min(windowWidth - 48, 560));
  const chartHeight = compact ? 180 : isExpanded ? height : 140;

  const paddingLeft = 36;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 32;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const maxHour = 144; // 6 days
  const maxMgDl = 20; // 0 - 20 mg/dL

  const scaleX = (h: number) => paddingLeft + (Math.max(0, Math.min(maxHour, h)) / maxHour) * plotWidth;
  const scaleY = (v: number) => paddingTop + plotHeight - (Math.max(0, Math.min(maxMgDl, v)) / maxMgDl) * plotHeight;

  // Build SVG path commands for percentile curves
  const buildCurvePath = (key: 'p40' | 'p75' | 'p95') => {
    const points = BHUTANI_NOMOGRAM_DATA.filter((p) => p.hour <= maxHour);
    if (points.length === 0) return '';
    let d = `M ${scaleX(points[0].hour)} ${scaleY(points[0][key])}`;
    for (let i = 1; i < points.length; i++) {
      const x = scaleX(points[i].hour);
      const y = scaleY(points[i][key]);
      d += ` L ${x} ${y}`;
    }
    return d;
  };

  // Build filled zone polygon between two curves or boundaries
  const buildZonePath = (
    bottomCurve: 'zero' | 'p40' | 'p75' | 'p95',
    topCurve: 'p40' | 'p75' | 'p95' | 'top'
  ) => {
    const points = BHUTANI_NOMOGRAM_DATA.filter((p) => p.hour <= maxHour);
    if (points.length === 0) return '';

    let d = '';
    // Forward along top
    for (let i = 0; i < points.length; i++) {
      const x = scaleX(points[i].hour);
      const y = topCurve === 'top' ? scaleY(maxMgDl) : scaleY(points[i][topCurve]);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    // Backward along bottom
    for (let i = points.length - 1; i >= 0; i--) {
      const x = scaleX(points[i].hour);
      const y = bottomCurve === 'zero' ? scaleY(0) : scaleY(points[i][bottomCurve]);
      d += ` L ${x} ${y}`;
    }
    d += ' Z';
    return d;
  };

  const p95Path = buildCurvePath('p95');
  const p75Path = buildCurvePath('p75');
  const p40Path = buildCurvePath('p40');

  // Trajectory path for serial readings across advancing hours
  // Deduplicate points with identical postnatal hours to prevent vertical zig-zag spikes
  const trajectoryPoints: BilirubinReading[] = [];
  sortedReadings.forEach((r) => {
    const last = trajectoryPoints[trajectoryPoints.length - 1];
    if (last && Math.abs((r.postnatalAgeHours || 0) - (last.postnatalAgeHours || 0)) < 0.25) {
      // If at same hour, track latest reading at that time anchor
      trajectoryPoints[trajectoryPoints.length - 1] = r;
    } else {
      trajectoryPoints.push(r);
    }
  });

  let trajectoryPath = '';
  if (trajectoryPoints.length > 1) {
    trajectoryPath = `M ${scaleX(trajectoryPoints[0].postnatalAgeHours || 0)} ${scaleY(trajectoryPoints[0].value || 0)}`;
    for (let i = 1; i < trajectoryPoints.length; i++) {
      trajectoryPath += ` L ${scaleX(trajectoryPoints[i].postnatalAgeHours || 0)} ${scaleY(trajectoryPoints[i].value || 0)}`;
    }
  }

  // Preterm warning
  const isPreterm = gestationalAgeWeeks < 35;

  return (
    <View style={styles.container}>
      {/* Header bar with title and expand/collapse */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.chartTitle}>Bhutani Bilirubin Risk Nomogram</Text>
          <Text style={styles.chartSubtitle}>Hour-Specific Bilirubin Risk Stratification (0–144h)</Text>
        </View>
        {!compact && (
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.expandToggle}>
            <Text style={styles.expandToggleText}>{isExpanded ? 'Collapse' : 'Expand'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Preterm Banner Alert if applicable */}
      {isPreterm && (
        <View style={styles.pretermBanner}>
          <Text style={styles.pretermBannerText}>
            ⚠️ Preterm Alert ({gestationalAgeWeeks}w): Standard Bhutani curve validated for ≥35w. Use gestational-specific charts for threshold decisions.
          </Text>
        </View>
      )}

      {/* Main SVG Chart Area */}
      <View style={styles.svgWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Background Risk Zone Shading with distinct clinical tints */}
          <Path d={buildZonePath('p95', 'top')} fill="#FEE2E2" opacity={0.85} />
          <Path d={buildZonePath('p75', 'p95')} fill="#FFEDD5" opacity={0.85} />
          <Path d={buildZonePath('p40', 'p75')} fill="#FEF9C3" opacity={0.85} />
          <Path d={buildZonePath('zero', 'p40')} fill="#DCFCE7" opacity={0.85} />

          {/* Grid lines: X-axis (Hours: 24, 48, 72, 96, 120, 144) */}
          {[24, 48, 72, 96, 120, 144].map((h) => (
            <Line
              key={`grid-x-${h}`}
              x1={scaleX(h)}
              y1={paddingTop}
              x2={scaleX(h)}
              y2={paddingTop + plotHeight}
              stroke="#CBD5E1"
              strokeDasharray="2,2"
              strokeWidth={0.8}
            />
          ))}

          {/* Grid lines: Y-axis (mg/dL: 5, 10, 15, 20) */}
          {[5, 10, 15, 20].map((v) => (
            <Line
              key={`grid-y-${v}`}
              x1={paddingLeft}
              y1={scaleY(v)}
              x2={paddingLeft + plotWidth}
              y2={scaleY(v)}
              stroke="#CBD5E1"
              strokeDasharray="2,2"
              strokeWidth={0.8}
            />
          ))}

          {/* Percentile Curves */}
          <Path d={p95Path} stroke="#E11D48" strokeWidth={1.8} fill="none" strokeDasharray="4,2" />
          <Path d={p75Path} stroke="#D97706" strokeWidth={1.8} fill="none" />
          <Path d={p40Path} stroke="#059669" strokeWidth={1.8} fill="none" />

          {/* Percentile Curve End Labels */}
          {isExpanded && (
            <G>
              <SvgText x={scaleX(138)} y={scaleY(18.6) - 4} fontSize={9} fill="#E11D48" fontWeight="bold">
                95th
              </SvgText>
              <SvgText x={scaleX(138)} y={scaleY(16.5) - 4} fontSize={9} fill="#D97706" fontWeight="bold">
                75th
              </SvgText>
              <SvgText x={scaleX(138)} y={scaleY(13.6) - 4} fontSize={9} fill="#059669" fontWeight="bold">
                40th
              </SvgText>
            </G>
          )}

          {/* Trajectory line for multiple readings - clean, sleek 1.5px stroke */}
          {trajectoryPath.length > 0 && (
            <Path d={trajectoryPath} stroke="#7D3BFF" strokeWidth={1.5} opacity={0.85} fill="none" />
          )}

          {/* Plotted Patient Readings */}
          {sortedReadings.map((reading, idx) => {
            const cx = scaleX(reading.postnatalAgeHours || 0);
            const cy = scaleY(reading.value || 0);
            const isSelected = selectedPoint && (selectedPoint.id === reading.id || selectedPoint.clientOperationId === reading.clientOperationId);
            const isLatest = idx === sortedReadings.length - 1;

            return (
              <G
                key={`point-${reading.id || idx}`}
                onPress={() => {
                  setSelectedPoint(reading);
                  onSelectReading?.(reading);
                }}
              >
                {/* Invisible touch target for mobile fingertips */}
                <Circle cx={cx} cy={cy} r={14} fill="transparent" />

                {/* Subtle glow ring around latest / selected reading */}
                {(isSelected || isLatest) && (
                  <Circle cx={cx} cy={cy} r={9} fill="#7D3BFF" opacity={0.2} />
                )}

                {/* Differentiated symbols: Pre (circle), During (diamond/rect), Post (square) */}
                {reading.phototherapyPhase === 'during_phototherapy' ? (
                  <Rect
                    x={cx - 4}
                    y={cy - 4}
                    width={8}
                    height={8}
                    fill="#3B82F6"
                    stroke="#FFFFFF"
                    strokeWidth={1.2}
                    transform={`rotate(45, ${cx}, ${cy})`}
                  />
                ) : reading.phototherapyPhase === 'post_phototherapy' ? (
                  <Rect
                    x={cx - 4}
                    y={cy - 4}
                    width={8}
                    height={8}
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth={1.2}
                  />
                ) : (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={4.5}
                    fill={isSelected ? '#7D3BFF' : '#5B21B6'}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                )}
              </G>
            );
          })}

          {/* Axes Lines */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + plotHeight}
            x2={paddingLeft + plotWidth}
            y2={paddingTop + plotHeight}
            stroke="#94A3B8"
            strokeWidth={1.5}
          />
          <Line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + plotHeight}
            stroke="#94A3B8"
            strokeWidth={1.5}
          />

          {/* X-axis tick labels */}
          {[24, 48, 72, 96, 120, 144].map((h) => (
            <SvgText
              key={`label-x-${h}`}
              x={scaleX(h)}
              y={paddingTop + plotHeight + 14}
              fontSize={9}
              fill="#64748B"
              textAnchor="middle"
            >
              {h}h
            </SvgText>
          ))}

          {/* Y-axis tick labels */}
          {[0, 5, 10, 15, 20].map((v) => (
            <SvgText
              key={`label-y-${v}`}
              x={paddingLeft - 6}
              y={scaleY(v) + 3}
              fontSize={9}
              fill="#64748B"
              textAnchor="end"
            >
              {v}
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* Axis Unit Labels */}
      <View style={styles.axisLabelsRow}>
        <Text style={styles.axisUnit}>mg/dL</Text>
        <Text style={styles.axisUnit}>Postnatal Age (Hours)</Text>
      </View>

      {/* Zone Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#E11D48' }]} />
          <Text style={styles.legendText}>High Risk (&gt;95th)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#D97706' }]} />
          <Text style={styles.legendText}>High-Int (75-95th)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#84CC16' }]} />
          <Text style={styles.legendText}>Low-Int (40-75th)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#059669' }]} />
          <Text style={styles.legendText}>Low (&lt;40th)</Text>
        </View>
      </View>

      {/* Mandatory Clinical Disclaimer */}
      <Text style={styles.disclaimerText}>
        * The Bhutani Nomogram is a predischarge risk-prediction model, not a phototherapy treatment threshold. Clinicians must verify gestational age and neurotoxicity risk factors.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181829',
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  expandToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
  },
  expandToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7D3BFF',
  },
  pretermBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  pretermBannerText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  axisLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  axisUnit: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 4,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  disclaimerText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 13,
  },
});
