import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecommendation extends Document {
  babyId: Types.ObjectId;
  readingId?: Types.ObjectId;
  suggestedAction: 'phototherapy' | 'exchange_transfusion' | 'continue_monitoring' | 'discharge_ready';
  frequency: string;
  guidelineReference: string;
  source: 'bilisure_automated' | 'healthcare_provider';
  providerNotes?: string;
  approvedBy?: Types.ObjectId;
  status: 'suggested' | 'accepted' | 'overridden' | 'completed';
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true, index: true },
    readingId: { type: Schema.Types.ObjectId, ref: 'BilirubinReading' },
    suggestedAction: {
      type: String,
      enum: ['phototherapy', 'exchange_transfusion', 'continue_monitoring', 'discharge_ready'],
      default: 'phototherapy',
    },
    frequency: { type: String, default: 'Continuous' },
    guidelineReference: { type: String, default: 'AAP 2022 Guidelines for Neonatal Hyperbilirubinemia' },
    source: {
      type: String,
      enum: ['bilisure_automated', 'healthcare_provider'],
      default: 'bilisure_automated',
    },
    providerNotes: { type: String, default: '' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['suggested', 'accepted', 'overridden', 'completed'],
      default: 'suggested',
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const RecommendationModel = mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
