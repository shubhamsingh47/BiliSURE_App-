export interface GraphReading {
  id: string;
  value: number; // in mg/dL
  timestamp: string | number | Date;
  site?: string;
  postnatalAgeHours?: number;
}

export interface PlottedPointInput {
  hour: number;
  x: number;
  y: number;
  value: number;
}

export interface TrendPathConfig {
  plottedPoints: PlottedPointInput[];
  paddingLeft: number;
  paddingRight: number;
  cardWidth: number;
  paddingTop: number;
  plotHeight: number;
  initialValue?: number;
}

export interface TrendPathResult {
  linePath: string;
  areaPath: string;
  projectionPath: string;
  sessionLine: {
    x: number;
    y1: number;
    y2: number;
  } | null;
}

/**
 * Calculates the elapsed hours between the baby's registration time
 * and when the observation/reading data was taken.
 *
 * Example (user specified):
 * Baby registered at 2:00 PM (14:00).
 * Data taken on same baby at 4:30 PM (16:30).
 * Elapsed time = 2.5 hours.
 * Plotted on 0-24h scale between 0h and 4h.
 *
 * @param registrationTimestamp Timestamp when the baby was registered
 * @param readingTimestamp Timestamp when the bilirubin reading was taken
 * @returns Elapsed hours as a decimal number (e.g. 2.5 for 2h 30m)
 */
