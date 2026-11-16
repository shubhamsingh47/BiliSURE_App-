import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBaby extends Document {
  uhid: string;
  name: string;
  parentsName: string;
  dateOfBirth: Date;
  gestationalAgeWeeks?: number;
  birthWeightGrams?: number;
  currentWeightGrams?: number;
  weight?: number; // In kg or as entered
  height?: number; // In cm
  assignedDoctor: string;
  facility: string;
  department: string;
  severityState: 'normal' | 'moderate' | 'critical';
  status: 'admitted' | 'under_treatment' | 'in_observation' | 'discharged';
  initialValue?: number;
  dischargeValue?: number;
  attachments?: string[];
  registeredBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BabySchema = new Schema<IBaby>(
  {
    uhid: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    parentsName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gestationalAgeWeeks: { type: Number },
    birthWeightGrams: { type: Number },
    currentWeightGrams: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    assignedDoctor: { type: String, default: 'Dr. XYZ' },
    facility: { type: String, default: 'Central Children Hospital' },
    department: { type: String, default: 'NICU', index: true },
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
    initialValue: { type: Number, default: 0 },
    dischargeValue: { type: Number, default: 0 },
    attachments: [{ type: String }],
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

BabySchema.index({ department: 1, severityState: 1 });
BabySchema.index({ createdAt: -1 });

export const BabyModel = mongoose.model<IBaby>('Baby', BabySchema);
