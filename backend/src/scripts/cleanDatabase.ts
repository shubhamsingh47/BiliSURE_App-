import dns from 'dns';
import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { BabyModel } from '../models/Baby';
import { ReferralModel } from '../models/Referral';
import { AdmissionModel } from '../models/Admission';
import { BilirubinReadingModel } from '../models/BilirubinReading';
import { NotificationModel } from '../models/Notification';
import { PTStationModel } from '../models/PTStation';
import { HospitalModel } from '../models/Hospital';
import { seedDefaultUsers } from '../config/seedUsers';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if DNS server configuration is restricted
}

export async function cleanDatabase() {
  console.log('[CleanDB] Connecting to MongoDB...');
  await mongoose.connect(ENV.MONGODB_URI);
  console.log('[CleanDB] Connected to database:', mongoose.connection.db?.databaseName);

  // 1. Delete all test babies, referrals, admissions, readings, notifications
  const resBabies = await BabyModel.deleteMany({});
  console.log(`[CleanDB] Deleted ${resBabies.deletedCount} baby records.`);

  const resReferrals = await ReferralModel.deleteMany({});
  console.log(`[CleanDB] Deleted ${resReferrals.deletedCount} referral records.`);

  const resAdmissions = await AdmissionModel.deleteMany({});
  console.log(`[CleanDB] Deleted ${resAdmissions.deletedCount} admission records.`);

  const resReadings = await BilirubinReadingModel.deleteMany({});
  console.log(`[CleanDB] Deleted ${resReadings.deletedCount} bilirubin reading records.`);

  const resNotifications = await NotificationModel.deleteMany({});
  console.log(`[CleanDB] Deleted ${resNotifications.deletedCount} notification records.`);

  // 2. Reset all stations so all beds are clean and available
  const resStations = await PTStationModel.updateMany(
    {},
    {
      $set: {
        operationalStatus: 'available',
        currentBabyId: null,
        currentBabyName: null,
        currentBabyUhid: null,
        lastCleanedAt: new Date(),
        lastUpdated: new Date(),
      },
    }
  );
  console.log(`[CleanDB] Reset ${resStations.modifiedCount} PT stations to clean & available.`);

  // 3. Reset hospital bed capacity counters
  const hospitals = await HospitalModel.find({});
  for (const h of hospitals) {
    const total = h.totalPTStations || 10;
    h.operationalPTStations = total;
    h.occupiedPTStations = 0;
    h.availablePTStations = total;
    h.lastAvailabilityUpdated = new Date();
    await h.save();
  }
  console.log(`[CleanDB] Reset capacity metrics for ${hospitals.length} hospitals.`);

  // 4. Ensure baseline login users exist (PGI, RML, KGMU)
  await seedDefaultUsers();
  console.log('[CleanDB] Verified baseline login accounts.');

  await mongoose.disconnect();
  console.log('[CleanDB] Database successfully wiped and reset for fresh testing!');
}

if (require.main === module) {
  cleanDatabase().catch((err) => {
    console.error('[CleanDB] Clean script encountered error:', err);
    process.exit(1);
  });
}
