import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  RotateCw,
  Sliders,
  Calendar,
  Layers,
  Sparkles,
  X,
  FileText,
  Clock,
  Eye,
  Search,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../services/api';
import {
  DeviceItem,
  DeviceDiagnosticRecord,
  DeviceHealthSummary,
  DiagnosticCheckItem,
} from '../../types';
import { useAuth } from '../../context/AuthContext';

export const DeviceTestingPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [summary, setSummary] = useState<DeviceHealthSummary | null>(null);
  const [history, setHistory] = useState<DeviceDiagnosticRecord[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyFilterSerial, setHistoryFilterSerial] = useState<string>('all');

  // Scanner State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStageIndex, setScanStageIndex] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [selectedScenario, setSelectedScenario] = useState<
    'auto' | 'healthy' | 'issue_detected' | 'calibration_required'
  >('auto');
  const [currentResult, setCurrentResult] = useState<DeviceDiagnosticRecord | null>(null);
  const [inspectRecord, setInspectRecord] = useState<DeviceDiagnosticRecord | null>(null);

  const scanStages = [
    { title: 'Initializing Hardware Diagnostics', detail: 'Connecting via low-latency telemetry bus...' },
    { title: 'Checking BLE & Microcontroller Continuity', detail: 'Verifying I2C bus parity and memory registers...' },
    { title: 'Inspecting Dual-Wavelength Optical Emitters', detail: 'Testing 460nm and 550nm spectral luminance balance...' },
    { title: 'Evaluating Photodiode Sensor Sensitivity', detail: 'Sampling dark current and dynamic SNR response...' },
    { title: 'Checking Calibration Drift & Ambient Shroud', detail: 'Comparing baseline against reference tile thresholds...' },
    { title: 'Generating Clinical Diagnostic Report', detail: 'Writing signed diagnostic telemetry to database...' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devRes, sumRes, histRes] = await Promise.all([
        api.get('/device-testing/devices'),
        api.get('/device-testing/summary'),
        api.get('/device-testing/history?limit=30'),
      ]);

      const devList: DeviceItem[] = devRes.data.data || [];
      setDevices(devList);
      setSummary(sumRes.data.data);
      setHistory(histRes.data.records || []);

      if (devList.length > 0 && !selectedDevice) {
        setSelectedDevice(devList[0]);
      } else if (selectedDevice) {
        const updated = devList.find((d) => d.serialNumber === selectedDevice.serialNumber);
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
  }, []);

  const handleStartScan = async () => {
    if (!selectedDevice || isScanning) return;

    setIsScanning(true);
    setScanStageIndex(0);
    setScanProgress(5);
    setCurrentResult(null);

    // Progressive stage simulation
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 18;
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

      // Wait for progress animation to complete
      setTimeout(() => {
        clearInterval(interval);
        setScanProgress(100);
        setScanStageIndex(scanStages.length - 1);
        setTimeout(() => {
          setIsScanning(false);
          setCurrentResult(res.data.data);
          fetchData(); // refresh devices and history from DB
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Device Healthy
          </span>
        );
      case 'issue_detected':
      case 'alert_broken':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Issue Detected
          </span>
        );
      case 'calibration_required':
      case 'maintenance':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wrench className="w-3.5 h-3.5" />
            Calibration Required
          </span>
        );
    }
  };

  const filteredHistory = historyFilterSerial === 'all'
    ? history
    : history.filter((h) => h.deviceSerial === historyFilterSerial);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
            <Cpu className="w-4 h-4" />
            Biomedical Engineering Suite
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Device Testing & Diagnostics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, spectrophotometer calibration verification, and optical sensor health for{' '}
            <span className="text-slate-200 font-semibold">{hospitalFacility}</span>.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading || isScanning}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#122033] hover:bg-[#1a2d47] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-800"
        >
          <RotateCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh Fleet Status
        </button>
      </div>

      {/* Fleet KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Assigned Fleet</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {summary?.totalDevices ?? devices.length}
            </span>
            <span className="text-xs text-slate-400">Units in {hospitalFacility}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            All devices tracked in MongoDB
          </div>
        </div>

        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Optimal & Healthy</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {summary?.healthy ?? 0}
            </span>
            <span className="text-xs text-slate-400">
              {summary?.totalDevices
                ? `${Math.round(((summary.healthy || 0) / summary.totalDevices) * 100)}% of fleet`
                : ''}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-500/80">
            Approved for clinical neonatal use
          </div>
        </div>

        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Attention / Issues</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {summary?.issues ?? 0}
            </span>
            <span className="text-xs text-slate-400">Requires inspection</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-400/80">
            Optical or sensor alerts flagged
          </div>
        </div>

        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Calibration Required</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {summary?.calibrationRequired ?? 0}
            </span>
            <span className="text-xs text-slate-400">Due or drift exceeded</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400/80">
            Dock on reference standard tile
          </div>
        </div>
      </div>

      {/* Main Workbench: Device Selector & Scan Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Device Selector & Metadata */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Select Device to Test
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose an active unit assigned to {hospitalFacility}.
            </p>

            <div className="mt-4 space-y-2">
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
                      'w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2',
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500/50 shadow-md'
                        : 'bg-[#101b2a] border-slate-800/60 hover:border-slate-700'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">
                        {dev.serialNumber}
                      </span>
                      {getStatusBadge(dev.lastDiagnosticStatus || dev.status)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{dev.deviceModel}</span>
                      <span className="font-medium text-slate-300">{dev.assignedWard || dev.department}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Device Calibration & Hardware Details */}
          {selectedDevice && (
            <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Calibration & Life Tracker
              </h3>

              <div className="space-y-2.5 text-xs pt-1">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Last Calibrated:</span>
                  <span className="font-semibold text-slate-200">
                    {selectedDevice.lastCalibratedAt
                      ? new Date(selectedDevice.lastCalibratedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Next Calibration Due:</span>
                  <span className={clsx('font-semibold', selectedDevice.lastDiagnosticStatus === 'calibration_required' ? 'text-amber-400' : 'text-slate-200')}>
                    {selectedDevice.nextCalibrationDue
                      ? new Date(selectedDevice.nextCalibrationDue).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'In 60 days'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Firmware Build:</span>
                  <span className="font-mono text-slate-300 font-medium">
                    {selectedDevice.firmwareVersion || 'v2.4.2-clinical'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Sensor Tests Remaining:</span>
                  <span className="font-mono font-bold text-blue-400">
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
          <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Automated Multi-Stage Test
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Run Diagnostic Scan on {selectedDevice?.serialNumber || 'Unit'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  Executes automated test protocols verifying dual-wavelength optics, photodiode SNR, dark noise current, and reflectance calibration tolerances.
                </p>
              </div>

              {/* Simulation Mode selector */}
              <div className="flex flex-col gap-2 shrink-0">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">
                  Diagnostic Simulation Mode
                </label>
                <select
                  value={selectedScenario}
                  onChange={(e: any) => setSelectedScenario(e.target.value)}
                  disabled={isScanning}
                  className="bg-[#122033] border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="auto">Auto (Evaluate Device State)</option>
                  <option value="healthy">Scenario 1: Healthy (Pass All)</option>
                  <option value="issue_detected">Scenario 2: Optical Issue Detected</option>
                  <option value="calibration_required">Scenario 3: Calibration Drift Due</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleStartScan}
                disabled={!selectedDevice || isScanning}
                className={clsx(
                  'px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center gap-2.5',
                  isScanning
                    ? 'bg-blue-600/50 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
                )}
              >
                <Activity className={clsx('w-4 h-4', isScanning && 'animate-spin')} />
                {isScanning ? 'Executing Diagnostic Cycle...' : 'Scan Device Now'}
              </button>

              <span className="text-[11px] text-slate-400 font-mono">
                {selectedDevice ? `Target: ${selectedDevice.serialNumber} (${selectedDevice.assignedWard})` : 'Select a device'}
              </span>
            </div>

            {/* Live Animated Scanning Radar / Progress Box */}
            {isScanning && (
              <div className="mt-6 bg-[#070e17] border border-blue-500/30 rounded-xl p-5 relative overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                    Stage {scanStageIndex + 1} of {scanStages.length}: {scanStages[scanStageIndex].title}
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400">{scanProgress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-cyan-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 font-mono mt-2.5">
                  {scanStages[scanStageIndex].detail}
                </p>
              </div>
            )}
          </div>

          {/* Diagnostic Result Card */}
          {currentResult && (
            <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-6 space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">
                        {currentResult.diagnosticId}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        Just Now
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      Diagnostic Report: {currentResult.deviceSerial}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Health Score</div>
                    <div className="text-xl font-extrabold text-white">
                      {currentResult.overallScore}<span className="text-xs text-slate-400">/100</span>
                    </div>
                  </div>
                  {getStatusBadge(currentResult.healthStatus)}
                </div>
              </div>

              {/* Clinical Recommendation Alert Box */}
              <div
                className={clsx(
                  'p-4 rounded-xl border text-xs',
                  currentResult.healthStatus === 'healthy'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : currentResult.healthStatus === 'issue_detected'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                )}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {currentResult.healthStatus === 'healthy' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : currentResult.healthStatus === 'issue_detected' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Wrench className="w-4 h-4" />
                  )}
                  Clinical Recommendation
                </div>
                <p className="leading-relaxed opacity-90">{currentResult.recommendation}</p>
                {currentResult.issues && currentResult.issues.length > 0 && (
                  <ul className="mt-2 list-disc list-inside space-y-1 font-mono text-[11px] opacity-95">
                    {currentResult.issues.map((iss, idx) => (
                      <li key={idx}>{iss}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Diagnostic Check Matrix */}
              <div>
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Telemetry & Calibration Sensor Verification
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentResult.checks.map((chk: DiagnosticCheckItem, i: number) => (
                    <div
                      key={i}
                      className="bg-[#101b2a] border border-slate-800/80 rounded-xl p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">{chk.name}</span>
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                            chk.status === 'passed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : chk.status === 'warning'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          )}
                        >
                          {chk.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{chk.message}</p>
                      {chk.measuredValue && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/40">
                          <span>Measured: <span className="text-slate-300 font-semibold">{chk.measuredValue}</span></span>
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
      <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Device Testing & Calibration Audit History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Persistent chronological diagnostic logs retrieved from MongoDB Atlas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Unit:</span>
            <select
              value={historyFilterSerial}
              onChange={(e) => setHistoryFilterSerial(e.target.value)}
              className="bg-[#122033] border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
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
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0e1b2d] text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-y border-slate-800/80">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Device Serial</th>
                <th className="py-3 px-4">Ward / Dept</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4">Engineer / Staff</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No diagnostic records found for this selection.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => (
                  <tr
                    key={rec.diagnosticId}
                    className="hover:bg-[#122033]/60 transition-colors cursor-pointer"
                    onClick={() => setInspectRecord(rec)}
                  >
                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {new Date(rec.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{rec.deviceSerial}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-400">{rec.department}</td>
                    <td className="py-3.5 px-4 font-sans">{getStatusBadge(rec.healthStatus)}</td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {rec.overallScore} / 100
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-400">{rec.scannedBy || 'System'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectRecord(rec);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-sans font-medium transition"
                      >
                        <Eye className="w-3 h-3" />
                        View Report
                      </button>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1623] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{inspectRecord.diagnosticId}</span>
                <h3 className="text-base font-bold text-white">
                  Historical Diagnostic Audit: {inspectRecord.deviceSerial}
                </h3>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-400">
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
            <div className="p-3.5 bg-[#122033] rounded-xl border border-slate-800 text-xs text-slate-200">
              <span className="font-bold block text-white mb-1">Recommendation:</span>
              {inspectRecord.recommendation}
            </div>

            {/* Checks list */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Sensor & Hardware Check Results
              </span>
              <div className="space-y-2">
                {inspectRecord.checks?.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-[#0e1a2b] border border-slate-800/80 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.message}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={clsx(
                          'text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                          c.status === 'passed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : c.status === 'warning'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        )}
                      >
                        {c.status}
                      </span>
                      {c.measuredValue && (
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
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
