import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  planId: string; // 'starter' | 'clinical' | 'enterprise' | 'pay_as_you_go'
  name: string;
  tier: 'starter' | 'clinical' | 'enterprise' | 'pay_as_you_go';
  billingPeriod: 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  testAllocation: number; // e.g. 200, 500, 1500, 1
  priceINR: number; // in INR
  effectivePricePerTestINR: number; // calculated INR
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
  isSynthetic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    planId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    tier: {
      type: String,
      enum: ['starter', 'clinical', 'enterprise', 'pay_as_you_go'],
      required: true,
    },
    billingPeriod: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', 'on_demand'],
      default: 'monthly',
    },
    testAllocation: { type: Number, required: true },
    priceINR: { type: Number, required: true },
    effectivePricePerTestINR: { type: Number, required: true },
    features: [{ type: String }],
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isSynthetic: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const SubscriptionPlanModel = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  SubscriptionPlanSchema
);
