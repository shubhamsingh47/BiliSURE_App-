import mongoose, { Schema, Document } from 'mongoose';

export interface IDistrict extends Document {
  districtCode: string;
  name: string;
  state: string;
  adminOfficerName: string;
  adminOfficerContact: string;
  totalHospitals: number;
  totalReferringCentres: number;
  totalPTCapacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DistrictSchema = new Schema<IDistrict>(
  {
    districtCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true },
    adminOfficerName: { type: String, required: true },
    adminOfficerContact: { type: String, required: true },
    totalHospitals: { type: Number, default: 0 },
    totalReferringCentres: { type: Number, default: 0 },
    totalPTCapacity: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DistrictModel = mongoose.models.District || mongoose.model<IDistrict>('District', DistrictSchema);
