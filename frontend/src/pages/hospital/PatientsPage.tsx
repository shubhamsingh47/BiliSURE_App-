import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, Users, Baby as BabyIcon, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { PatientDrawer } from '../../components/patient/PatientDrawer';
import { Baby } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const PatientsPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [patients, setPatients] = useState<Baby[]>([]);
  const [totalHospitalBabies, setTotalHospitalBabies] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  const fetchTotalCount = async () => {
    try {
      const res = await api.get('/babies', {
        params: { limit: 1 },
      });
      if (res.data?.pagination?.total !== undefined) {
        setTotalHospitalBabies(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load total baby count:', err);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/babies', {
        params: {
          search: search.trim() || undefined,
          department: departmentFilter !== 'All' ? departmentFilter : undefined,
          severityState: severityFilter !== 'All' ? severityFilter.toLowerCase() : undefined,
          limit: 100,
        },
      });
      setPatients(res.data?.data || []);
      if (!search.trim() && departmentFilter === 'All' && severityFilter === 'All') {
        if (res.data?.pagination?.total !== undefined) {
          setTotalHospitalBabies(res.data.pagination.total);
        }
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalCount();
  }, [hospitalFacility]);

  useEffect(() => {
    fetchPatients();
  }, [hospitalFacility, departmentFilter, severityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  const criticalCount = patients.filter((b) => b.severityState === 'critical').length;
  const underTreatmentCount = patients.filter((b) => b.status === 'under_treatment' || b.status === 'admitted').length;

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-5">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Patients & Clinical Cohort</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <span>{hospitalFacility} Care</span>
          </div>
        </div>

        {/* Dynamic Metric Indicator Badges */}
        <div className="flex items-center gap-2.5">
          <div className="bg-white border border-slate-200/90 rounded-lg px-3.5 py-1.5 shadow-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <BabyIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">All Babies</span>
              <span className="text-sm font-bold text-slate-900 leading-none">
                {totalHospitalBabies} <span className="text-xs font-normal text-slate-500">infants</span>
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg px-3.5 py-1.5 shadow-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">In Treatment</span>
              <span className="text-sm font-bold text-purple-700 leading-none">
                {underTreatmentCount}
              </span>
            </div>
          </div>

          {criticalCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-rose-700">{criticalCount} Critical</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-3.5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by patient name, UHID, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs transition"
            />
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ward:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Wards</option>
                <option value="NICU">NICU</option>
                <option value="Postnatal">Postnatal</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Severities</option>
                <option value="normal">Normal</option>
                <option value="moderate">Moderate</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <button
              onClick={fetchPatients}
              title="Refresh Records"
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabular Patient Records */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Fetching patient cohort from database...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Infant / UHID</th>
                  <th className="py-3 px-4">Ward</th>
                  <th className="py-3 px-4">Gestation</th>
                  <th className="py-3 px-4">Initial TcB</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Clinical Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No patients matching the specified filters found for {hospitalFacility}.
                    </td>
                  </tr>
                ) : (
                  patients.map((baby) => {
                    const measurement = baby.initialValue || 10.5;
                    const isHigh = baby.severityState === 'critical' || measurement >= 14;

                    return (
                      <tr
                        key={baby._id}
                        onClick={() =>
                          setSelectedPatient({
                            ...baby,
                            patientName: baby.name,
                            uhid: baby.uhid,
                            ward: baby.department,
                            ageHours: 48,
                            measurementValue: measurement,
                            unit: 'mg/dL',
                            timestamp: baby.createdAt,
                            gestationalAgeWeeks: baby.gestationalAgeWeeks,
                            reviewStatus: isHigh ? 'Pending review' : 'Reviewed',
                            operatorName: 'Dr. Ward In-Charge',
                          })
                        }
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                        title="Click to inspect patient details, Bhutani nomogram & sample history"
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{baby.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{baby.uhid}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{baby.department || 'NICU'}</td>
                        <td className="py-3 px-4 text-slate-600">{baby.gestationalAgeWeeks || 38} wks</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 text-sm">{measurement}</span>{' '}
                          <span className="text-[11px] text-slate-500">mg/dL</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={baby.severityState === 'critical' ? 'critical' : baby.severityState === 'moderate' ? 'moderate' : 'normal'}>
                            {baby.severityState?.toUpperCase() || 'NORMAL'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={baby.status === 'discharged' ? 'normal' : baby.status === 'under_treatment' ? 'occupied' : 'pending'}>
                            {baby.status?.replace('_', ' ') || 'Admitted'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2.5 py-1 rounded-md border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-700 text-xs font-medium text-slate-600 transition-colors inline-flex items-center gap-1">
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                          </span>
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

      {/* Slide-over Patient Drawer with Bhutani Nomogram & Full Sample History */}
      <PatientDrawer
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
};
