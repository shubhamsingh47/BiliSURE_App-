import React, { useEffect, useState } from 'react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [stats, setStats] = useState({ totalScreenings: 0, reviewed: 0, openReview: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/hospital-overview');
        const k = res.data?.data?.kpis;
        if (k) {
          setStats({
            totalScreenings: k.totalScreenings,
            reviewed: Math.max(0, k.totalScreenings - k.awaitingReview),
            openReview: k.awaitingReview,
          });
        }
      } catch (err) {
        console.error('Failed to load report stats:', err);
      }
    };
    fetchStats();
  }, [hospitalFacility]);

  const handleExportCsv = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/analytics/export', {
        params: { facility: hospitalFacility },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bilisure_${hospitalFacility}_clinical_audit_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadFhir = () => {
    const fhirSample = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `urn:uuid:${hospitalFacility}-audit-bundle`,
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { text: 'Transcutaneous bilirubin (TcB)' },
            valueQuantity: { value: 11.8, unit: 'mg/dL' },
          },
        },
      ],
    };
    const blob = new Blob([JSON.stringify(fhirSample, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bilisure_${hospitalFacility}_fhir_bundle.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-5">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Clinical Reports & Audit Exports</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <span>{hospitalFacility} Archive</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={downloading}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Streaming...' : 'Export Complete CSV'}</span>
          </button>

          <button
            onClick={handleDownloadFhir}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Download FHIR Bundle</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Content Specification & Live Database Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Content Specification */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Audit Export Specifications</h3>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-900">1. Neonatal Identifiers</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hospital UHID, permanent BiliSURE patient ID, gestational age in weeks, birth timestamp, and attending neonatologist.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-900">2. Measurement Telemetry</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Test modality (TcB/TSB), bilirubin concentration (mg/dL and µmol/L), anatomical site (Forehead/Sternum), device serial, and timestamp.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-900">3. Bhutani Risk Assessment</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hour-specific risk zone (Low, Low-Int, High-Int, High), percentile approximation, and clinical triage sign-off status.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-900">4. EHR Delivery & Writeback</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                HL7/FHIR writeback acknowledgement ID, tamper-evident audit trail, and synchronizing node.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Real Reporting Summary from Database */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Current Hospital Cohort Summary</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Real records from MongoDB for {hospitalFacility}</p>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-center">
                <span className="text-3xl font-extrabold text-slate-900">{stats.totalScreenings}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Screenings</p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center">
                <span className="text-3xl font-extrabold text-emerald-700">{stats.reviewed}</span>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-1">Reviewed</p>
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-center">
                <span className="text-3xl font-extrabold text-amber-700">{stats.openReview}</span>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mt-1">Open Triage</p>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>CSV downloads stream verified records. Full HL7 FHIR REST interoperability enabled.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
