import React, { useEffect, useState } from 'react';
import { X, Activity, Clock, RefreshCw } from 'lucide-react';
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
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{patient.patientName || patient.name || 'Infant Patient'}</h2>
              <Badge variant={isHigh ? 'critical' : 'normal'}>
                {patient.severityState?.toUpperCase() || (isHigh ? 'CRITICAL' : 'NORMAL')}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              UHID: <span className="font-bold text-slate-800">{patient.uhid}</span> · Ward: {patient.ward || patient.department || 'NICU'} · Gestation: {patient.gestationalAgeWeeks || 38}w
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="px-6 pt-2 border-b border-slate-200 bg-white flex gap-6">
          <button
            onClick={() => setActiveTab('nomogram')}
            className={`pb-2.5 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'nomogram'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Bhutani Nomogram</span>
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`pb-2.5 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'samples'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sample History ({readings.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
              Loading clinical records from MongoDB...
            </div>
          ) : activeTab === 'nomogram' ? (
            <div className="space-y-4">
              <BhutaniNomogramWeb
                readings={nomogramReadings}
                gestationalAgeWeeks={patient.gestationalAgeWeeks || 38}
              />

              {/* Patient Core Vital Parameters */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                <h4 className="text-[11px] font-bold text-slate-500 mb-2.5 uppercase tracking-wider">
                  Neonatal Profile
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date of Birth</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Recorded in DB'}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Admission Status</span>
                    <span className="font-bold text-slate-800 mt-0.5 block capitalize">
                      {patient.status?.replace('_', ' ') || 'Admitted'}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Attending Doctor</span>
                    <span className="font-bold text-slate-800 mt-0.5 block truncate">
                      {patient.assignedDoctor || 'Dr. Ward In-Charge'}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Birth Weight</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {patient.weight || 3.1} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Bilirubin Samples & Measurements</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Audit log of all readings captured for {patient.uhid}
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {readings.length} Records
                </span>
              </div>

              {readings.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">No bilirubin samples recorded for this infant.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  {readings.map((sample: any, idx: number) => {
                    const isHighRisk = sample.bhutaniZone === 'high' || (sample.valueMgDl || sample.value) >= 14;

                    return (
                      <div
                        key={sample._id || idx}
                        className="p-3.5 hover:bg-blue-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {sample.valueMgDl || sample.value} {sample.unit || 'mg/dL'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">
                              {sample.method || 'TcB'}
                            </span>
                            <Badge variant={isHighRisk ? 'critical' : sample.bhutaniZone === 'high_intermediate' ? 'moderate' : 'normal'} size="sm">
                              {sample.bhutaniZone ? sample.bhutaniZone.replace('_', ' ').toUpperCase() : 'LOW RISK'}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-slate-500 text-[11px]">
                            <span>Postnatal Age: <strong className="text-slate-800">{sample.postnatalAgeHours || 24}h</strong></span>
                            <span>Site: <strong className="text-slate-800 capitalize">{sample.measurementSite || 'Forehead'}</strong></span>
                            <span>Device: <strong className="text-slate-800 font-mono">{sample.deviceSerial || 'BLS-004'}</strong></span>
                            <span>Operator: <strong className="text-slate-800">{sample.operatorName || 'Nurse Staff'}</strong></span>
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
            className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
