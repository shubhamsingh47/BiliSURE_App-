import mongoose, { Schema, Document, Types } from 'mongoose';

export type PTStationStatus =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'out_of_service'
  | 'cleaning_prep';

export type PTStationType =
  | 'single_surface'
  | 'double_surface'
  | 'led_tunnel'
  | 'fiberoptic_blanket';

export interface IPTStation extends Document {
  stationId: string; // Unique human-readable code e.g. "PT-NICU-01"
  hospitalId: Types.ObjectId | string;
  hospitalName: string;
  name: string;
  type: PTStationType;
  location: string;
  operationalStatus: PTStationStatus;
  currentBabyId?: Types.ObjectId | string | null;
  currentBabyName?: string | null;
  currentBabyUhid?: string | null;
  currentAdmissionId?: Types.ObjectId | string | null;
  allocatedAt?: Date | null;
  lastCleanedAt?: Date;
  lastUpdated: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PTStationSchema = new Schema<IPTStation>(
  {
    stationId: { type: String, required: true, uppercase: true, trim: true },
    hospitalId: { type: Schema.Types.Mixed, required: true, index: true },
    hospitalName: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['single_surface', 'double_surface', 'led_tunnel', 'fiberoptic_blanket'],
      default: 'double_surface',
    },
    location: { type: String, default: 'NICU Main Ward' },
    operationalStatus: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'out_of_service', 'cleaning_prep'],
      default: 'available',
      index: true,
    },
    currentBabyId: { type: Schema.Types.Mixed, default: null },
    currentBabyName: { type: String, default: null },
    currentBabyUhid: { type: String, default: null },
    currentAdmissionId: { type: Schema.Types.Mixed, default: null },
    allocatedAt: { type: Date, default: null },
    lastCleanedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

PTStationSchema.index({ hospitalId: 1, stationId: 1 }, { unique: true });

export const PTStationModel = mongoose.model<IPTStation>('PTStation', PTStationSchema);
