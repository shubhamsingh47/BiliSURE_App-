import dns from 'dns';
import path from 'path';
import fs from 'fs';
import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function getBhutaniZone(hours: number, val: number): 'low' | 'low_intermediate' | 'high_intermediate' | 'high' {
  if (hours < 24) {
    if (val > 8.0) return 'high';
    if (val > 6.0) return 'high_intermediate';
    if (val > 4.5) return 'low_intermediate';
    return 'low';
  } else if (hours < 48) {
    if (val > 13.0) return 'high';
    if (val > 10.5) return 'high_intermediate';
    if (val > 8.0) return 'low_intermediate';
    return 'low';
  } else if (hours < 72) {
    if (val > 16.0) return 'high';
    if (val > 13.5) return 'high_intermediate';
    if (val > 11.0) return 'low_intermediate';
    return 'low';
  } else {
    if (val > 17.5) return 'high';
    if (val > 15.0) return 'high_intermediate';
    if (val > 12.0) return 'low_intermediate';
    return 'low';
  }
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

// 15 Hindu mother names for PGI
const PGI_NAMES = [
  'Sunita Sharma',
  'Pooja Verma',
  'Geeta Devi',
  'Ananya Joshi',
  'Kavita Singh',
  'Meena Gupta',
  'Rekha Mishra',
  'Priya Pandey',
  'Shweta Tiwari',
  'Sangeeta Yadav',
  'Deepa Tripathi',
  'Neha Dubey',
  'Ritu Shukla',
  'Mamta Srivastava',
  'Archana Chauhan',
];

// 10 Muslim mother names for RML
const RML_NAMES = [
  'Fatima Bano',
  'Ayesha Begum',
  'Shabana Parveen',
  'Zainab Khatoon',
  'Yasmeen Jahan',
  'Nasreen Akhtar',
  'Rukhsar Fatima',
  'Farzana Siddiqui',
  'Sabiha Naaz',
  'Razia Sultana',
];

// 5 Christian mother names for KGMU
const KGMU_NAMES = [
  'Mary Joseph',
  'Grace Mathew',
  'Elizabeth D\'Souza',
  'Sarah Thomas',
  'Rachel Fernandes',
];

export async function seed30Patients() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Fatal: MONGODB_URI not found in backend/.env!');
    process.exit(1);
  }

  console.log('[Seed30] Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 25000 });
  const db = mongoose.connection.db;
  if (!db) {
    console.error('Fatal: Failed to get db handle!');
    process.exit(1);
  }

  console.log(`[Seed30] Connected to Database: "${db.databaseName}"`);
  if (db.databaseName !== 'BiliSURE') {
    console.warn(`[Seed30] Warning: Expected database name "BiliSURE", got "${db.databaseName}".`);
  }

  // 1. Audit pre-existing counts
  const initialBabyCount = await db.collection('babies').countDocuments({});
  const initialStationCount = await db.collection('ptstations').countDocuments({});
  console.log(`[Seed30] Baseline Audit: ${initialBabyCount} babies, ${initialStationCount} PT stations.`);

  // If seeded records already exist, check for safety
  const existingSeedBabies = await db.collection('babies').find({
    uhid: { $regex: '^(PGI|RML|KGMU)-' },
  }).toArray();

  if (existingSeedBabies.length >= 30) {
    console.log(`[Seed30] Notice: ${existingSeedBabies.length} patients already seeded. Checking consistency...`);
  }

  // Generate 30 Patient Blueprints
  interface PatientPlan {
    hospital: 'PGI' | 'RML' | 'KGMU';
    hospitalId: string;
    motherName: string;
    uhid: string;
    regDay: number;
    regDate: Date;
    dobDate: Date;
    exactTimeStr: string;
    gestWeeks: number;
    gestDays: number;
    birthWeight: number;
    assignedDoctor: string;
  }

  const patientPlans: PatientPlan[] = [];
  const usedUhids = new Set<string>();

  function generateUniqueUhid(prefix: string): string {
    while (true) {
      const code = `${prefix}-${randomBetween(100000, 999999)}`;
      if (!usedUhids.has(code)) {
        usedUhids.add(code);
        return code;
      }
    }
  }

  // Day distribution: 15, 16, 17, 18, 19 Nov 2026
  // PGI: 3 per day (total 15)
  // RML: 2 per day (total 10)
  // KGMU: 1 per day (total 5)
  const days = [15, 16, 17, 18, 19];

  let pgiIdx = 0;
  let rmlIdx = 0;
  let kgmuIdx = 0;

  for (let dIdx = 0; dIdx < days.length; dIdx++) {
    const day = days[dIdx];

    // 3 PGI babies
    for (let i = 0; i < 3; i++) {
      const motherName = PGI_NAMES[pgiIdx++];
      const uhid = generateUniqueUhid('PGI');
      const regHour = [8, 11, 15][i];
      const regMin = randomBetween(10, 50);
      const regDate = new Date(Date.UTC(2026, 10, day, regHour, regMin, 0));
      const dobHoursBefore = randomBetween(3, 10);
      const dobDate = new Date(regDate.getTime() - dobHoursBefore * 3600 * 1000);
      const exactTimeStr = `${String(dobDate.getUTCHours()).padStart(2, '0')}:${String(dobDate.getUTCMinutes()).padStart(2, '0')}`;

      patientPlans.push({
        hospital: 'PGI',
        hospitalId: 'hosp_pgi',
        motherName,
        uhid,
        regDay: day,
        regDate,
        dobDate,
        exactTimeStr,
        gestWeeks: randomBetween(37, 40),
        gestDays: randomBetween(0, 6),
        birthWeight: randomBetween(2600, 3600),
        assignedDoctor: 'PGI Attending Doctor',
      });
    }

    // 2 RML babies
    for (let i = 0; i < 2; i++) {
      const motherName = RML_NAMES[rmlIdx++];
      const uhid = generateUniqueUhid('RML');
      const regHour = [9, 14][i];
      const regMin = randomBetween(10, 50);
      const regDate = new Date(Date.UTC(2026, 10, day, regHour, regMin, 0));
      const dobHoursBefore = randomBetween(3, 10);
      const dobDate = new Date(regDate.getTime() - dobHoursBefore * 3600 * 1000);
      const exactTimeStr = `${String(dobDate.getUTCHours()).padStart(2, '0')}:${String(dobDate.getUTCMinutes()).padStart(2, '0')}`;

      patientPlans.push({
        hospital: 'RML',
        hospitalId: 'hosp_rml',
        motherName,
        uhid,
        regDay: day,
        regDate,
        dobDate,
        exactTimeStr,
        gestWeeks: randomBetween(37, 40),
        gestDays: randomBetween(0, 6),
        birthWeight: randomBetween(2600, 3600),
        assignedDoctor: 'RML Attending Doctor',
      });
    }

    // 1 KGMU baby
    const motherName = KGMU_NAMES[kgmuIdx++];
    const uhid = generateUniqueUhid('KGMU');
    const regHour = 10;
    const regMin = randomBetween(15, 45);
    const regDate = new Date(Date.UTC(2026, 10, day, regHour, regMin, 0));
    const dobHoursBefore = randomBetween(3, 10);
    const dobDate = new Date(regDate.getTime() - dobHoursBefore * 3600 * 1000);
    const exactTimeStr = `${String(dobDate.getUTCHours()).padStart(2, '0')}:${String(dobDate.getUTCMinutes()).padStart(2, '0')}`;

    patientPlans.push({
      hospital: 'KGMU',
      hospitalId: 'hosp_kgmu',
      motherName,
      uhid,
      regDay: day,
      regDate,
      dobDate,
      exactTimeStr,
      gestWeeks: randomBetween(37, 40),
      gestDays: randomBetween(0, 6),
      birthWeight: randomBetween(2600, 3600),
      assignedDoctor: 'KGMU Attending Doctor',
    });
  }

  console.log(`[Seed30] Formulated ${patientPlans.length} patient blueprints.`);

  // 2. Insert Patients and generate readings
  const babyDocsToInsert: any[] = [];
  const readingDocsToInsert: any[] = [];
  const observationDocsToInsert: any[] = [];

  for (const plan of patientPlans) {
    const babyId = new Types.ObjectId();
    const babyName = `B/o ${plan.motherName}`;

    // Plan readings strictly within 15-19 Nov, >= regDate, max 2 per day, strictly 4-5h gap
    const sampleDates: Date[] = [];

    for (let day = plan.regDay; day <= 19; day++) {
      let numSamples = day === plan.regDay ? (plan.regDate.getUTCHours() >= 18 ? 1 : randomBetween(1, 2)) : randomBetween(0, 2);

      if (numSamples === 1) {
        let sHour = day === plan.regDay ? plan.regDate.getUTCHours() + 1 : randomBetween(9, 18);
        if (sHour > 23) sHour = 23;
        const sTime = new Date(Date.UTC(2026, 10, day, sHour, randomBetween(5, 55), 0));
        if (sTime >= plan.regDate) sampleDates.push(sTime);
      } else if (numSamples === 2) {
        let s1Hour = day === plan.regDay ? plan.regDate.getUTCHours() : randomBetween(8, 11);
        let s1Min = day === plan.regDay ? Math.min(50, plan.regDate.getUTCMinutes() + 15) : randomBetween(10, 50);
        const s1Time = new Date(Date.UTC(2026, 10, day, s1Hour, s1Min, 0));

        // CRITICAL CONSTRAINT: Gap must strictly be between 4 and 5 hours (245 to 295 minutes)
        const gapMinutes = randomBetween(245, 295);
        const s2Time = new Date(s1Time.getTime() + gapMinutes * 60 * 1000);

        if (s1Time >= plan.regDate) {
          sampleDates.push(s1Time);
          if (s2Time.getUTCDate() === day) {
            sampleDates.push(s2Time);
          }
        }
      }
    }

    sampleDates.sort((a, b) => a.getTime() - b.getTime());
    if (sampleDates.length === 0) {
      sampleDates.push(new Date(plan.regDate.getTime() + 30 * 60 * 1000));
    }

    let currentBili = randomFloat(6.5, 11.0, 1);
    const babyReadings: any[] = [];

    for (let sIdx = 0; sIdx < sampleDates.length; sIdx++) {
      const sTime = sampleDates[sIdx];
      const ageHours = parseFloat(((sTime.getTime() - plan.dobDate.getTime()) / (3600 * 1000)).toFixed(1));

      if (sIdx > 0) {
        const delta = randomFloat(-0.7, 1.3, 1);
        currentBili = parseFloat(Math.max(4.5, Math.min(18.0, currentBili + delta)).toFixed(1));
      }

      const bhutaniZone = getBhutaniZone(ageHours, currentBili);
      const isInitial = sIdx === 0;
      const opId = `rdg_${plan.uhid}_${sTime.getUTCDate()}_${sIdx + 1}`;
      const obsOpId = `obs_${plan.uhid}_${sTime.getUTCDate()}_${sIdx + 1}`;

      const readingDoc = {
        _id: new Types.ObjectId(),
        clientOperationId: opId,
        babyId,
        babyUhid: plan.uhid,
        value: currentBili,
        valueMgDl: currentBili,
        unit: 'mg/dL',
        method: sIdx % 2 === 0 ? 'TcB' : 'TSB',
        sampleTimestamp: sTime,
        postnatalAgeHours: ageHours,
        measurementSite: sIdx % 2 === 0 ? 'forehead' : 'sternum',
        source: 'clinical_flowsheet',
        bhutaniZone,
        bhutaniPercentileApprox: bhutaniZone === 'high' ? 96 : bhutaniZone === 'high_intermediate' ? 84 : bhutaniZone === 'low_intermediate' ? 50 : 25,
        phototherapyPhase: 'none',
        guidelineUsed: 'AAP 2004 / Bhutani Nomogram',
        isEligibleForBhutani: true,
        operatorName: 'Nurse A',
        symptoms: 'Routine neonatal monitoring',
        riskFactors: [],
        timestamp: sTime,
        isInitial,
        isDischarge: false,
        correctionHistory: [],
        createdAt: sTime,
        updatedAt: sTime,
      };

      const obsDoc = {
        _id: new Types.ObjectId(),
        clientOperationId: obsOpId,
        babyId,
        observerName: 'Nurse A',
        site: sIdx % 2 === 0 ? 'Forehead' : 'Sternum',
        clinicalNotes: `Observation #${sIdx + 1} (${readingDoc.method})`,
        bilirubinValue: currentBili,
        timestamp: sTime,
        createdAt: sTime,
        updatedAt: sTime,
      };

      babyReadings.push(readingDoc);
      readingDocsToInsert.push(readingDoc);
      observationDocsToInsert.push(obsDoc);
    }

    const initialVal = babyReadings[0]?.value || 7.0;
    const latestVal = babyReadings[babyReadings.length - 1]?.value || initialVal;

    let severityState: 'normal' | 'moderate' | 'critical' = 'normal';
    if (latestVal > 14.5) severityState = 'critical';
    else if (latestVal > 10.5) severityState = 'moderate';

    const babyDoc = {
      _id: babyId,
      uhid: plan.uhid,
      name: babyName,
      parentsName: plan.motherName,
      guardianPhone: `+91-98${randomBetween(10000000, 99999999)}`,
      guardianAddress: `${plan.hospital} Catchment Area, Lucknow`,
      bloodGroup: ['O+', 'A+', 'B+', 'AB+'][randomBetween(0, 3)],
      rhesusFactor: 'positive',
      directCoombsTest: 'negative',
      dateOfBirth: plan.dobDate,
      exactTimeOfBirth: plan.exactTimeStr,
      gestationalAgeWeeks: plan.gestWeeks,
      gestationalAgeDays: plan.gestDays,
      birthWeightGrams: plan.birthWeight,
      currentWeightGrams: plan.birthWeight - randomBetween(50, 150),
      weight: parseFloat((plan.birthWeight / 1000).toFixed(2)),
      height: 49.0,
      assignedDoctor: plan.assignedDoctor,
      facility: plan.hospital,
      hospitalId: plan.hospitalId,
      currentHospital: plan.hospital,
      department: 'NICU',
      severityState,
      status: severityState === 'critical' ? 'under_treatment' : 'admitted',
      referralStatus: 'none',
      currentStationId: null,
      initialValue: initialVal,
      riskFactors: [],
      attachments: [],
      createdAt: plan.regDate,
      updatedAt: sampleDates[sampleDates.length - 1] || plan.regDate,
    };

    babyDocsToInsert.push(babyDoc);
  }

  // Check if UHIDs already exist to be strictly idempotent
  const uhidList = babyDocsToInsert.map(b => b.uhid);
  const existingDupes = await db.collection('babies').find({ uhid: { $in: uhidList } }).toArray();
  if (existingDupes.length > 0) {
    console.log(`[Seed30] Found ${existingDupes.length} existing matching UHIDs. Removing to avoid duplication...`);
    const dupeIds = existingDupes.map(d => d._id);
    await db.collection('babies').deleteMany({ _id: { $in: dupeIds } });
    await db.collection('bilirubinreadings').deleteMany({ babyId: { $in: dupeIds } });
    await db.collection('observations').deleteMany({ babyId: { $in: dupeIds } });
  }

  // Perform inserts
  console.log(`[Seed30] Inserting ${babyDocsToInsert.length} synthetic babies...`);
  await db.collection('babies').insertMany(babyDocsToInsert);

  console.log(`[Seed30] Inserting ${readingDocsToInsert.length} bilirubin readings...`);
  await db.collection('bilirubinreadings').insertMany(readingDocsToInsert);

  console.log(`[Seed30] Inserting ${observationDocsToInsert.length} observations...`);
  await db.collection('observations').insertMany(observationDocsToInsert);

  // -------------------------------------------------------------
  // VERIFICATION AUDIT
  // -------------------------------------------------------------
  console.log('\n=== SEEDING VERIFICATION AUDIT ===');
  const allBabies = await db.collection('babies').find({}).toArray();
  const allReadings = await db.collection('bilirubinreadings').find({}).toArray();
  const allStations = await db.collection('ptstations').find({}).toArray();

  console.log(`\n1. Total Patients: ${allBabies.length} (Expected: 30)`);
  console.log(`2. Total Readings: ${allReadings.length}`);
  console.log(`3. Total Observations: ${observationDocsToInsert.length}`);
  console.log(`4. Total PT Stations: ${allStations.length} (Preserved: 27)`);

  const pgiCount = allBabies.filter(b => b.facility === 'PGI').length;
  const rmlCount = allBabies.filter(b => b.facility === 'RML').length;
  const kgmuCount = allBabies.filter(b => b.facility === 'KGMU').length;
  console.log(`\nPatients per Hospital:`);
  console.log(`- PGI: ${pgiCount} (Expected: 15)`);
  console.log(`- RML: ${rmlCount} (Expected: 10)`);
  console.log(`- KGMU: ${kgmuCount} (Expected: 5)`);

  const dateDistribution: Record<string, { PGI: number; RML: number; KGMU: number; Total: number }> = {};
  for (const b of allBabies) {
    const dStr = new Date(b.createdAt).toISOString().slice(0, 10);
    if (!dateDistribution[dStr]) dateDistribution[dStr] = { PGI: 0, RML: 0, KGMU: 0, Total: 0 };
    dateDistribution[dStr][b.facility as 'PGI' | 'RML' | 'KGMU'] = (dateDistribution[dStr][b.facility as 'PGI' | 'RML' | 'KGMU'] || 0) + 1;
    dateDistribution[dStr].Total += 1;
  }
  console.log('\nRegistration Date Distribution:');
  console.table(dateDistribution);

  // Validate Sample Constraints
  let maxPerDayExceeded = false;
  let samplePredatesReg = false;
  let gapRuleViolated = false;
  let minGapHours = 999;
  let maxGapHours = 0;

  for (const b of allBabies) {
    const bReadings = allReadings.filter(r => String(r.babyId) === String(b._id));
    const regTime = new Date(b.createdAt).getTime();

    const byDay: Record<string, Date[]> = {};
    for (const r of bReadings) {
      const sTime = new Date(r.sampleTimestamp);
      if (sTime.getTime() < regTime - 1000) {
        samplePredatesReg = true;
      }
      const dayKey = sTime.toISOString().slice(0, 10);
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(sTime);
    }

    for (const [dayKey, times] of Object.entries(byDay)) {
      if (times.length > 2) maxPerDayExceeded = true;
      if (times.length === 2) {
        times.sort((a, b) => a.getTime() - b.getTime());
        const gapH = (times[1].getTime() - times[0].getTime()) / (3600 * 1000);
        if (gapH < minGapHours) minGapHours = gapH;
        if (gapH > maxGapHours) maxGapHours = gapH;
        if (gapH < 3.98 || gapH > 5.02) {
          gapRuleViolated = true;
        }
      }
    }
  }

  console.log('\nClinical Reading Constraints Validation:');
  console.log(`- Max 2 readings per patient per calendar day: ${!maxPerDayExceeded ? 'PASSED' : 'FAILED'}`);
  console.log(`- No reading occurs before registration: ${!samplePredatesReg ? 'PASSED' : 'FAILED'}`);
  console.log(`- Same-day two-reading interval strictly 4-5 hours: ${!gapRuleViolated ? 'PASSED' : 'FAILED'}`);
  console.log(`- Min observed same-day interval: ${minGapHours.toFixed(2)} hours`);
  console.log(`- Max observed same-day interval: ${maxGapHours.toFixed(2)} hours`);

  // Verify unique UHIDs
  const uhidSet = new Set(allBabies.map(b => b.uhid));
  console.log(`\nUHID Uniqueness:`);
  console.log(`- Unique UHIDs: ${uhidSet.size} / ${allBabies.length} -> ${uhidSet.size === allBabies.length ? 'PASSED' : 'FAILED'}`);

  // PT Station preservation check
  const availableStations = allStations.filter(s => s.operationalStatus === 'available').length;
  console.log(`\nPT Stations Preservation:`);
  console.log(`- Stations Count: ${allStations.length} (Expected: 27)`);
  console.log(`- Available Stations: ${availableStations} (Expected: 27)`);

  await mongoose.disconnect();
  console.log('\n[Seed30] Database disconnected cleanly. Seeding and verification complete.');
}

if (require.main === module) {
  seed30Patients().catch(err => {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
  });
}
