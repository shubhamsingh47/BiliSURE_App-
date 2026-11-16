import mongoose, { Schema, Document, Types } from 'mongoose';

export type BhutaniRiskZone =
  | 'low'
  | 'low_intermediate'
  | 'high_intermediate'
  | 'high'
  | 'ineligible';

export type PhototherapyPhase =
  | 'pre_phototherapy'
  | 'during_phototherapy'
  | 'post_phototherapy'
  | 'none';

export interface IBilirubinReading extends Document {
  clientOperationId: string;
  babyId: Types.ObjectId | string;
  babyUhid?: string;
  value: number; // in unit specified
  valueMgDl: number; // normalized to mg/dL for clinical calculation
  unit: 'mg/dL' | 'µmol/L';
  method: 'TSB' | 'TcB'; // Total Serum Bilirubin vs Transcutaneous
  sampleTimestamp: Date;
  postnatalAgeHours: number; // Postnatal age in exact hours at sample collection
  measurementSite: 'palms_and_soles' | 'face' | 'forehead' | 'sternum' | 'abdomen';
  source: 'manual_entry' | 'device_transcutaneous' | 'serum_lab';
  bhutaniZone: BhutaniRiskZone;
  bhutaniPercentileApprox?: number;
  phototherapyPhase: PhototherapyPhase;
  guidelineUsed?: string;
  isEligibleForBhutani: boolean;
  ineligibilityReason?: string;
  deviceId?: Types.ObjectId | string;
  operatorId?: Types.ObjectId | string;
  operatorName: string;
  symptoms?: string;
  riskFactors?: string[];
  timestamp: Date;
  isInitial: boolean;
  isDischarge: boolean;
  correctionHistory?: {
    previousValue: number;
    correctedBy: string;
    reason: string;
    correctedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const BilirubinReadingSchema = new Schema<IBilirubinReading>(
  {
    clientOperationId: { type: String, required: true, unique: true, index: true },
    babyId: { type: Schema.Types.Mixed, required: true, index: true },
    babyUhid: { type: String, index: true },
    value: { type: Number, required: true },
    valueMgDl: { type: Number, required: true, default: 0 },
    unit: { type: String, enum: ['mg/dL', 'µmol/L'], default: 'mg/dL' },
    method: { type: String, enum: ['TSB', 'TcB'], default: 'TSB' },
    sampleTimestamp: { type: Date, default: Date.now },
    postnatalAgeHours: { type: Number, default: 24 },
    measurementSite: {
      type: String,
      enum: ['palms_and_soles', 'face', 'forehead', 'sternum', 'abdomen'],
      default: 'palms_and_soles',
    },
    source: {
      type: String,
      enum: ['manual_entry', 'device_transcutaneous', 'serum_lab'],
      default: 'manual_entry',
    },
    bhutaniZone: {
      type: String,
      enum: ['low', 'low_intermediate', 'high_intermediate', 'high', 'ineligible'],
      default: 'low',
    },
    bhutaniPercentileApprox: { type: Number },
    phototherapyPhase: {
      type: String,
      enum: ['pre_phototherapy', 'during_phototherapy', 'post_phototherapy', 'none'],
      default: 'pre_phototherapy',
    },
    guidelineUsed: { type: String, default: 'AAP 2004 / Bhutani Nomogram' },
    isEligibleForBhutani: { type: Boolean, default: true },
    ineligibilityReason: { type: String },
    deviceId: { type: Schema.Types.Mixed },
    operatorId: { type: Schema.Types.Mixed },
    operatorName: { type: String, default: 'Dr. / Nurse' },
    symptoms: { type: String, default: '' },
    riskFactors: [{ type: String }],
    timestamp: { type: Date, default: Date.now, index: true },
    isInitial: { type: Boolean, default: false },
    isDischarge: { type: Boolean, default: false },
    correctionHistory: [
      {
        previousValue: { type: Number, required: true },
        correctedBy: { type: String, required: true },
        reason: { type: String, required: true },
        correctedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

BilirubinReadingSchema.index({ babyId: 1, timestamp: -1 });

export const BilirubinReadingModel = mongoose.model<IBilirubinReading>('BilirubinReading', BilirubinReadingSchema);
