export type SeverityState = 'normal' | 'moderate' | 'critical';
export type PatientStatus = 'admitted' | 'under_treatment' | 'in_observation' | 'discharged';
export type RiskLevel = 'low' | 'intermediate' | 'high';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export type PrimaryUserRole =
  | 'doctor_referring'
  | 'receiving_hospital'
  | 'district_admin';

export type LegacyUserRole =
  | 'referring_doctor'
  | 'hospital_doctor'
  | 'hospital_nurse'
  | 'hospital_admin';

export type UserRole = PrimaryUserRole | LegacyUserRole;

export type PermissionProfile = 'clinical' | 'nursing' | 'management' | 'all';

export type HospitalPermission =
  // Clinical
  | 'view_referrals'
  | 'manage_referrals'
  | 'confirm_arrival'
  | 'register_admissions'
  | 'view_baby_details'
  | 'view_nomogram'
  | 'enter_bilirubin'
  | 'record_observations'
  | 'allocate_stations'
  | 'manage_treatment'
  | 'record_duration'
  | 'update_patient_status'
  | 'record_discharge'
  // Hospital management
  | 'register_stations'
  | 'update_stations'
  | 'manage_station_status'
  | 'manage_staff'
  | 'view_hospital_analytics';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  primaryRole: PrimaryUserRole;
  permissionProfile?: PermissionProfile;
  permissions: string[];
  department: string;
  facility: string;
  facilityId?: string;
  districtId?: string;
}

export type BhutaniZone =
  | 'low'
  | 'low_intermediate'
  | 'high_intermediate'
  | 'high'
  | 'ineligible';

export type PhototherapyPhase =
  | 'pre_phototherapy'
  | 'during_phototherapy'
  | 'post_phototherapy'
  | 'none';

export interface Baby {
  id: string;
  serverId?: string;
  uhid: string;
  bilisureId?: string;
  name: string;
  parentsName: string;
  dateOfBirth: string;
  exactTimeOfBirth?: string;
  gestationalAgeWeeks?: number;
  gestationalAgeDays?: number;
  weight?: number;
  height?: number;
  gender?: string;
  assignedDoctor?: string;
  facility?: string;
  department?: string;
  referringDoctor?: string;
  referringCentre?: string;
  currentHospital?: string;
  currentStationId?: string;
  severityState: SeverityState;
  status: PatientStatus;
  referralStatus?: 'none' | 'pending' | 'accepted' | 'rejected' | 'admitted';
  referredToHospitalName?: string;
  referredToHospitalId?: string;
  referralAcceptedAt?: string;
  acceptedAt?: string;
  initialValue?: number;
  dischargeValue?: number;
  riskFactors?: string[];
  syncStatus?: SyncStatus;
  registeredAt?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface BilirubinReading {
  id: string;
  serverId?: string;
  clientOperationId: string;
  babyId: string;
  babyUhid?: string;
  value: number;
  valueMgDl?: number;
  unit: 'mg/dL' | 'µmol/L';
  method: 'TSB' | 'TcB';
  sampleTimestamp: string;
  postnatalAgeHours: number;
  measurementSite: string;
  source: string;
  operatorName?: string;
  symptoms?: string;
  riskLevel: RiskLevel;
  bhutaniZone: BhutaniZone;
  bhutaniPercentileApprox?: number;
  phototherapyPhase: PhototherapyPhase;
  timestamp: string;
  isInitial?: boolean;
  isDischarge?: boolean;
  syncStatus?: SyncStatus;
}

export interface ClinicalObservation {
  id: string;
  serverId?: string;
  clientOperationId: string;
  babyId: string;
  site: string;
  observerName: string;
  clinicalNotes: string;
  bilirubinValue: number;
  timestamp: string;
  syncStatus?: SyncStatus;
}

export interface Recommendation {
  id: string;
  babyId: string;
  source: 'bilisure_automated' | 'healthcare_provider';
  suggestedAction: string;
  frequency: string;
  guidelineReference?: string;
  providerNotes?: string;
  status: string;
}

export type PTStationStatus =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'out_of_service'
  | 'cleaning_prep';

export type PTStationType =
  | 'single_surface'
  | 'double_surface'
  | 'led_tunnel'
  | 'fiberoptic_blanket';

export interface PTStation {
  id: string;
  stationId: string;
  hospitalId: string;
  hospitalName: string;
  name: string;
  type: PTStationType;
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

export interface Hospital {
  id: string;
  _id?: string;
  name: string;
  code: string;
  type: 'referring_centre' | 'receiving_hospital';
  district: string;
  address: string;
  contactNumber: string;
  totalPTStations: number;
  operationalPTStations: number;
  occupiedPTStations: number;
  availablePTStations: number;
  lastAvailabilityUpdated: string;
}

export type ReferralStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'arrived'
  | 'admitted'
  | 'completed'
  | 'cancelled';

export type ReferralUrgency = 'routine' | 'urgent' | 'emergency';

export interface Referral {
  id: string;
  _id?: string;
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
  status: ReferralStatus;
  urgency: ReferralUrgency;
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
  createdAt: string;
}

export interface TreatmentSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  phototherapyType: string;
  irradianceMwCm2?: number;
  nurseName: string;
  notes?: string;
  status: 'active' | 'completed' | 'interrupted';
}

export interface Admission {
  id: string;
  _id?: string;
  admissionId: string;
  babyId: string;
  babyUhid: string;
  babyName: string;
  hospitalId: string;
  hospitalName: string;
  referralId?: string;
  physicalArrivalConfirmed: boolean;
  arrivalConfirmedAt?: string;
  arrivalConfirmedBy?: string;
  ptStationId?: string;
  ptStationName?: string;
  admittedAt: string;
  admissionStatus: PatientStatus;
  assignedDoctor: string;
  primaryNurse: string;
  initialAdmissionBilirubin: number;
  treatmentSessions: TreatmentSession[];
  dischargeApprovedByDoctor?: string;
  dischargeApprovedAt?: string;
  dischargeBilirubinValue?: number;
  dischargeNotes?: string;
  followUpPlan?: string;
  dischargedAt?: string;
  stationReleased: boolean;
}

export interface InAppNotification {
  id: string;
  _id?: string;
  recipientRole?: string;
  hospitalId?: string;
  title: string;
  message: string;
  type: string;
  relatedBabyUhid?: string;
  relatedReferralId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DeviceProfile {
  serialNumber: string;
  deviceModel: string;
  macAddress: string;
  autoCalibrateEnabled: boolean;
  accuracyTestPassed: boolean;
  recordCalibrationLog: boolean;
  remainingTests: number;
  totalTests: number;
  isCalibrated: boolean;
  status: string;
  lastCalibratedAt: string;
}

export interface SyncQueueItem {
  operationId: string;
  entityType: 'baby' | 'reading' | 'observation';
  action: 'create' | 'update';
  payloadJson: string;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;
}
