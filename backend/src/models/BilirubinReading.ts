import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBilirubinReading extends Document {
  clientOperationId: string;
  babyId: Types.ObjectId;
  value: number; // in mg/dL, preserved precision
  unit: string;
  measurementSite: 'palms_and_soles' | 'face' | 'forehead' | 'sternum' | 'abdomen';
  source: 'manual_entry' | 'device_transcutaneous' | 'serum_lab';
  deviceId?: Types.ObjectId;
  operatorId?: Types.ObjectId;
  operatorName: string;
  symptoms?: string;
  riskLevel: 'low' | 'intermediate' | 'high';
  timestamp: Date;
  isInitial: boolean;
  isDischarge: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BilirubinReadingSchema = new Schema<IBilirubinReading>(
  {
    clientOperationId: { type: String, required: true, unique: true, index: true },
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true, index: true },
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
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
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
    operatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    operatorName: { type: String, default: 'Nurse A' },
    symptoms: { type: String, default: '' },
    riskLevel: {
      type: String,
      enum: ['low', 'intermediate', 'high'],
      default: 'low',
    },
    timestamp: { type: Date, default: Date.now, index: true },
    isInitial: { type: Boolean, default: false },
    isDischarge: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BilirubinReadingSchema.index({ babyId: 1, timestamp: -1 });

export const BilirubinReadingModel = mongoose.model<IBilirubinReading>('BilirubinReading', BilirubinReadingSchema);
