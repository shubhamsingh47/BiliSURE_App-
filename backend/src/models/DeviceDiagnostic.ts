import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnosticCheck {
  name: string;
  category: 'hardware' | 'optical' | 'sensor' | 'calibration' | 'connectivity';
  status: 'passed' | 'warning' | 'failed';
  message: string;
  measuredValue?: string;
  referenceThreshold?: string;
}

export interface IDeviceDiagnostic extends Document {
  diagnosticId: string;
  deviceId?: string;
  deviceSerial: string;
  facility: string; // 'PGI' | 'RML' | 'KGMU'
  department: string;
  healthStatus: 'healthy' | 'issue_detected' | 'calibration_required';
  overallScore: number; // 0 - 100
  checks: IDiagnosticCheck[];
  issues: string[];
  recommendation: string;
  scannedBy?: string;
  testDurationMs: number;
  scenario?: 'healthy' | 'optical_degradation' | 'calibration_drift' | 'sensor_fault';
  isSynthetic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiagnosticCheckSchema = new Schema<IDiagnosticCheck>(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['hardware', 'optical', 'sensor', 'calibration', 'connectivity'],
      default: 'hardware',
    },
    status: {
      type: String,
      enum: ['passed', 'warning', 'failed'],
      required: true,
    },
    message: { type: String, required: true },
    measuredValue: { type: String },
    referenceThreshold: { type: String },
  },
  { _id: false }
);

const DeviceDiagnosticSchema = new Schema<IDeviceDiagnostic>(
  {
    diagnosticId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String },
    deviceSerial: { type: String, required: true, index: true },
    facility: { type: String, required: true, index: true },
    department: { type: String, default: 'NICU' },
    healthStatus: {
      type: String,
      enum: ['healthy', 'issue_detected', 'calibration_required'],
      required: true,
      index: true,
    },
    overallScore: { type: Number, default: 95 },
    checks: [DiagnosticCheckSchema],
    issues: [{ type: String }],
    recommendation: { type: String, required: true },
    scannedBy: { type: String, default: 'Clinical Engineer' },
    testDurationMs: { type: Number, default: 3200 },
    scenario: { type: String, default: 'healthy' },
    isSynthetic: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const DeviceDiagnosticModel = mongoose.model<IDeviceDiagnostic>(
  'DeviceDiagnostic',
  DeviceDiagnosticSchema
);
