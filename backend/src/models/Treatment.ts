import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITreatment extends Document {
  babyId: Types.ObjectId;
  treatmentType: 'phototherapy' | 'double_phototherapy' | 'exchange_transfusion' | 'hydration';
  startTime: Date;
  endTime?: Date;
  stationNumber?: number;
  prescribedBy?: Types.ObjectId;
  doctorName: string;
  notes?: string;
  status: 'ongoing' | 'completed' | 'interrupted';
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentSchema = new Schema<ITreatment>(
  {
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true, index: true },
    treatmentType: {
      type: String,
      enum: ['phototherapy', 'double_phototherapy', 'exchange_transfusion', 'hydration'],
      default: 'phototherapy',
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    stationNumber: { type: Number, default: 1 },
    prescribedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    doctorName: { type: String, default: 'Dr. XYZ' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'interrupted'],
      default: 'ongoing',
    },
  },
  { timestamps: true }
);

export const TreatmentModel = mongoose.model<ITreatment>('Treatment', TreatmentSchema);
