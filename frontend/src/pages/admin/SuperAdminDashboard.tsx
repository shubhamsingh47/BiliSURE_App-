import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  Download,
  Building2,
  ShieldCheck,
  Lock,
  Layers,
  ArrowRight,
  RefreshCw,
  GitFork,
  BedDouble,
  Activity,
  Users,
} from 'lucide-react';
import api from '../../services/api';
import { SuperAdminOverviewData } from '../../types';

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<SuperAdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [facilityFilter, setFacilityFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'total' | 'admits'>('total');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/superadmin-overview', {
        params: { facility: facilityFilter !== 'All' ? facilityFilter : undefined },
      });
      setData(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load Super Admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [facilityFilter]);

  const handleExport = async () => {
    try {
      const response = await api.get('/analytics/export', {
        params: { facility: facilityFilter },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bilisure_district_consolidated_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export district data:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
          <span>Aggregating real data across PGI, RML, and KGMU nodes from MongoDB...</span>
        </div>
      </div>
    );
  }

  const { summaryTotal, bhutaniRiskDistribution, capacityGrid, participatingFacilities } = data;

  const donutData = [
    { name: 'In Observation', value: summaryTotal.inObservation.count, color: '#f59e0b' },
    { name: 'In Phototherapy', value: summaryTotal.inPhototherapy.count, color: '#8b5cf6' },
    { name: 'Critical / Transferred', value: summaryTotal.critical.count, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-7 text-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-widest bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                District Health Network
              </span>
              <span className="text-xs text-slate-500 font-mono">Lucknow Division</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
              Central Neonatal Command Hub
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Consolidated real-time monitoring across PGI, RML, and KGMU hospital centres
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="All">All Hospitals (Consolidated)</option>
              <option value="PGI">PGI Hospital Node</option>
              <option value="RML">RML Hospital Node</option>
              <option value="KGMU">KGMU Hospital Node</option>
            </select>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm shadow-purple-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
            <button
              onClick={() => setActiveTab('total')}
              className={`px-4 py-1.5 rounded-lg transition ${
                activeTab === 'total' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total Network
            </button>
            <button
              onClick={() => setActiveTab('admits')}
              className={`px-4 py-1.5 rounded-lg transition ${
                activeTab === 'admits' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admissions & Discharge
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY TOTAL Donut Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">SUMMARY TOTAL COHORT</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Donut Chart */}
          <div className="relative h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-extrabold text-slate-900">{summaryTotal.totalInfants}</span>
              <span className="text-xs font-medium text-slate-400 mt-0.5">Total Infants</span>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  In Observation
                </span>
                <span className="text-slate-900">
                  {summaryTotal.inObservation.count} ({summaryTotal.inObservation.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${summaryTotal.inObservation.percentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  In Phototherapy
                </span>
                <span className="text-slate-900">
                  {summaryTotal.inPhototherapy.count} ({summaryTotal.inPhototherapy.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${summaryTotal.inPhototherapy.percentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Critical / Transferred
                </span>
                <span className="text-slate-900">
                  {summaryTotal.critical.count} ({summaryTotal.critical.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-500"
                  style={{ width: `${summaryTotal.critical.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DE-IDENTIFIED BHUTANI RISK DISTRIBUTION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
            DE-IDENTIFIED BHUTANI RISK DISTRIBUTION
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">District-level hour-specific neonatal bilirubin risk zones</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/30 text-center">
            <span className="text-2xl font-black text-emerald-600">
              {bhutaniRiskDistribution.lowRisk.percentage}%
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">Low Risk</p>
            <p className="text-[10px] text-slate-500">&lt; 40th %tile</p>
          </div>

          <div className="p-4 rounded-2xl border-2 border-yellow-400 bg-yellow-50/30 text-center">
            <span className="text-2xl font-black text-yellow-600">
              {bhutaniRiskDistribution.lowIntRisk.percentage}%
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">Low-Int Risk</p>
            <p className="text-[10px] text-slate-500">40th–75th %tile</p>
          </div>

          <div className="p-4 rounded-2xl border-2 border-amber-400 bg-amber-50/30 text-center">
            <span className="text-2xl font-black text-amber-600">
              {bhutaniRiskDistribution.highIntRisk.percentage}%
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">High-Int Risk</p>
            <p className="text-[10px] text-slate-500">75th–95th %tile</p>
          </div>

          <div className="p-4 rounded-2xl border-2 border-rose-400 bg-rose-50/30 text-center">
            <span className="text-2xl font-black text-rose-600">
              {bhutaniRiskDistribution.highRisk.percentage}%
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">High Risk</p>
            <p className="text-[10px] text-slate-500">&gt; 95th %tile</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            De-identified aggregate statistics only. Patient identifiable data is restricted from district view per healthcare privacy standards.
          </span>
        </div>
      </div>

      {/* HOSPITAL PT CAPACITY GRID */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
            HOSPITAL PT CAPACITY GRID
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            District PT Stations: {capacityGrid.districtOccupied} Occupied of {capacityGrid.districtStations} Total ({capacityGrid.districtAvailable} Available)
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {capacityGrid.hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">{hosp.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hosp.operational} Operational Units · {hosp.inUse} In Use
                </p>
              </div>

              <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold text-xs">
                {hosp.available} Available Beds
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PARTICIPATING FACILITIES */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">
          PARTICIPATING FACILITIES & NETWORK
        </h2>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-3xl font-extrabold text-blue-600">{participatingFacilities.receivingHospitals}</span>
            <p className="text-xs font-semibold text-slate-600 mt-1">Tertiary Hospitals</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-3xl font-extrabold text-indigo-600">{participatingFacilities.referringCentres}</span>
            <p className="text-xs font-semibold text-slate-600 mt-1">Referring CHCs / Clinics</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-3xl font-extrabold text-purple-600">{participatingFacilities.totalReferrals}</span>
            <p className="text-xs font-semibold text-slate-600 mt-1">Total Referrals</p>
          </div>
        </div>
      </div>
    </div>
  );
};
