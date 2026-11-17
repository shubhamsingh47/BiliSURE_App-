import {
  calculatePostnatalAgeHours,
  binPostnatalAge12h,
  evaluateBhutaniRisk,
  mgDlToUmolL,
  umolLToMgDl,
  getPercentilesAtHour,
} from '../bhutani.service';

describe('Bhutani Bilirubin Risk Nomogram Service', () => {
  describe('Postnatal Age Calculations', () => {
    it('calculates exact age in hours using birth date and time', () => {
      const dob = '2026-11-14';
      const exactTime = '08:00';
      const sampleTime = '2026-11-16T02:30:00';
      const hours = calculatePostnatalAgeHours(dob, exactTime, sampleTime);
      expect(hours).toBeCloseTo(42.5, 1);
    });

    it('returns 0 for negative time differences', () => {
      const dob = '2026-11-16';
      const exactTime = '12:00';
      const sampleTime = '2026-11-15T12:00:00';
      const hours = calculatePostnatalAgeHours(dob, exactTime, sampleTime);
      expect(hours).toBe(0);
    });

    it('automatically bins postnatal age into 12-hour intervals according to clinical rule', () => {
      // 0 to <= 12 -> 12h
      expect(binPostnatalAge12h(0)).toBe(12);
      expect(binPostnatalAge12h(4)).toBe(12);
      expect(binPostnatalAge12h(12)).toBe(12);

      // 12 to <= 24 -> 24h
      expect(binPostnatalAge12h(12.1)).toBe(24);
      expect(binPostnatalAge12h(18)).toBe(24);
      expect(binPostnatalAge12h(24)).toBe(24);

      // 24 to <= 36 -> 36h
      expect(binPostnatalAge12h(25)).toBe(36);
      expect(binPostnatalAge12h(36)).toBe(36);

      // 36 to <= 48 -> 48h
      expect(binPostnatalAge12h(37)).toBe(48);
      expect(binPostnatalAge12h(48)).toBe(48);

      // 48 to <= 60 -> 60h
      expect(binPostnatalAge12h(49)).toBe(60);
      expect(binPostnatalAge12h(60)).toBe(60);
    });
  });

  describe('Unit Conversions', () => {
    it('converts mg/dL to µmol/L correctly (1 mg/dL = 17.1 µmol/L)', () => {
      expect(mgDlToUmolL(10.0)).toBe(171.0);
      expect(mgDlToUmolL(15.0)).toBe(256.6);
    });

    it('converts µmol/L to mg/dL correctly', () => {
      expect(umolLToMgDl(171.0)).toBeCloseTo(10.0, 1);
      expect(umolLToMgDl(256.6)).toBeCloseTo(15.0, 1);
    });
  });

  describe('Nomogram Percentile Interpolation', () => {
    it('returns exact values at known hour anchors', () => {
      // 24h: p40=4.8, p75=6.2, p95=8.0
      const p24 = getPercentilesAtHour(24);
      expect(p24.p40).toBe(4.8);
      expect(p24.p75).toBe(6.2);
      expect(p24.p95).toBe(8.0);

      // 48h: p40=8.5, p75=11.0, p95=13.5
      const p48 = getPercentilesAtHour(48);
      expect(p48.p40).toBe(8.5);
      expect(p48.p75).toBe(11.0);
      expect(p48.p95).toBe(13.5);
    });

    it('interpolates intermediate hours accurately', () => {
      const p36 = getPercentilesAtHour(36);
      expect(p36.p40).toBe(7.0);
      expect(p36.p95).toBe(11.2);
    });
  });

  describe('Clinical Risk-Zone Classification', () => {
    it('classifies result below 40th percentile as Low Risk', () => {
      const res = evaluateBhutaniRisk({
        dateOfBirth: '2026-11-14',
        exactTimeOfBirth: '00:00',
        sampleTimestamp: '2026-11-16T00:00:00', // 48h
        value: 7.0, // p40 at 48h is 8.5
        unit: 'mg/dL',
        method: 'TSB',
        gestationalAgeWeeks: 38,
      });

      expect(res.zone).toBe('low');
      expect(res.isEligible).toBe(true);
    });

    it('classifies result between 40th and 75th percentile as Low-Intermediate Risk', () => {
      const res = evaluateBhutaniRisk({
        dateOfBirth: '2026-11-14',
        exactTimeOfBirth: '00:00',
        sampleTimestamp: '2026-11-16T00:00:00', // 48h (p40=8.5, p75=11.0)
        value: 9.8,
        unit: 'mg/dL',
        method: 'TSB',
        gestationalAgeWeeks: 39,
      });

      expect(res.zone).toBe('low_intermediate');
    });

    it('classifies result between 75th and 95th percentile as High-Intermediate Risk', () => {
      const res = evaluateBhutaniRisk({
        dateOfBirth: '2026-11-14',
        exactTimeOfBirth: '00:00',
        sampleTimestamp: '2026-11-16T00:00:00', // 48h (p75=11.0, p95=13.5)
        value: 12.4,
        unit: 'mg/dL',
        method: 'TSB',
        gestationalAgeWeeks: 38,
      });

      expect(res.zone).toBe('high_intermediate');
    });

    it('classifies result above 95th percentile as High Risk', () => {
      const res = evaluateBhutaniRisk({
        dateOfBirth: '2026-11-14',
        exactTimeOfBirth: '00:00',
        sampleTimestamp: '2026-11-16T00:00:00', // 48h (p95=13.5)
        value: 16.0,
        unit: 'mg/dL',
        method: 'TSB',
        gestationalAgeWeeks: 38,
      });

      expect(res.zone).toBe('high');
    });

    it('flags preterm neonates (<35 weeks) as ineligible with clinical warning', () => {
      const res = evaluateBhutaniRisk({
        dateOfBirth: '2026-11-14',
        exactTimeOfBirth: '00:00',
        sampleTimestamp: '2026-11-16T00:00:00',
        value: 12.0,
        unit: 'mg/dL',
        method: 'TSB',
        gestationalAgeWeeks: 33, // Preterm
      });

      expect(res.isEligible).toBe(false);
      expect(res.zone).toBe('ineligible');
      expect(res.ineligibilityReason).toContain('<35w');
    });

    it('includes TcB screening note when measurement method is transcutaneous', () => {
      const res = evaluateBhutaniRisk({
        dateOfBirth: '2026-11-14',
        exactTimeOfBirth: '00:00',
        sampleTimestamp: '2026-11-16T00:00:00',
        value: 11.5,
        unit: 'mg/dL',
        method: 'TcB',
        gestationalAgeWeeks: 38,
      });

      expect(res.methodNote).toBeDefined();
      expect(res.methodNote).toContain('Transcutaneous');
    });
  });
});
