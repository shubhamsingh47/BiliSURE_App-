import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IObservation extends Document {
  clientOperationId: string;
  babyId: Types.ObjectId;
  observedBy?: Types.ObjectId;
  observerName: string;
  site: string;
  clinicalNotes: string;
  bilirubinValue: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ObservationSchema = new Schema<IObservation>(
  {
    clientOperationId: { type: String, required: true, unique: true, index: true },
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true, index: true },
    observedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    observerName: { type: String, default: 'Nurse A' },
    site: { type: String, required: true },
    clinicalNotes: { type: String, default: '' },
    bilirubinValue: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const ObservationModel = mongoose.model<IObservation>('Observation', ObservationSchema);
