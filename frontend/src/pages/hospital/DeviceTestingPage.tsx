import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  RotateCw,
  Sliders,
  Calendar,
  Sparkles,
  Activity,
  FileText,
  Clock,
  Eye,
  X,
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

export const DeviceTestingPage: React.FC = () => {
  const { hospitalFacility } = useAuth();

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

  // Simulation mode
  const [selectedScenario, setSelectedScenario] = useState<string>('auto');

  // Filter history by device
  const [historyFilterSerial, setHistoryFilterSerial] = useState<string>('all');

  // Inspection modal for past report
  const [inspectRecord, setInspectRecord] = useState<DeviceDiagnosticRecord | null>(null);

  const scanStages = [
    { title: 'Optical Sensor Initialization', detail: 'Calibrating baseline photodiodes and dual-LED drivers...' },
    { title: 'Inspecting Dual-Wavelength Optical Emitters', detail: 'Testing 460nm and 550nm spectral luminance balance...' },
    { title: 'Photodiode Signal-to-Noise Ratio (SNR)', detail: 'Measuring analog frontend response & dark-noise voltage...' },
    { title: 'Evaluating Spectrophotometer Linearity', detail: 'Running multi-point reflectance curve validation...' },
    { title: 'Reference Tile Calibration Verification', detail: 'Checking white ceramic calibration standard tolerances...' },
    { title: 'Finalizing Health Telemetry Report', detail: 'Synthesizing hardware diagnostic metrics and saving to DB...' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesRes, summaryRes, historyRes] = await Promise.all([
        api.get('/device-testing/devices'),
        api.get('/device-testing/summary'),
        api.get('/device-testing/history', { params: { limit: 25 } }),
      ]);

      const devs: DeviceItem[] = devicesRes.data.data || [];
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
    }, 450);

    try {
      const scenarioParam = selectedScenario === 'auto' ? undefined : selectedScenario;
      const res = await api.post('/device-testing/scan', {
        deviceSerial: selectedDevice.serialNumber,
        department: selectedDevice.assignedWard || 'NICU',
        requestedScenario: scenarioParam,
      });

      setTimeout(() => {
        clearInterval(interval);
        setScanProgress(100);
        setScanStageIndex(scanStages.length - 1);
        setTimeout(() => {
          setIsScanning(false);
          setCurrentResult(res.data.data);
          fetchData();
        }, 600);
      }, 3000);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Healthy
          </span>
        );
      case 'issue_detected':
      case 'alert_broken':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Issue Detected
          </span>
        );
      case 'calibration_required':
      case 'maintenance':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-600" />
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
    <div className="w-full max-w-[1700px] mx-auto space-y-5 pb-12">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Device Testing & Diagnostics
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>{hospitalFacility} Fleet</span>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading || isScanning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 shadow-xs"
        >
          <RotateCw className={clsx('w-3.5 h-3.5 text-blue-600', loading && 'animate-spin')} />
          <span>Refresh Fleet Status</span>
        </button>
      </div>

      {/* Fleet KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Fleet</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
            {summary?.totalDevices ?? devices.length}
          </span>
          <p className="text-xs text-slate-500 mt-0.5">Units in {hospitalFacility}</p>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Optimal & Healthy</span>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">
            {summary?.healthy ?? 0}
          </span>
          <p className="text-xs text-emerald-600/90 mt-0.5">Approved for clinical use</p>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Attention / Issues</span>
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-rose-700 mt-1 block">
            {summary?.issues ?? 0}
          </span>
          <p className="text-xs text-rose-600/90 mt-0.5">Requires engineering review</p>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Calibration Required</span>
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-amber-700 mt-1 block">
            {summary?.calibrationRequired ?? 0}
          </span>
          <p className="text-xs text-amber-600/90 mt-0.5">Reference tile dock due</p>
        </div>
      </div>

      {/* Main Workbench: Device Selector & Scan Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Device Selector & Metadata */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Select Device
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">{devices.length} units</span>
            </div>

            <div className="space-y-2">
              {devices.map((dev) => {
                const isSelected = selectedDevice?.serialNumber === dev.serialNumber;
                return (
                  <button
                    key={dev.serialNumber}
                    onClick={() => {
                      setSelectedDevice(dev);
                      setCurrentResult(null);
                    }}
                    className={clsx(
                      'w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5',
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {dev.serialNumber}
                      </span>
                      {getStatusBadge(dev.lastDiagnosticStatus || dev.status)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{dev.deviceModel}</span>
                      <span className="font-semibold text-slate-700">{dev.assignedWard || dev.department}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Device Details */}
          {selectedDevice && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Calibration Profile
              </h3>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Last Calibrated:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDevice.lastCalibratedAt
                      ? new Date(selectedDevice.lastCalibratedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Next Calibration Due:</span>
                  <span className={clsx('font-semibold', selectedDevice.lastDiagnosticStatus === 'calibration_required' ? 'text-amber-700 font-bold' : 'text-slate-800')}>
                    {selectedDevice.nextCalibrationDue
                      ? new Date(selectedDevice.nextCalibrationDue).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'In 60 days'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Firmware Build:</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {selectedDevice.firmwareVersion || 'v2.4.2-clinical'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Tests Remaining:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {selectedDevice.remainingTests?.toLocaleString() || '7,500'} / {selectedDevice.totalTests?.toLocaleString() || '14,000'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Testing Panel & Scanner */}
        <div className="lg:col-span-2 space-y-5">
          {/* Diagnostic Action Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 relative overflow-hidden shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Automated Multi-Stage Test
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Run Diagnostic Scan on {selectedDevice?.serialNumber || 'Unit'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 max-w-lg">
                  Verifies dual-wavelength optics, photodiode SNR, dark noise current, and reflectance calibration tolerances.
                </p>
              </div>

              {/* Simulation Mode selector */}
              <div className="flex flex-col gap-1 shrink-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Test Protocol
                </label>
                <select
                  value={selectedScenario}
                  onChange={(e: any) => setSelectedScenario(e.target.value)}
                  disabled={isScanning}
                  className="bg-white border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none shadow-xs"
                >
                  <option value="auto">Auto (Evaluate Device State)</option>
                  <option value="healthy">Scenario 1: Healthy (Pass All)</option>
                  <option value="issue_detected">Scenario 2: Optical Issue Detected</option>
                  <option value="calibration_required">Scenario 3: Calibration Drift Due</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={handleStartScan}
                disabled={!selectedDevice || isScanning}
                className={clsx(
                  'px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2',
                  isScanning
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                )}
              >
                <Activity className={clsx('w-3.5 h-3.5', isScanning && 'animate-spin')} />
                {isScanning ? 'Executing Diagnostic Cycle...' : 'Scan Device Now'}
              </button>

              <span className="text-[11px] text-slate-500 font-mono">
                {selectedDevice ? `Target: ${selectedDevice.serialNumber} (${selectedDevice.assignedWard})` : 'Select a device'}
              </span>
            </div>

            {/* Live Progress Box */}
            {isScanning && (
              <div className="mt-4 bg-blue-50/70 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    Stage {scanStageIndex + 1} of {scanStages.length}: {scanStages[scanStageIndex].title}
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-700">{scanProgress}%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 mt-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-600 font-mono mt-2">
                  {scanStages[scanStageIndex].detail}
                </p>
              </div>
            )}
          </div>

          {/* Diagnostic Result Card */}
          {currentResult && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">
                        {currentResult.diagnosticId}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                        Just Now
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      Diagnostic Report: {currentResult.deviceSerial}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Health Score</div>
                    <div className="text-base font-extrabold text-slate-900">
                      {currentResult.overallScore}<span className="text-xs text-slate-400">/100</span>
                    </div>
                  </div>
                  {getStatusBadge(currentResult.healthStatus)}
                </div>
              </div>

              {/* Recommendation Alert Box */}
              <div
                className={clsx(
                  'p-3.5 rounded-lg border text-xs',
                  currentResult.healthStatus === 'healthy'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : currentResult.healthStatus === 'issue_detected'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                )}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {currentResult.healthStatus === 'healthy' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : currentResult.healthStatus === 'issue_detected' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Wrench className="w-4 h-4 text-amber-600" />
                  )}
                  Clinical Recommendation
                </div>
                <p className="leading-relaxed">{currentResult.recommendation}</p>
                {currentResult.issues && currentResult.issues.length > 0 && (
                  <ul className="mt-2 list-disc list-inside space-y-0.5 font-mono text-[11px]">
                    {currentResult.issues.map((iss, idx) => (
                      <li key={idx}>{iss}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Diagnostic Check Matrix */}
              <div>
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Sensor Verification Matrix
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentResult.checks.map((chk: DiagnosticCheckItem, i: number) => (
                    <div
                      key={i}
                      className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">{chk.name}</span>
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                            chk.status === 'passed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : chk.status === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          )}
                        >
                          {chk.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{chk.message}</p>
                      {chk.measuredValue && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                          <span>Measured: <span className="text-slate-800 font-semibold">{chk.measuredValue}</span></span>
                          {chk.referenceThreshold && <span>Ref: {chk.referenceThreshold}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostic Scan History Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Device Testing & Calibration Audit History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Persistent chronological diagnostic logs retrieved from MongoDB Atlas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Unit:</span>
            <select
              value={historyFilterSerial}
              onChange={(e) => setHistoryFilterSerial(e.target.value)}
              className="bg-white border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1 font-semibold focus:outline-none shadow-xs"
            >
              <option value="all">All Devices</option>
              {devices.map((d) => (
                <option key={d.serialNumber} value={d.serialNumber}>
                  {d.serialNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Device Serial</th>
                <th className="py-2.5 px-4">Ward / Dept</th>
                <th className="py-2.5 px-4">Health Status</th>
                <th className="py-2.5 px-4">Health Score</th>
                <th className="py-2.5 px-4">Engineer / Staff</th>
                <th className="py-2.5 px-4 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No diagnostic records found for this selection.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => (
                  <tr
                    key={rec.diagnosticId}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    onClick={() => setInspectRecord(rec)}
                  >
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(rec.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors font-mono">
                      {rec.deviceSerial}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.department}</td>
                    <td className="py-3 px-4">{getStatusBadge(rec.healthStatus)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {rec.overallScore} / 100
                    </td>
                    <td className="py-3 px-4 text-slate-500">{rec.scannedBy || 'System'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 group-hover:border-blue-300 group-hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors">
                        <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                        Audit
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Past Report Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{inspectRecord.diagnosticId}</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Diagnostic Audit: {inspectRecord.deviceSerial}
                </h3>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500">
                Conducted on{' '}
                {new Date(inspectRecord.createdAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {getStatusBadge(inspectRecord.healthStatus)}
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="font-bold block text-slate-900 mb-0.5">Recommendation:</span>
              {inspectRecord.recommendation}
            </div>

            {/* Checks list */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Sensor & Hardware Check Results
              </span>
              <div className="space-y-1.5">
                {inspectRecord.checks?.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/90 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.message}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={clsx(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
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
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
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
                onClick={() => setInspectRecord(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
