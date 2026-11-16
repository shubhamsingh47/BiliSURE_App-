import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITreatmentSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  phototherapyType: string; // 'Double Surface LED', 'Overhead Blue LED', etc.
  irradianceMwCm2?: number; // e.g. 35 µW/cm²/nm
  nurseName: string;
  notes?: string;
  status: 'active' | 'completed' | 'interrupted';
  interruptionReason?: string;
  pausedAt?: Date;
  resumedAt?: Date;
}

export interface IAdmission extends Document {
  admissionId: string; // Unique e.g. "ADM-2026-0042"
  babyId: Types.ObjectId | string;
  babyUhid: string;
  babyName: string;
  hospitalId: Types.ObjectId | string;
  hospitalName: string;
  referralId?: Types.ObjectId | string;
  physicalArrivalConfirmed: boolean;
  arrivalConfirmedAt?: Date;
  arrivalConfirmedBy?: string;
  ptStationId?: string;
  ptStationName?: string;
  admittedAt: Date;
  admissionStatus: 'admitted' | 'under_treatment' | 'in_observation' | 'discharged';
  assignedDoctor: string;
  primaryNurse: string;
  initialAdmissionBilirubin: number;
  cumulativeTreatmentMinutes?: number;
  treatmentSessions: ITreatmentSession[];
  dischargeApprovedByDoctor?: string;
  dischargeApprovedAt?: Date;
  dischargeBilirubinValue?: number;
  dischargeNotes?: string;
  followUpPlan?: string;
  dischargedAt?: Date;
  stationReleased: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentSessionSchema = new Schema<ITreatmentSession>(
  {
    sessionId: { type: String, required: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    phototherapyType: { type: String, default: 'Double Surface LED' },
    irradianceMwCm2: { type: Number, default: 35 },
    nurseName: { type: String, default: 'Nurse' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'completed', 'interrupted'],
      default: 'active',
    },
  },
  { _id: false }
);

const AdmissionSchema = new Schema<IAdmission>(
  {
    admissionId: { type: String, required: true, unique: true, uppercase: true, index: true },
    babyId: { type: Schema.Types.Mixed, required: true, index: true },
    babyUhid: { type: String, required: true, index: true },
    babyName: { type: String, required: true },
    hospitalId: { type: Schema.Types.Mixed, required: true, index: true },
    hospitalName: { type: String, required: true },
    referralId: { type: Schema.Types.Mixed },
    physicalArrivalConfirmed: { type: Boolean, default: false },
    arrivalConfirmedAt: { type: Date },
    arrivalConfirmedBy: { type: String },
    ptStationId: { type: String },
    ptStationName: { type: String },
    admittedAt: { type: Date, default: Date.now },
    admissionStatus: {
      type: String,
      enum: ['admitted', 'under_treatment', 'in_observation', 'discharged'],
      default: 'admitted',
      index: true,
    },
    assignedDoctor: { type: String, default: 'Dr. Hospital Paediatrician' },
    primaryNurse: { type: String, default: 'Nurse' },
    initialAdmissionBilirubin: { type: Number, default: 0 },
    cumulativeTreatmentMinutes: { type: Number, default: 0 },
    treatmentSessions: [TreatmentSessionSchema],
    dischargeApprovedByDoctor: { type: String },
    dischargeApprovedAt: { type: Date },
    dischargeBilirubinValue: { type: Number },
    dischargeNotes: { type: String },
    followUpPlan: { type: String },
    dischargedAt: { type: Date },
    stationReleased: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AdmissionSchema.index({ hospitalId: 1, admissionStatus: 1 });

export const AdmissionModel = mongoose.model<IAdmission>('Admission', AdmissionSchema);
