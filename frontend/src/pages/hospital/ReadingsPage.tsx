import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, Activity } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { BilirubinReading } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PatientDrawer } from '../../components/patient/PatientDrawer';

export const ReadingsPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [readings, setReadings] = useState<BilirubinReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/readings', {
        params: { search: search.trim() || undefined, limit: 50 },
      });
      setReadings(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load readings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [hospitalFacility]);

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-5">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Bilirubin Readings & Nomogram Logs</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>{hospitalFacility} Telemetry</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <form onSubmit={(e) => { e.preventDefault(); fetchReadings(); }} className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by UHID or operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 shadow-xs transition"
            />
          </form>

          <button
            onClick={fetchReadings}
            title="Refresh Readings"
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {/* Readings Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Fetching reading database from MongoDB...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Infant / UHID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Postnatal Age</th>
                  <th className="py-3 px-4">Bilirubin Value</th>
                  <th className="py-3 px-4">Modality</th>
                  <th className="py-3 px-4">Bhutani Risk Zone</th>
                  <th className="py-3 px-4 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {readings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No bilirubin readings recorded yet for this facility.
                    </td>
                  </tr>
                ) : (
                  readings.map((r) => {
                    const isHigh = r.bhutaniZone === 'high' || r.valueMgDl >= 14;
                    const zoneBadgeVariant =
                      r.bhutaniZone === 'high'
                        ? 'critical'
                        : r.bhutaniZone === 'high_intermediate'
                        ? 'moderate'
                        : 'normal';

                    return (
                      <tr
                        key={r._id}
                        onClick={() =>
                          setSelectedPatient({
                            patientName: r.babyName || r.babyUhid,
                            uhid: r.babyUhid,
                            ward: r.department || 'NICU',
                            ageHours: r.postnatalAgeHours,
                            measurementValue: r.valueMgDl || r.value,
                            unit: r.unit,
                            timestamp: r.timestamp,
                            measurementSite: r.measurementSite,
                            operatorName: r.operatorName,
                            deviceSerial: r.deviceSerial,
                            reviewStatus: isHigh ? 'Pending review' : 'Reviewed',
                            bhutaniZone: r.bhutaniZone,
                          })
                        }
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                        title="Click to inspect Bhutani nomogram and sample history"
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {r.babyName || r.babyUhid}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{r.babyUhid}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {new Date(r.timestamp || r.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {r.postnatalAgeHours || 48} h
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 text-sm">
                            {r.valueMgDl || r.value}
                          </span>{' '}
                          <span className="text-[11px] text-slate-500">{r.unit || 'mg/dL'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
                            {r.method || 'TcB'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={zoneBadgeVariant}>
                            {r.bhutaniZone ? r.bhutaniZone.replace('_', ' ').toUpperCase() : 'LOW RISK'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-600 group-hover:text-blue-600 transition-colors">
                          {r.operatorName || 'Nurse Staff'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PatientDrawer
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
};