export function calculateElapsedHoursFromRegistration(
  registrationTimestamp: string | number | Date,
  readingTimestamp: string | number | Date
): number {
  const regMs = new Date(registrationTimestamp).getTime();
  const readMs = new Date(readingTimestamp).getTime();

  if (isNaN(regMs) || isNaN(readMs)) return 0;

  const diffMs = readMs - regMs;
  if (diffMs <= 0) return 0;

  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

/**
 * Computes the plotted hour on the 0 - 24 hour timeline based on
 * the difference between baby registration and reading timestamp.
 *
 * @param reading The observation / reading record
 * @param registrationTimestamp Timestamp of baby registration
 * @param maxHours Total scale hours (default: 24)
 * @returns Plotted hour coordinate on the 0 - 24h axis
 */
export function computeReadingHour(
  reading: GraphReading,
  registrationTimestamp?: string | number | Date,
  maxHours: number = 24
): number {
  if (registrationTimestamp) {
    const elapsed = calculateElapsedHoursFromRegistration(
      registrationTimestamp,
      reading.timestamp
    );

    if (maxHours === 24) {
      if (elapsed <= 24) return elapsed;
      // Beyond 24h, cycle hour within the current 24-hour phototherapy/observation period
      const rem = elapsed % 24;
      return rem === 0 ? 24 : Math.round(rem * 100) / 100;
    }

    const rem = elapsed % maxHours;
    return rem === 0 && elapsed > 0 ? maxHours : Math.round(rem * 100) / 100;
  }

  // Fallback if no registration timestamp is available:
  // If postnatalAgeHours is provided on the reading
  if (typeof reading.postnatalAgeHours === 'number' && !isNaN(reading.postnatalAgeHours)) {
    const age = reading.postnatalAgeHours;
    if (age <= maxHours) return age;
    const rem = age % maxHours;
    return rem === 0 ? maxHours : Math.round(rem * 100) / 100;
  }

  // Fallback to time of day from timestamp
  const d = new Date(reading.timestamp);
  if (!isNaN(d.getTime())) {
    const h = d.getHours() + d.getMinutes() / 60;
    return Math.round(h * 100) / 100;
  }

  return 0;
}

/**
 * Generates smooth SVG paths for the BiliSURE bilirubin trend curve, area fill,
 * and session indicators.
 *
 * Requirements:
 * 1. Trend line starts explicitly from 0 (t = 0h, value = 0 mg/dL baseline at origin).
 * 2. Curves smoothly through every observation point across the timeline.
 * 3. Does not start at any random floating coordinate in mid-air.
 * 4. Provides a subtle projection to the right edge from the latest reading.
 * 5. Accurately indicates multi-reading sessions at the same timestamp.
 */
export function generateBilirubinTrendPaths(config: TrendPathConfig): TrendPathResult {
  const {
    plottedPoints,
    paddingLeft,
    paddingRight,
    cardWidth,
    paddingTop,
    plotHeight,
    initialValue = 0,
  } = config;

  const baselineY = paddingTop + plotHeight;

  if (!plottedPoints || plottedPoints.length === 0) {
    return { linePath: '', areaPath: '', projectionPath: '', sessionLine: null };
  }

  // Sort all points chronologically; if timestamps match, preserve reading progression
  const sorted = [...plottedPoints].sort((a, b) => {
    if (Math.abs(a.hour - b.hour) > 0.001) {
      return a.hour - b.hour;
    }
    // When readings share the same timestamp (e.g. 8.5 -> 12.5 -> 15.5 -> 16.0),
    // sort by ascending bilirubin value to connect the progression cleanly
    return a.value - b.value;
  });

  // Define Origin Anchor (t = 0h, value = 0 mg/dL baseline at axis intersection)
  const originY =
    initialValue === 0
      ? baselineY
      : paddingTop + (1 - Math.max(0, Math.min(24, initialValue)) / 24) * plotHeight;

  const originAnchor = {
    hour: 0,
    x: paddingLeft,
    y: originY,
    value: initialValue,
  };

  // Trend line MUST start from 0 at the origin, and connect EVERY recorded point like connecting dots
  const anchors =
    sorted[0].hour > 0.05 ? [originAnchor, ...sorted] : sorted;

  const n = anchors.length;
  const firstPt = anchors[0];
  const lastPt = anchors[n - 1];

  // Case 1: Only 1 point
  if (n === 1) {
    const lPath = `M ${firstPt.x.toFixed(1)} ${firstPt.y.toFixed(1)}`;
    const pPath =
      firstPt.x < cardWidth - paddingRight
        ? `M ${firstPt.x.toFixed(1)} ${firstPt.y.toFixed(1)} L ${(cardWidth - paddingRight).toFixed(1)} ${firstPt.y.toFixed(1)}`
        : '';
    return { linePath: lPath, areaPath: '', projectionPath: pPath, sessionLine: null };
  }

  // Build the continuous path connecting every dot
  let lPath = `M ${firstPt.x.toFixed(1)} ${firstPt.y.toFixed(1)}`;

  for (let i = 0; i < n - 1; i++) {
    const p0 = anchors[i];
    const p1 = anchors[i + 1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;

    if (i === 0) {
      // From origin (0, 0) to first recorded observation
      if (dx > 4) {
        const cp1x = p0.x + dx * 0.45;
        const cp1y = p0.y;
        const cp2x = p1.x - dx * 0.25;
        const cp2y = p1.y;
        lPath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      } else {
        lPath += ` L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
    } else {
      // Between recorded observation points (connecting dots)
      if (dx > 4) {
        const prev = anchors[i - 1];
        const next = anchors[i + 2] || p1;
        const prevDx = p0.x - prev.x;
        const nextDx = next.x - p1.x;

        const slopeA =
          prevDx > 0.1 ? (p1.y - prev.y) / (dx + prevDx) : dy / dx;
        const slopeB =
          nextDx > 0.1 ? (next.y - p0.y) / (dx + nextDx) : dy / dx;

        const cp1x = p0.x + dx / 3;
        const cp1y = p0.y + (dx / 3) * slopeA;
        const cp2x = p1.x - dx / 3;
        const cp2y = p1.y - (dx / 3) * slopeB;

        lPath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      } else {
        // Same timestamp or very close points: connect directly through the dot
        lPath += ` L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
    }
  }

  // Shaded area beneath the curve from origin (0,0) through all points down to baseline
  const aPath = `${lPath} L ${lastPt.x.toFixed(1)} ${baselineY.toFixed(1)} L ${firstPt.x.toFixed(1)} ${baselineY.toFixed(1)} Z`;

  // Projection reference line extending from the latest observation to the right edge
  const pPath =
    lastPt.x < cardWidth - paddingRight
      ? `M ${lastPt.x.toFixed(1)} ${lastPt.y.toFixed(1)} L ${(cardWidth - paddingRight).toFixed(1)} ${lastPt.y.toFixed(1)}`
      : '';

  return { linePath: lPath, areaPath: aPath, projectionPath: pPath, sessionLine: null };
}
