export type SeverityState = 'normal' | 'moderate' | 'critical';
export type PatientStatus = 'admitted' | 'under_treatment' | 'in_observation' | 'discharged';
export type RiskLevel = 'low' | 'intermediate' | 'high';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  facility: string;
}

export interface Baby {
  id: string;
  serverId?: string;
  uhid: string;
  name: string;
  parentsName: string;
  dateOfBirth: string;
  weight?: number;
  height?: number;
  assignedDoctor?: string;
  facility?: string;
  department?: string;
  severityState: SeverityState;
  status: PatientStatus;
  initialValue?: number;
  dischargeValue?: number;
  syncStatus?: SyncStatus;
  updatedAt: string;
}

export interface BilirubinReading {
  id: string;
  serverId?: string;
  clientOperationId: string;
  babyId: string;
  value: number;
  unit: string;
  measurementSite: string;
  source: string;
  operatorName?: string;
  symptoms?: string;
  riskLevel: RiskLevel;
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
