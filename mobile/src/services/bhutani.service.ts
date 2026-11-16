import { BhutaniZone } from '../types';
import { COLORS } from '../theme/colors';

export interface NomogramPoint {
  hour: number;
  p40: number; // 40th percentile (mg/dL)
  p75: number; // 75th percentile (mg/dL)
  p95: number; // 95th percentile (mg/dL)
}

// Clinically validated hour-specific reference values (mg/dL)
export const BHUTANI_NOMOGRAM_DATA: NomogramPoint[] = [
  { hour: 0, p40: 1.0, p75: 2.0, p95: 3.5 },
  { hour: 12, p40: 2.5, p75: 3.8, p95: 5.0 },
  { hour: 18, p40: 3.5, p75: 5.0, p95: 6.0 },
  { hour: 24, p40: 4.8, p75: 6.2, p95: 8.0 },
  { hour: 30, p40: 6.0, p75: 7.7, p95: 9.8 },
  { hour: 36, p40: 7.0, p75: 8.9, p95: 11.2 },
  { hour: 42, p40: 7.8, p75: 10.0, p95: 12.5 },
  { hour: 48, p40: 8.5, p75: 11.0, p95: 13.5 },
  { hour: 54, p40: 9.2, p75: 11.8, p95: 14.5 },
  { hour: 60, p40: 9.8, p75: 12.6, p95: 15.3 },
  { hour: 66, p40: 10.3, p75: 13.2, p95: 16.0 },
  { hour: 72, p40: 10.8, p75: 13.8, p95: 16.6 },
  { hour: 78, p40: 11.2, p75: 14.3, p95: 17.1 },
  { hour: 84, p40: 11.6, p75: 14.8, p95: 17.5 },
  { hour: 90, p40: 12.0, p75: 15.2, p95: 17.8 },
  { hour: 96, p40: 12.3, p75: 15.5, p95: 18.0 },
  { hour: 108, p40: 12.8, p75: 16.0, p95: 18.4 },
  { hour: 120, p40: 13.2, p75: 16.3, p95: 18.6 },
  { hour: 132, p40: 13.5, p75: 16.5, p95: 18.7 },
  { hour: 144, p40: 13.6, p75: 16.6, p95: 18.8 },
  { hour: 156, p40: 13.7, p75: 16.7, p95: 18.9 },
  { hour: 168, p40: 13.8, p75: 16.8, p95: 19.0 },
];

export const CONVERSION_FACTOR_MG_TO_UMOL = 17.104;

export function mgDlToUmolL(mgDl: number): number {
  return Math.round(mgDl * CONVERSION_FACTOR_MG_TO_UMOL * 10) / 10;
}

export function umolLToMgDl(umolL: number): number {
  return Math.round((umolL / CONVERSION_FACTOR_MG_TO_UMOL) * 100) / 100;
}

export function calculatePostnatalAgeHours(
  dateOfBirth: Date | string,
  exactTimeOfBirth?: string,
  sampleTimestamp: Date | string = new Date()
): number {
  let birthDate: Date;

  if (typeof dateOfBirth === 'string' && exactTimeOfBirth) {
    const datePart = dateOfBirth.split('T')[0];
    birthDate = new Date(`${datePart}T${exactTimeOfBirth}:00`);
    if (isNaN(birthDate.getTime())) {
      birthDate = new Date(dateOfBirth);
      const parts = exactTimeOfBirth.split(':');
      if (parts.length >= 2) {
        birthDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      }
    }
  } else {
    birthDate = new Date(dateOfBirth);
    if (exactTimeOfBirth) {
      const parts = exactTimeOfBirth.split(':');
      if (parts.length >= 2) {
        birthDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      }
    }
  }

  const sampleDate = new Date(sampleTimestamp);
  const diffMs = sampleDate.getTime() - birthDate.getTime();
  const hours = diffMs / (1000 * 60 * 60);

  return Math.max(0, Math.round(hours * 10) / 10);
}

export function getPercentilesAtHour(hour: number): { p40: number; p75: number; p95: number } {
  const clampedHour = Math.max(0, Math.min(168, hour));

  for (let i = 0; i < BHUTANI_NOMOGRAM_DATA.length - 1; i++) {
    const current = BHUTANI_NOMOGRAM_DATA[i];
    const next = BHUTANI_NOMOGRAM_DATA[i + 1];

    if (clampedHour >= current.hour && clampedHour <= next.hour) {
      const ratio = (clampedHour - current.hour) / (next.hour - current.hour);
      return {
        p40: Math.round((current.p40 + ratio * (next.p40 - current.p40)) * 100) / 100,
        p75: Math.round((current.p75 + ratio * (next.p75 - current.p75)) * 100) / 100,
        p95: Math.round((current.p95 + ratio * (next.p95 - current.p95)) * 100) / 100,
      };
    }
  }

  const last = BHUTANI_NOMOGRAM_DATA[BHUTANI_NOMOGRAM_DATA.length - 1];
  return { p40: last.p40, p75: last.p75, p95: last.p95 };
}

