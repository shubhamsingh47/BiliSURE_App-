import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import clsx from 'clsx';
import api from '../../services/api';
import { HospitalSubscriptionData, TestUsageItem, UsageHistoryResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const UsagePage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [subData, setSubData] = useState<HospitalSubscriptionData | null>(null);
  const [usageData, setUsageData] = useState<UsageHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchUhid, setSearchUhid] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const [subRes, usageRes] = await Promise.all([
        api.get('/billing/subscription'),
        api.get(`/billing/usage-history?page=${page}&limit=15`),
      ]);
      setSubData(subRes.data.data);
      setUsageData(usageRes.data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to load usage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const metrics = subData?.metrics;
  const sub = subData?.subscription;

  const filteredRecords = (usageData?.records || []).filter((r) => {
    if (!searchUhid.trim()) return true;
    const q = searchUhid.toLowerCase();
    return (
      r.babyUhid.toLowerCase().includes(q) ||
      (r.babyName && r.babyName.toLowerCase().includes(q)) ||
      r.deviceSerial.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
            <Zap className="w-4 h-4" />
            BiliSURE Billing & Consumption
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Test Credits & Usage Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time neonatal screening consumption ledger and allocation status for{' '}
            <span className="text-slate-200 font-semibold">{hospitalFacility}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(currentPage)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#122033] hover:bg-[#1a2d47] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-800"
          >
            <RotateCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh Usage
          </button>

          <NavLink
            to="/hospital/billing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Upgrade Plan
          </NavLink>
        </div>
      </div>

      {/* Low Credits or Expiry Warning Banner */}
      {metrics?.isLowCredit && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3.5 animate-fade-in">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-300">
              Low Screening Credit Warning ({metrics.remainingTests} Tests Remaining)
            </h4>
            <p className="text-amber-200/80 mt-1 leading-relaxed">
              Your hospital test allocation is below 15%. To avoid clinical interruption in NICU or Postnatal wards, renew your subscription or upgrade test quotas now.
            </p>
          </div>
          <NavLink
            to="/hospital/billing"
            className="shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
          >
            Add Tests
          </NavLink>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Allocated */}
        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Allocated Tests</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics?.totalAllocatedTests?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-slate-400">Tests</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Current plan allocation ({sub?.planName || 'Monthly Tier'})
          </div>
        </div>

        {/* Consumed */}
        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Consumed / Used</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400">
              {metrics?.usedTests?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-slate-400">Screenings</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Recorded via BiliSURE devices
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Remaining Balance</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={clsx('text-3xl font-extrabold', metrics?.isLowCredit ? 'text-amber-400' : 'text-emerald-400')}>
              {metrics?.remainingTests?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-slate-400">Tests</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-500/80">
            Valid until {sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' }) : 'End of cycle'}
          </div>
        </div>

        {/* Usage % */}
        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Consumption Rate</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics?.usagePercent ?? 0}%
            </span>
            <span className="text-xs text-slate-400">Utilized</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={clsx(
                'h-1.5 rounded-full transition-all duration-500',
                (metrics?.usagePercent ?? 0) > 85 ? 'bg-amber-500' : 'bg-blue-500'
              )}
              style={{ width: `${Math.min(metrics?.usagePercent ?? 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Subscription Banner & Rates */}
      <div className="bg-gradient-to-r from-[#0d1c2d] to-[#091522] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Active Institutional Plan
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {sub?.status || 'Active'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {sub?.planName || 'Clinical Care High-Volume Plan'}
          </h3>
          <p className="text-xs text-slate-400">
            Effective Billing Rate: <span className="font-semibold text-white">₹{sub?.pricePerTestINR?.toFixed(2) || '39.99'}</span> per test | Cycle: {sub?.billingCycle || 'Monthly'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="bg-[#122033] px-4 py-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Cycle Start</span>
            <span className="text-slate-200 font-semibold font-sans">
              {sub?.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN') : 'N/A'}
            </span>
          </div>

          <div className="bg-[#122033] px-4 py-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Cycle Renewal</span>
            <span className="text-slate-200 font-semibold font-sans">
              {sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
            </span>
          </div>

          <NavLink
            to="/hospital/billing"
            className="inline-flex items-center gap-1.5 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-sans font-bold text-xs transition"
          >
            Change Plan
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* Usage Trend Chart */}
      <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Daily Screening Test Consumption Trend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated volumetric tests conducted at {hospitalFacility} across the last 30 days.
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          {usageData?.trend && usageData.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#16253a" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return `${parts[2]}/${parts[1]}`;
                  }}
                  stroke="#16253a"
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#16253a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1623',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} tests consumed`, 'Daily Consumption']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#usageGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No volumetric trend available for this timeframe.
            </div>
          )}
        </div>
      </div>

      {/* Detailed Usage History Table */}
      <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Test Consumption Audit Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live database audit log of each individual infant test debited against subscription.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search UHID, name, device..."
              value={searchUhid}
              onChange={(e) => setSearchUhid(e.target.value)}
              className="w-full bg-[#122033] border border-slate-700 text-xs text-slate-200 rounded-xl pl-9 pr-3 py-2 font-medium focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0e1b2d] text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-y border-slate-800/80">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Infant UHID</th>
                <th className="py-3 px-4">Infant Name</th>
                <th className="py-3 px-4">Device Serial</th>
                <th className="py-3 px-4">Method / Reading</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Billed Amount</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    No consumption records found in database.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.usageId} className="hover:bg-[#122033]/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {new Date(r.testTimestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{r.babyUhid}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-300">{r.babyName || 'Infant'}</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.deviceSerial}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="font-semibold text-white">
                        {r.readingValueMgDl ? `${r.readingValueMgDl} mg/dL` : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({r.method})</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-400">{r.operatorName}</td>
                    <td className="py-3.5 px-4 font-bold text-cyan-400">
                      -{r.creditsConsumed} test
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      ₹{r.costINR ? r.costINR.toFixed(2) : '39.99'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {usageData && usageData.pages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">
              Page {currentPage} of {usageData.pages} ({usageData.total} total consumption logs)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => fetchData(currentPage - 1)}
                className="px-3 py-1.5 bg-[#122033] hover:bg-[#1a2d47] text-slate-300 disabled:opacity-40 rounded-lg transition"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= usageData.pages}
                onClick={() => fetchData(currentPage + 1)}
                className="px-3 py-1.5 bg-[#122033] hover:bg-[#1a2d47] text-slate-300 disabled:opacity-40 rounded-lg transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
