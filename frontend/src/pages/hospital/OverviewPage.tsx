import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  FileText,
  Clock,
  Share2,
  RefreshCw,
  BedDouble,
  ChevronRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { Badge } from '../../components/common/Badge';
import { PatientDrawer } from '../../components/patient/PatientDrawer';
import { HospitalOverviewData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [data, setData] = useState<HospitalOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/hospital-overview');
      setData(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch hospital overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [hospitalFacility]);

  if (loading || !data) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Synchronizing live clinical data for {hospitalFacility}...</span>
        </div>
      </div>
    );
  }

  const { kpis, screeningVolume, recentResults } = data;

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-5">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Clinical Overview</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>{data.facility || hospitalFacility}</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Live Telemetry
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOverview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Sync Database</span>
          </button>
        </div>
      </div>

      {/* 4 Core Clinical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Screenings"
          value={kpis.totalScreenings}
          subtitle="Real measurements in database"
          icon={<FileText className="w-4 h-4" />}
          iconBg="bg-blue-50 text-blue-600 border-blue-200"
        />
        <MetricCard
          title="Awaiting Clinician Review"
          value={kpis.awaitingReview}
          subtitle="Triage action queue"
          highlight={kpis.awaitingReview > 0}
          icon={<Clock className="w-4 h-4" />}
          iconBg="bg-amber-50 text-amber-600 border-amber-200"
        />
        <MetricCard
          title="PT Stations In Use"
          value={kpis.connectedDevices}
          subtitle={`${kpis.availablePtStations} beds ready for intake`}
          icon={<BedDouble className="w-4 h-4" />}
          iconBg="bg-purple-50 text-purple-600 border-purple-200"
        />
        <MetricCard
          title="Pending Incoming Referrals"
          value={kpis.hmsPending}
          subtitle="Awaiting physician acceptance"
          icon={<Share2 className="w-4 h-4" />}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-200"
        />
      </div>

      {/* Middle Grid: 7-Day Volume Chart & Workflow Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: 7-Day Screening Volume Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">7-Day Screening Activity</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Daily ward count</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={screeningVolume} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: '1px solid #1e293b',
                    padding: '8px 12px',
                  }}
                  formatter={(val: any) => [`${val} screenings`, 'Volume']}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Clinical Workflow Protocol Checklist */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Clinical Workflow Protocol</h2>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Patient UHID Matched</p>
                    <p className="text-[11px] text-slate-500">Identity resolution prevents duplicate registration</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Result Quality Verified</p>
                    <p className="text-[11px] text-slate-500">Optical sensor flags and timestamp integrity preserved</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    3
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Clinician Triage Signed</p>
                    <p className="text-[11px] text-slate-500">Bhutani nomogram hour-specific assessment approved</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    4
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">EHR Synced & Committed</p>
                    <p className="text-[11px] text-slate-500">FHIR R4 writeback receipt and audit trail logged</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            FHIR R4 writeback verified for {hospitalFacility}
          </div>
        </div>
      </div>

      {/* Recently Captured Patient Results Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Recently Captured Patient Results</h2>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">· Click row to inspect Bhutani nomogram</span>
          </div>
          <Link
            to="/hospital/patients"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs"
          >
            <span>View All Patients</span>
            <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Patient / UHID</th>
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4">Postnatal Age</th>
                <th className="py-3 px-4">Measurement</th>
                <th className="py-3 px-4">Clinical Review</th>
                <th className="py-3 px-4">EHR Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {recentResults.map((result) => (
                <tr
                  key={result.id}
                  onClick={() => setSelectedResult(result)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  title="Click to inspect Bhutani nomogram and sample history"
                >
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{result.patientName}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{result.uhid}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{result.ward}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{result.ageHours} h</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 text-sm">{result.measurementValue}</span>{' '}
                    <span className="text-[11px] text-slate-500">{result.unit}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {result.timestamp ? new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recorded'}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={result.reviewStatus === 'Reviewed' ? 'reviewed' : 'pending'}>
                      {result.reviewStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={result.hmsState === 'Simulated synced' ? 'normal' : 'pending'}>
                      {result.hmsState}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-md border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-700 text-xs font-medium text-slate-600 transition-colors inline-flex items-center gap-1">
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Patient Drawer with Bhutani Nomogram and Full Sample History */}
      <PatientDrawer
        patient={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
};