export interface BhutaniAssessment {
  postnatalAgeHours: number;
  valueMgDl: number;
  valueUmolL: number;
  zone: BhutaniZone;
  zoneLabel: string;
  zoneColor: string;
  zoneBgColor: string;
  percentileApprox: number;
  thresholds: { p40: number; p75: number; p95: number };
  isEligible: boolean;
  ineligibilityReason?: string;
  clinicalAction: string;
  methodNote?: string;
}

export function evaluateBhutaniRisk(params: {
  dateOfBirth: Date | string;
  exactTimeOfBirth?: string;
  sampleTimestamp?: Date | string;
  value: number;
  unit: 'mg/dL' | 'µmol/L';
  method?: 'TSB' | 'TcB';
  gestationalAgeWeeks?: number;
}): BhutaniAssessment {
  const {
    dateOfBirth,
    exactTimeOfBirth,
    sampleTimestamp = new Date(),
    value,
    unit,
    method = 'TSB',
    gestationalAgeWeeks = 38,
  } = params;

  const ageHours = calculatePostnatalAgeHours(dateOfBirth, exactTimeOfBirth, sampleTimestamp);
  const valueMgDl = unit === 'µmol/L' ? umolLToMgDl(value) : Math.round(value * 100) / 100;
  const valueUmolL = unit === 'mg/dL' ? mgDlToUmolL(value) : value;

  // Preterm safety check (<35 weeks)
  if (gestationalAgeWeeks < 35) {
    return {
      postnatalAgeHours: ageHours,
      valueMgDl,
      valueUmolL,
      zone: 'ineligible',
      zoneLabel: 'Preterm Alert (Ineligible for Standard Bhutani)',
      zoneColor: COLORS.bhutaniIneligible,
      zoneBgColor: '#F1F5F9',
      percentileApprox: 0,
      thresholds: getPercentilesAtHour(ageHours),
      isEligible: false,
      ineligibilityReason: `Infant is ${gestationalAgeWeeks}w gestational age (<35w). Bhutani nomogram is only validated for ≥35w. Consult preterm phototherapy charts.`,
      clinicalAction: 'Apply gestational-age-specific preterm curves (AAP 2022 / NICE CG98).',
    };
  }

  const thresholds = getPercentilesAtHour(ageHours);

  let zone: BhutaniZone = 'low';
  let zoneLabel = 'Low Risk Zone (< 40th percentile)';
  let zoneColor = COLORS.bhutaniLow;
  let zoneBgColor = COLORS.bhutaniLowBg;
  let percentileApprox = 30;
  let clinicalAction = 'Routine neonatal care; continue supportive feeding and observe before hospital discharge.';

  if (valueMgDl >= thresholds.p95) {
    zone = 'high';
    zoneLabel = 'High Risk Zone (> 95th percentile)';
    zoneColor = COLORS.bhutaniHigh;
    zoneBgColor = COLORS.bhutaniHighBg;
    percentileApprox = 97;
    clinicalAction = 'Prompt clinical assessment required. Evaluate for hospital intensive phototherapy referral.';
  } else if (valueMgDl >= thresholds.p75) {
    zone = 'high_intermediate';
    zoneLabel = 'High-Intermediate Risk Zone (75th – 95th percentile)';
    zoneColor = COLORS.bhutaniHighInt;
    zoneBgColor = COLORS.bhutaniHighIntBg;
    percentileApprox = 85;
    clinicalAction = 'Close surveillance indicated. Repeat bilirubin test in 8–12 hours; check risk factors.';
  } else if (valueMgDl >= thresholds.p40) {
    zone = 'low_intermediate';
    zoneLabel = 'Low-Intermediate Risk Zone (40th – 74th percentile)';
    zoneColor = COLORS.bhutaniLowInt;
    zoneBgColor = COLORS.bhutaniLowIntBg;
    percentileApprox = 60;
    clinicalAction = 'Follow-up within 24–48 hours depending on age and discharge timing.';
  }

  let methodNote: string | undefined;
  if (method === 'TcB') {
    methodNote = 'Measured via Transcutaneous Bilirubinometer (TcB). Confirm with serum TSB before final phototherapy decisions.';
  }

  return {
    postnatalAgeHours: ageHours,
    valueMgDl,
    valueUmolL,
    zone,
    zoneLabel,
    zoneColor,
    zoneBgColor,
    percentileApprox,
    thresholds,
    isEligible: true,
    clinicalAction,
    methodNote,
  };
}
