"use strict";
/**
 * Bhutani Hour-Specific Bilirubin Nomogram Clinical Engine
 * Reference: Bhutani VK, Johnson L, Sivieri EM. Predictive ability of a predischarge
 * hour-specific serum bilirubin for subsequent significant hyperbilirubinemia in healthy
 * term and near-term newborns. Pediatrics. 1999;103(1):6-14.
 * Endorsed by AAP (American Academy of Pediatrics) 2004/2022 Guidelines.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONVERSION_FACTOR_MG_TO_UMOL = exports.BHUTANI_NOMOGRAM_DATA = void 0;
exports.mgDlToUmolL = mgDlToUmolL;
exports.umolLToMgDl = umolLToMgDl;
exports.calculatePostnatalAgeHours = calculatePostnatalAgeHours;
exports.getPercentilesAtHour = getPercentilesAtHour;
exports.evaluateBhutaniRisk = evaluateBhutaniRisk;
// Clinically validated hour-specific reference values (mg/dL)
exports.BHUTANI_NOMOGRAM_DATA = [
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
exports.CONVERSION_FACTOR_MG_TO_UMOL = 17.104;
function mgDlToUmolL(mgDl) {
    return Math.round(mgDl * exports.CONVERSION_FACTOR_MG_TO_UMOL * 10) / 10;
}
function umolLToMgDl(umolL) {
    return Math.round((umolL / exports.CONVERSION_FACTOR_MG_TO_UMOL) * 100) / 100;
}
/**
 * Calculates exact postnatal age in hours from birth date & time and sample collection timestamp.
 */
function calculatePostnatalAgeHours(dateOfBirth, exactTimeOfBirth, sampleTimestamp = new Date()) {
    let birthDate;
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
    }
    else {
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
/**
 * Linearly interpolates percentile thresholds for any given hour.
 */
function getPercentilesAtHour(hour) {
    const clampedHour = Math.max(0, Math.min(168, hour));
    for (let i = 0; i < exports.BHUTANI_NOMOGRAM_DATA.length - 1; i++) {
        const current = exports.BHUTANI_NOMOGRAM_DATA[i];
        const next = exports.BHUTANI_NOMOGRAM_DATA[i + 1];
        if (clampedHour >= current.hour && clampedHour <= next.hour) {
            const ratio = (clampedHour - current.hour) / (next.hour - current.hour);
            return {
                p40: Math.round((current.p40 + ratio * (next.p40 - current.p40)) * 100) / 100,
                p75: Math.round((current.p75 + ratio * (next.p75 - current.p75)) * 100) / 100,
                p95: Math.round((current.p95 + ratio * (next.p95 - current.p95)) * 100) / 100,
            };
        }
    }
    const last = exports.BHUTANI_NOMOGRAM_DATA[exports.BHUTANI_NOMOGRAM_DATA.length - 1];
    return { p40: last.p40, p75: last.p75, p95: last.p95 };
}
/**
 * Classifies a newborn's bilirubin level according to Bhutani Nomogram risk zones.
 */
function evaluateBhutaniRisk(params) {
    const { dateOfBirth, exactTimeOfBirth, sampleTimestamp = new Date(), value, unit, method = 'TSB', gestationalAgeWeeks = 38, riskFactors = [], } = params;
    const ageHours = calculatePostnatalAgeHours(dateOfBirth, exactTimeOfBirth, sampleTimestamp);
    const valueMgDl = unit === 'µmol/L' ? umolLToMgDl(value) : Math.round(value * 100) / 100;
    const valueUmolL = unit === 'mg/dL' ? mgDlToUmolL(value) : value;
    // Eligibility check: Bhutani nomogram is validated for neonates >= 35 weeks gestational age
    if (gestationalAgeWeeks < 35) {
        return {
            postnatalAgeHours: ageHours,
            valueMgDl,
            valueUmolL,
            zone: 'ineligible',
            zoneLabel: 'Preterm Alert (Ineligible for Standard Bhutani)',
            percentileApprox: 0,
            thresholds: getPercentilesAtHour(ageHours),
            isEligible: false,
            ineligibilityReason: `Infant is ${gestationalAgeWeeks} weeks gestational age (< 35 weeks). Bhutani nomogram is only validated for >= 35 weeks. Consult gestational-age-specific AAP / NICE preterm curves.`,
            guidelineReference: 'AAP Neonatal Hyperbilirubinemia Guidelines (2022 Update)',
            clinicalActionRecommendation: 'Apply preterm-specific phototherapy threshold tables based on exact gestational age in completed weeks.',
        };
    }
    const thresholds = getPercentilesAtHour(ageHours);
    let zone = 'low';
    let zoneLabel = 'Low Risk Zone (< 40th percentile)';
    let percentileApprox = 30;
    let clinicalActionRecommendation = 'Routine neonatal care; continue supportive feeding and observe before hospital discharge.';
    if (valueMgDl >= thresholds.p95) {
        zone = 'high';
        zoneLabel = 'High Risk Zone (> 95th percentile)';
        percentileApprox = 97;
        clinicalActionRecommendation = 'Prompt clinical assessment required. Evaluate for intensive phototherapy and consider referral to hospital neonatal unit.';
    }
    else if (valueMgDl >= thresholds.p75) {
        zone = 'high_intermediate';
        zoneLabel = 'High-Intermediate Risk Zone (75th – 95th percentile)';
        percentileApprox = 85;
        clinicalActionRecommendation = 'Close surveillance indicated. Track bilirubin trajectory in 8–12 hours; check for hemolytic risk factors and assess phototherapy indication.';
    }
    else if (valueMgDl >= thresholds.p40) {
        zone = 'low_intermediate';
        zoneLabel = 'Low-Intermediate Risk Zone (40th – 74th percentile)';
        percentileApprox = 60;
        clinicalActionRecommendation = 'Follow-up within 24–48 hours depending on age and discharge timing. Educate parents on jaundice symptoms.';
    }
    let methodNote;
    if (method === 'TcB') {
        methodNote = 'Measured via Transcutaneous Bilirubinometer (TcB). Confirm with Total Serum Bilirubin (TSB) before deciding phototherapy or exchange transfusion.';
    }
    return {
        postnatalAgeHours: ageHours,
        valueMgDl,
        valueUmolL,
        zone,
        zoneLabel,
        percentileApprox,
        thresholds,
        isEligible: true,
        guidelineReference: 'Bhutani VK et al. Pediatrics 1999; AAP 2004/2022',
        clinicalActionRecommendation,
        methodNote,
    };
}
