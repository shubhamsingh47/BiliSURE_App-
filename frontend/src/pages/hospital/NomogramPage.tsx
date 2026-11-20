import React, { useEffect, useState } from 'react';
import { Search, Activity, User, Eye, ArrowUpRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { BilirubinReading } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BhutaniNomogramWeb, ReadingItem } from '../../components/patient/BhutaniNomogramWeb';
import { PatientDrawer } from '../../components/patient/PatientDrawer';
import { TestBalanceButton } from '../../components/common/TestBalanceButton';
import { Badge } from '../../components/common/Badge';

export const NomogramPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [readings, setReadings] = useState<BilirubinReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [activeReading, setActiveReading] = useState<BilirubinReading | null>(null);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/readings', {
        params: {
          search: search.trim() || undefined,
          limit: 100,
        },
      });
      const data = res.data?.data || [];
      setReadings(data);
      if (data.length > 0 && !activeReading) {
        setActiveReading(data[0]);
      }
    } catch (err) {
      console.error('Failed to load readings for nomogram:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [hospitalFacility]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReadings();
  };

  // Convert readings to chart format
  const chartReadings: ReadingItem[] = readings.slice(0, 30).map((r: any) => ({
    id: r._id,
    postnatalAgeHours: r.postnatalAgeHours || 36,
    valueMgDl: r.valueMgDl || r.value || 0,
    unit: r.unit || 'mg/dL',
    method: r.method || 'TcB',
    measurementSite: r.measurementSite || 'Forehead',
    timestamp: r.timestamp || r.createdAt,
    operatorName: r.operatorName || 'Nurse Staff',
  }));

  const getRiskBadge = (r: BilirubinReading) => {
    const val = r.valueMgDl || r.value || 0;
    const age = r.postnatalAgeHours || 48;
    if (val >= 15 || (age < 48 && val > 11)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3" />
          High Risk (&gt;95th)
        </span>
      );
    }
    if (val >= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Intermediate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3 h-3" />
        Low Risk (&lt;40th)
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header: Only heading on left, Balance indicator on right */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nomogram</h1>
        <TestBalanceButton />
      </div>

      {/* Interactive Bhutani Nomogram Curve Visualization */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Bhutani Risk Stratification Curve</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">AAP & Bhutani et al. Guidelines</span>
        </div>

        <BhutaniNomogramWeb
          readings={chartReadings}
          gestationalAgeWeeks={38}
        />
      </div>

      {/* Bilirubin Readings Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Bilirubin Readings Ledger</h2>
            <span className="text-xs text-slate-400 font-medium">Recorded transcutaneous & serum telemetry</span>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by UHID, patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Patient UHID</th>
                <th className="py-3 px-4">Postnatal Age</th>
                <th className="py-3 px-4">TcB Value</th>
                <th className="py-3 px-4">Method / Site</th>
                <th className="py-3 px-4">Risk Stratification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading clinical readings...
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No readings found matching criteria.
                  </td>
                </tr>
              ) : (
                readings.map((r) => {
                  const val = r.valueMgDl || r.value || 0;
                  const isSelected = activeReading?._id === r._id;

                  return (
                    <tr
                      key={r._id}
                      onClick={() => setActiveReading(r)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition ${
                        isSelected ? 'bg-blue-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {r.timestamp ? new Date(r.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {r.babyUhid || r.babyId || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {r.postnatalAgeHours ? `${r.postnatalAgeHours}h` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="text-sm">{val.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          {r.unit || 'mg/dL'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                          {r.method || 'TcB'}
                        </span>
                        <span className="text-slate-400 ml-1.5 text-[11px]">
                          {r.measurementSite || 'Forehead'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getRiskBadge(r)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient({
                              uhid: r.babyUhid || r.babyId,
                              babyId: r.babyId || r.babyUhid,
                              measurementValue: val,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
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
