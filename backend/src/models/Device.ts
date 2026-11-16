import mongoose, { Schema } from 'mongoose';

export interface IDevice {
  _id?: any;
  serialNumber: string;
  deviceModel: string;
  macAddress: string;
  facility: string;
  department: string;
  autoCalibrateEnabled: boolean;
  accuracyTestPassed: boolean;
  recordCalibrationLog: boolean;
  remainingTests: number;
  totalTests: number;
  isCalibrated: boolean;
  status: 'active' | 'calibrated' | 'alert_broken' | 'maintenance';
  lastCalibratedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    serialNumber: { type: String, required: true, unique: true, index: true },
    deviceModel: { type: String, default: 'BiliSURE-Transcutaneous-X1' },
    macAddress: { type: String, default: '00:1B:44:11:3A:B7' },
    facility: { type: String, default: 'Central Children Hospital' },
    department: { type: String, default: 'NICU' },
    autoCalibrateEnabled: { type: Boolean, default: true },
    accuracyTestPassed: { type: Boolean, default: true },
    recordCalibrationLog: { type: Boolean, default: false },
    remainingTests: { type: Number, default: 7500 },
    totalTests: { type: Number, default: 14000 },
    isCalibrated: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'calibrated', 'alert_broken', 'maintenance'],
      default: 'calibrated',
    },
    lastCalibratedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DeviceModel = mongoose.model<IDevice>('Device', DeviceSchema);
