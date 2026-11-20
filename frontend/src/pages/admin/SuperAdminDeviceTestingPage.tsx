import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  RotateCw,
  Search,
  Eye,
  X,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../services/api';
import { DeviceItem, DeviceHealthSummary, DeviceDiagnosticRecord } from '../../types';

export const SuperAdminDeviceTestingPage: React.FC = () => {
  const [facilityFilter, setFacilityFilter] = useState<'All' | 'PGI' | 'RML' | 'KGMU'>('All');
  const [summary, setSummary] = useState<DeviceHealthSummary | null>(null);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [history, setHistory] = useState<DeviceDiagnosticRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectDevice, setInspectDevice] = useState<DeviceItem | null>(null);
  const [deviceDiagnostics, setDeviceDiagnostics] = useState<DeviceDiagnosticRecord[]>([]);
  const [selectedScanReport, setSelectedScanReport] = useState<DeviceDiagnosticRecord | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = facilityFilter !== 'All' ? { facility: facilityFilter } : {};
      const [sumRes, devRes, histRes] = await Promise.all([
        api.get('/device-testing/summary', { params }),
        api.get('/device-testing/devices', { params }),
        api.get('/device-testing/history', { params: { ...params, limit: 30 } }),
      ]);

      setSummary(sumRes.data.data);
      setDevices(devRes.data.data || []);
      setHistory(histRes.data.records || []);
    } catch (err) {
      console.error('Failed to load Super Admin device testing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [facilityFilter]);

  const handleOpenDeviceInspection = async (dev: DeviceItem) => {
    setInspectDevice(dev);
    try {
      const res = await api.get('/device-testing/history', {
        params: { deviceSerial: dev.serialNumber, limit: 10 },
      });
      setDeviceDiagnostics(res.data.records || []);
    } catch (err) {
      console.error('Failed to load device diagnostic logs:', err);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
      case 'calibrated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Healthy
          </span>
        );
      case 'issue_detected':
      case 'alert_broken':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Issue Detected
          </span>
        );
      case 'calibration_required':
      case 'maintenance':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-600" />
            Calibration Due
          </span>
        );
    }
  };

  const filteredDevices = devices.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.serialNumber.toLowerCase().includes(q) ||
      d.deviceModel.toLowerCase().includes(q) ||
      d.facility.toLowerCase().includes(q) ||
      (d.assignedWard && d.assignedWard.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-5 pb-16">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Device Testing & Diagnostics Command
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
            Fleet Telemetry
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 text-xs font-semibold shadow-xs">
            {(['All', 'PGI', 'RML', 'KGMU'] as const).map((fac) => (
              <button
                key={fac}
                onClick={() => setFacilityFilter(fac)}
                className={clsx(
                  'px-3 py-1 rounded-md text-xs transition-all',
                  facilityFilter === fac
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {fac}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <RotateCw className={clsx('w-3.5 h-3.5 text-purple-600', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Fleet KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Units</span>
          <div className="mt-1 text-3xl font-black text-slate-900">
            {summary?.totalDevices ?? devices.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {facilityFilter === 'All' ? '3 hospital nodes' : `${facilityFilter} fleet`}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Devices Scanned</span>
          <div className="mt-1 text-3xl font-black text-blue-600">
            {(summary as any)?.totalScanned ?? summary?.totalDevices ?? devices.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Diagnostic logs saved</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Healthy & Optimal</span>
          <div className="mt-1 text-3xl font-black text-emerald-700">
            {summary?.healthy ?? 0}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">Passed optical tests</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Issues Flagged</span>
          <div className="mt-1 text-3xl font-black text-rose-700">
            {summary?.issues ?? 0}
          </div>
          <p className="text-[11px] text-rose-600 mt-0.5">Requires maintenance</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Calibration Due</span>
          <div className="mt-1 text-3xl font-black text-amber-700">
            {summary?.calibrationRequired ?? 0}
          </div>
          <p className="text-[11px] text-amber-600 mt-0.5">Reference tile dock</p>
        </div>
      </div>

      {/* Main Registered Devices Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Registered Hospital Fleet ({filteredDevices.length} Units)
            </h2>
            <span className="text-xs text-slate-400 font-normal">· Select row to inspect diagnostic logs</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search serial, hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition shadow-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Serial / Model</th>
                <th className="py-3 px-4">Facility</th>
                <th className="py-3 px-4">Ward / Location</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4">Remaining Tests</th>
                <th className="py-3 px-4">Next Due</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    No registered devices matching selection.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((dev) => (
                  <tr
                    key={dev.serialNumber}
                    onClick={() => handleOpenDeviceInspection(dev)}
                    className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                        {dev.serialNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">{dev.deviceModel}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{dev.facility}</td>
                    <td className="py-3 px-4 text-slate-600">{dev.assignedWard || dev.department || 'Ward'}</td>
                    <td className="py-3 px-4">{getStatusBadge(dev.lastDiagnosticStatus || dev.status)}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {dev.remainingTests?.toLocaleString() || '7,500'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {dev.nextCalibrationDue
                        ? new Date(dev.nextCalibrationDue).toLocaleDateString()
                        : '60 days'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 group-hover:border-purple-300 group-hover:text-purple-700 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors shadow-xs">
                        <Eye className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
                        Inspect
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Device Modal */}
      {inspectDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{inspectDevice.deviceModel}</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Device Telemetry: {inspectDevice.serialNumber}
                </h3>
              </div>
              <button
                onClick={() => setInspectDevice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Assigned Hospital</span>
                <span className="font-bold text-slate-800">{inspectDevice.facility}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Status</span>
                <span className="font-bold text-slate-800">{inspectDevice.status || 'Active'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Scan History ({deviceDiagnostics.length})
              </h4>
              {deviceDiagnostics.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                  No scan reports recorded yet for this unit.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {deviceDiagnostics.map((diag) => (
                    <div
                      key={diag.diagnosticId}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200/90 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {new Date(diag.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Score: <span className="font-bold text-slate-800">{diag.overallScore}/100</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(diag.healthStatus)}
                        <button
                          onClick={() => setSelectedScanReport(diag)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 shadow-xs"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectDevice(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Scan Report Inspection Modal */}
      {selectedScanReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{selectedScanReport.diagnosticId}</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Report: {selectedScanReport.deviceSerial}
                </h3>
              </div>
              <button
                onClick={() => setSelectedScanReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800">
              <span className="font-bold block text-slate-900 mb-0.5">Recommendation:</span>
              {selectedScanReport.recommendation}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Sensor Checks ({selectedScanReport.checks?.length || 0})
              </span>
              <div className="space-y-1">
                {selectedScanReport.checks?.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.message}</div>
                    </div>
                    <span
                      className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                        c.status === 'passed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      )}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedScanReport(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
