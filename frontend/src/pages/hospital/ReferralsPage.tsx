import React, { useEffect, useState } from 'react';
import { Copy, Check, RefreshCw, Share2, Layers } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Referral } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ReferralsPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/referrals/inbox');
      setReferrals(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [hospitalFacility]);

  const fhirPayloadSample = JSON.stringify(
    {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'Observation',
            status: 'preliminary',
            code: {
              text: 'Transcutaneous bilirubin (TcB)',
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '58413-6',
                  display: 'Bilirubin.transcutaneous',
                },
              ],
            },
            subject: {
              reference: `Patient/${hospitalFacility}-2401`,
            },
            effectiveDateTime: new Date().toISOString(),
            valueQuantity: {
              value: 12.4,
              unit: 'mg/dL',
              system: 'http://unitsofmeasure.org',
              code: 'mg/dL',
            },
          },
        },
      ],
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(fhirPayloadSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-5">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">EHR Integration & Referrals</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5" />
            <span>HL7 FHIR R4 Ready</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Gateway Connected
          </span>
        </div>

        <button
          onClick={fetchReferrals}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Two Column Layout: Proposed Data Flow & FHIR Payload Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Telemetry Data Flow */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">EHR Integration Architecture</h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Bidirectional
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  1
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Device Captures TcB Reading</p>
                  <p className="text-[11px] text-slate-500">
                    BiliSURE optical sensor records spectral measurement; payload encrypted locally.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  2
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Gateway Verifies Integrity</p>
                  <p className="text-[11px] text-slate-500">
                    Validates schema, device serial, optical SNR quality flags, and deduplication queues.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  3
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Hospital Patient Matched</p>
                  <p className="text-[11px] text-slate-500">
                    Master Patient Index resolves hospital UHID, birth timestamp, and encounter ID.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  4
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Clinician Review & EHR Writeback</p>
                  <p className="text-[11px] text-slate-500">
                    Standardized FHIR Observation committed to hospital records with delivery receipt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Compliant standards: HL7 FHIR R4, LOINC 58413-6, SNOMED-CT, ABDM Data Exchange.
          </div>
        </div>

        {/* Right: FHIR R4 Sample Payload Preview with Copy Button */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">FHIR R4 Observation Schema</h2>
                <span className="text-[11px] text-slate-400 font-mono">LOINC 58413-6 (Bilirubin.transcutaneous)</span>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-lg text-[11px] font-mono overflow-x-auto h-64 border border-slate-800 shadow-inner">
              {fhirPayloadSample}
            </pre>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 text-[11px]">National ABDM & LOINC interoperability active</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Protocol Ready
            </span>
          </div>
        </div>
      </div>

      {/* Referrals Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Incoming Hospital Transfer Requests</h2>
            <span className="text-xs text-slate-400 font-normal">· {referrals.length} active triage cases</span>
          </div>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Referral ID</th>
                  <th className="py-3 px-4">Infant / UHID</th>
                  <th className="py-3 px-4">Origin Clinic</th>
                  <th className="py-3 px-4">Clinical Triage</th>
                  <th className="py-3 px-4">Latest Bilirubin</th>
                  <th className="py-3 px-4">Intake Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No incoming inter-hospital referrals pending for {hospitalFacility}.
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref) => (
                    <tr key={ref._id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{ref.referralId}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{ref.babyName}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{ref.babyUhid}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ref.referringCentreName}</td>
                      <td className="py-3 px-4">
                        <Badge variant={ref.urgency === 'emergency' ? 'critical' : ref.urgency === 'urgent' ? 'moderate' : 'info'}>
                          {ref.urgency?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ref.latestBilirubinValue} {ref.latestBilirubinUnit}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={ref.status === 'accepted' ? 'reviewed' : 'pending'}>
                          {ref.status?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => alert(`Reviewing transfer case for ${ref.babyName} (${ref.babyUhid})`)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
                        >
                          Review Case
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
