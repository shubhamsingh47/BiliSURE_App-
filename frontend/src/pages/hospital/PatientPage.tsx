import React, { useEffect, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { Baby } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { PatientDrawer } from '../../components/patient/PatientDrawer';
import { TestBalanceButton } from '../../components/common/TestBalanceButton';

export const PatientPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [patients, setPatients] = useState<Baby[]>([]);
  const [totalPatientCount, setTotalPatientCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState<Baby | null>(null);

  // Fetch baseline total count for authenticated hospital scope
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/babies', { params: { limit: 1 } });
        const total = res.data?.pagination?.total ?? res.data?.total ?? res.data?.data?.length ?? 0;
        setTotalPatientCount(total);
      } catch (e) {
        console.error('Failed to fetch patient count:', e);
      }
    };
    fetchCount();
  }, [hospitalFacility]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/babies', {
        params: {
          search: search.trim() || undefined,
          department: wardFilter !== 'All' ? wardFilter : undefined,
          severityState: severityFilter !== 'All' ? severityFilter.toLowerCase() : undefined,
          limit: 100,
        },
      });
      const data = res.data?.data || [];
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [hospitalFacility, wardFilter, severityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  const getSeverityBadge = (p: Baby) => {
    const sev = p.severityState || 'normal';
    switch (sev) {
      case 'critical':
        return <Badge variant="critical">Critical</Badge>;
      case 'moderate':
        return <Badge variant="moderate">Moderate</Badge>;
      default:
        return <Badge variant="normal">Normal</Badge>;
    }
  };

  const getPostnatalAge = (dobString: string): string => {
    if (!dobString) return '48h';
    const birth = new Date(dobString).getTime();
    const now = Date.now();
    const hours = Math.round((now - birth) / (1000 * 60 * 60));
    return hours > 0 ? `${hours}h` : '12h';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header: Only heading on left with subtle patient count, Balance circle on right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient</h1>
          {totalPatientCount !== null && (
            <span
              title="Total Hospital Patient Cohort"
              className="text-xs font-semibold font-mono text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full"
            >
              {totalPatientCount}
            </span>
          )}
        </div>
        <TestBalanceButton />
      </div>

      {/* Main Patient Directory Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, UHID, parents name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Ward:</span>
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-1.5 font-medium focus:outline-none"
              >
                <option value="All">All Wards</option>
                <option value="NICU">NICU</option>
                <option value="Postnatal">Postnatal Ward</option>
                <option value="SNCU">SNCU</option>
                <option value="Labour Ward">Labour Ward</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-1.5 font-medium focus:outline-none"
              >
                <option value="All">All Severities</option>
                <option value="normal">Normal</option>
                <option value="moderate">Moderate</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Infant & UHID</th>
                <th className="py-3 px-4">Parent's Name</th>
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4">Gestation & Age</th>
                <th className="py-3 px-4">Initial TcB</th>
                <th className="py-3 px-4">Clinical Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading patient cohort...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No neonatal patients found matching the selected filters.
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const val = p.initialValue || 0;
                  return (
                    <tr
                      key={p._id || p.uhid}
                      onClick={() => setSelectedPatient(p)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.name || 'Infant of ' + (p.parentsName || 'Patient')}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{p.uhid}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {p.parentsName || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {p.department || 'NICU'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {p.gestationalAgeWeeks ? `${p.gestationalAgeWeeks}w` : '38w'} · {getPostnatalAge(p.dateOfBirth)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="text-sm">{val > 0 ? val.toFixed(1) : '—'}</span>
                        {val > 0 && <span className="text-[10px] text-slate-500 font-normal ml-1">mg/dL</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {getSeverityBadge(p)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient(p);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <span>Review</span>
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
