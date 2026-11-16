import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBaby extends Document {
  uhid: string;
  bilisureId?: string; // Permanent BiliSURE Patient ID e.g. "BS-2026-0042"
  name: string;
  parentsName: string;
  guardianPhone?: string;
  guardianAddress?: string;
  bloodGroup?: string;
  rhesusFactor?: 'positive' | 'negative' | 'unknown';
  directCoombsTest?: 'positive' | 'negative' | 'not_tested';
  dateOfBirth: Date;
  exactTimeOfBirth?: string; // e.g. "08:30" or ISO timestamp
  gestationalAgeWeeks?: number;
  gestationalAgeDays?: number;
  birthWeightGrams?: number;
  currentWeightGrams?: number;
  weight?: number; // In kg or as entered
  height?: number; // In cm
  assignedDoctor: string;
  facility: string;
  department: string;
  referringDoctor?: string;
  referringCentre?: string;
  currentHospital?: string;
  currentStationId?: string;
  severityState: 'normal' | 'moderate' | 'critical';
  status: 'admitted' | 'under_treatment' | 'in_observation' | 'discharged';
  referralStatus?: 'none' | 'pending' | 'accepted' | 'rejected' | 'admitted';
  initialValue?: number;
  dischargeValue?: number;
  riskFactors?: string[];
  attachments?: string[];
  registeredBy?: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const BabySchema = new Schema<IBaby>(
  {
    uhid: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    bilisureId: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    parentsName: { type: String, required: true, trim: true },
    guardianPhone: { type: String, trim: true },
    guardianAddress: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    rhesusFactor: { type: String, enum: ['positive', 'negative', 'unknown'], default: 'unknown' },
    directCoombsTest: { type: String, enum: ['positive', 'negative', 'not_tested'], default: 'not_tested' },
    dateOfBirth: { type: Date, required: true },
    exactTimeOfBirth: { type: String, default: '09:00' },
    gestationalAgeWeeks: { type: Number, default: 38 },
    gestationalAgeDays: { type: Number, default: 0 },
    birthWeightGrams: { type: Number },
    currentWeightGrams: { type: Number },
    weight: { type: Number, default: 3.1 },
    height: { type: Number, default: 49.0 },
    assignedDoctor: { type: String, default: 'Dr. XYZ' },
    facility: { type: String, default: 'Central Children Hospital' },
    department: { type: String, default: 'NICU', index: true },
    referringDoctor: { type: String },
    referringCentre: { type: String },
    currentHospital: { type: String },
    currentStationId: { type: String },
    severityState: {
      type: String,
      enum: ['normal', 'moderate', 'critical'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['admitted', 'under_treatment', 'in_observation', 'discharged'],
      default: 'admitted',
      index: true,
    },
    referralStatus: {
      type: String,
      enum: ['none', 'pending', 'accepted', 'rejected', 'admitted'],
      default: 'none',
    },
    initialValue: { type: Number, default: 0 },
    dischargeValue: { type: Number, default: 0 },
    riskFactors: [{ type: String }],
    attachments: [{ type: String }],
    registeredBy: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

BabySchema.index({ department: 1, severityState: 1 });
BabySchema.index({ createdAt: -1 });

export const BabyModel = mongoose.model<IBaby>('Baby', BabySchema);
