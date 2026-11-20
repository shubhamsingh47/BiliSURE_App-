import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, BedDouble } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { PTStation } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const PhototherapyPage: React.FC = () => {
  const { hospitalFacility, user } = useAuth();
  const [stations, setStations] = useState<PTStation[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');
  const [loading, setLoading] = useState(true);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const hospitalId = user?.facilityId || (hospitalFacility === 'KGMU' ? 'hosp_kgmu' : hospitalFacility === 'RML' ? 'hosp_rml' : 'hosp_pgi');
      const res = await api.get(`/hospitals/${hospitalId}/stations`);
      setStations(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, [hospitalFacility]);

  const totalStations = stations.length;
  const occupiedCount = stations.filter((s) => s.operationalStatus === 'occupied').length;
  const maintenanceCount = stations.filter((s) => s.operationalStatus === 'maintenance' || s.operationalStatus === 'out_of_service').length;
  const availableCount = Math.max(0, totalStations - occupiedCount - maintenanceCount);

  const filteredStations = stations.filter((st) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'available') return st.operationalStatus === 'available' || (!st.operationalStatus && !st.currentBabyId);
    if (statusFilter === 'occupied') return st.operationalStatus === 'occupied';
    if (statusFilter === 'maintenance') return st.operationalStatus === 'maintenance' || st.operationalStatus === 'out_of_service';
    return true;
  });

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-5">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Device Fleet & PT Stations</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
            <BedDouble className="w-3.5 h-3.5" />
            <span>{hospitalFacility} Capacity</span>
          </div>
        </div>

        <button
          onClick={fetchStations}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Refresh Fleet Telemetry</span>
        </button>
      </div>

      {/* Fleet KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Station Fleet</span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{totalStations}</span>
          <p className="text-xs text-slate-500 mt-0.5">Configured units in ward</p>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Ready for Intake</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">{availableCount}</span>
          <p className="text-xs text-emerald-600/90 mt-0.5">Clean & operational beds</p>
        </div>

        <div className="bg-white rounded-xl border border-purple-200 bg-purple-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Currently Occupied</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </div>
          <span className="text-3xl font-extrabold text-purple-700 mt-1 block">{occupiedCount}</span>
          <p className="text-xs text-purple-600/90 mt-0.5">Active infant treatments</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">In Maintenance</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="text-3xl font-extrabold text-slate-700 mt-1 block">{maintenanceCount}</span>
          <p className="text-xs text-slate-500 mt-0.5">Calibration / sanitization</p>
        </div>
      </div>

      {/* Main Device Operations Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Phototherapy Station Fleet</h2>
            <span className="text-xs text-slate-400 font-normal">· {filteredStations.length} units displayed</span>
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'available', 'occupied', 'maintenance'] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setStatusFilter(filterKey)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === filterKey
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Stations Table */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading station fleet status...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Station ID</th>
                  <th className="py-3 px-4">Hardware Type</th>
                  <th className="py-3 px-4">Ward Location</th>
                  <th className="py-3 px-4">Quality Control</th>
                  <th className="py-3 px-4">Operational Status</th>
                  <th className="py-3 px-4">Allocated Infant</th>
                  <th className="py-3 px-4 text-right">Last Sanitized</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {filteredStations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No phototherapy stations matching status filter found.
                    </td>
                  </tr>
                ) : (
                  filteredStations.map((st, idx) => {
                    const isOccupied = st.operationalStatus === 'occupied';
                    const isMaint = st.operationalStatus === 'maintenance' || st.operationalStatus === 'out_of_service';

                    return (
                      <tr key={st._id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {st.stationId || st.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 capitalize">
                          {st.type ? st.type.replace(/_/g, ' ') : 'Double surface LED'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{st.location || 'NICU Main Ward'}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> QC Certified
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={isOccupied ? 'occupied' : isMaint ? 'maintenance' : 'available'}>
                            {st.operationalStatus ? st.operationalStatus.toUpperCase() : 'AVAILABLE'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {st.currentBabyName ? (
                            <span className="text-purple-700 font-bold">{st.currentBabyName} ({st.currentBabyUhid})</span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">None (Ready for intake)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] text-right">
                          {st.lastCleanedAt ? new Date(st.lastCleanedAt).toLocaleDateString() : 'Verified'}
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
    </div>
  );
};
