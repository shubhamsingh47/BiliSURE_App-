import React, { useState } from 'react';

export interface NomogramPoint {
  hour: number;
  p40: number; // 40th percentile (mg/dL)
  p75: number; // 75th percentile (mg/dL)
  p95: number; // 95th percentile (mg/dL)
}

// Clinically validated hour-specific reference values (Bhutani et al. Pediatrics 1999)
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

export function getPercentilesAtHour(hour: number): { p40: number; p75: number; p95: number } {
  const clampedHour = Math.max(0, Math.min(168, hour));
  for (let i = 0; i < BHUTANI_NOMOGRAM_DATA.length - 1; i++) {
    const cur = BHUTANI_NOMOGRAM_DATA[i];
    const nxt = BHUTANI_NOMOGRAM_DATA[i + 1];
    if (clampedHour >= cur.hour && clampedHour <= nxt.hour) {
      const ratio = (clampedHour - cur.hour) / (nxt.hour - cur.hour);
      return {
        p40: Math.round((cur.p40 + ratio * (nxt.p40 - cur.p40)) * 10) / 10,
        p75: Math.round((cur.p75 + ratio * (nxt.p75 - cur.p75)) * 10) / 10,
        p95: Math.round((cur.p95 + ratio * (nxt.p95 - cur.p95)) * 10) / 10,
      };
    }
  }
  const last = BHUTANI_NOMOGRAM_DATA[BHUTANI_NOMOGRAM_DATA.length - 1];
  return { p40: last.p40, p75: last.p75, p95: last.p95 };
}

export interface ReadingItem {
  id?: string;
  postnatalAgeHours: number;
  valueMgDl: number;
  unit?: string;
  method?: string;
  measurementSite?: string;
  timestamp?: string;
  operatorName?: string;
}

interface BhutaniNomogramWebProps {
  readings: ReadingItem[];
  gestationalAgeWeeks?: number;
}

