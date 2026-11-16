import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment extends Document {
  attachmentId: string;
  babyId?: string;
  babyUhid?: string;
  referralId?: string;
  admissionId?: string;
  fileName: string;
  fileType: string; // e.g. 'application/pdf', 'image/jpeg'
  fileSize: number;
  fileUrl: string;
  category: 'clinical_report' | 'lab_result' | 'transfer_summary' | 'consent_form';
  uploadedBy: string;
  facility: string;
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    attachmentId: { type: String, required: true, unique: true, index: true },
    babyId: { type: String, index: true },
    babyUhid: { type: String, index: true },
    referralId: { type: String, index: true },
    admissionId: { type: String, index: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    category: {
      type: String,
      enum: ['clinical_report', 'lab_result', 'transfer_summary', 'consent_form'],
      default: 'clinical_report',
    },
    uploadedBy: { type: String, required: true },
    facility: { type: String, required: true },
  },
  { timestamps: true }
);

export const AttachmentModel =
  mongoose.models.Attachment || mongoose.model<IAttachment>('Attachment', AttachmentSchema);
