import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  FileText,
  Clock,
  Cpu,
  Share2,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Activity,
  BedDouble,
  Baby as BabyIcon,
  ChevronRight,
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
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Synchronizing live clinical data for {hospitalFacility}...</span>
        </div>
      </div>
    );
  }

  const { kpis, screeningVolume, recentResults } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time neonatal jaundice telemetry, risk stratification, and admissions for {data.facility}
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Sync Database</span>
        </button>
      </div>

      {/* 4 Core Clinical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Screenings"
          value={kpis.totalScreenings}
          subtitle="Real measurements in database"
          icon={<FileText className="w-4 h-4 text-blue-600" />}
        />
        <MetricCard
          title="Awaiting Clinician Review"
          value={kpis.awaitingReview}
          subtitle="Triage action queue"
          highlight={kpis.awaitingReview > 0}
          icon={<Clock className="w-4 h-4 text-amber-600" />}
        />
        <MetricCard
          title="PT Stations In Use"
          value={kpis.connectedDevices}
          subtitle={`${kpis.availablePtStations} beds ready for intake`}
          icon={<BedDouble className="w-4 h-4 text-purple-600" />}
        />
        <MetricCard
          title="Pending Incoming Referrals"
          value={kpis.hmsPending}
          subtitle="Awaiting physician acceptance"
          icon={<Share2 className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Middle Grid: 7-Day Volume Chart & Workflow Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 7-Day Screening Volume Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">7-Day Screening Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daily screening count recorded across wards</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={screeningVolume} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1d68bd" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px', border: 'none' }}
                  formatter={(val: any) => [`${val} screenings`, 'Volume']}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Clinical Workflow Protocol Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Clinical Workflow Protocol</h2>
            <p className="text-xs text-slate-500 mt-0.5">Validated result verification pipeline</p>

            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-blue-600 text-blue-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Patient UHID Matched</p>
                    <p className="text-[11px] text-slate-500">Identity resolution prevents duplicate registration</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                  Required
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-blue-600 text-blue-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Result Quality Verified</p>
                    <p className="text-[11px] text-slate-500">Optical sensor flags and timestamp integrity preserved</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                  Required
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-blue-600 text-blue-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Clinician Triage Signed</p>
                    <p className="text-[11px] text-slate-500">Bhutani nomogram hour-specific assessment approved</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                  Required
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-blue-600 text-blue-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">EHR Synced & Committed</p>
                    <p className="text-[11px] text-slate-500">FHIR R4 writeback receipt and audit trail logged</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                  Required
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Captured Patient Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/40">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recently Captured Patient Results</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any infant result to inspect the Bhutani Nomogram and complete sample history
            </p>
          </div>
          <Link
            to="/hospital/patients"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1"
          >
            <span>View All Patients</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-5">PATIENT / UHID</th>
                <th className="py-3 px-5">WARD</th>
                <th className="py-3 px-5">POSTNATAL AGE</th>
                <th className="py-3 px-5">MEASUREMENT</th>
                <th className="py-3 px-5">CLINICAL REVIEW</th>
                <th className="py-3 px-5">EHR STATUS</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recentResults.map((result) => (
                <tr
                  key={result.id}
                  onClick={() => setSelectedResult(result)}
                  className="hover:bg-blue-50/60 cursor-pointer transition group"
                  title="Click to inspect Bhutani nomogram and sample history"
                >
                  <td className="py-3.5 px-5">
                    <p className="font-bold text-slate-900 group-hover:text-blue-700 transition">{result.patientName}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{result.uhid}</p>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">{result.ward}</td>
                  <td className="py-3.5 px-5 font-semibold text-slate-800">{result.ageHours} h</td>
                  <td className="py-3.5 px-5">
                    <span className="font-extrabold text-slate-900 text-sm">{result.measurementValue}</span>{' '}
                    <span className="text-[11px] text-slate-500">{result.unit}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {result.timestamp ? new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recorded'}
                    </p>
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge variant={result.reviewStatus === 'Reviewed' ? 'reviewed' : 'pending'}>
                      {result.reviewStatus}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge variant={result.hmsState === 'Simulated synced' ? 'normal' : 'pending'}>
                      {result.hmsState}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="px-2.5 py-1 rounded-lg border border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50 group-hover:text-blue-700 text-xs font-semibold text-slate-600 transition inline-flex items-center gap-1">
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
