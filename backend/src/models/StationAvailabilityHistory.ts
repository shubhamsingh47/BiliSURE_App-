import mongoose, { Schema, Document } from 'mongoose';

export interface IStationAvailabilityHistory extends Document {
  hospitalId: string;
  hospitalName: string;
  district: string;
  totalStations: number;
  operationalStations: number;
  occupiedStations: number;
  reservedStations: number;
  availableStations: number;
  cleaningStations: number;
  maintenanceStations: number;
  outOfServiceStations: number;
  changeReason: 'allocation' | 'discharge' | 'maintenance_toggle' | 'cleaning_complete' | 'reservation_created' | 'reservation_expired';
  stationId?: string;
  performedBy: string;
  timestamp: Date;
}

const StationAvailabilityHistorySchema = new Schema<IStationAvailabilityHistory>(
  {
    hospitalId: { type: String, required: true, index: true },
    hospitalName: { type: String, required: true },
    district: { type: String, required: true, index: true },
    totalStations: { type: Number, required: true },
    operationalStations: { type: Number, required: true },
    occupiedStations: { type: Number, required: true },
    reservedStations: { type: Number, default: 0 },
    availableStations: { type: Number, required: true },
    cleaningStations: { type: Number, default: 0 },
    maintenanceStations: { type: Number, default: 0 },
    outOfServiceStations: { type: Number, default: 0 },
    changeReason: {
      type: String,
      enum: [
        'allocation',
        'discharge',
        'maintenance_toggle',
        'cleaning_complete',
        'reservation_created',
        'reservation_expired',
      ],
      required: true,
    },
    stationId: { type: String },
    performedBy: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const StationAvailabilityHistoryModel =
  mongoose.models.StationAvailabilityHistory ||
  mongoose.model<IStationAvailabilityHistory>('StationAvailabilityHistory', StationAvailabilityHistorySchema);
