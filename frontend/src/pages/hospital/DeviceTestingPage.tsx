import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Activity,
  FileText,
  Eye,
  X,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  DeviceItem,
  DeviceHealthSummary,
  DeviceDiagnosticRecord,
  DiagnosticCheckItem,
} from '../../types';
import { TestBalanceButton } from '../../components/common/TestBalanceButton';

// Consistently map device serial or item to (Hospital) D1, D2, D3
export const getCleanDeviceName = (
  device: { serialNumber?: string } | string,
  facilityName: string,
  index?: number
): string => {
  const serial = typeof device === 'string' ? device : device?.serialNumber || '';
  const fac = facilityName || 'Hospital';

  if (serial.includes('-101') || serial.includes('-201') || serial.includes('-301')) {
    return `${fac} D1`;
  }
  if (serial.includes('-102') || serial.includes('-202') || serial.includes('-302')) {
    return `${fac} D2`;
  }
  if (serial.includes('-103') || serial.includes('-203') || serial.includes('-303')) {
    return `${fac} D3`;
  }
  if (index !== undefined) {
    return `${fac} D${index + 1}`;
  }
  return `${fac} Unit`;
};

export const DeviceTestingPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const facility = hospitalFacility || 'Hospital';

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [summary, setSummary] = useState<DeviceHealthSummary | null>(null);
  const [history, setHistory] = useState<DeviceDiagnosticRecord[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Scanning animation states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStageIndex, setScanStageIndex] = useState<number>(0);
  const [currentResult, setCurrentResult] = useState<DeviceDiagnosticRecord | null>(null);

  // Filter history by device
  const [historyFilterSerial, setHistoryFilterSerial] = useState<string>('all');

  // Inspection modal for past report
  const [inspectRecord, setInspectRecord] = useState<DeviceDiagnosticRecord | null>(null);

  const scanStages = [
    { title: 'Optical Sensor Initialization', detail: 'Calibrating baseline photodiodes and dual-LED drivers...' },
    { title: 'Dual-Wavelength Spectral Luminance', detail: 'Testing 460nm and 550nm spectral luminance balance...' },
    { title: 'Signal-to-Noise Ratio (SNR) Analysis', detail: 'Measuring analog frontend response & dark-noise voltage...' },
    { title: 'Spectrophotometer Linearity Verification', detail: 'Running multi-point reflectance curve validation...' },
    { title: 'Reference Tile Calibration Inspection', detail: 'Checking white ceramic calibration standard tolerances...' },
    { title: 'Telemetry Synthesis & Report Generation', detail: 'Compiling hardware diagnostic telemetry and saving...' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesRes, summaryRes, historyRes] = await Promise.all([
        api.get('/device-testing/devices'),
        api.get('/device-testing/summary'),
        api.get('/device-testing/history', { params: { limit: 30 } }),
      ]);

      const devs: DeviceItem[] = devicesRes.data.data || [];
      devs.sort((a, b) => a.serialNumber.localeCompare(b.serialNumber));
      setDevices(devs);
      setSummary(summaryRes.data.data || null);
      setHistory(historyRes.data.records || []);

      if (!selectedDevice && devs.length > 0) {
        setSelectedDevice(devs[0]);
      } else if (selectedDevice) {
        const updated = devs.find((d) => d.serialNumber === selectedDevice.serialNumber);
        if (updated) setSelectedDevice(updated);
      }
    } catch (err) {
      console.error('Failed to load device testing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalFacility]);

  // Handle Scan execution
  const handleStartScan = async () => {
    if (!selectedDevice || isScanning) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStageIndex(0);
    setCurrentResult(null);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        const stage = Math.min(Math.floor((next / 100) * scanStages.length), scanStages.length - 1);
        setScanStageIndex(stage);
        return next;
      });
    }, 400);

    try {
      const res = await api.post('/device-testing/scan', {
        deviceSerial: selectedDevice.serialNumber,
        department: selectedDevice.assignedWard || 'NICU',
      });

      setTimeout(() => {
        clearInterval(interval);
        setScanProgress(100);
        setScanStageIndex(scanStages.length - 1);
        setTimeout(() => {
          setIsScanning(false);
          setCurrentResult(res.data.data);
          fetchData();
        }, 500);
      }, 2400);
    } catch (err) {
      clearInterval(interval);
      setIsScanning(false);
      console.error('Scan failed:', err);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
      case 'calibrated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Healthy
          </span>
        );
      case 'issue_detected':
      case 'alert_broken':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Issue
          </span>
        );
      case 'calibration_required':
      case 'maintenance':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            Calibration Due
          </span>
        );
    }
  };

  const filteredHistory = history.filter((h) => {
    if (historyFilterSerial === 'all') return true;
    return h.deviceSerial === historyFilterSerial;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header: ONLY Heading on left, Percentage Ring on right */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Device Testing</h1>
        <TestBalanceButton />
      </div>

      {/* KPI Overview Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Healthy Devices</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {summary?.healthy ?? 0}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                of {summary?.totalDevices ?? devices.length} units
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Issues Flagged</span>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">
              {summary?.issues ?? 0}
            </div>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Calibration Required</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">
              {summary?.calibrationRequired ?? 0}
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Device Selection & Scan Workbench */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-5">
        {/* Compact Device Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {devices.map((dev, idx) => {
            const displayName = getCleanDeviceName(dev, facility, idx);
            const isSelected = selectedDevice?.serialNumber === dev.serialNumber;

            return (
              <button
                key={dev.serialNumber}
                onClick={() => {
                  setSelectedDevice(dev);
                  setCurrentResult(null);
                }}
                className={clsx(
                  'p-3.5 rounded-xl border text-left transition flex items-center justify-between',
                  isSelected
                    ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                )}
              >
                <div>
                  <div className="text-sm font-bold text-slate-900">{displayName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {dev.assignedWard || dev.department || 'NICU'}
                  </div>
                </div>
                <div>{getStatusBadge(dev.lastDiagnosticStatus || dev.status)}</div>
              </button>
            );
          })}
        </div>

        {/* Scan Action Bar: Just ONE clean button "Scan Device" */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-slate-800">
              {selectedDevice ? getCleanDeviceName(selectedDevice, facility) : 'Device'} Diagnostics
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Verify optical sensor balance, dark noise SNR, and white tile calibration tolerance.
            </div>
          </div>

          <button
            onClick={handleStartScan}
            disabled={!selectedDevice || isScanning}
            className={clsx(
              'px-5 py-2.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-2 shadow-sm',
              isScanning
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
            )}
          >
            <Activity className={clsx('w-4 h-4', isScanning && 'animate-spin')} />
            <span>{isScanning ? 'Scanning...' : 'Scan Device'}</span>
          </button>
        </div>

        {/* Inline Scan Animation */}
        {isScanning && (
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-bold text-blue-700">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                {scanStages[scanStageIndex].title}
              </span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              {scanStages[scanStageIndex].detail}
            </p>
          </div>
        )}

        {/* Diagnostic Results Matrix */}
        {currentResult && (
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  Diagnostic Result: {getCleanDeviceName(currentResult.deviceSerial, facility)}
                </span>
              </div>
              {getStatusBadge(currentResult.healthStatus)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {currentResult.checks?.map((check: DiagnosticCheckItem) => (
                <div key={check.name} className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">{check.name}</span>
                    <span
                      className={clsx(
                        'text-[10px] font-bold uppercase',
                        check.status === 'passed' ? 'text-emerald-600' : 'text-rose-600'
                      )}
                    >
                      {check.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                    {check.measuredValue || check.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Diagnostics History Ledger */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Diagnostic Scan History</h2>
            <span className="text-xs text-slate-400">Timestamped sensor audit telemetry</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Device:</span>
            <select
              value={historyFilterSerial}
              onChange={(e) => setHistoryFilterSerial(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-1.5 font-medium focus:outline-none"
            >
              <option value="all">All Devices</option>
              {devices.map((dev, idx) => (
                <option key={dev.serialNumber} value={dev.serialNumber}>
                  {getCleanDeviceName(dev, facility, idx)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">SNR Ratio</th>
                <th className="py-3 px-4">Spectral Balance</th>
                <th className="py-3 px-4 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No diagnostic records found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => {
                  const devIndex = devices.findIndex((d) => d.serialNumber === rec.deviceSerial);
                  const displayDev = getCleanDeviceName(
                    rec.deviceSerial,
                    facility,
                    devIndex >= 0 ? devIndex : undefined
                  );

                  return (
                    <tr key={rec._id || rec.diagnosticId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {rec.createdAt ? new Date(rec.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {displayDev}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(rec.healthStatus)}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {rec.overallScore} / 100
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {rec.testDurationMs ? `${rec.testDurationMs}ms` : '320ms'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectRecord(rec)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
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

      {/* Inspect Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {getCleanDeviceName(inspectRecord.deviceSerial, facility)} Diagnostic Report
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {inspectRecord.createdAt ? new Date(inspectRecord.createdAt).toLocaleString() : ''}
                </span>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-xs font-semibold text-slate-600">Overall Diagnostic Verdict:</span>
              {getStatusBadge(inspectRecord.healthStatus)}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Telemetry Verifications
              </div>
              <div className="grid grid-cols-2 gap-2">
                {inspectRecord.checks?.map((c: any) => (
                  <div key={c.name} className="p-2.5 border border-slate-200 rounded-lg bg-white">
                    <div className="text-[11px] text-slate-500">{c.name}</div>
                    <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                      {c.measuredValue ?? c.message} ({c.status})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
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
