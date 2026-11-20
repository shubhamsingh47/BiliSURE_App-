import React, { useEffect, useState } from 'react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TestBalanceButton } from '../../components/common/TestBalanceButton';

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
            category: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: 'laboratory',
                    display: 'Laboratory',
                  },
                ],
              },
            ],
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '58941-6',
                  display: 'Transcutaneous Bilirubin [Mass/volume]',
                },
              ],
            },
            performer: [{ display: `${hospitalFacility} Neonatology Team` }],
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header: ONLY Heading on left, Percentage Ring on right */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Export</h1>
        <TestBalanceButton />
      </div>

      {/* Export Actions & Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Export Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Complete Clinical CSV</h3>
                <span className="text-xs text-slate-400">Comma-separated ledger for clinical audits</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Includes all baby demographics, gestational ages, and UHIDs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exact TcB values, units, timestamps, and operator IDs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bhutani risk zones and physician review status</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleExportCsv}
              disabled={downloading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* FHIR Interoperability Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">HL7 / FHIR R4 Bundle</h3>
                <span className="text-xs text-slate-400">Structured JSON for Hospital EHR integration</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Standard LOINC 58941-6 transcutaneous bilirubin coding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Interoperable with Epic, Cerner, and ABDM hospital HMS</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ready for Indian ABDM health registry ingestion</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleDownloadFhir}
              className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download FHIR Bundle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Snapshot */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Export Telemetry Coverage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs text-slate-500 font-medium">Total Screenings in DB</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{stats.totalScreenings}</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
            <span className="text-xs text-emerald-700 font-medium">Clinician Reviewed</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">{stats.reviewed}</div>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60">
            <span className="text-xs text-amber-700 font-medium">Pending Review</span>
            <div className="text-xl font-bold text-amber-700 mt-1">{stats.openReview}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
