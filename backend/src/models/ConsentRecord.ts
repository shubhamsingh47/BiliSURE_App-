import mongoose, { Schema, Document } from 'mongoose';

export type ConsentType = 'phototherapy' | 'referral_transfer' | 'exchange_transfusion' | 'data_sharing';

export interface IConsentRecord extends Document {
  consentId: string;
  babyId: string;
  babyUhid: string;
  consentType: ConsentType;
  guardianName: string;
  relationship: 'mother' | 'father' | 'legal_guardian';
  guardianContact: string;
  hasConsented: boolean;
  witnessName?: string;
  witnessRole?: string;
  clinicianName: string;
  facility: string;
  consentTimestamp: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentRecordSchema = new Schema<IConsentRecord>(
  {
    consentId: { type: String, required: true, unique: true, index: true },
    babyId: { type: String, required: true, index: true },
    babyUhid: { type: String, required: true, index: true },
    consentType: {
      type: String,
      enum: ['phototherapy', 'referral_transfer', 'exchange_transfusion', 'data_sharing'],
      required: true,
    },
    guardianName: { type: String, required: true },
    relationship: {
      type: String,
      enum: ['mother', 'father', 'legal_guardian'],
      default: 'mother',
    },
    guardianContact: { type: String, required: true },
    hasConsented: { type: Boolean, required: true, default: true },
    witnessName: { type: String },
    witnessRole: { type: String },
    clinicianName: { type: String, required: true },
    facility: { type: String, required: true },
    consentTimestamp: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ConsentRecordModel =
  mongoose.models.ConsentRecord ||
  mongoose.model<IConsentRecord>('ConsentRecord', ConsentRecordSchema);
