import mongoose from 'express';
import { connectDatabase } from '../config/database';
import { DeviceModel } from '../models/Device';
import { DeviceDiagnosticModel } from '../models/DeviceDiagnostic';
import { SubscriptionPlanModel } from '../models/SubscriptionPlan';
import { HospitalSubscriptionModel } from '../models/HospitalSubscription';
import { TestUsageRecordModel } from '../models/TestUsageRecord';
import { BabyModel } from '../models/Baby';

async function seedDeviceBilling() {
  console.log('--- Connecting to MongoDB Atlas for Device Testing & Billing Seeding ---');
  await connectDatabase();

  const facilities = ['PGI', 'RML', 'KGMU'];

  // 1. Seed Subscription Plans (Idempotent)
  console.log('1. Seeding Subscription Plans...');
  const plans = [
    {
      planId: 'plan_starter_200',
      name: 'Starter Neonatal Plan',
      tier: 'starter',
      billingPeriod: 'monthly',
      testAllocation: 200,
      priceINR: 9999,
      effectivePricePerTestINR: 49.99,
      isPopular: false,
      features: [
        '200 BiliSURE TcB Screenings / month',
        'Effective price: ₹49.99 per test',
        'Single NICU / Postnatal ward access',
        'Automated Bhutani Risk Stratification',
        'Standard CSV & PDF clinical audit export',
        'Email technical support within 24h',
      ],
      isActive: true,
      isSynthetic: true,
    },
    {
      planId: 'plan_clinical_500',
      name: 'Clinical Care High-Volume',
      tier: 'clinical',
      billingPeriod: 'monthly',
      testAllocation: 500,
      priceINR: 19999,
      effectivePricePerTestINR: 39.99,
      isPopular: true,
      features: [
        '500 BiliSURE TcB Screenings / month',
        'Effective price: ₹39.99 per test (Save 20%)',
        'Multi-department access (NICU + Postnatal + OPD)',
        'Real-time phototherapy tracking & bed management',
        'EHR / HMS JSON & HL7 export endpoints',
        'Semi-annual optical tile recalibration kit included',
        '24/7 Priority clinical engineering assistance',
      ],
      isActive: true,
      isSynthetic: true,
    },
    {
      planId: 'plan_enterprise_1500',
      name: 'Tertiary Hospital Network',
      tier: 'enterprise',
      billingPeriod: 'monthly',
      testAllocation: 1500,
      priceINR: 49999,
      effectivePricePerTestINR: 33.33,
      isPopular: false,
      features: [
        '1,500 BiliSURE TcB Screenings / month',
        'Effective price: ₹33.33 per test (Save 33%)',
        'Unlimited ward seats & clinical operator accounts',
        'Automated bidirectional EHR/FHIR R4 integration',
        'Comprehensive multi-station phototherapy mesh',
        'Dedicated biomedical field engineer & quarterly visits',
        'Instant hot-swap device replacement guarantee',
      ],
      isActive: true,
      isSynthetic: true,
    },
    {
      planId: 'plan_pay_as_you_go',
      name: 'On-Demand Pay-As-You-Go',
      tier: 'pay_as_you_go',
      billingPeriod: 'on_demand',
      testAllocation: 1,
      priceINR: 65,
      effectivePricePerTestINR: 65.0,
      isPopular: false,
      features: [
        'No monthly commitment or expiration penalty',
        'Fixed rate: ₹65.00 per single screened neonate',
        'Ideal for low-census community wards & overflow',
        'Standard Nomogram analysis included',
        'Pay via institutional billing invoice',
      ],
      isActive: true,
      isSynthetic: true,
    },
  ];

  for (const p of plans) {
    await SubscriptionPlanModel.findOneAndUpdate({ planId: p.planId }, p, { upsert: true, new: true });
  }
  console.log(`✓ Subscription Plans seeded (${plans.length} plans).`);

  // 2. Seed Devices per Hospital
  console.log('2. Seeding Devices and Initial Diagnostic Scans...');
  const deviceConfigs: { [key: string]: Array<any> } = {
    PGI: [
      {
        serialNumber: 'BLS-PGI-101',
        deviceModel: 'BiliSURE Transcutaneous Pro X1',
        macAddress: '00:1B:44:A1:01:P1',
        facility: 'PGI',
        department: 'NICU',
        assignedWard: 'NICU A-Wing',
        status: 'calibrated',
        isCalibrated: true,
        lastDiagnosticStatus: 'healthy',
        lastCalibratedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        nextCalibrationDue: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
        totalTests: 12000,
        remainingTests: 6420,
        firmwareVersion: 'v2.4.2',
        isSynthetic: true,
      },
      {
        serialNumber: 'BLS-PGI-102',
        deviceModel: 'BiliSURE Transcutaneous Pro X1',
        macAddress: '00:1B:44:A1:02:P2',
        facility: 'PGI',
        department: 'Postnatal Ward',
        assignedWard: 'Postnatal Ward 3',
        status: 'alert_broken',
        isCalibrated: true,
        lastDiagnosticStatus: 'issue_detected',
        lastCalibratedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        nextCalibrationDue: new Date(Date.now() + 78 * 24 * 60 * 60 * 1000),
        totalTests: 10000,
        remainingTests: 3100,
        firmwareVersion: 'v2.4.0',
        isSynthetic: true,
      },
      {
        serialNumber: 'BLS-PGI-103',
        deviceModel: 'BiliSURE Transcutaneous Lite',
        macAddress: '00:1B:44:A1:03:P3',
        facility: 'PGI',
        department: 'Pediatric Emergency',
        assignedWard: 'Emergency Triage',
        status: 'maintenance',
        isCalibrated: false,
        lastDiagnosticStatus: 'calibration_required',
        lastCalibratedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000),
        nextCalibrationDue: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue
        totalTests: 8000,
        remainingTests: 450,
        firmwareVersion: 'v2.3.9',
        isSynthetic: true,
      },
    ],
    RML: [
      {
        serialNumber: 'BLS-RML-201',
        deviceModel: 'BiliSURE Transcutaneous Pro X1',
        macAddress: '00:1B:44:B2:01:R1',
        facility: 'RML',
        department: 'NICU',
        assignedWard: 'NICU Level III',
        status: 'calibrated',
        isCalibrated: true,
        lastDiagnosticStatus: 'healthy',
        lastCalibratedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        nextCalibrationDue: new Date(Date.now() + 87 * 24 * 60 * 60 * 1000),
        totalTests: 15000,
        remainingTests: 8120,
        firmwareVersion: 'v2.4.2',
        isSynthetic: true,
      },
      {
        serialNumber: 'BLS-RML-202',
        deviceModel: 'BiliSURE Transcutaneous Pro X1',
        macAddress: '00:1B:44:B2:02:R2',
        facility: 'RML',
        department: 'Postnatal Ward',
        assignedWard: 'Maternity Unit 2',
        status: 'calibrated',
        isCalibrated: true,
        lastDiagnosticStatus: 'healthy',
        lastCalibratedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        nextCalibrationDue: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
        totalTests: 9000,
        remainingTests: 2300,
        firmwareVersion: 'v2.4.1',
        isSynthetic: true,
      },
      {
        serialNumber: 'BLS-RML-203',
        deviceModel: 'BiliSURE Transcutaneous Lite',
        macAddress: '00:1B:44:B2:03:R3',
        facility: 'RML',
        department: 'Special Care Nursery',
        assignedWard: 'SNCU Ward B',
        status: 'maintenance',
        isCalibrated: false,
        lastDiagnosticStatus: 'calibration_required',
        lastCalibratedAt: new Date(Date.now() - 92 * 24 * 60 * 60 * 1000),
        nextCalibrationDue: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        totalTests: 7000,
        remainingTests: 120,
        firmwareVersion: 'v2.3.8',
        isSynthetic: true,
      },
    ],
    KGMU: [
      {
        serialNumber: 'BLS-KGMU-301',
        deviceModel: 'BiliSURE Transcutaneous Pro X1',
        macAddress: '00:1B:44:C3:01:K1',
        facility: 'KGMU',
        department: 'NICU',
        assignedWard: 'Apex Neonatal Intensive',
        status: 'calibrated',
        isCalibrated: true,
        lastDiagnosticStatus: 'healthy',
        lastCalibratedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        nextCalibrationDue: new Date(Date.now() + 86 * 24 * 60 * 60 * 1000),
        totalTests: 18000,
        remainingTests: 11450,
        firmwareVersion: 'v2.4.2',
        isSynthetic: true,
      },
      {
        serialNumber: 'BLS-KGMU-302',
        deviceModel: 'BiliSURE Transcutaneous Pro X1',
        macAddress: '00:1B:44:C3:02:K2',
        facility: 'KGMU',
        department: 'Postnatal Ward',
        assignedWard: 'Postnatal Wing 4',
        status: 'alert_broken',
        isCalibrated: true,
        lastDiagnosticStatus: 'issue_detected',
        lastCalibratedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        nextCalibrationDue: new Date(Date.now() + 76 * 24 * 60 * 60 * 1000),
        totalTests: 14000,
        remainingTests: 4200,
        firmwareVersion: 'v2.4.1',
        isSynthetic: true,
      },
      {
        serialNumber: 'BLS-KGMU-303',
        deviceModel: 'BiliSURE Transcutaneous Pro X1',
        macAddress: '00:1B:44:C3:03:K3',
        facility: 'KGMU',
        department: 'NICU High Dependency',
        assignedWard: 'HDU Unit 1',
        status: 'calibrated',
        isCalibrated: true,
        lastDiagnosticStatus: 'healthy',
        lastCalibratedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextCalibrationDue: new Date(Date.now() + 83 * 24 * 60 * 60 * 1000),
        totalTests: 12000,
        remainingTests: 7600,
        firmwareVersion: 'v2.4.2',
        isSynthetic: true,
      },
    ],
  };

  for (const fac of facilities) {
    const devs = deviceConfigs[fac];
    for (const d of devs) {
      await DeviceModel.findOneAndUpdate({ serialNumber: d.serialNumber }, d, { upsert: true, new: true });

      // Add corresponding historical diagnostic record
      const existingDiag = await DeviceDiagnosticModel.findOne({ deviceSerial: d.serialNumber });
      if (!existingDiag) {
        const isHealthy = d.lastDiagnosticStatus === 'healthy';
        const isIssue = d.lastDiagnosticStatus === 'issue_detected';
        await DeviceDiagnosticModel.create({
          diagnosticId: `DIAG-INIT-${d.serialNumber}`,
          deviceSerial: d.serialNumber,
          facility: fac,
          department: d.assignedWard,
          healthStatus: d.lastDiagnosticStatus,
          overallScore: isHealthy ? 97 : isIssue ? 72 : 78,
          checks: [
            {
              name: 'Optical Spectrum Integrity',
              category: 'optical',
              status: isIssue ? 'warning' : 'passed',
              message: isIssue ? 'Optical tip aperture transmittance attenuated 16%.' : 'Dual-wavelength 460nm/550nm emission normal.',
              measuredValue: isIssue ? '552 nm (attenuated)' : '460.1 nm / 550.0 nm',
              referenceThreshold: '±2.0 nm',
            },
            {
              name: 'Photodiode Sensor Response',
              category: 'sensor',
              status: 'passed',
              message: 'Photodiode dynamic SNR verified.',
              measuredValue: '67.2 dB',
              referenceThreshold: '> 60.0 dB',
            },
            {
              name: 'Calibration Baseline Drift',
              category: 'calibration',
              status: d.lastDiagnosticStatus === 'calibration_required' ? 'failed' : 'passed',
              message: d.lastDiagnosticStatus === 'calibration_required' ? 'Baseline variance 0.39 mg/dL exceeds clinical tolerance.' : 'Baseline drift within 0.14 mg/dL.',
              measuredValue: d.lastDiagnosticStatus === 'calibration_required' ? '0.39 mg/dL' : '0.14 mg/dL',
              referenceThreshold: '< 0.30 mg/dL',
            },
            {
              name: 'Ambient Light Shielding',
              category: 'optical',
              status: isIssue ? 'failed' : 'passed',
              message: isIssue ? 'Perimeter silicone shroud light leakage detected.' : 'Light seal integrity verified.',
              measuredValue: isIssue ? '0.38 lux' : '0.05 lux',
              referenceThreshold: '< 0.20 lux',
            },
            {
              name: 'Hardware Bus & Sensor Continuity',
              category: 'hardware',
              status: 'passed',
              message: 'I2C telemetry bus responsive.',
              measuredValue: '0.9 ms',
              referenceThreshold: '< 5.0 ms',
            },
            {
              name: 'Power Regulation & Battery Core',
              category: 'hardware',
              status: 'passed',
              message: 'Internal Li-ion voltage and 3.3V rail nominal.',
              measuredValue: '3.31 V',
              referenceThreshold: '3.3V ± 5%',
            },
          ],
          issues: isHealthy ? [] : isIssue ? ['Optical tip aperture attenuation detected', 'Ambient light seal compromised'] : ['Calibration baseline drift exceeded tolerance'],
          recommendation: isHealthy
            ? 'Device operational. Clinical testing approved.'
            : isIssue
            ? 'Clean optical aperture tip and inspect rubber light shroud.'
            : 'Recalibrate on standard BiliSURE reference dock.',
          scannedBy: 'Lead Biomedical Engineer',
          testDurationMs: 3100,
          scenario: isHealthy ? 'healthy' : isIssue ? 'optical_degradation' : 'calibration_drift',
          isSynthetic: true,
        });
      }
    }
  }
  console.log('✓ Devices and initial diagnostic logs seeded.');

  // 3. Seed Hospital Subscriptions
  console.log('3. Seeding Hospital Subscriptions...');
  const hospitalSubs = [
    {
      subscriptionId: 'SUB-PGI-2026',
      facility: 'PGI',
      planId: 'plan_clinical_500',
      planName: 'Clinical Care High-Volume',
      tier: 'clinical',
      status: 'active',
      billingCycle: 'monthly',
      startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      totalAllocatedTests: 500,
      usedTests: 342,
      remainingTests: 158,
      pricePerTestINR: 39.99,
      planAmountINR: 19999,
      autoRenew: true,
      isSynthetic: true,
    },
    {
      subscriptionId: 'SUB-RML-2026',
      facility: 'RML',
      planId: 'plan_starter_200',
      planName: 'Starter Neonatal Plan',
      tier: 'starter',
      status: 'expiring_soon', // low credit warning state
      billingCycle: 'monthly',
      startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      totalAllocatedTests: 200,
      usedTests: 184,
      remainingTests: 16, // Under 10% -> triggers low credit alert
      pricePerTestINR: 49.99,
      planAmountINR: 9999,
      autoRenew: true,
      isSynthetic: true,
    },
    {
      subscriptionId: 'SUB-KGMU-2026',
      facility: 'KGMU',
      planId: 'plan_enterprise_1500',
      planName: 'Tertiary Hospital Network',
      tier: 'enterprise',
      status: 'active',
      billingCycle: 'monthly',
      startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      totalAllocatedTests: 1500,
      usedTests: 624,
      remainingTests: 876,
      pricePerTestINR: 33.33,
      planAmountINR: 49999,
      autoRenew: true,
      isSynthetic: true,
    },
  ];

  for (const s of hospitalSubs) {
    await HospitalSubscriptionModel.findOneAndUpdate({ facility: s.facility }, s, { upsert: true, new: true });
  }
  console.log('✓ Hospital Subscriptions seeded.');

  // 4. Seed Usage History
  console.log('4. Seeding Test Usage Records...');
  const existingUsageCount = await TestUsageRecordModel.countDocuments({ isSynthetic: true });
  if (existingUsageCount < 30) {
    for (const fac of facilities) {
      // Find actual infants in DB for this facility to link realistic UHIDs
      const infants = await BabyModel.find({ facility: fac }).limit(10);
      const dev = deviceConfigs[fac][0].serialNumber;
      const sub = hospitalSubs.find((x) => x.facility === fac)!;

      const recordsToCreate = 15;
      for (let i = 0; i < recordsToCreate; i++) {
        const infant = infants[i % (infants.length || 1)];
        const uhid = infant ? infant.uhid : `UHID-${fac}-${1000 + i}`;
        const babyName = infant ? infant.name : `Baby ${i + 1}`;
        const daysAgo = Math.floor(Math.random() * 14);
        const hoursAgo = Math.floor(Math.random() * 24);
        const testTimestamp = new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);

        await TestUsageRecordModel.create({
          usageId: `USG-${fac}-${Date.now()}-${i}-${Math.floor(100 + Math.random() * 900)}`,
          facility: fac,
          department: 'NICU',
          babyUhid: uhid,
          babyName,
          deviceSerial: dev,
          readingValueMgDl: parseFloat((8.5 + Math.random() * 8.0).toFixed(1)),
          method: 'TcB',
          creditsConsumed: 1,
          costINR: sub.pricePerTestINR,
          testTimestamp,
          operatorName: i % 2 === 0 ? 'Nurse Sister Priya' : 'Staff Nurse Anita',
          status: 'billed',
          isSynthetic: true,
        });
      }
    }
    console.log('✓ 45 Test Usage Records seeded across hospitals.');
  } else {
    console.log(`✓ Test Usage Records already exist (${existingUsageCount} records).`);
  }

  console.log('=== All Device Testing & Billing data seeded successfully! ===');
  process.exit(0);
}

seedDeviceBilling().catch((err) => {
  console.error('Error seeding device billing:', err);
  process.exit(1);
});
