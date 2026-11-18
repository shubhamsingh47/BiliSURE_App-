import {
  calculateElapsedHoursFromRegistration,
  computeReadingHour,
  isReadingWithinMaxHours,
  generateBilirubinTrendPaths,
  GraphReading,
} from '../chartTimeline.service';

describe('ChartCard 48-Hour Acute Monitoring with Continuous Elapsed Time', () => {
  it('correctly calculates continuous elapsed hours between registration and reading (User Prompt Example)', () => {
    // Baby registered at 2:00 PM, Reading taken at 4:30 PM -> 2.5 hours
    // Plotted continuously between 0h and 8h ticks
    const registrationTime = '2026-11-17T14:00:00'; // 2:00 PM (17 Nov)
    const readingTime = '2026-11-17T16:30:00'; // 4:30 PM (2.5h later)

    const elapsed = calculateElapsedHoursFromRegistration(registrationTime, readingTime);
    expect(elapsed).toBe(2.5);

    const reading: GraphReading = {
      id: 'test_1',
      value: 11.4,
      timestamp: readingTime,
    };

    const plottedHour = computeReadingHour(reading, registrationTime, 48);
    expect(plottedHour).toBe(2.5);
  });

  it('preserves exact continuous hours across the 48-hour timeline without artificial rounding', () => {
    const registrationTime = '2026-11-17T00:00:00';

    const readings: { hoursLater: number; expectedHour: number }[] = [
      { hoursLater: 0, expectedHour: 0 },
      { hoursLater: 2.5, expectedHour: 2.5 },
      { hoursLater: 7.75, expectedHour: 7.75 },
      { hoursLater: 12.0, expectedHour: 12.0 },
      { hoursLater: 18.5, expectedHour: 18.5 },
      { hoursLater: 24.0, expectedHour: 24.0 },
      { hoursLater: 33.25, expectedHour: 33.25 },
      { hoursLater: 41.5, expectedHour: 41.5 },
      { hoursLater: 48.0, expectedHour: 48.0 },
    ];

    readings.forEach(({ hoursLater, expectedHour }) => {
      const readingTimestamp = new Date(
        new Date(registrationTime).getTime() + hoursLater * 3600 * 1000
      ).toISOString();

      const r: GraphReading = {
        id: `r_${hoursLater}`,
        value: 10 + hoursLater * 0.1,
        timestamp: readingTimestamp,
      };

      expect(computeReadingHour(r, registrationTime, 48)).toBe(expectedHour);
    });
  });

  it('correctly identifies and filters out readings taken beyond 48 hours', () => {
    const registrationTime = '2026-11-17T00:00:00';

    const readingDay1: GraphReading = {
      id: 'r_day1',
      value: 12.0,
      timestamp: new Date(new Date(registrationTime).getTime() + 16 * 3600 * 1000).toISOString(),
    };
    const readingDay2: GraphReading = {
      id: 'r_day2',
      value: 15.0,
      timestamp: new Date(new Date(registrationTime).getTime() + 40 * 3600 * 1000).toISOString(),
    };
    const readingDay4: GraphReading = {
      id: 'r_day4',
      value: 18.0,
      timestamp: new Date(new Date(registrationTime).getTime() + 96 * 3600 * 1000).toISOString(),
    };

    // Day 1 & Day 2 (<= 48h) are included in acute card
    expect(isReadingWithinMaxHours(readingDay1, registrationTime, 48)).toBe(true);
    expect(isReadingWithinMaxHours(readingDay2, registrationTime, 48)).toBe(true);

    // Day 4 (> 48h) is excluded from 48h card (destined for 0-144h Bhutani Nomogram)
    expect(isReadingWithinMaxHours(readingDay4, registrationTime, 48)).toBe(false);
  });

  it('accurately groups co-occurring session readings (Forehead + Sternum) at the same elapsed coordinate', () => {
    const registrationTime = '2026-11-17T14:00:00';
    const readingTime = '2026-11-17T16:30:00'; // 2.5h later

    const readings: GraphReading[] = [
      { id: '1', value: 8.5, timestamp: readingTime, site: 'Forehead' },
      { id: '2', value: 12.5, timestamp: readingTime, site: 'Sternum' },
    ];

    const hours = readings.map((r) => computeReadingHour(r, registrationTime, 48));

    expect(hours[0]).toBe(2.5);
    expect(hours[1]).toBe(2.5);

    const uniqueHours = new Set(hours);
    expect(uniqueHours.size).toBe(1);
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
