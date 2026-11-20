export type SeverityState = 'normal' | 'moderate' | 'critical';
export type AdmissionStatus = 'admitted' | 'under_treatment' | 'in_observation' | 'discharged';
export type BhutaniZone = 'low' | 'low_intermediate' | 'high_intermediate' | 'high';
export type PTStationStatus = 'available' | 'occupied' | 'maintenance' | 'out_of_service' | 'cleaning_prep';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  primaryRole: string;
  permissionProfile?: string;
  permissions?: string[];
  department?: string;
  facility: string; // 'PGI' | 'RML' | 'KGMU' | 'District Command'
  facilityId?: string;
  districtId?: string;
}

export interface Baby {
  _id: string;
  uhid: string;
  bilisureId?: string;
  name: string;
  parentsName: string;
  guardianPhone?: string;
  guardianAddress?: string;
  bloodGroup?: string;
  rhesusFactor?: 'positive' | 'negative' | 'unknown';
  directCoombsTest?: 'positive' | 'negative' | 'not_tested';
  dateOfBirth: string;
  exactTimeOfBirth?: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays?: number;
  birthWeightGrams?: number;
  currentWeightGrams?: number;
  weight?: number;
  height?: number;
  assignedDoctor?: string;
  facility: string;
  department: string;
  currentHospital?: string;
  currentStationId?: string;
  severityState: SeverityState;
  status: AdmissionStatus;
  referralStatus?: 'none' | 'pending' | 'accepted' | 'rejected' | 'admitted' | 'completed';
  referredToHospitalName?: string;
  referralSentAt?: string;
  activeReferralId?: string;
  isTransferredOut?: boolean;
  isHistoricalOnly?: boolean;
  initialValue?: number;
  dischargeValue?: number;
  riskFactors?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BilirubinReading {
  _id: string;
  babyId?: string;
  babyUhid: string;
  babyName?: string;
  department?: string;
  value: number;
  valueMgDl: number;
  unit: 'mg/dL' | 'µmol/L';
  method: 'TcB' | 'TSB';
  measurementSite?: string;
  source?: string;
  sampleTimestamp: string;
  postnatalAgeHours: number;
  bhutaniZone: BhutaniZone;
  bhutaniPercentileApprox?: number;
  phototherapyPhase?: string;
  riskLevel: 'low' | 'intermediate' | 'high';
  operatorName?: string;
  deviceSerial?: string;
  notes?: string;
  timestamp: string;
  createdAt: string;
}

export interface PTStation {
  _id: string;
  stationId: string;
  hospitalId: string;
  hospitalName: string;
  name: string;
  type: 'single_surface' | 'double_surface' | 'led_tunnel' | 'fiberoptic_blanket';
  location: string;
  operationalStatus: PTStationStatus;
  currentBabyId?: string | null;
  currentBabyName?: string | null;
  currentBabyUhid?: string | null;
  allocatedAt?: string | null;
  lastCleanedAt?: string;
  lastUpdated: string;
  notes?: string;
}

export interface Referral {
  _id: string;
  referralId: string;
  babyId: string;
  babyName: string;
  babyUhid: string;
  dateOfBirth: string;
  gestationalAgeWeeks: number;
  referringDoctorName: string;
  referringCentreName: string;
  receivingHospitalId: string;
  receivingHospitalName: string;
  status: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  clinicalSummary: string;
  latestBilirubinValue: number;
  latestBilirubinUnit: string;
  latestBhutaniRiskZone: string;
  postnatalAgeHoursAtReferral: number;
  phototherapyRecommended: boolean;
  rejectionReason?: string;
  reviewedByDoctorName?: string;
  reviewedAt?: string;
  arrivedAt?: string;
  allocatedStationId?: string;
  timeline: {
    status: string;
    timestamp: string;
    performedBy: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderFacility: string;
  recipientFacility?: string;
  channel: string;
  message: string;
  relatedBabyUhid?: string;
  relatedReferralId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface HospitalOverviewData {
  facility: string;
  kpis: {
    totalScreenings: number;
    awaitingReview: number;
    connectedDevices: string;
    hmsPending: number;
    totalPatients: number;
    criticalPatients: number;
    activePhototherapy: number;
    availablePtStations: number;
    totalPtStations: number;
  };
  patientBreakdown: {
    total: number;
    critical: number;
    moderate: number;
    normal: number;
    underTreatment: number;
    inObservation: number;
    discharged: number;
  };
  screeningVolume: {
    day: string;
    count: number;
    date: string;
  }[];
  recentResults: {
    id: string;
    babyId?: string;
    patientName: string;
    uhid: string;
    ward: string;
    ageHours: number;
    measurementValue: number;
    unit: string;
    method: string;
    timestamp: string;
    measurementSite: string;
    operatorName: string;
    deviceSerial: string;
    reviewStatus: string;
    hmsState: string;
    bhutaniZone: string;
    gestationalAgeWeeks?: number;
  }[];
  ptStations: PTStation[];
  referralStats: {
    incomingPending: number;
    incomingTotal: number;
    outgoingPending: number;
  };
}

export interface SuperAdminOverviewData {
  facilityFilter: string;
  summaryTotal: {
    totalInfants: number;
    inObservation: { count: number; percentage: number };
    inPhototherapy: { count: number; percentage: number };
    critical: { count: number; percentage: number };
  };
  bhutaniRiskDistribution: {
    totalSampled: number;
    lowRisk: { percentage: number; label: string; threshold: string };
    lowIntRisk: { percentage: number; label: string; threshold: string };
    highIntRisk: { percentage: number; label: string; threshold: string };
    highRisk: { percentage: number; label: string; threshold: string };
  };
  capacityGrid: {
    districtStations: number;
    districtOccupied: number;
    districtAvailable: number;
    hospitals: {
      id: string;
      name: string;
      code: string;
      operational: number;
      inUse: number;
      available: number;
    }[];
  };
  participatingFacilities: {
    receivingHospitals: number;
    referringCentres: number;
    totalReferrals: number;
  };
  screeningVolume: {
    day: string;
    count: number;
    date: string;
  }[];
}

export interface DiagnosticCheckItem {
  name: string;
  category: 'hardware' | 'optical' | 'sensor' | 'calibration' | 'connectivity';
  status: 'passed' | 'warning' | 'failed';
  message: string;
  measuredValue?: string;
  referenceThreshold?: string;
}

export interface DeviceDiagnosticRecord {
  _id?: string;
  diagnosticId: string;
  deviceId?: string;
  deviceSerial: string;
  facility: string;
  department: string;
  healthStatus: 'healthy' | 'issue_detected' | 'calibration_required';
  overallScore: number;
  checks: DiagnosticCheckItem[];
  issues: string[];
  recommendation: string;
  scannedBy?: string;
  testDurationMs: number;
  scenario?: string;
  createdAt: string;
}

export interface DeviceItem {
  _id: string;
  serialNumber: string;
  deviceModel: string;
  macAddress: string;
  facility: string;
  department: string;
  assignedWard?: string;
  autoCalibrateEnabled: boolean;
  accuracyTestPassed: boolean;
  recordCalibrationLog: boolean;
  remainingTests: number;
  totalTests: number;
  isCalibrated: boolean;
  status: 'active' | 'calibrated' | 'alert_broken' | 'maintenance';
  lastCalibratedAt?: string;
  nextCalibrationDue?: string;
  lastDiagnosticStatus?: 'healthy' | 'issue_detected' | 'calibration_required';
  firmwareVersion?: string;
  updatedAt?: string;
}

export interface DeviceHealthSummary {
  totalDevices: number;
  healthy: number;
  issues: number;
  calibrationRequired: number;
  latestScanAt?: string;
  facility: string;
}

export interface SubscriptionPlanItem {
  _id: string;
  planId: string;
  name: string;
  tier: 'starter' | 'clinical' | 'enterprise' | 'pay_as_you_go';
  billingPeriod: 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  testAllocation: number;
  priceINR: number;
  effectivePricePerTestINR: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
}

export interface HospitalSubscriptionData {
  subscription: {
    _id: string;
    subscriptionId: string;
    facility: string;
    planId: string;
    planName: string;
    tier: string;
    status: 'active' | 'expiring_soon' | 'exhausted' | 'inactive';
    billingCycle: string;
    startDate: string;
    expiryDate: string;
    totalAllocatedTests: number;
    usedTests: number;
    remainingTests: number;
    pricePerTestINR: number;
    planAmountINR: number;
    autoRenew: boolean;
    requestedUpgradePlanId?: string;
    requestedUpgradeAt?: string;
  };
  metrics: {
    totalAllocatedTests: number;
    usedTests: number;
    remainingTests: number;
    usagePercent: number;
    effectivePricePerTestINR: number;
    status: string;
    expiryDate: string;
    isLowCredit: boolean;
  };
}

export interface TestUsageItem {
  _id: string;
  usageId: string;
  facility: string;
  department: string;
  babyUhid: string;
  babyName?: string;
  deviceSerial: string;
  method: 'TcB' | 'TSB';
  readingValueMgDl?: number;
  creditsConsumed: number;
  costINR: number;
  testTimestamp: string;
  operatorName: string;
  status: 'billed' | 'pending' | 'reversed';
}

export interface UsageHistoryResponse {
  records: TestUsageItem[];
  total: number;
  page: number;
  pages: number;
  trend: { date: string; count: number }[];
}

export interface SuperAdminBillingSummary {
  aggregate: {
    totalAllocated: number;
    totalConsumed: number;
    totalRemaining: number;
    overallUsagePercent: number;
    totalActiveSubscriptions: number;
  };
  hospitalStats: {
    facility: string;
    planName: string;
    tier: string;
    status: string;
    totalAllocated: number;
    consumed: number;
    remaining: number;
    usagePercent: number;
    totalBilledCostINR: number;
    uniquePatientsCount: number;
    expiryDate: string;
  }[];
  plans: SubscriptionPlanItem[];
}
