import {
  calculateElapsedHoursFromRegistration,
  computeReadingHour,
  generateBilirubinTrendPaths,
  GraphReading,
} from '../chartTimeline.service';

describe('ChartCard 24-Hour Time Distribution Mechanism from Registration', () => {
  it('correctly calculates 2.5 hours when baby registered at 2:00 PM and data taken at 4:30 PM (User Example)', () => {
    // Exactly reproducing the user's explicit prompt example:
    // "baby registered on 2 pm and if data is taken on same baby on 4:30 pm - its 2.30hrs - so it should plot that point between 0h and 4h"
    const registrationTime = '2026-11-17T14:00:00'; // 2:00 PM
    const readingTime = '2026-11-17T16:30:00'; // 4:30 PM

    const elapsed = calculateElapsedHoursFromRegistration(registrationTime, readingTime);
    expect(elapsed).toBe(2.5);

    const reading: GraphReading = {
      id: 'test_1',
      value: 11.4,
      timestamp: readingTime,
    };

    const plottedHour = computeReadingHour(reading, registrationTime, 24);
    expect(plottedHour).toBe(2.5);

    // Verify it is strictly between 0h and 4h
    expect(plottedHour).toBeGreaterThan(0);
    expect(plottedHour).toBeLessThan(4);
  });

  it('correctly plots multiple readings added at the exact same timestamp at the exact same hour coordinate', () => {
    // 4 readings added at 4:30 PM for a baby registered at 2:00 PM
    const registrationTime = '2026-11-17T14:00:00';
    const readingTime = '2026-11-17T16:30:00';

    const readings: GraphReading[] = [
      { id: '1', value: 8.5, timestamp: readingTime, site: 'Forehead' },
      { id: '2', value: 12.5, timestamp: readingTime, site: 'Sternum' },
      { id: '3', value: 15.5, timestamp: readingTime, site: 'Forehead' },
      { id: '4', value: 16.0, timestamp: readingTime, site: 'Sternum' },
    ];

    const hours = readings.map((r) => computeReadingHour(r, registrationTime, 24));

    // All 4 readings must have the exact same hour coordinate (2.5h)
    expect(hours[0]).toBe(2.5);
    expect(hours[1]).toBe(2.5);
    expect(hours[2]).toBe(2.5);
    expect(hours[3]).toBe(2.5);

    // ZERO artificial horizontal distribution
    const uniqueHours = new Set(hours);
    expect(uniqueHours.size).toBe(1);
  });

  it('plots baseline reading taken at registration time at exactly 0h', () => {
    const registrationTime = '2026-11-17T14:00:00';
    const readingTime = '2026-11-17T14:00:00';

    const reading: GraphReading = {
      id: 'r_base',
      value: 6.2,
      timestamp: readingTime,
    };

    expect(computeReadingHour(reading, registrationTime, 24)).toBe(0);
  });

  it('plots reading taken 8 hours after registration at exactly 8h', () => {
    const registrationTime = '2026-11-17T14:00:00';
    const readingTime = '2026-11-17T22:00:00'; // 10:00 PM

    const reading: GraphReading = {
      id: 'r_8h',
      value: 14.0,
      timestamp: readingTime,
    };

    expect(computeReadingHour(reading, registrationTime, 24)).toBe(8);
  });
});

describe('ChartCard Trend Spline Origin and Smooth Curve Generation', () => {
  const baseConfig = {
    paddingLeft: 24,
    paddingRight: 24,
    cardWidth: 320,
    paddingTop: 16,
    plotHeight: 129,
    initialValue: 0,
  };

  it('guarantees trend curve starts from 0 (baseline origin) instead of floating at reading value', () => {
    // Reading taken at 2.5h with value 16.0 mg/dL
    // Baseline Y for 0 mg/dL is paddingTop (16) + plotHeight (129) = 145
    // Reading Y for 16.0 mg/dL is 16 + (1 - 16/24) * 129 = 16 + 43 = 59
    const plottedPoint = {
      hour: 2.5,
      x: 24 + (2.5 / 24) * (320 - 48), // ~52.33
      y: 59,
      value: 16.0,
    };

    const result = generateBilirubinTrendPaths({
      ...baseConfig,
      plottedPoints: [plottedPoint],
    });

    // 1. Line MUST start at origin (t = 0h, value = 0 mg/dL at paddingLeft, baselineY)
    expect(result.linePath).toMatch(/^M 24\.0 145\.0/);

    // 2. Line must NOT start floating at 59.0 (the reading value)
    expect(result.linePath).not.toMatch(/^M 24\.0 59\.0/);

    // 3. Line must curve smoothly up to the point (52.3, 59.0)
    expect(result.linePath).toContain('C ');
    expect(result.linePath).toContain('59.0');

    // 4. Area path must fill down to baseline (145.0)
    expect(result.areaPath).toContain('145.0 Z');

    // 5. Projection path continues from point to right edge
    expect(result.projectionPath).toMatch(/^M \d+\.\d+ 59\.0 L 296\.0 59\.0/);
  });

  it('connects through each and every point (8.5, 12.5, 15.5, 16.0) like connecting dots rather than skipping to the top point', () => {
    const xCoord = 24 + (2.5 / 24) * (320 - 48); // 52.33
    const plottedPoints = [
      { hour: 2.5, x: xCoord, y: 99.4, value: 8.5 },
      { hour: 2.5, x: xCoord, y: 77.9, value: 12.5 },
      { hour: 2.5, x: xCoord, y: 61.8, value: 15.5 },
      { hour: 2.5, x: xCoord, y: 59.0, value: 16.0 },
    ];

    const result = generateBilirubinTrendPaths({
      ...baseConfig,
      plottedPoints,
    });

    // 1. Trend line starts from 0 at origin
    expect(result.linePath).toMatch(/^M 24\.0 145\.0/);

    // 2. Trend line visits EVERY point sequentially: 8.5 -> 12.5 -> 15.5 -> 16.0
    expect(result.linePath).toContain('99.4'); // visits 8.5 mg/dL
    expect(result.linePath).toContain('77.9'); // visits 12.5 mg/dL
    expect(result.linePath).toContain('61.8'); // visits 15.5 mg/dL
    expect(result.linePath).toContain('59.0'); // visits 16.0 mg/dL

    // 3. Shaded area beneath all connected dots down to baseline
    expect(result.areaPath).toContain('145.0 Z');
  });

  it('generates a smooth continuous PCHIP spline starting from 0 for multiple readings across time', () => {
    const plottedPoints = [
      { hour: 2.5, x: 52.3, y: 77.9, value: 12.5 },
      { hour: 6.0, x: 92.0, y: 61.8, value: 15.5 },
      { hour: 12.0, x: 160.0, y: 45.0, value: 18.6 },
    ];

    const result = generateBilirubinTrendPaths({
      ...baseConfig,
      plottedPoints,
    });

    // Starts at origin
    expect(result.linePath).toMatch(/^M 24\.0 145\.0/);

    // Smoothly traverses all 3 anchors
    expect(result.linePath).toContain('77.9');
    expect(result.linePath).toContain('61.8');
    expect(result.linePath).toContain('45.0');

    // Area fill returns to baseline
    expect(result.areaPath).toContain('145.0 Z');
  });

  it('returns empty paths when no readings are present', () => {
    const result = generateBilirubinTrendPaths({
      ...baseConfig,
      plottedPoints: [],
    });

    expect(result.linePath).toBe('');
    expect(result.areaPath).toBe('');
    expect(result.projectionPath).toBe('');
    expect(result.sessionLine).toBeNull();
  });
});
