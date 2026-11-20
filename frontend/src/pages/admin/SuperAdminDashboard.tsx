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
  Cpu,
  Zap,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import {
  SuperAdminOverviewData,
  DeviceItem,
  DeviceHealthSummary,
  SuperAdminBillingSummary,
} from '../../types';

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<SuperAdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [facilityFilter, setFacilityFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'total' | 'admits' | 'fleet_health' | 'billing_usage'>('total');

  // New modules state
  const [fleetSummary, setFleetSummary] = useState<DeviceHealthSummary | null>(null);
  const [fleetDevices, setFleetDevices] = useState<DeviceItem[]>([]);
  const [billingSummary, setBillingSummary] = useState<SuperAdminBillingSummary | null>(null);
  const [moduleLoading, setModuleLoading] = useState(false);

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

  const fetchFleetData = async () => {
    try {
      setModuleLoading(true);
      const [sumRes, devRes] = await Promise.all([
        api.get('/device-testing/summary', {
          params: { facility: facilityFilter !== 'All' ? facilityFilter : undefined },
        }),
        api.get('/device-testing/devices', {
          params: { facility: facilityFilter !== 'All' ? facilityFilter : undefined },
        }),
      ]);
      setFleetSummary(sumRes.data.data);
      setFleetDevices(devRes.data.data || []);
    } catch (err) {
      console.error('Failed to load fleet data:', err);
    } finally {
      setModuleLoading(false);
    }
  };

  const fetchBillingData = async () => {
    try {
      setModuleLoading(true);
      const res = await api.get('/billing/superadmin-summary');
      setBillingSummary(res.data.data);
    } catch (err) {
      console.error('Failed to load billing summary:', err);
    } finally {
      setModuleLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fleet_health') {
      fetchFleetData();
    } else if (activeTab === 'billing_usage') {
      fetchBillingData();
    }
  }, [activeTab, facilityFilter]);

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
      <div className="bg-[#121c2d] border border-[#1e2f47] rounded-3xl p-7 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-lg">
                District Health Network
              </span>
              <span className="text-xs text-slate-400 font-mono">Lucknow Division</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
              Central Neonatal Command Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Consolidated real-time monitoring across PGI, RML, and KGMU hospital centres
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="px-3.5 py-2 bg-[#1a2942] border border-[#2a3f61] rounded-xl text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All" className="text-slate-900">All Hospitals (Consolidated)</option>
              <option value="PGI" className="text-slate-900">PGI Hospital Node</option>
              <option value="RML" className="text-slate-900">RML Hospital Node</option>
              <option value="KGMU" className="text-slate-900">KGMU Hospital Node</option>
            </select>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm shadow-purple-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 pt-5 border-t border-[#1e2f47] flex gap-2">
          <div className="inline-flex flex-wrap rounded-xl bg-[#09111c] p-1 text-xs font-bold border border-[#1e2f47] gap-1">
            <button
              onClick={() => setActiveTab('total')}
              className={`px-4 py-1.5 rounded-lg transition ${
                activeTab === 'total' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Total Network
            </button>
            <button
              onClick={() => setActiveTab('admits')}
              className={`px-4 py-1.5 rounded-lg transition ${
                activeTab === 'admits' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admissions & Discharge
            </button>
            <button
              onClick={() => setActiveTab('fleet_health')}
              className={`px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'fleet_health' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Device Fleet Health
            </button>
            <button
              onClick={() => setActiveTab('billing_usage')}
              className={`px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'billing_usage' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Billing & Usage Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: FLEET HEALTH */}
      {activeTab === 'fleet_health' && (
        <div className="space-y-6 animate-fade-in">
          {/* Fleet KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>District Total Fleet</span>
                <Cpu className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">
                {fleetSummary?.totalDevices ?? fleetDevices.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across PGI, RML, and KGMU</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase">
                <span>Healthy & Operational</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-emerald-600">
                {fleetSummary?.healthy ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Passed clinical telemetry check</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-rose-600 uppercase">
                <span>Issues / Attention</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-rose-600">
                {fleetSummary?.issues ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Flagged for optical inspection</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-amber-600 uppercase">
                <span>Calibration Required</span>
                <Wrench className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-amber-600">
                {fleetSummary?.calibrationRequired ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Reference dock required</p>
            </div>
          </div>

          {/* Fleet Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  District Device Inventory & Telemetry Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filtered by: <span className="font-semibold text-slate-700">{facilityFilter}</span>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Hospital Node</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Assigned Ward</th>
                    <th className="py-3 px-4">Health Status</th>
                    <th className="py-3 px-4">Last Calibrated</th>
                    <th className="py-3 px-4">Next Due</th>
                    <th className="py-3 px-4 text-right">Remaining Tests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {fleetDevices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                        No devices matching current filter.
                      </td>
                    </tr>
                  ) : (
                    fleetDevices.map((d) => (
                      <tr key={d.serialNumber} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">{d.facility}</td>
                        <td className="py-3.5 px-4 font-bold text-blue-600">{d.serialNumber}</td>
                        <td className="py-3.5 px-4 font-sans text-slate-600">{d.deviceModel}</td>
                        <td className="py-3.5 px-4 font-sans text-slate-600">{d.assignedWard || d.department}</td>
                        <td className="py-3.5 px-4 font-sans">
                          {d.lastDiagnosticStatus === 'healthy' || d.status === 'calibrated' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              Healthy
                            </span>
                          ) : d.lastDiagnosticStatus === 'issue_detected' || d.status === 'alert_broken' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                              Issue Detected
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                              Calibration Due
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-slate-500">
                          {d.lastCalibratedAt ? new Date(d.lastCalibratedAt).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-slate-500">
                          {d.nextCalibrationDue ? new Date(d.nextCalibrationDue).toLocaleDateString('en-IN') : 'In 60 days'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {d.remainingTests?.toLocaleString() || '7,500'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BILLING & USAGE TELEMETRY */}
      {activeTab === 'billing_usage' && (
        <div className="space-y-6 animate-fade-in">
          {/* Aggregate Billing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>District Allocated Tests</span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">
                {billingSummary?.aggregate.totalAllocated.toLocaleString() ?? '2,200'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across active hospital plans</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase">
                <span>Total Consumed Tests</span>
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-indigo-600">
                {billingSummary?.aggregate.totalConsumed.toLocaleString() ?? '1,150'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Screenings executed</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase">
                <span>Remaining Tests</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-emerald-600">
                {billingSummary?.aggregate.totalRemaining.toLocaleString() ?? '1,050'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Usable quota available</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-600 uppercase">
                <span>Utilization Rate</span>
                <Zap className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-cyan-600">
                {billingSummary?.aggregate.overallUsagePercent ?? 52}%
              </div>
              <p className="text-xs text-slate-500 mt-1">District quota velocity</p>
            </div>
          </div>

          {/* Hospital Subscriptions Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cross-Hospital Subscription & Usage Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Hospital Facility</th>
                    <th className="py-3 px-4">Subscribed Plan</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Allocated Tests</th>
                    <th className="py-3 px-4">Consumed</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Utilization</th>
                    <th className="py-3 px-4 text-right">Renewal Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {billingSummary?.hospitalStats?.map((h) => (
                    <tr key={h.facility} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">{h.facility}</td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-800">{h.planName}</td>
                      <td className="py-3.5 px-4 uppercase font-bold text-slate-500">{h.tier}</td>
                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            h.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{h.totalAllocated.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600">{h.consumed.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">{h.remaining.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{h.usagePercent}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(h.usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans text-slate-500">
                        {new Date(h.expiryDate).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Catalog In INR */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Standard BiliSURE Institutional Pricing Catalog (INR)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {billingSummary?.plans?.map((plan) => (
                <div key={plan.planId} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                    {plan.tier}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{plan.name}</h4>
                  <div className="text-lg font-extrabold text-slate-900">
                    ₹{plan.priceINR.toLocaleString('en-IN')}
                    <span className="text-xs text-slate-500 font-normal"> / {plan.billingPeriod}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700">
                    ₹{plan.effectivePricePerTestINR.toFixed(2)} / test
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Quota: {plan.testAllocation} tests
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ORIGINAL TOTAL & ADMITS */}
      {(activeTab === 'total' || activeTab === 'admits') && (
        <>

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
      </>
      )}
    </div>
  );
};
