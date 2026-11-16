import { DeviceModel } from '../../models/Device';

let mockDevice = {
  _id: 'dev_bilisure_01',
  serialNumber: 'BS-2026-X1-9942',
  deviceModel: 'BiliSURE Transcutaneous Bilirubinometer X1',
  macAddress: 'B8:27:EB:9A:82:1F',
  facility: 'Central Children Hospital',
  department: 'NICU',
  autoCalibrateEnabled: true,
  accuracyTestPassed: true,
  recordCalibrationLog: false,
  remainingTests: 7500,
  totalTests: 14000,
  isCalibrated: true,
  status: 'calibrated',
  lastCalibratedAt: new Date(),
};

export class DevicesService {
  static async getDeviceProfile() {
    try {
      const dev = await DeviceModel.findOne().lean();
      if (dev) return dev;
    } catch {}
    return mockDevice;
  }

  static async updateCalibrationSettings(settings: {
    autoCalibrateEnabled?: boolean;
    accuracyTestPassed?: boolean;
    recordCalibrationLog?: boolean;
  }) {
    try {
      const updated = await DeviceModel.findOneAndUpdate(
        {},
        { $set: settings },
        { new: true, upsert: true }
      ).lean();
      if (updated) return updated;
    } catch {}

    mockDevice = { ...mockDevice, ...settings };
    return mockDevice;
  }

  static async triggerCalibration() {
    try {
      const updated = await DeviceModel.findOneAndUpdate(
        {},
        {
          $set: {
            isCalibrated: true,
            status: 'calibrated',
            lastCalibratedAt: new Date(),
          },
        },
        { new: true, upsert: true }
      ).lean();
      if (updated) return updated;
    } catch {}

    mockDevice.isCalibrated = true;
    mockDevice.status = 'calibrated';
    mockDevice.lastCalibratedAt = new Date();
    return mockDevice;
  }

  static async getDiagnostics() {
    return {
      status: mockDevice.remainingTests <= 10 ? 'alert_broken' : 'ok',
      remainingTests: mockDevice.remainingTests,
      totalTests: mockDevice.totalTests,
      errorMessage: mockDevice.remainingTests <= 10 ? 'Sorry! No more tests can be performed' : null,
      deviceHealth: 'Good',
      batteryLevel: 94,
    };
  }
}
