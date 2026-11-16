import mongoose, { Schema, Document } from 'mongoose';

export type ReservationStatus = 'active' | 'fulfilled' | 'expired' | 'cancelled';

export interface ICapacityReservation extends Document {
  reservationId: string;
  referralId: string;
  referralCode?: string;
  hospitalId: string;
  hospitalName: string;
  babyId: string;
  babyUhid: string;
  stationId?: string;
  stationName?: string;
  reservedBy: string; // Doctor or nurse who accepted and reserved
  reservedAt: Date;
  expiresAt: Date;
  durationMinutes: number;
  status: ReservationStatus;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  fulfilledAt?: Date;
  admissionId?: string;
  actionLog: {
    action: 'created' | 'extended' | 'cancelled' | 'fulfilled' | 'expired';
    performedBy: string;
    timestamp: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CapacityReservationSchema = new Schema<ICapacityReservation>(
  {
    reservationId: { type: String, required: true, unique: true, index: true },
    referralId: { type: String, required: true, index: true },
    referralCode: { type: String },
    hospitalId: { type: String, required: true, index: true },
    hospitalName: { type: String, required: true },
    babyId: { type: String, required: true },
    babyUhid: { type: String, required: true },
    stationId: { type: String },
    stationName: { type: String },
    reservedBy: { type: String, required: true },
    reservedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 120 }, // 2 hours standard reservation window
    status: {
      type: String,
      enum: ['active', 'fulfilled', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    cancellationReason: { type: String },
    fulfilledAt: { type: Date },
    admissionId: { type: String },
    actionLog: [
      {
        action: {
          type: String,
          enum: ['created', 'extended', 'cancelled', 'fulfilled', 'expired'],
          required: true,
        },
        performedBy: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Compound index to prevent duplicate active reservations for the same referral
CapacityReservationSchema.index(
  { referralId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

export const CapacityReservationModel =
  mongoose.models.CapacityReservation ||
  mongoose.model<ICapacityReservation>('CapacityReservation', CapacityReservationSchema);
