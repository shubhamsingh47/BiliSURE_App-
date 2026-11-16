import { create } from 'zustand';
import { Baby, BilirubinReading, ClinicalObservation, SeverityState } from '../types';
import { BabyRepository } from '../database/repositories/BabyRepository';
import { ReadingRepository } from '../database/repositories/ReadingRepository';
import { SyncQueueRepository } from '../database/repositories/SyncQueueRepository';
import { SyncEngine } from '../services/sync.engine';
import { evaluateBhutaniRisk } from '../services/bhutani.service';

interface PatientState {
  babies: Baby[];
  selectedBaby: Baby | null;
  readings: BilirubinReading[];
  observations: ClinicalObservation[];
  selectedDepartment: string;
  isLoading: boolean;
  loadBabies: () => Promise<void>;
  selectBaby: (baby: Baby) => void;
  setSelectedDepartment: (dept: string) => void;
  registerBaby: (babyData: Partial<Baby>) => Promise<Baby>;
  addReading: (readingData: Partial<BilirubinReading>) => Promise<BilirubinReading>;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  babies: [
    {
      id: 'baby_1',
      serverId: '651a00010000000000000001',
      uhid: 'M1A2N3S4I5',
      bilisureId: 'BS-2026-0041',
      name: 'Baby 1',
      parentsName: 'Sarah Jenkins',
      dateOfBirth: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      exactTimeOfBirth: '08:00',
      gestationalAgeWeeks: 38,
      weight: 3.1,
      height: 48.0,
      assignedDoctor: 'Dr. Priya Sharma',
      facility: 'North Community Health Centre (CHC)',
      department: 'Deppt',
      severityState: 'critical',
      status: 'under_treatment',
      referralStatus: 'accepted',
      initialValue: 10.0,
      dischargeValue: 5.0,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'baby_2',
      serverId: '651a00010000000000000002',
      uhid: 'B2C3D4E5F6',
      bilisureId: 'BS-2026-0042',
      name: 'Baby 2',
      parentsName: 'Emily Watson',
      dateOfBirth: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      exactTimeOfBirth: '14:30',
      gestationalAgeWeeks: 37,
      weight: 2.9,
      height: 47.5,
      assignedDoctor: 'Dr. Priya Sharma',
      facility: 'East Primary Health Centre (PHC)',
      department: 'Deppt',
      severityState: 'critical',
      status: 'admitted',
      referralStatus: 'pending',
      initialValue: 17.5,
      dischargeValue: 0,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'baby_3',
      serverId: '651a00010000000000000003',
      uhid: 'G7H8I9J0K1',
      bilisureId: 'BS-2026-0043',
      name: 'Baby 3',
      parentsName: 'Maria Rodriguez',
      dateOfBirth: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      exactTimeOfBirth: '10:15',
      gestationalAgeWeeks: 39,
      weight: 3.4,
      height: 50.0,
      assignedDoctor: 'Dr. Priya Sharma',
      facility: 'North Community Health Centre (CHC)',
      department: 'Deppt',
      severityState: 'normal',
      status: 'in_observation',
      referralStatus: 'none',
      initialValue: 7.2,
      dischargeValue: 0,
      updatedAt: new Date().toISOString(),
    },
  ],
  selectedBaby: null,
  readings: [
    {
      id: 'rdg_1',
      clientOperationId: 'op_seed_001',
      babyId: 'baby_1',
      babyUhid: 'M1A2N3S4I5',
      value: 10.0,
      unit: 'mg/dL',
      method: 'TSB',
      sampleTimestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      postnatalAgeHours: 24,
      bhutaniZone: 'low_intermediate',
      bhutaniPercentileApprox: 60,
      phototherapyPhase: 'pre_phototherapy',
      measurementSite: 'palms_and_soles',
      source: 'manual_entry',
      operatorName: 'Nurse A',
      symptoms: '',
      riskLevel: 'low',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      isInitial: true,
      syncStatus: 'synced',
    },
    {
      id: 'rdg_2',
      clientOperationId: 'op_seed_002',
      babyId: 'baby_1',
      babyUhid: 'M1A2N3S4I5',
      value: 14.8,
      unit: 'mg/dL',
      method: 'TSB',
      sampleTimestamp: new Date().toISOString(),
      postnatalAgeHours: 48,
      bhutaniZone: 'high_intermediate',
      bhutaniPercentileApprox: 88,
      phototherapyPhase: 'pre_phototherapy',
      measurementSite: 'sternum',
      source: 'manual_entry',
      operatorName: 'Dr. Priya Sharma',
      symptoms: 'Icterus extended to palms and soles',
      riskLevel: 'intermediate',
      timestamp: new Date().toISOString(),
      isInitial: false,
      syncStatus: 'synced',
    },
  ],
  observations: [
    {
      id: 'obs_1',
      clientOperationId: 'obs_op_1',
      babyId: 'baby_1',
      site: 'Face',
      observerName: 'Nurse A',
      clinicalNotes: 'Facial sclera icterus',
      bilirubinValue: 18.0,
      timestamp: new Date().toISOString(),
      syncStatus: 'synced',
    },
  ],
  selectedDepartment: 'Deppt',
  isLoading: false,

