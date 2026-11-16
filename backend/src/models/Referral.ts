import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReferralStatus =
  | 'created'
  | 'sent'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'arrived'
  | 'admitted'
  | 'under_treatment'
  | 'treatment_completed'
  | 'discharged'
  | 'cancelled'
  | 'not_arrived'
  | 'transferred'
  | 'clarification_requested'
  | 'completed';

export type ReferralUrgency = 'routine' | 'urgent' | 'emergency';

export interface IReferralTimelineItem {
  status: ReferralStatus;
  timestamp: Date;
  performedBy: string;
  notes?: string;
}

export interface IReferral extends Document {
  referralId: string; // Unique e.g. "REF-2026-0042"
  babyId: Types.ObjectId | string;
  babyName: string;
  babyUhid: string;
  dateOfBirth: Date;
  gestationalAgeWeeks: number;
  referringDoctorId?: Types.ObjectId | string;
  referringDoctorName: string;
  referringCentreName: string;
  receivingHospitalId: Types.ObjectId | string;
  receivingHospitalName: string;
  status: ReferralStatus;
  urgency: ReferralUrgency;
  clinicalSummary: string;
  latestBilirubinValue: number;
  latestBilirubinUnit: string;
  latestBhutaniRiskZone: string;
  postnatalAgeHoursAtReferral: number;
  phototherapyRecommended: boolean;
  rejectionReason?: string;
  clarificationNotes?: string;
  transferredToHospitalName?: string;
  transferredToHospitalId?: string;
  originalReferralId?: string; // Set when this referral is created as a re-referral
  reviewedByDoctorName?: string;
  reviewedAt?: Date;
  arrivedAt?: Date;
  arrivalConfirmedBy?: string;
  allocatedStationId?: string;
  reservationId?: string;
  hasCapacityReservation: boolean;
  timeline: IReferralTimelineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referralId: { type: String, required: true, unique: true, uppercase: true, index: true },
    babyId: { type: Schema.Types.Mixed, required: true, index: true },
    babyName: { type: String, required: true },
    babyUhid: { type: String, required: true, index: true },
    dateOfBirth: { type: Date, required: true },
    gestationalAgeWeeks: { type: Number, default: 38 },
    referringDoctorId: { type: Schema.Types.Mixed },
    referringDoctorName: { type: String, required: true, default: 'Dr. Referring' },
    referringCentreName: { type: String, required: true, default: 'Community Health Centre' },
    receivingHospitalId: { type: Schema.Types.Mixed, required: true, index: true },
    receivingHospitalName: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'created',
        'sent',
        'pending',
        'accepted',
        'rejected',
        'arrived',
        'admitted',
        'under_treatment',
        'treatment_completed',
        'discharged',
        'cancelled',
        'not_arrived',
        'transferred',
        'clarification_requested',
        'completed',
      ],
      default: 'pending',
      index: true,
    },
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'emergency'],
      default: 'routine',
    },
    clinicalSummary: { type: String, default: '' },
    latestBilirubinValue: { type: Number, default: 0 },
    latestBilirubinUnit: { type: String, default: 'mg/dL' },
    latestBhutaniRiskZone: { type: String, default: 'low' },
    postnatalAgeHoursAtReferral: { type: Number, default: 24 },
    phototherapyRecommended: { type: Boolean, default: false },
    rejectionReason: { type: String },
    clarificationNotes: { type: String },
    transferredToHospitalName: { type: String },
    transferredToHospitalId: { type: String },
    originalReferralId: { type: String },
    reviewedByDoctorName: { type: String },
    reviewedAt: { type: Date },
    arrivedAt: { type: Date },
    arrivalConfirmedBy: { type: String },
    allocatedStationId: { type: String },
    reservationId: { type: String },
    hasCapacityReservation: { type: Boolean, default: false },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        performedBy: { type: String, required: true },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

ReferralSchema.index({ receivingHospitalId: 1, status: 1 });
ReferralSchema.index({ babyUhid: 1, createdAt: -1 });

export const ReferralModel =
  mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);
