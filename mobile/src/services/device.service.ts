// BiliSURE Device Service Abstraction
// Designed for clean decoupling so hardware BLE / Kotlin SDK integration can be plugged in later

import { DeviceProfile } from '../types';

export interface IDeviceService {
  getDeviceProfile(): Promise<DeviceProfile>;
  updateSettings(settings: Partial<DeviceProfile>): Promise<DeviceProfile>;
  triggerCalibration(): Promise<{ success: boolean; isCalibrated: boolean }>;
  getRemainingTests(): Promise<{ remaining: number; total: number; isExhausted: boolean }>;
}

export class DeviceService implements IDeviceService {
  private static instance: DeviceService;

  private currentProfile: DeviceProfile = {
    serialNumber: 'BS-2026-X1-9942',
    deviceModel: 'BiliSURE Transcutaneous Bilirubinometer X1',
    macAddress: 'B8:27:EB:9A:82:1F',
    autoCalibrateEnabled: true,
    accuracyTestPassed: true,
    recordCalibrationLog: false,
    remainingTests: 7500,
    totalTests: 14000,
    isCalibrated: true,
    status: 'calibrated',
    lastCalibratedAt: new Date().toISOString(),
  };

  public static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  async getDeviceProfile(): Promise<DeviceProfile> {
    return { ...this.currentProfile };
  }

  async updateSettings(settings: Partial<DeviceProfile>): Promise<DeviceProfile> {
    this.currentProfile = { ...this.currentProfile, ...settings };
    return { ...this.currentProfile };
  }

  async triggerCalibration(): Promise<{ success: boolean; isCalibrated: boolean }> {
    this.currentProfile.isCalibrated = true;
    this.currentProfile.lastCalibratedAt = new Date().toISOString();
    return { success: true, isCalibrated: true };
  }

  async getRemainingTests(): Promise<{ remaining: number; total: number; isExhausted: boolean }> {
    return {
      remaining: this.currentProfile.remainingTests,
      total: this.currentProfile.totalTests,
      isExhausted: this.currentProfile.remainingTests <= 0,
    };
  }
}

export const deviceService = DeviceService.getInstance();
