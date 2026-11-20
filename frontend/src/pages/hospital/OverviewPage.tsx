import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  FileText,
  Clock,
  Share2,
  BedDouble,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import api from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { PatientDrawer } from '../../components/patient/PatientDrawer';
import { HospitalOverviewData, BilirubinReading } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TestBalanceButton } from '../../components/common/TestBalanceButton';

export const OverviewPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [data, setData] = useState<HospitalOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentReadings, setRecentReadings] = useState<BilirubinReading[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  // Full-screen Recent Samples view state
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [allSamples, setAllSamples] = useState<BilirubinReading[]>([]);
  const [allSamplesLoading, setAllSamplesLoading] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [overviewRes, readingsRes] = await Promise.all([
        api.get('/analytics/hospital-overview'),
        api.get('/readings', { params: { limit: 10 } }),
      ]);
      setData(overviewRes.data?.data || null);
      setRecentReadings(readingsRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch hospital overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [hospitalFacility]);

  const handleOpenViewAll = async () => {
    setIsViewAllOpen(true);
    setAllSamplesLoading(true);
    try {
      const res = await api.get('/readings', { params: { limit: 500 } });
      setAllSamples(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load all samples:', err);
    } finally {
      setAllSamplesLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-slate-400 text-xs font-semibold">
          Loading clinical overview...
        </div>
      </div>
    );
  }

  const { kpis, screeningVolume } = data;

  // DEDICATED FULL-SCREEN RECENT SAMPLES VIEW
  if (isViewAllOpen) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Full-screen Header with Back icon button returning to Overview */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsViewAllOpen(false)}
              title="Back to Overview"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 bg-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recent Samples</h1>
          </div>
          <TestBalanceButton />
        </div>

        {/* Full-screen Samples Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Complete historical record of all patient samples ({allSamples.length} records)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Patient UHID</th>
                  <th className="py-3 px-4">Mother Name</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Age (hrs)</th>
                  <th className="py-3 px-4">TcB Value</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allSamplesLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading all sample records...
                    </td>
                  </tr>
                ) : allSamples.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No sample records found.
                    </td>
                  </tr>
                ) : (
                  allSamples.map((r) => {
                    const val = r.valueMgDl || r.value || 0;
                    const isHigh = val >= 14 || r.bhutaniZone === 'high';
                    return (
                      <tr
                        key={r._id}
                        onClick={() =>
                          setSelectedPatient({
                            uhid: r.babyUhid || r.babyId,
                            babyId: r.babyId || r.babyUhid,
                            measurementValue: val,
                          })
                        }
                        className="hover:bg-slate-50/80 cursor-pointer transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {r.babyUhid || r.babyId || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {r.motherName || (r as any).parentsName || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {r.timestamp
                            ? new Date(r.timestamp).toLocaleString([], {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {r.postnatalAgeHours ? `${r.postnatalAgeHours}h` : '—'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {val.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">mg/dL</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                            {r.method || 'TcB'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isHigh ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              High Risk
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" />
                              Low / Normal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient({
                                uhid: r.babyUhid || r.babyId,
                                babyId: r.babyId || r.babyUhid,
                                measurementValue: val,
                              });
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide-over Patient Drawer */}
        {selectedPatient && (
          <PatientDrawer
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header: ONLY Heading on left, Percentage Balance Ring on right */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
        <TestBalanceButton />
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

      {/* 7-Day Screening Activity Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">7-Day Screening Activity</h2>
          <span className="text-xs text-slate-400 font-medium">Daily transcutaneous screenings</span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={screeningVolume} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
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

      {/* Recent Samples Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Samples</h2>
          <button
            onClick={handleOpenViewAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Patient UHID</th>
                <th className="py-3 px-4">Mother Name</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Age (hrs)</th>
                <th className="py-3 px-4">TcB Value</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentReadings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No recent readings found.
                  </td>
                </tr>
              ) : (
                recentReadings.map((r) => {
                  const val = r.valueMgDl || r.value || 0;
                  const isHigh = val >= 14 || r.bhutaniZone === 'high';
                  return (
                    <tr
                      key={r._id}
                      onClick={() =>
                        setSelectedPatient({
                          uhid: r.babyUhid || r.babyId,
                          babyId: r.babyId || r.babyUhid,
                          measurementValue: val,
                        })
                      }
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {r.babyUhid || r.babyId || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {r.motherName || (r as any).parentsName || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.postnatalAgeHours ? `${r.postnatalAgeHours}h` : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {val.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">mg/dL</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                          {r.method || 'TcB'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isHigh ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            High Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            Low / Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient({
                              uhid: r.babyUhid || r.babyId,
                              babyId: r.babyId || r.babyUhid,
                              measurementValue: val,
                            });
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Patient Drawer */}
      {selectedPatient && (
        <PatientDrawer
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
};
