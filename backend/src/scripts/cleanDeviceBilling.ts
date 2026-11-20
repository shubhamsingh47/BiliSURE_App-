import { connectDatabase } from '../config/database';
import { DeviceModel } from '../models/Device';
import { DeviceDiagnosticModel } from '../models/DeviceDiagnostic';
import { SubscriptionPlanModel } from '../models/SubscriptionPlan';
import { HospitalSubscriptionModel } from '../models/HospitalSubscription';
import { TestUsageRecordModel } from '../models/TestUsageRecord';

async function cleanDeviceBilling() {
  console.log('--- Connecting to MongoDB Atlas for Device Testing & Billing Cleanup ---');
  await connectDatabase();

  console.log('Cleaning all synthetic Device Testing & Billing records (isSynthetic: true)...');

  const [devRes, diagRes, planRes, subRes, usageRes] = await Promise.all([
    DeviceModel.deleteMany({ isSynthetic: true }),
    DeviceDiagnosticModel.deleteMany({ isSynthetic: true }),
    SubscriptionPlanModel.deleteMany({ isSynthetic: true }),
    HospitalSubscriptionModel.deleteMany({ isSynthetic: true }),
    TestUsageRecordModel.deleteMany({ isSynthetic: true }),
  ]);

  console.log(`✓ Deleted ${devRes.deletedCount} synthetic devices.`);
  console.log(`✓ Deleted ${diagRes.deletedCount} synthetic device diagnostics.`);
  console.log(`✓ Deleted ${planRes.deletedCount} synthetic subscription plans.`);
  console.log(`✓ Deleted ${subRes.deletedCount} synthetic hospital subscriptions.`);
  console.log(`✓ Deleted ${usageRes.deletedCount} synthetic test usage records.`);

  console.log('=== Cleanup complete. All real patient, reading, referral, and PT station data remain 100% intact! ===');
  process.exit(0);
}

cleanDeviceBilling().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
