import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChatMessage extends Document {
  senderId: Types.ObjectId | string;
  senderName: string;
  senderRole: string;
  senderFacility: string; // 'PGI' | 'RML' | 'KGMU'
  recipientFacility?: string; // 'PGI' | 'RML' | 'KGMU' | 'ALL'
  channel: string; // e.g. 'general', 'referrals', 'nicu_ward'
  message: string;
  relatedBabyUhid?: string;
  relatedReferralId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: { type: Schema.Types.Mixed, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    senderFacility: { type: String, required: true, index: true },
    recipientFacility: { type: String, default: 'ALL', index: true },
    channel: { type: String, default: 'general', index: true },
    message: { type: String, required: true, trim: true },
    relatedBabyUhid: { type: String },
    relatedReferralId: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ChatMessageModel = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