export const BhutaniNomogramWeb: React.FC<BhutaniNomogramWebProps> = ({
  readings = [],
  gestationalAgeWeeks = 38,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<ReadingItem | null>(
    readings.length > 0 ? readings[readings.length - 1] : null
  );

  const width = 640;
  const height = 340;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 40;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxHour = 144;
  const maxMgDl = 20;

  const scaleX = (h: number) => paddingLeft + (Math.max(0, Math.min(maxHour, h)) / maxHour) * plotWidth;
  const scaleY = (v: number) => paddingTop + plotHeight - (Math.max(0, Math.min(maxMgDl, v)) / maxMgDl) * plotHeight;

  const buildZonePolygon = (
    bottomCurve: 'zero' | 'p40' | 'p75' | 'p95',
    topCurve: 'p40' | 'p75' | 'p95' | 'top'
  ) => {
    const points = BHUTANI_NOMOGRAM_DATA.filter((p) => p.hour <= maxHour);
    const coords: string[] = [];

    for (let i = 0; i < points.length; i++) {
      const x = scaleX(points[i].hour);
      const y = topCurve === 'top' ? scaleY(maxMgDl) : scaleY(points[i][topCurve]);
      coords.push(`${x},${y}`);
    }

    for (let i = points.length - 1; i >= 0; i--) {
      const x = scaleX(points[i].hour);
      const y = bottomCurve === 'zero' ? scaleY(0) : scaleY(points[i][bottomCurve]);
      coords.push(`${x},${y}`);
    }

    return coords.join(' ');
  };

  const buildCurvePath = (key: 'p40' | 'p75' | 'p95') => {
    const points = BHUTANI_NOMOGRAM_DATA.filter((p) => p.hour <= maxHour);
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.hour)} ${scaleY(p[key])}`)
      .join(' ');
  };

  const sorted = [...readings].sort((a, b) => a.postnatalAgeHours - b.postnatalAgeHours);
  const currentPoint = selectedPoint || (sorted.length > 0 ? sorted[sorted.length - 1] : null);

  let riskZone = 'Low Risk';
  let riskColor = 'text-emerald-800 bg-emerald-50 border-emerald-200';
  let clinicalAdvice = 'Standard nursery care. Support maternal breastfeeding.';

  if (currentPoint) {
    const th = getPercentilesAtHour(currentPoint.postnatalAgeHours);
    if (currentPoint.valueMgDl >= th.p95) {
      riskZone = 'High Risk (> 95th %tile)';
      riskColor = 'text-rose-800 bg-rose-50 border-rose-200';
      clinicalAdvice = 'Immediate phototherapy evaluation recommended. Review serum TSB confirmation.';
    } else if (currentPoint.valueMgDl >= th.p75) {
      riskZone = 'High-Intermediate Risk (75th–95th %tile)';
      riskColor = 'text-amber-800 bg-amber-50 border-amber-200';
      clinicalAdvice = 'High surveillance. Repeat bilirubin within 8–12 hours and inspect risk factors.';
    } else if (currentPoint.valueMgDl >= th.p40) {
      riskZone = 'Low-Intermediate Risk (40th–74th %tile)';
      riskColor = 'text-blue-800 bg-blue-50 border-blue-200';
      clinicalAdvice = 'Follow-up within 24–48 hours based on hospital discharge protocol.';
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header & Risk Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Bhutani Nomogram</h3>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              AAP 2022 Guidelines (≥35w)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hour-specific bilirubin risk stratification over postnatal hours
          </p>
        </div>

        {currentPoint && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${riskColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{riskZone}</span>
          </div>
        )}
      </div>

      {/* SVG Nomogram Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[360px] font-sans">
          {/* Background Risk Zone Polygons */}
          <polygon points={buildZonePolygon('p95', 'top')} fill="#fee2e2" opacity="0.65" />
          <polygon points={buildZonePolygon('p75', 'p95')} fill="#fef3c7" opacity="0.65" />
          <polygon points={buildZonePolygon('p40', 'p75')} fill="#dbeafe" opacity="0.6" />
          <polygon points={buildZonePolygon('zero', 'p40')} fill="#dcfce7" opacity="0.6" />

          {/* Grid lines */}
          {[24, 48, 72, 96, 120, 144].map((h) => (
            <g key={`x-${h}`}>
              <line
                x1={scaleX(h)}
                y1={paddingTop}
                x2={scaleX(h)}
                y2={paddingTop + plotHeight}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={scaleX(h)}
                y={paddingTop + plotHeight + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontWeight="500"
              >
                {h}h
              </text>
            </g>
          ))}

          {[0, 5, 10, 15, 20].map((v) => (
            <g key={`y-${v}`}>
              <line
                x1={paddingLeft}
                y1={scaleY(v)}
                x2={paddingLeft + plotWidth}
                y2={scaleY(v)}
                stroke="#e2e8f0"
                strokeDasharray={v === 0 ? '' : '3 3'}
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={scaleY(v) + 3}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
                fontWeight="500"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Percentile Threshold Lines */}
          <path d={buildCurvePath('p95')} fill="none" stroke="#dc2626" strokeWidth="2" />
          <path d={buildCurvePath('p75')} fill="none" stroke="#d97706" strokeWidth="2" />
          <path d={buildCurvePath('p40')} fill="none" stroke="#2563eb" strokeWidth="1.75" />

          {/* Curve Label Badges at right margin */}
          <text x={scaleX(144) - 4} y={scaleY(19.2)} textAnchor="end" fontSize="9" fill="#991b1b" fontWeight="700">
            95th %tile
          </text>
          <text x={scaleX(144) - 4} y={scaleY(16.9)} textAnchor="end" fontSize="9" fill="#92400e" fontWeight="700">
            75th %tile
          </text>
          <text x={scaleX(144) - 4} y={scaleY(14.0)} textAnchor="end" fontSize="9" fill="#1e40af" fontWeight="700">
            40th %tile
          </text>

          {/* Chronological Trajectory Line */}
          {sorted.length > 1 && (
            <path
              d={sorted.map((r, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(r.postnatalAgeHours)} ${scaleY(r.valueMgDl)}`).join(' ')}
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Patient Measurement Points */}
          {sorted.map((r, idx) => {
            const cx = scaleX(r.postnatalAgeHours);
            const cy = scaleY(r.valueMgDl);
            const isSelected = currentPoint?.id === r.id || (selectedPoint === null && idx === sorted.length - 1);

            return (
              <g
                key={r.id || idx}
                onClick={() => setSelectedPoint(r)}
                className="cursor-pointer group"
              >
                {isSelected && (
                  <circle cx={cx} cy={cy} r="9" fill="#2563eb" fillOpacity="0.25" />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? '5.5' : '4.5'}
                  fill="#0f172a"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#0f172a"
                >
                  {r.valueMgDl}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={paddingLeft + plotWidth / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#475569"
          >
            Postnatal Age (Hours)
          </text>
          <text
            x={-(paddingTop + plotHeight / 2)}
            y="12"
            transform="rotate(-90)"
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#475569"
          >
            Bilirubin (mg/dL)
          </text>
        </svg>
      </div>

      {/* Selected Point Details Panel */}
      {currentPoint ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Selected: {currentPoint.valueMgDl} mg/dL at {currentPoint.postnatalAgeHours}h Age
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({currentPoint.method || 'TcB'} · {currentPoint.measurementSite || 'Forehead'})
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">{clinicalAdvice}</p>
          </div>

          <div className="text-right text-[11px] text-slate-400 font-medium">
            <span>Operator: {currentPoint.operatorName || 'Nurse Staff'}</span>
            <span className="block">{currentPoint.timestamp ? new Date(currentPoint.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recorded'}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-2">
          No bilirubin readings recorded yet for this infant.
        </p>
      )}
    </div>
  );
};
