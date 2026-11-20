import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  Download,
  Lock,
  RefreshCw,
  Building2,
  Activity,
  BedDouble,
} from 'lucide-react';
import api from '../../services/api';
import { SuperAdminOverviewData } from '../../types';

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<SuperAdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [facilityFilter, setFacilityFilter] = useState('All');

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
        <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
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
    <div className="w-full max-w-[1700px] mx-auto space-y-5">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Central Neonatal Command Hub
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            Consolidated Network
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            PGI · RML · KGMU
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shadow-xs"
          >
            <option value="All">All Hospitals (Consolidated)</option>
            <option value="PGI">PGI Hospital Node</option>
            <option value="RML">RML Hospital Node</option>
            <option value="KGMU">KGMU Hospital Node</option>
          </select>

          <button
            onClick={handleExport}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* SUMMARY TOTAL Donut Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Summary Total Cohort</h2>
          <span className="text-xs text-slate-400 font-medium">Aggregated hospital intake</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Donut Chart */}
          <div className="relative h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={96}
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
              <span className="text-xs font-semibold text-slate-400 mt-0.5">Total Infants</span>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-50/40 border border-amber-100">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-2 text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  In Observation
                </span>
                <span className="text-slate-900 font-bold">
                  {summaryTotal.inObservation.count} ({summaryTotal.inObservation.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${summaryTotal.inObservation.percentage}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-purple-50/40 border border-purple-100">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-2 text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  In Phototherapy
                </span>
                <span className="text-slate-900 font-bold">
                  {summaryTotal.inPhototherapy.count} ({summaryTotal.inPhototherapy.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${summaryTotal.inPhototherapy.percentage}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-rose-50/40 border border-rose-100">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-2 text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Critical / Transferred
                </span>
                <span className="text-slate-900 font-bold">
                  {summaryTotal.critical.count} ({summaryTotal.critical.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all"
                  style={{ width: `${summaryTotal.critical.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DE-IDENTIFIED BHUTANI RISK DISTRIBUTION */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            De-Identified Bhutani Risk Distribution
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">District-level hour-specific neonatal bilirubin risk zones</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-4 rounded-xl border border-slate-200 border-t-2 border-t-emerald-500 bg-slate-50/60 text-center">
            <span className="text-3xl font-black text-emerald-600">
              {bhutaniRiskDistribution.lowRisk.percentage}%
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">Low Risk</p>
            <p className="text-[10px] text-slate-400 font-medium">&lt; 40th %tile</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 border-t-2 border-t-amber-400 bg-slate-50/60 text-center">
            <span className="text-3xl font-black text-amber-600">
              {bhutaniRiskDistribution.lowIntRisk.percentage}%
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">Low-Int Risk</p>
            <p className="text-[10px] text-slate-400 font-medium">40th–75th %tile</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 border-t-2 border-t-orange-500 bg-slate-50/60 text-center">
            <span className="text-3xl font-black text-orange-600">
              {bhutaniRiskDistribution.highIntRisk.percentage}%
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">High-Int Risk</p>
            <p className="text-[10px] text-slate-400 font-medium">75th–95th %tile</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 border-t-2 border-t-rose-500 bg-slate-50/60 text-center">
            <span className="text-3xl font-black text-rose-600">
              {bhutaniRiskDistribution.highRisk.percentage}%
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">High Risk</p>
            <p className="text-[10px] text-slate-400 font-medium">&gt; 95th %tile</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            De-identified aggregate statistics only. Patient identifiable data is restricted per HIPAA / healthcare privacy standards.
          </span>
        </div>
      </div>

      {/* HOSPITAL PT CAPACITY GRID */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Hospital PT Capacity Grid
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              District Stations: {capacityGrid.districtOccupied} Occupied of {capacityGrid.districtStations} Total ({capacityGrid.districtAvailable} Available)
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            {capacityGrid.districtAvailable} Available Beds Network-Wide
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {capacityGrid.hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="p-4 rounded-xl border border-slate-200/90 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{hosp.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {hosp.operational} Operational Units · {hosp.inUse} Currently In Use
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (hosp.inUse / (hosp.operational || 1)) * 100)}%` }}
                  />
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs shrink-0">
                  {hosp.available} Available Beds
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PARTICIPATING FACILITIES */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
          Participating Facilities & Network
        </h2>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90">
            <span className="text-3xl font-extrabold text-blue-600">{participatingFacilities.receivingHospitals}</span>
            <p className="text-xs font-semibold text-slate-700 mt-1">Tertiary Hospitals</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90">
            <span className="text-3xl font-extrabold text-indigo-600">{participatingFacilities.referringCentres}</span>
            <p className="text-xs font-semibold text-slate-700 mt-1">Referring CHCs / Clinics</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90">
            <span className="text-3xl font-extrabold text-purple-600">{participatingFacilities.totalReferrals}</span>
            <p className="text-xs font-semibold text-slate-700 mt-1">Total Referrals</p>
          </div>
        </div>
      </div>
    </div>
  );
};
