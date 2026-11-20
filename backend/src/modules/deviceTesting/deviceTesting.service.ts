import { DeviceModel } from '../../models/Device';
import { DeviceDiagnosticModel, IDeviceDiagnostic, IDiagnosticCheck } from '../../models/DeviceDiagnostic';
import { NotFoundError, BadRequestError } from '../../common/errors';

export class DeviceTestingService {
  /**
   * Get all registered devices for a facility
   */
  static async getDevices(facility?: string, isSuperAdmin = false) {
    const filter: any = {};
    if (!isSuperAdmin && facility) {
      filter.facility = facility;
    }
    const devices = await DeviceModel.find(filter).sort({ serialNumber: 1 });
    return devices;
  }

  /**
   * Run a simulated comprehensive diagnostic scan on a device
   */
  static async runScan(params: {
    deviceSerial: string;
    facility: string;
    department?: string;
    requestedScenario?: 'healthy' | 'issue_detected' | 'calibration_required';
    scannedBy?: string;
  }) {
    const { deviceSerial, facility, department = 'NICU', requestedScenario, scannedBy = 'Clinical Engineer' } = params;

    const device = await DeviceModel.findOne({ serialNumber: deviceSerial });
    if (!device) {
      throw new NotFoundError(`Device with serial number ${deviceSerial} not found.`);
    }

    // Determine diagnostic scenario (either requested or derived from device state)
    let outcome: 'healthy' | 'issue_detected' | 'calibration_required' = 'healthy';
    if (requestedScenario) {
      outcome = requestedScenario;
    } else if (device.status === 'alert_broken' || device.lastDiagnosticStatus === 'issue_detected') {
      outcome = 'issue_detected';
    } else if (!device.isCalibrated || (device.nextCalibrationDue && new Date(device.nextCalibrationDue) < new Date())) {
      outcome = 'calibration_required';
    } else {
      outcome = 'healthy';
    }

    let overallScore = 96;
    let issues: string[] = [];
    let recommendation = 'Device is operating within manufacturer clinical tolerance. Ready for patient neonatal TcB screenings.';
    let checks: IDiagnosticCheck[] = [];

    if (outcome === 'healthy') {
      overallScore = Math.floor(Math.random() * 5) + 94; // 94-98%
      checks = [
        {
          name: 'Optical Spectrum Integrity',
          category: 'optical',
          status: 'passed',
          message: 'Dual-wavelength LED emission spectrum balanced (460nm & 550nm).',
          measuredValue: '460.2 nm / 549.8 nm',
          referenceThreshold: '±2.0 nm',
        },
        {
          name: 'Photodiode Sensor Response',
          category: 'sensor',
          status: 'passed',
          message: 'Photodiode dynamic range SNR 68 dB exceeds clinical minimum.',
          measuredValue: '68.4 dB',
          referenceThreshold: '> 60.0 dB',
        },
        {
          name: 'Calibration Baseline Drift',
          category: 'calibration',
          status: 'passed',
          message: 'Optical reflectance tile baseline variance within 0.18 mg/dL.',
          measuredValue: '0.12 mg/dL',
          referenceThreshold: '< 0.30 mg/dL',
        },
        {
          name: 'Ambient Light Shielding',
          category: 'optical',
          status: 'passed',
          message: 'Measurement shroud seal blocks ambient fluorescent flicker.',
          measuredValue: '0.04 lux leak',
          referenceThreshold: '< 0.20 lux',
        },
        {
          name: 'Hardware Bus & Sensor Continuity',
          category: 'hardware',
          status: 'passed',
          message: 'I2C telemetry bus responsive with zero transmission packet drops.',
          measuredValue: '0.8 ms latency',
          referenceThreshold: '< 5.0 ms',
        },
        {
          name: 'Power Regulation & Battery Core',
          category: 'hardware',
          status: 'passed',
          message: '3.3V power rail regulated within ±1.2%. Internal Li-ion healthy.',
          measuredValue: '3.31 V',
          referenceThreshold: '3.3V ± 5%',
        },
      ];
    } else if (outcome === 'issue_detected') {
      overallScore = Math.floor(Math.random() * 8) + 68; // 68-75%
      issues = [
        'Optical tip aperture shows significant light transmission attenuation (~18%).',
        'Ambient stray light rejection sensor detected moderate perimeter seal leakage.',
      ];
      recommendation =
        'Clean the optical probe tip aperture using 70% isopropyl wipes. If attenuation persists above 15%, replace optical contact tip assembly before clinical use.';
      checks = [
        {
          name: 'Optical Spectrum Integrity',
          category: 'optical',
          status: 'warning',
          message: '550nm emitter path shows 18% luminous flux attenuation.',
          measuredValue: '552.1 nm (attenuated)',
          referenceThreshold: '±2.0 nm',
        },
        {
          name: 'Photodiode Sensor Response',
          category: 'sensor',
          status: 'passed',
          message: 'Photodiode dynamic range SNR within acceptable limits.',
          measuredValue: '62.1 dB',
          referenceThreshold: '> 60.0 dB',
        },
        {
          name: 'Calibration Baseline Drift',
          category: 'calibration',
          status: 'warning',
          message: 'Baseline drift elevated near warning threshold (0.28 mg/dL).',
          measuredValue: '0.28 mg/dL',
          referenceThreshold: '< 0.30 mg/dL',
        },
        {
          name: 'Ambient Light Shielding',
          category: 'optical',
          status: 'failed',
          message: 'Excessive ambient photon leakage detected during dark scan phase.',
          measuredValue: '0.42 lux leak',
          referenceThreshold: '< 0.20 lux',
        },
        {
          name: 'Hardware Bus & Sensor Continuity',
          category: 'hardware',
          status: 'passed',
          message: 'I2C bus responsive with zero frame corruption.',
          measuredValue: '1.2 ms latency',
          referenceThreshold: '< 5.0 ms',
        },
        {
          name: 'Power Regulation & Battery Core',
          category: 'hardware',
          status: 'passed',
          message: 'Power rail output stable.',
          measuredValue: '3.28 V',
          referenceThreshold: '3.3V ± 5%',
        },
      ];
    } else {
      // outcome === 'calibration_required'
      overallScore = Math.floor(Math.random() * 6) + 76; // 76-81%
      issues = [
        'Spectrophotometric baseline drift exceeds acceptable clinical limit (> 0.35 mg/dL).',
        'Last optical calibration cycle expired or requires recalibration verification on standard tile.',
      ];
      recommendation =
        'Perform zero-reference optical tile recalibration via the BiliSURE Calibration dock before screening neonates.';
      checks = [
        {
          name: 'Optical Spectrum Integrity',
          category: 'optical',
          status: 'passed',
          message: 'Dual-wavelength optical emitters functional.',
          measuredValue: '460.1 nm / 550.0 nm',
          referenceThreshold: '±2.0 nm',
        },
        {
          name: 'Photodiode Sensor Response',
          category: 'sensor',
          status: 'passed',
          message: 'Sensor sensitivity verified.',
          measuredValue: '65.2 dB',
          referenceThreshold: '> 60.0 dB',
        },
        {
          name: 'Calibration Baseline Drift',
          category: 'calibration',
          status: 'failed',
          message: 'Reflectance drift 0.41 mg/dL exceeds clinical variance tolerance.',
          measuredValue: '0.41 mg/dL',
          referenceThreshold: '< 0.30 mg/dL',
        },
        {
          name: 'Ambient Light Shielding',
          category: 'optical',
          status: 'passed',
          message: 'Ambient shroud integrity intact.',
          measuredValue: '0.08 lux leak',
          referenceThreshold: '< 0.20 lux',
        },
        {
          name: 'Hardware Bus & Sensor Continuity',
          category: 'hardware',
          status: 'passed',
          message: 'Hardware telemetry bus operational.',
          measuredValue: '1.0 ms latency',
          referenceThreshold: '< 5.0 ms',
        },
        {
          name: 'Power Regulation & Battery Core',
          category: 'hardware',
          status: 'passed',
          message: 'Battery charge state and voltage healthy.',
          measuredValue: '3.30 V',
          referenceThreshold: '3.3V ± 5%',
        },
      ];
    }

    const diagnosticId = `DIAG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const diagnostic = await DeviceDiagnosticModel.create({
      diagnosticId,
      deviceId: device._id.toString(),
      deviceSerial: device.serialNumber,
      facility: device.facility || facility,
      department: device.assignedWard || department,
      healthStatus: outcome,
      overallScore,
      checks,
      issues,
      recommendation,
      scannedBy,
      testDurationMs: 3100,
      scenario: outcome === 'healthy' ? 'healthy' : outcome === 'issue_detected' ? 'optical_degradation' : 'calibration_drift',
    });

    // Update Device status in MongoDB
    device.lastDiagnosticStatus = outcome;
    if (outcome === 'healthy') {
      device.status = 'calibrated';
      device.accuracyTestPassed = true;
    } else if (outcome === 'issue_detected') {
      device.status = 'alert_broken';
      device.accuracyTestPassed = false;
    } else {
      device.status = 'maintenance';
      device.isCalibrated = false;
    }
    await device.save();

    return diagnostic;
  }

  /**
   * Get diagnostic history for a facility or specific device
   */
  static async getHistory(params: {
    facility?: string;
    deviceSerial?: string;
    isSuperAdmin?: boolean;
    limit?: number;
    page?: number;
  }) {
    const { facility, deviceSerial, isSuperAdmin = false, limit = 20, page = 1 } = params;
    const filter: any = {};

    if (!isSuperAdmin && facility) {
      filter.facility = facility;
    }
    if (deviceSerial) {
      filter.deviceSerial = deviceSerial;
    }

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      DeviceDiagnosticModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      DeviceDiagnosticModel.countDocuments(filter),
    ]);

    return {
      records,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get fleet health diagnostic summary
   */
  static async getSummary(facility?: string, isSuperAdmin = false) {
    const filter: any = {};
    if (!isSuperAdmin && facility) {
      filter.facility = facility;
    }

    const devices = await DeviceModel.find(filter);
    const totalDevices = devices.length;

    let healthy = 0;
    let issues = 0;
    let calibrationRequired = 0;

    devices.forEach((d) => {
      const status = d.lastDiagnosticStatus || (d.status === 'calibrated' ? 'healthy' : d.status === 'alert_broken' ? 'issue_detected' : 'calibration_required');
      if (status === 'healthy') healthy++;
      else if (status === 'issue_detected') issues++;
      else calibrationRequired++;
    });

    const latestScan = await DeviceDiagnosticModel.findOne(filter).sort({ createdAt: -1 });

    return {
      totalDevices,
      healthy,
      issues,
      calibrationRequired,
      latestScanAt: latestScan ? latestScan.createdAt : null,
      facility: facility || 'All Facilities',
    };
  }
}
