import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDischargeRecord extends Document {
  babyId: Types.ObjectId;
  dischargedBy?: Types.ObjectId;
  doctorName: string;
  initialReading: number;
  dischargeReading: number;
  dischargeDate: Date;
  dischargeSummary: string;
  followUpPlan: string;
  status: 'discharged' | 'pending_approval';
  createdAt: Date;
  updatedAt: Date;
}

const DischargeRecordSchema = new Schema<IDischargeRecord>(
  {
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true, index: true },
    dischargedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    doctorName: { type: String, default: 'Dr. XYZ' },
    initialReading: { type: Number, required: true },
    dischargeReading: { type: Number, required: true },
    dischargeDate: { type: Date, default: Date.now },
    dischargeSummary: { type: String, default: 'Normal resolution of neonatal jaundice.' },
    followUpPlan: { type: String, default: 'Pediatric follow up in 48 hours.' },
    status: {
      type: String,
      enum: ['discharged', 'pending_approval'],
      default: 'discharged',
    },
  },
  { timestamps: true }
);

export const DischargeRecordModel = mongoose.model<IDischargeRecord>('DischargeRecord', DischargeRecordSchema);
