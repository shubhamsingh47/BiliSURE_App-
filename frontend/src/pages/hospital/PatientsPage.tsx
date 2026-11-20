import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, Users, AlertCircle, Baby as BabyIcon, ChevronRight } from 'lucide-react';
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

  // Fetch total hospital babies count (unfiltered baseline)
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

  // Fetch filtered patients list
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
      // If no search or filters applied, update total count
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patients & Clinical Cohort</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered neonatal admissions and hour-specific monitoring under {hospitalFacility} care
          </p>
        </div>

        {/* Dynamic Metric Indicator Badges (Requirement 3: Dynamic All Babies Count) */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <BabyIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">All Babies</span>
              <span className="text-base font-extrabold text-slate-900 leading-none">
                {totalHospitalBabies} <span className="text-xs font-medium text-slate-500">infants</span>
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Treatment</span>
              <span className="text-base font-extrabold text-purple-700 leading-none">
                {underTreatmentCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by patient name, UHID, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm transition"
            />
          </form>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ward:</span>
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

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Severity:</span>
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
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabular Patient Records */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Fetching patient cohort from database...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5">INFANT / UHID</th>
                  <th className="py-3 px-5">WARD</th>
                  <th className="py-3 px-5">GESTATION</th>
                  <th className="py-3 px-5">INITIAL TCB</th>
                  <th className="py-3 px-5">SEVERITY</th>
                  <th className="py-3 px-5">CLINICAL STATUS</th>
                  <th className="py-3 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                      No patients matching the specified filters found for {hospitalFacility}.
                    </td>
                  </tr>
                ) : (
                  patients.map((baby) => {
                    const measurement = baby.initialValue || 10.5;
                    const isHigh = baby.severityState === 'critical' || measurement >= 14;

                    return (
                      <tr key={baby._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900">{baby.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{baby.uhid}</p>
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">{baby.department || 'NICU'}</td>
                        <td className="py-3.5 px-5 text-slate-600">{baby.gestationalAgeWeeks || 38} wks</td>
                        <td className="py-3.5 px-5">
                          <span className="font-extrabold text-slate-900 text-sm">{measurement}</span>{' '}
                          <span className="text-[11px] text-slate-500">mg/dL</span>
                        </td>
                        <td className="py-3.5 px-5">
                          <Badge variant={baby.severityState === 'critical' ? 'critical' : baby.severityState === 'moderate' ? 'moderate' : 'normal'}>
                            {baby.severityState?.toUpperCase() || 'NORMAL'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5">
                          <Badge variant={baby.status === 'discharged' ? 'normal' : baby.status === 'under_treatment' ? 'occupied' : 'pending'}>
                            {baby.status?.replace('_', ' ') || 'Admitted'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
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
                            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 text-xs font-semibold text-slate-700 transition inline-flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
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
