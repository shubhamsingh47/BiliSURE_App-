import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  RotateCw,
  Building2,
  Search,
  Eye,
  X,
  FileText,
  Clock,
  ShieldAlert,
  Calendar,
  Layers,
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Healthy
          </span>
        );
      case 'issue_detected':
      case 'alert_broken':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3" />
            Issue Detected
          </span>
        );
      case 'calibration_required':
      case 'maintenance':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
            <Wrench className="w-3 h-3" />
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
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner Card */}
      <div className="bg-[#121c2d] border border-[#1e2f47] rounded-3xl p-7 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-lg">
                District Device Fleet Oversight
              </span>
              <span className="text-xs text-slate-400 font-mono">Lucknow Division</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
              Device Testing & Diagnostics Command
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Consolidated optical spectrophotometer fleet telemetry across{' '}
              <span className="text-white font-semibold">PGI</span>,{' '}
              <span className="text-white font-semibold">RML</span>, and{' '}
              <span className="text-white font-semibold">KGMU</span> hospital centres.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-2 bg-[#1a2942] hover:bg-[#253a5c] border border-[#2a3f61] rounded-xl text-xs font-bold text-white transition inline-flex items-center gap-1.5"
            >
              <RotateCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh Fleet</span>
            </button>
          </div>
        </div>

        {/* Hospital Filter Tabs */}
        <div className="mt-6 pt-5 border-t border-[#1e2f47] flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-[#09111c] p-1 text-xs font-bold border border-[#1e2f47] gap-1">
            {(['All', 'PGI', 'RML', 'KGMU'] as const).map((fac) => (
              <button
                key={fac}
                onClick={() => setFacilityFilter(fac)}
                className={clsx(
                  'px-4 py-1.5 rounded-lg transition font-bold text-xs',
                  facilityFilter === fac
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {fac === 'All' ? 'All Hospitals (Consolidated)' : `${fac} Hospital`}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Scope: {facilityFilter === 'All' ? 'PGI + RML + KGMU' : `${facilityFilter} Node Only`}
          </span>
        </div>
      </div>

      {/* Fleet KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Registered */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Registered Units</span>
            <Cpu className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">
            {summary?.totalDevices ?? devices.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {facilityFilter === 'All' ? 'Total fleet across 3 hospitals' : `Assigned to ${facilityFilter}`}
          </p>
        </div>

        {/* Total Scanned */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 uppercase">
            <span>Devices Scanned</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-blue-600">
            {(summary as any)?.totalScanned ?? summary?.totalDevices ?? devices.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">With telemetry diagnostic logs</p>
        </div>

        {/* Healthy */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase">
            <span>Healthy & Optimal</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-600">
            {summary?.healthy ?? 0}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">Passed all optical tests</p>
        </div>

        {/* Issues */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 uppercase">
            <span>Issues Flagged</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-rose-600">
            {summary?.issues ?? 0}
          </div>
          <p className="text-[11px] text-rose-700/80 mt-1">Attenuation or shroud leak</p>
        </div>

        {/* Calibration Due */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 uppercase">
            <span>Calibration Due</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-amber-600">
            {summary?.calibrationRequired ?? 0}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">Requires optical tile dock</p>
        </div>
      </div>

      {/* Main Registered Devices Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Registered Hospital Device Telemetry ({filteredDevices.length} Units)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any device row or &ldquo;Inspect&rdquo; to view sensor details, calibration status, and scan history.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search serial, model, ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl pl-9 pr-3 py-2 font-medium focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Hospital Node</th>
                <th className="py-3 px-4">Device Serial</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Assigned Ward</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4">Last Calibrated</th>
                <th className="py-3 px-4">Next Due</th>
                <th className="py-3 px-4">Remaining Tests</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    No devices found matching current selection.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((d) => (
                  <tr
                    key={d.serialNumber}
                    onClick={() => handleOpenDeviceInspection(d)}
                    className="hover:bg-purple-50/50 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {d.facility}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-700 group-hover:underline">{d.serialNumber}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-600">{d.deviceModel}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-600">{d.assignedWard || d.department}</td>
                    <td className="py-3.5 px-4 font-sans">{getStatusBadge(d.lastDiagnosticStatus || d.status)}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-500">
                      {d.lastCalibratedAt ? new Date(d.lastCalibratedAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-500">
                      {d.nextCalibrationDue ? new Date(d.nextCalibrationDue).toLocaleDateString('en-IN') : 'In 60 days'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {d.remainingTests?.toLocaleString() || '7,500'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 group-hover:bg-purple-100 text-slate-600 group-hover:text-purple-700 rounded-lg text-[11px] font-sans font-semibold transition">
                        <Eye className="w-3 h-3" />
                        View
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Historical Scan Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            District Diagnostic Activity Log (Last 30 Records)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of diagnostic tests conducted on hospital devices.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Hospital Node</th>
                <th className="py-3 px-4">Device Serial</th>
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Engineer / Staff</th>
                <th className="py-3 px-4 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No scan activity found.
                  </td>
                </tr>
              ) : (
                history.map((rec) => (
                  <tr key={rec.diagnosticId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-slate-600 font-sans">
                      {new Date(rec.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">{rec.facility}</td>
                    <td className="py-3.5 px-4 font-bold text-purple-700">{rec.deviceSerial}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-500">{rec.department}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{rec.overallScore} / 100</td>
                    <td className="py-3.5 px-4 font-sans">{getStatusBadge(rec.healthStatus)}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-500">{rec.scannedBy || 'System'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedScanReport(rec)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-sans font-medium transition"
                      >
                        <FileText className="w-3 h-3" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Inspection Modal */}
      {inspectDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {inspectDevice.facility} Node
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {inspectDevice.assignedWard || 'NICU'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {inspectDevice.serialNumber} · {inspectDevice.deviceModel}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setInspectDevice(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Health State</span>
                <span className="mt-1 block font-bold text-slate-900">
                  {getStatusBadge(inspectDevice.lastDiagnosticStatus || inspectDevice.status)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Last Calibrated</span>
                <span className="mt-1 block font-bold text-slate-900 font-mono">
                  {inspectDevice.lastCalibratedAt ? new Date(inspectDevice.lastCalibratedAt).toLocaleDateString('en-IN') : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Next Calibration</span>
                <span className="mt-1 block font-bold text-slate-900 font-mono">
                  {inspectDevice.nextCalibrationDue ? new Date(inspectDevice.nextCalibrationDue).toLocaleDateString('en-IN') : 'In 60 days'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Tests Remaining</span>
                <span className="mt-1 block font-bold text-purple-700 font-mono">
                  {inspectDevice.remainingTests?.toLocaleString() || '7,500'}
                </span>
              </div>
            </div>

            {/* Device Diagnostic Scan Logs */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Telemetry Scan History for {inspectDevice.serialNumber}
              </h4>
              {deviceDiagnostics.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  No scan reports recorded yet for this unit.
                </div>
              ) : (
                <div className="space-y-2">
                  {deviceDiagnostics.map((diag) => (
                    <div
                      key={diag.diagnosticId}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {new Date(diag.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Score: <span className="font-bold text-slate-700">{diag.overallScore}/100</span> · Evaluated by: {diag.scannedBy || 'Biomedical Engineer'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(diag.healthStatus)}
                        <button
                          onClick={() => setSelectedScanReport(diag)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700"
                        >
                          View Details
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Scan Report Inspection Modal */}
      {selectedScanReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{selectedScanReport.diagnosticId}</span>
                <h3 className="text-base font-bold text-slate-900">
                  Diagnostic Telemetry: {selectedScanReport.deviceSerial}
                </h3>
              </div>
              <button
                onClick={() => setSelectedScanReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500">
                Hospital: <strong className="text-slate-800">{selectedScanReport.facility}</strong> · {selectedScanReport.department}
              </span>
              {getStatusBadge(selectedScanReport.healthStatus)}
            </div>

            {/* Recommendation */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
              <span className="font-bold block text-slate-900 mb-1">Recommendation:</span>
              {selectedScanReport.recommendation}
              {selectedScanReport.issues && selectedScanReport.issues.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-rose-700 font-mono text-[11px]">
                  {selectedScanReport.issues.map((iss, idx) => (
                    <li key={idx}>{iss}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Checks list */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Sensor Checks ({selectedScanReport.checks?.length || 0})
              </span>
              <div className="space-y-2">
                {selectedScanReport.checks?.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.message}</div>
                    </div>
                    <div className="text-right">
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
                      {c.measuredValue && (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          {c.measuredValue}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedScanReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
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
