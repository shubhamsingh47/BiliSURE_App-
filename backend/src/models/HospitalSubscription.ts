import mongoose, { Schema, Document } from 'mongoose';

export interface IHospitalSubscription extends Document {
  subscriptionId: string;
  facility: string; // 'PGI' | 'RML' | 'KGMU'
  planId: string;
  planName: string;
  tier: string;
  status: 'active' | 'expiring_soon' | 'exhausted' | 'inactive';
  billingCycle: 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  startDate: Date;
  expiryDate: Date;
  totalAllocatedTests: number;
  usedTests: number;
  remainingTests: number;
  pricePerTestINR: number;
  planAmountINR: number;
  autoRenew: boolean;
  requestedUpgradePlanId?: string;
  requestedUpgradeAt?: Date;
  isSynthetic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSubscriptionSchema = new Schema<IHospitalSubscription>(
  {
    subscriptionId: { type: String, required: true, unique: true, index: true },
    facility: { type: String, required: true, unique: true, index: true }, // 1 active subscription record per facility
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    tier: { type: String, default: 'clinical' },
    status: {
      type: String,
      enum: ['active', 'expiring_soon', 'exhausted', 'inactive'],
      default: 'active',
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', 'on_demand'],
      default: 'monthly',
    },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    totalAllocatedTests: { type: Number, required: true },
    usedTests: { type: Number, default: 0 },
    remainingTests: { type: Number, required: true },
    pricePerTestINR: { type: Number, required: true },
    planAmountINR: { type: Number, required: true },
    autoRenew: { type: Boolean, default: true },
    requestedUpgradePlanId: { type: String },
    requestedUpgradeAt: { type: Date },
    isSynthetic: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const HospitalSubscriptionModel = mongoose.model<IHospitalSubscription>(
  'HospitalSubscription',
  HospitalSubscriptionSchema
);