  loadBabies: async () => {
    set({ isLoading: true });
    try {
      const local = await BabyRepository.getAll();
      if (local && local.length > 0) {
        set({ babies: local, selectedBaby: local[0] });
      } else {
        const stateBabies = get().babies;
        for (const b of stateBabies) {
          await BabyRepository.insertOrUpdate(b);
        }
        set({ selectedBaby: stateBabies[0] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  selectBaby: (baby) => {
    set({ selectedBaby: baby });
  },

  setSelectedDepartment: (dept) => {
    set({ selectedDepartment: dept });
  },

  registerBaby: async (babyData) => {
    const newBaby: Baby = {
      id: 'baby_' + Date.now(),
      uhid: babyData.uhid || `UHID_${Date.now().toString().slice(-6)}`,
      bilisureId: `BS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: babyData.name || 'New Baby',
      parentsName: babyData.parentsName || '',
      dateOfBirth: babyData.dateOfBirth || new Date().toISOString(),
      exactTimeOfBirth: babyData.exactTimeOfBirth || '09:00',
      gestationalAgeWeeks: babyData.gestationalAgeWeeks || 38,
      weight: babyData.weight || 3.0,
      height: babyData.height || 48.0,
      assignedDoctor: babyData.assignedDoctor || 'Dr. Priya Sharma',
      facility: babyData.facility || 'North Community Health Centre (CHC)',
      department: get().selectedDepartment,
      severityState: babyData.severityState || 'normal',
      status: babyData.status || 'admitted',
      referralStatus: 'none',
      initialValue: babyData.initialValue || 0,
      dischargeValue: babyData.dischargeValue || 0,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    };

    // 1. Persist to SQLite
    await BabyRepository.insertOrUpdate(newBaby);

    // 2. Queue for offline sync
    await SyncQueueRepository.enqueue({
      operationId: 'op_baby_' + Date.now(),
      entityType: 'baby',
      action: 'create',
      payloadJson: JSON.stringify(newBaby),
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });

    // 3. Update store
    set((state) => ({
      babies: [newBaby, ...state.babies],
      selectedBaby: newBaby,
    }));

    // 4. Trigger background sync
    SyncEngine.syncPending().catch(() => {});

    return newBaby;
  },

  addReading: async (readingData) => {
    const activeBaby = get().selectedBaby || get().babies[0];
    const clientOpId = 'op_rdg_' + Date.now();
    const value = readingData.value || 10.0;
    const unit = readingData.unit || 'mg/dL';
    const method = readingData.method || 'TSB';

    // Clinical Bhutani stratification
    const bhutaniAssessment = evaluateBhutaniRisk({
      dateOfBirth: activeBaby.dateOfBirth,
      exactTimeOfBirth: activeBaby.exactTimeOfBirth || '08:00',
      sampleTimestamp: readingData.sampleTimestamp || new Date().toISOString(),
      value,
      unit,
      method,
      gestationalAgeWeeks: activeBaby.gestationalAgeWeeks || 38,
    });

    const bhutaniZone = bhutaniAssessment.zone;
    let riskLevel: 'low' | 'intermediate' | 'high' = 'low';
    if (bhutaniZone === 'high') riskLevel = 'high';
    else if (bhutaniZone === 'high_intermediate' || bhutaniZone === 'low_intermediate') riskLevel = 'intermediate';

    const newReading: BilirubinReading = {
      id: 'rdg_' + Date.now(),
      clientOperationId: clientOpId,
      babyId: activeBaby.id,
      babyUhid: activeBaby.uhid,
      value,
      unit,
      method,
      sampleTimestamp: readingData.sampleTimestamp || new Date().toISOString(),
      postnatalAgeHours: bhutaniAssessment.postnatalAgeHours,
      bhutaniZone,
      bhutaniPercentileApprox: bhutaniAssessment.percentileApprox,
      phototherapyPhase: readingData.phototherapyPhase || 'pre_phototherapy',
      measurementSite: readingData.measurementSite || 'palms_and_soles',
      source: readingData.source || 'manual_entry',
      operatorName: readingData.operatorName || 'Nurse Staff',
      symptoms: readingData.symptoms || '',
      riskLevel,
      timestamp: new Date().toISOString(),
      isInitial: readingData.isInitial,
      isDischarge: readingData.isDischarge,
      syncStatus: 'pending',
    };

    // 1. SQLite persistence
    await ReadingRepository.insertOrUpdate(newReading);

    // 2. Sync queue
    await SyncQueueRepository.enqueue({
      operationId: clientOpId,
      entityType: 'reading',
      action: 'create',
      payloadJson: JSON.stringify(newReading),
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });

    // 3. Update store & baby status
    const updatedSeverity: SeverityState = riskLevel === 'high' ? 'critical' : riskLevel === 'intermediate' ? 'moderate' : 'normal';
    set((state) => {
      const updatedBabies = state.babies.map((b) =>
        b.id === activeBaby.id ? { ...b, severityState: updatedSeverity } : b
      );
      return {
        readings: [newReading, ...state.readings],
        babies: updatedBabies,
        selectedBaby: { ...activeBaby, severityState: updatedSeverity },
      };
    });

    // 4. Background sync
    SyncEngine.syncPending().catch(() => {});

    return newReading;
  },
}));
