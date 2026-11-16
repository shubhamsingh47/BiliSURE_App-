import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'referral_created'
  | 'referral_accepted'
  | 'referral_rejected'
  | 'baby_arrived'
  | 'pt_allocated'
  | 'critical_reading'
  | 'discharge_approved';

export interface INotification extends Document {
  recipientRole?: string; // 'doctor_referring', 'receiving_hospital', 'district_admin' (plus legacy 'referring_doctor', 'hospital_doctor', etc.)
  hospitalId?: Types.ObjectId | string;
  centreName?: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedBabyUhid?: string;
  relatedReferralId?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientRole: { type: String, index: true },
    hospitalId: { type: Schema.Types.Mixed, index: true },
    centreName: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'referral_created',
        'referral_accepted',
        'referral_rejected',
        'baby_arrived',
        'pt_allocated',
        'critical_reading',
        'discharge_approved',
      ],
      required: true,
    },
    relatedBabyUhid: { type: String },
    relatedReferralId: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
