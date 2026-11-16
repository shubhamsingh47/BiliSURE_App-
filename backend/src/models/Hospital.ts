import mongoose, { Schema, Document } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  code: string;
  type: 'referring_centre' | 'receiving_hospital';
  district: string;
  districtId?: string;
  address: string;
  contactNumber: string;
  totalPTStations: number;
  operationalPTStations: number;
  occupiedPTStations: number;
  reservedPTStations: number;
  availablePTStations: number;
  cleaningStations: number;
  maintenanceStations: number;
  outOfServiceStations: number;
  isReferralPaused: boolean;
  pauseReason?: string;
  latitude?: number;
  longitude?: number;
  lastAvailabilityUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['referring_centre', 'receiving_hospital'],
      required: true,
      default: 'receiving_hospital',
    },
    district: { type: String, required: true, default: 'Central District', index: true },
    districtId: { type: String, index: true },
    address: { type: String, default: '' },
    contactNumber: { type: String, default: '+91-9876543210' },
    totalPTStations: { type: Number, default: 0 },
    operationalPTStations: { type: Number, default: 0 },
    occupiedPTStations: { type: Number, default: 0 },
    reservedPTStations: { type: Number, default: 0 },
    availablePTStations: { type: Number, default: 0 },
    cleaningStations: { type: Number, default: 0 },
    maintenanceStations: { type: Number, default: 0 },
    outOfServiceStations: { type: Number, default: 0 },
    isReferralPaused: { type: Boolean, default: false },
    pauseReason: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    lastAvailabilityUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

HospitalSchema.pre('save', function (next) {
  this.availablePTStations = Math.max(
    0,
    this.operationalPTStations - (this.occupiedPTStations + (this.reservedPTStations || 0))
  );
  this.lastAvailabilityUpdated = new Date();
  next();
});

export const HospitalModel = mongoose.models.Hospital || mongoose.model<IHospital>('Hospital', HospitalSchema);
