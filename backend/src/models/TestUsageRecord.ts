import mongoose, { Schema, Document } from 'mongoose';

export interface ITestUsageRecord extends Document {
  usageId: string;
  facility: string; // 'PGI' | 'RML' | 'KGMU'
  department: string;
  babyUhid: string;
  babyName?: string;
  deviceSerial: string;
  readingId?: string;
  readingValueMgDl?: number;
  method: 'TcB' | 'TSB';
  creditsConsumed: number;
  costINR: number;
  testTimestamp: Date;
  operatorName?: string;
  status: 'billed' | 'pending' | 'reversed';
  isSynthetic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestUsageRecordSchema = new Schema<ITestUsageRecord>(
  {
    usageId: { type: String, required: true, unique: true, index: true },
    facility: { type: String, required: true, index: true },
    department: { type: String, default: 'NICU' },
    babyUhid: { type: String, required: true, index: true },
    babyName: { type: String },
    deviceSerial: { type: String, required: true, index: true },
    readingId: { type: String },
    readingValueMgDl: { type: Number },
    method: { type: String, enum: ['TcB', 'TSB'], default: 'TcB' },
    creditsConsumed: { type: Number, default: 1 },
    costINR: { type: Number, required: true },
    testTimestamp: { type: Date, default: Date.now, index: true },
    operatorName: { type: String, default: 'Staff Nurse' },
    status: {
      type: String,
      enum: ['billed', 'pending', 'reversed'],
      default: 'billed',
    },
    isSynthetic: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const TestUsageRecordModel = mongoose.model<ITestUsageRecord>(
  'TestUsageRecord',
  TestUsageRecordSchema
);
