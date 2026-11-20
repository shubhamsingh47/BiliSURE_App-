import React, { useEffect, useState } from 'react';
import { X, Calendar, Activity, Cpu, User, ShieldCheck, Clock, FileText, Layers, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../common/Badge';
import { BhutaniNomogramWeb, ReadingItem } from './BhutaniNomogramWeb';

interface PatientDrawerProps {
  patient: any | null;
  onClose: () => void;
}

export const PatientDrawer: React.FC<PatientDrawerProps> = ({ patient, onClose }) => {
  const [activeTab, setActiveTab] = useState<'nomogram' | 'samples'>('nomogram');
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patient) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const id = patient.uhid || patient.babyId || patient._id;
        const readingsRes = await api.get(`/readings/baby/${id}`).catch(() => ({ data: { data: [] } }));
        const rawReadings = readingsRes.data?.data || [];
        setReadings(rawReadings);
      } catch (err) {
        console.error('Failed to load baby history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [patient]);

  if (!patient) return null;

  // Convert database readings to Nomogram items
  const nomogramReadings: ReadingItem[] = readings.map((r: any) => ({
    id: r._id,
    postnatalAgeHours: r.postnatalAgeHours || 24,
    valueMgDl: r.valueMgDl || r.value || 0,
    unit: r.unit || 'mg/dL',
    method: r.method || 'TcB',
    measurementSite: r.measurementSite || 'Forehead',
    timestamp: r.timestamp || r.createdAt,
    operatorName: r.operatorName || 'Nurse Staff',
  }));

  const latestVal = patient.measurementValue || (readings.length > 0 ? readings[0].valueMgDl || readings[0].value : 0);
  const isHigh = latestVal >= 14 || patient.severityState === 'critical';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm transition-opacity flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{patient.patientName || patient.name || 'Infant Patient'}</h2>
              <Badge variant={isHigh ? 'critical' : 'normal'}>
                {patient.severityState?.toUpperCase() || (isHigh ? 'CRITICAL' : 'NORMAL')}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              UHID: <span className="font-semibold text-slate-700">{patient.uhid}</span> · Ward: {patient.ward || patient.department || 'NICU'} · Gestation: {patient.gestationalAgeWeeks || 38}w
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex gap-6">
          <button
            onClick={() => setActiveTab('nomogram')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'nomogram'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Bhutani Nomogram</span>
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'samples'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Complete Sample History ({readings.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
              Loading clinical records from MongoDB...
            </div>
          ) : activeTab === 'nomogram' ? (
            <div className="space-y-5">
              {/* Clinical Bhutani Nomogram View */}
              <BhutaniNomogramWeb
                readings={nomogramReadings}
                gestationalAgeWeeks={patient.gestationalAgeWeeks || 38}
              />

              {/* Patient Core Vital Parameters */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">
                  Neonatal Clinical Profile
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date of Birth</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Recorded in DB'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Admission Status</span>
                    <span className="font-bold text-slate-800 mt-0.5 block capitalize">
                      {patient.status?.replace('_', ' ') || 'Admitted'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Attending Doctor</span>
                    <span className="font-bold text-slate-800 mt-0.5 block truncate">
                      {patient.assignedDoctor || 'Dr. Neonatologist'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Birth Weight</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {patient.weight || 3.1} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Complete Sample / Measurement History View (Requirement 5) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">All Bilirubin Samples & Measurements</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological audit log of all readings captured for {patient.uhid}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {readings.length} Total Records
                </span>
              </div>

              {/* Complete Sample History */}
              {readings.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-500 font-semibold">No bilirubin samples recorded for this infant.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {readings.map((sample: any, idx: number) => {
                    const isHighRisk = sample.bhutaniZone === 'high' || (sample.valueMgDl || sample.value) >= 14;

                    return (
                      <div
                        key={sample._id || idx}
                        className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-default"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {sample.valueMgDl || sample.value} {sample.unit || 'mg/dL'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[10px]">
                              {sample.method || 'TcB'}
                            </span>
                            <Badge variant={isHighRisk ? 'critical' : sample.bhutaniZone === 'high_intermediate' ? 'moderate' : 'normal'} size="sm">
                              {sample.bhutaniZone ? sample.bhutaniZone.replace('_', ' ').toUpperCase() : 'LOW RISK'}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                            <span>Postnatal Age: <strong className="text-slate-700">{sample.postnatalAgeHours || 24}h</strong></span>
                            <span>Site: <strong className="text-slate-700 capitalize">{sample.measurementSite || 'Forehead'}</strong></span>
                            <span>Device: <strong className="text-slate-700 font-mono">{sample.deviceSerial || 'BLS-004'}</strong></span>
                            <span>Operator: <strong className="text-slate-700">{sample.operatorName || 'Nurse Staff'}</strong></span>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                          {new Date(sample.timestamp || sample.createdAt).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 italic">
            Clinical Governance: Screening values (TcB) require serum TSB confirmation before phototherapy.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
