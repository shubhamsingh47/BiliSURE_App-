import React, { useEffect, useState } from 'react';
import { Copy, Check, Share2, ArrowRight, RefreshCw, Send, ArrowRightLeft } from 'lucide-react';
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">EHR Integration & Inter-Hospital Referrals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standardized HL7 FHIR R4 clinical observations, intake triage, and cross-facility neonatal transfer pipeline
          </p>
        </div>

        <button
          onClick={fetchReferrals}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Referrals Queue</span>
        </button>
      </div>

      {/* Two Column Layout: Proposed Data Flow & FHIR Payload Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Telemetry Data Flow */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Electronic Health Record Integration Flow</h2>
            <p className="text-xs text-slate-500 mt-0.5">End-to-end telemetry and verification architecture</p>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">Device Captures TcB Reading</p>
                  <p className="text-[11px] text-slate-500">
                    BiliSURE transcutaneous device records optical measurement; local encryption applied.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">Gateway Verifies Integrity</p>
                  <p className="text-[11px] text-slate-500">
                    Validates schema, device ID, measurement flags, deduplication and transmission queues.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">Hospital Patient Matched</p>
                  <p className="text-[11px] text-slate-500">
                    Master Patient Index resolves hospital UHID, birth timestamp, and encounter ID.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">Clinician Review & EHR Writeback</p>
                  <p className="text-[11px] text-slate-500">
                    Standardized FHIR Observation resource committed to central hospital records with delivery receipt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Compliant standards: HL7 FHIR R4, LOINC 58413-6, SNOMED-CT, ABDM Health Data Exchange.
          </div>
        </div>

        {/* Right: FHIR R4 Sample Payload Preview with Copy Button */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">FHIR R4 Observation Schema</h2>
                <p className="text-xs text-slate-500">LOINC 58413-6 (Bilirubin.transcutaneous)</p>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition inline-flex items-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>

            <pre className="bg-[#0b1523] text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto h-64 border border-[#1a2f4c]">
              {fhirPayloadSample}
            </pre>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs pt-2">
            <span className="text-slate-500 text-[11px]">National ABDM & LOINC interoperability active</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Protocol Ready
            </span>
          </div>
        </div>
      </div>

      {/* Referrals Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/40">
          <div>
            <h2 className="text-base font-bold text-slate-900">Incoming Hospital Transfer Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Urgent and routine neonatal referral queue for {hospitalFacility}
            </p>
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
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5">REFERRAL ID</th>
                  <th className="py-3 px-5">INFANT / UHID</th>
                  <th className="py-3 px-5">ORIGIN CLINIC</th>
                  <th className="py-3 px-5">CLINICAL TRIAGE</th>
                  <th className="py-3 px-5">LATEST BILIRUBIN</th>
                  <th className="py-3 px-5">INTAKE STATUS</th>
                  <th className="py-3 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                      No incoming inter-hospital referrals pending for {hospitalFacility}.
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref) => (
                    <tr key={ref._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-blue-600">{ref.referralId}</td>
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">{ref.babyName}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{ref.babyUhid}</p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">{ref.referringCentreName}</td>
                      <td className="py-3.5 px-5">
                        <Badge variant={ref.urgency === 'emergency' ? 'critical' : ref.urgency === 'urgent' ? 'moderate' : 'info'}>
                          {ref.urgency?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900">
                        {ref.latestBilirubinValue} {ref.latestBilirubinUnit}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge variant={ref.status === 'accepted' ? 'reviewed' : 'pending'}>
                          {ref.status?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => alert(`Reviewing transfer case for ${ref.babyName} (${ref.babyUhid})`)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                        >
                          Review
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
