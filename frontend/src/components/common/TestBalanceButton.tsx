import React, { useState, useEffect, useRef } from 'react';
import { Layers, Activity, AlertTriangle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface HospitalBalance {
  facility: string;
  configured: boolean;
  planName?: string;
  totalAllocated: number;
  usedTests: number;
  remainingTests: number;
  usagePercent: number;
  isLowCredit?: boolean;
}

interface DistrictBalances {
  hospitals: HospitalBalance[];
  combined: {
    totalAllocated: number;
    usedTests: number;
    remainingTests: number;
    usagePercent: number;
  };
}

export const TestBalanceButton: React.FC = () => {
  const { isSuperAdmin, hospitalFacility } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hospitalBalance, setHospitalBalance] = useState<HospitalBalance | null>(null);
  const [districtBalances, setDistrictBalances] = useState<DistrictBalances | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      if (isSuperAdmin) {
        const res = await api.get('/billing/district-balances');
        setDistrictBalances(res.data.data);
      } else {
        const res = await api.get('/billing/balance');
        setHospitalBalance(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load test balance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [isSuperAdmin, hospitalFacility]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Compute ring percentage
  const usagePercent = isSuperAdmin
    ? districtBalances?.combined.usagePercent ?? 0
    : hospitalBalance?.usagePercent ?? 0;

  const remainingTests = isSuperAdmin
    ? districtBalances?.combined.remainingTests ?? 0
    : hospitalBalance?.remainingTests ?? 0;

  // Circular indicator parameters matching reference design
  const size = 18;
  const radius = size / 2;
  const stroke = 2;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const displayPercent = Math.max(0, Math.min(100, Math.round(100 - usagePercent)));
  const strokeDashoffset = circumference - (displayPercent / 100) * circumference;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Test Balance Indicator Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Test Balance"
        className={clsx(
          'inline-flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors focus:outline-none cursor-pointer select-none',
          isOpen ? 'bg-slate-100' : 'hover:bg-slate-50/80'
        )}
      >
        {/* Percentage Text to the Left of the Circle */}
        <span className="text-xs font-medium text-slate-600 tracking-tight">
          {displayPercent}% left
        </span>

        {/* Thin Clean Green Circular Ring */}
        <svg height={size} width={size} className="transform -rotate-90 shrink-0">
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="#22c55e"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-500 ease-out"
          />
        </svg>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-5 z-50 animate-fade-in text-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isSuperAdmin ? 'District Test Quotas' : `${hospitalBalance?.facility || hospitalFacility} Balance`}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {isSuperAdmin ? 'PGI, RML & KGMU Combined' : 'Authenticated Hospital Allocation'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="mt-3.5 space-y-3.5">
            {!isSuperAdmin && hospitalBalance && (
              <>
                {/* 3 Metric Summary Boxes */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Total</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                      {hospitalBalance.totalAllocated.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Used</span>
                    <span className="text-sm font-extrabold text-slate-600 mt-0.5 block">
                      {hospitalBalance.usedTests.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-semibold text-blue-600 uppercase block">Remaining</span>
                    <span className="text-sm font-extrabold text-blue-700 mt-0.5 block">
                      {hospitalBalance.remainingTests.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-medium">
                    <span className="text-slate-500">Consumption Rate</span>
                    <span className="font-bold text-slate-800">{hospitalBalance.usagePercent}% Used</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-500',
                        hospitalBalance.usagePercent > 85 ? 'bg-amber-500' : 'bg-blue-600'
                      )}
                      style={{ width: `${Math.min(hospitalBalance.usagePercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Low credit alert if applicable */}
                {hospitalBalance.isLowCredit && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Quota below 15%. Notify biomedical team for hospital top-up.</span>
                  </div>
                )}
              </>
            )}

            {/* Super Admin District-Wise View */}
            {isSuperAdmin && districtBalances && (
              <>
                {/* District Combined Bar */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span>Lucknow Division Total</span>
                    <span className="text-blue-700 font-extrabold">
                      {districtBalances.combined.remainingTests.toLocaleString()} / {districtBalances.combined.totalAllocated.toLocaleString()} Available
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(districtBalances.combined.usagePercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{districtBalances.combined.usedTests.toLocaleString()} used</span>
                    <span>{districtBalances.combined.usagePercent}% consumed</span>
                  </div>
                </div>

                {/* Individual Hospital Balances: PGI, RML, KGMU */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Hospital Allocation Breakdown
                  </span>
                  {districtBalances.hospitals.map((h) => (
                    <div
                      key={h.facility}
                      className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{h.facility} Hospital</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Total: <strong className="text-slate-700">{h.totalAllocated.toLocaleString()}</strong> · Used: <strong className="text-slate-700">{h.usedTests.toLocaleString()}</strong>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-blue-700">
                          {h.remainingTests.toLocaleString()} left
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {h.usagePercent}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
