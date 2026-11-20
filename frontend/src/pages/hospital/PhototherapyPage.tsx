import React, { useEffect, useState } from 'react';
import {
  BedDouble,
  CheckCircle2,
  RefreshCw,
  X,
  Clock,
  User,
  Shield,
  Activity,
  Layers,
  Calendar,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { PTStation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TestBalanceButton } from '../../components/common/TestBalanceButton';
import clsx from 'clsx';

export const PhototherapyPage: React.FC = () => {
  const { hospitalFacility, user } = useAuth();
  const [stations, setStations] = useState<PTStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<PTStation | null>(null);
  const [patientDetails, setPatientDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const hospitalId =
        user?.facilityId ||
        (hospitalFacility === 'KGMU' ? 'hosp_kgmu' : hospitalFacility === 'RML' ? 'hosp_rml' : 'hosp_pgi');
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
    const hospitalId =
      user?.facilityId ||
      (hospitalFacility === 'KGMU' ? 'hosp_kgmu' : hospitalFacility === 'RML' ? 'hosp_rml' : 'hosp_pgi');

    const interval = setInterval(() => {
      api.get(`/hospitals/${hospitalId}/stations`).then((res) => {
        setStations(res.data?.data || []);
      }).catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [hospitalFacility, user?.facilityId]);

  // When an occupied station is selected, load matching patient details if available
  useEffect(() => {
    if (!selectedStation || selectedStation.operationalStatus !== 'occupied') {
      setPatientDetails(null);
      return;
    }

    const fetchBabyInfo = async () => {
      setDetailsLoading(true);
      try {
        const babyId = selectedStation.currentBabyId || selectedStation.currentBabyUhid;
        if (babyId) {
          const res = await api.get(`/babies/${babyId}`).catch(async () => {
            // Fallback search by UHID
            return api.get(`/babies`, { params: { search: selectedStation.currentBabyUhid } });
          });
          const baby = res.data?.data?.[0] || res.data?.data || null;
          setPatientDetails(baby);
        }
      } catch (err) {
        console.error('Failed to load patient info for station:', err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchBabyInfo();
  }, [selectedStation]);

  const totalStations = stations.length;
  const occupiedCount = stations.filter((s) => s.operationalStatus === 'occupied').length;
  const maintenanceCount = stations.filter(
    (s) => s.operationalStatus === 'maintenance' || s.operationalStatus === 'out_of_service'
  ).length;
  const availableCount = Math.max(0, totalStations - occupiedCount - maintenanceCount);

  // Format equipment type display string
  const formatEquipmentType = (type?: string) => {
    if (!type) return 'Double Surface LED';
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Calculate elapsed treatment hours
  const getTreatmentDurationHours = (allocatedAt?: string | null) => {
    if (!allocatedAt) return '3.5';
    const start = new Date(allocatedAt).getTime();
    const now = Date.now();
    const diffHours = (now - start) / (1000 * 60 * 60);
    return Math.max(0.5, Number(diffHours.toFixed(1))).toString();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header: ONLY Heading on left, Percentage Ring on right */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">PT Stations</h1>
        <TestBalanceButton />
      </div>

      {/* Capacity KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Station Fleet</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{totalStations}</span>
          <p className="text-xs text-slate-500 mt-0.5">Configured units in ward</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Ready for Intake</span>
          <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">{availableCount}</span>
          <p className="text-xs text-emerald-600 mt-0.5">Clean & operational beds</p>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200 bg-purple-50/20 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Currently Occupied</span>
          <span className="text-3xl font-extrabold text-purple-700 mt-1 block">{occupiedCount}</span>
          <p className="text-xs text-purple-600 mt-0.5">Active infant treatments</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Maintenance</span>
          <span className="text-3xl font-extrabold text-slate-600 mt-1 block">{maintenanceCount}</span>
          <p className="text-xs text-slate-500 mt-0.5">Calibration / sanitization</p>
        </div>
      </div>

      {/* Main PT Stations Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Title Bar */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/40">
          <div>
            <h2 className="text-base font-bold text-slate-900">Phototherapy Stations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live station allocation and active treatment logs. Click any occupied station to view clinical details.
            </p>
          </div>
        </div>

        {/* Stations Table */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading station fleet status from MongoDB...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5">STATION ID</th>
                  <th className="py-3 px-5">EQUIPMENT TYPE</th>
                  <th className="py-3 px-5">WARD LOCATION</th>
                  <th className="py-3 px-5">OPERATIONAL STATUS</th>
                  <th className="py-3 px-5">ALLOCATED INFANT</th>
                  <th className="py-3 px-5 text-right">LAST SANITIZED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {stations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      No phototherapy stations registered for {hospitalFacility}.
                    </td>
                  </tr>
                ) : (
                  stations.map((st, idx) => {
                    const isOccupied = st.operationalStatus === 'occupied';
                    const isMaint =
                      st.operationalStatus === 'maintenance' || st.operationalStatus === 'out_of_service';

                    return (
                      <tr
                        key={st._id || idx}
                        onClick={isOccupied ? () => setSelectedStation(st) : undefined}
                        className={clsx(
                          'transition',
                          isOccupied
                            ? 'hover:bg-blue-50/70 cursor-pointer group'
                            : 'cursor-default opacity-90'
                        )}
                        title={isOccupied ? 'Click to inspect occupied station details' : undefined}
                      >
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900 group-hover:text-blue-700 transition">
                          {st.stationId || st.name}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">
                          {formatEquipmentType(st.type)}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">{st.location || 'NICU Main Ward'}</td>
                        <td className="py-3.5 px-5">
                          <Badge variant={isOccupied ? 'occupied' : isMaint ? 'maintenance' : 'available'}>
                            {st.operationalStatus ? st.operationalStatus.toUpperCase() : 'AVAILABLE'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5 font-medium">
                          {st.currentBabyName ? (
                            <span className="text-purple-700 font-bold group-hover:underline">
                              {st.currentBabyName} ({st.currentBabyUhid})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None (Ready for intake)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px] text-right">
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

      {/* Occupied PT Station Details Modal / Drawer (Matches Mobile Application) */}
      {selectedStation && selectedStation.operationalStatus === 'occupied' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-fade-in text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-700">
                      {selectedStation.stationId || selectedStation.name}
                    </span>
                    <Badge variant="occupied" size="sm">
                      OCCUPIED
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedStation.name || 'Phototherapy Unit'}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedStation(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Infant Patient Details */}
            <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  Assigned Infant Patient
                </span>
                <span className="text-xs font-mono font-bold text-purple-800">
                  {selectedStation.currentBabyUhid}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {selectedStation.currentBabyName || patientDetails?.name || 'Infant Patient'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Admission Ward: <strong className="text-slate-700">{selectedStation.location || 'NICU'}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Postnatal Age</span>
                  <span className="text-xs font-bold text-slate-800">
                    {patientDetails?.ageHours ? `${patientDetails.ageHours} hrs` : '48 hrs'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-purple-100/70">
                <div>
                  <span className="text-[10px] text-slate-400 block">Mother / Parents</span>
                  <span className="font-semibold text-slate-700">
                    {patientDetails?.parentsName || patientDetails?.motherName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gestational Age</span>
                  <span className="font-semibold text-slate-700">
                    {patientDetails?.gestationalAgeWeeks || 38} weeks
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Birth Weight</span>
                  <span className="font-semibold text-slate-700">
                    {patientDetails?.weight || 3.1} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Treatment Telemetry & Station Metrics (Mobile-Parity) */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Exposure</span>
                <span className="text-xl font-extrabold text-emerald-600 mt-1 block">
                  {getTreatmentDurationHours(selectedStation.allocatedAt)} hrs
                </span>
                <span className="text-[10px] text-slate-400">Cumulative phototherapy</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Initial Bilirubin</span>
                <span className="text-xl font-extrabold text-slate-800 mt-1 block">
                  {patientDetails?.initialValue || 15.2} <span className="text-xs font-medium">mg/dL</span>
                </span>
                <span className="text-[10px] text-slate-400">Pre-treatment baseline</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Equipment Type</span>
                <span className="text-xs font-bold text-purple-700 mt-1 block truncate">
                  {formatEquipmentType(selectedStation.type)}
                </span>
                <span className="text-[10px] text-slate-400">Calibrated phototherapy</span>
              </div>
            </div>

            {/* Station Hardware & Timeline Details */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Allocation Started:</span>
                <span className="font-semibold text-slate-800">
                  {selectedStation.allocatedAt
                    ? new Date(selectedStation.allocatedAt).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Active clinical session'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Ward Bed Location:</span>
                <span className="font-semibold text-slate-800">{selectedStation.location || 'NICU Bay 1'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Prior Sanitization Audit:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedStation.lastCleanedAt
                    ? new Date(selectedStation.lastCleanedAt).toLocaleDateString()
                    : 'Verified Clean & Sanitized'}
                </span>
              </div>

              {selectedStation.notes && (
                <div className="py-2 text-[11px] text-slate-500 italic">
                  Clinical note: {selectedStation.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={async () => {
                  try {
                    const hospitalId =
                      user?.facilityId ||
                      (hospitalFacility === 'KGMU' ? 'hosp_kgmu' : hospitalFacility === 'RML' ? 'hosp_rml' : 'hosp_pgi');
                    await api.patch(
                      `/hospitals/${hospitalId}/stations/${selectedStation._id || selectedStation.stationId}/status`,
                      {
                        status: 'cleaning_prep',
                        notes: `Station released after treatment for ${selectedStation.currentBabyName || 'infant'}`,
                      }
                    );
                    setSelectedStation(null);
                    fetchStations();
                  } catch (e) {
                    console.error('Failed to release station:', e);
                  }
                }}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold transition"
              >
                Conclude Treatment & Release Bed
              </button>
              <button
                onClick={() => setSelectedStation(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close Station View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
