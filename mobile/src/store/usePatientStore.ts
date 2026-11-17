import { create } from 'zustand';
import { Baby, BilirubinReading, ClinicalObservation, SeverityState } from '../types';
import { BabyRepository } from '../database/repositories/BabyRepository';
import { ReadingRepository } from '../database/repositories/ReadingRepository';
import { ObservationRepository } from '../database/repositories/ObservationRepository';
import { SyncQueueRepository } from '../database/repositories/SyncQueueRepository';
import { SyncEngine } from '../services/sync.engine';
import { evaluateBhutaniRisk } from '../services/bhutani.service';
import { SEED_BABIES, SEED_READINGS, SEED_OBSERVATIONS } from './seedData';

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
  updateBaby: (babyId: string, updates: Partial<Baby>) => Promise<Baby>;
  addReading: (readingData: Partial<BilirubinReading>) => Promise<BilirubinReading>;
  addObservation: (
    babyId: string,
    site: string,
    bilirubinValue: number,
    observerName: string,
    timestamp?: string
  ) => ClinicalObservation;
  updateObservation: (observationId: string, updates: { site?: string; bilirubinValue?: number }) => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  babies: SEED_BABIES,
  selectedBaby: SEED_BABIES[0] || null,
  readings: SEED_READINGS,
  observations: SEED_OBSERVATIONS,
  selectedDepartment: 'Deppt',
  isLoading: false,

  loadBabies: async () => {
    set({ isLoading: true });
    try {
      // 1. Load and merge babies from SQLite
      const local = await BabyRepository.getAll();
      let finalBabies = local;
      if (local && local.length > 0) {
        const existingIds = new Set(local.map((b) => b.uhid || b.id));
        const missingSeed = SEED_BABIES.filter((b) => !existingIds.has(b.uhid) && !existingIds.has(b.id));
        if (missingSeed.length > 0) {
          for (const b of missingSeed) {
            await BabyRepository.insertOrUpdate(b);
          }
          finalBabies = await BabyRepository.getAll();
        }
      } else {
        for (const b of SEED_BABIES) {
          await BabyRepository.insertOrUpdate(b);
        }
        finalBabies = SEED_BABIES;
      }

      // 2. Load and merge readings from SQLite
      const localReadings = await ReadingRepository.getAll();
      let finalReadings = localReadings;
      if (localReadings && localReadings.length > 0) {
        const existingRdgIds = new Set(localReadings.map((r) => r.clientOperationId || r.id));
        const missingSeedRdg = SEED_READINGS.filter(
          (r) => !existingRdgIds.has(r.clientOperationId) && !existingRdgIds.has(r.id)
        );
        if (missingSeedRdg.length > 0) {
          for (const r of missingSeedRdg) {
            await ReadingRepository.insertOrUpdate(r);
          }
          finalReadings = await ReadingRepository.getAll();
        }
      } else {
        for (const r of SEED_READINGS) {
          await ReadingRepository.insertOrUpdate(r);
        }
        finalReadings = SEED_READINGS;
      }

      // 3. Load and merge clinical observations from SQLite
      const localObs = await ObservationRepository.getAll();
      let finalObs = localObs;
      if (localObs && localObs.length > 0) {
        const existingObsIds = new Set(localObs.map((o) => o.clientOperationId || o.id));
        const missingSeedObs = SEED_OBSERVATIONS.filter(
          (o) => !existingObsIds.has(o.clientOperationId) && !existingObsIds.has(o.id)
        );
        if (missingSeedObs.length > 0) {
          for (const o of missingSeedObs) {
            await ObservationRepository.insertOrUpdate(o);
          }
          finalObs = await ObservationRepository.getAll();
        }
      } else {
        for (const o of SEED_OBSERVATIONS) {
          await ObservationRepository.insertOrUpdate(o);
        }
        finalObs = SEED_OBSERVATIONS;
      }

      // Filter out any legacy entries named "Baby 1", "Baby 2", or "Baby"
      finalBabies = finalBabies.filter((b) => {
        const n = (b.name || '').trim().toLowerCase();
        const pn = (b.parentsName || '').trim().toLowerCase();
        return !['baby 1', 'baby 2', 'baby', 'baby1', 'baby2'].includes(n) &&
               !['baby 1', 'baby 2', 'baby1', 'baby2'].includes(pn);
      });

      const activeBaby = get().selectedBaby;
      const matchingActive = activeBaby ? finalBabies.find((b) => b.id === activeBaby.id) : null;

      set({
        babies: finalBabies,
        readings: finalReadings,
        observations: finalObs,
        selectedBaby: matchingActive || finalBabies[0] || null,
      });
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
      name: babyData.name || 'New Patient',
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

  updateBaby: async (babyId: string, updates: Partial<Baby>) => {
    let updated: Baby | null = null;
    set((state) => {
      const newBabies = state.babies.map((b) => {
        if (b.id === babyId) {
          updated = { ...b, ...updates, updatedAt: new Date().toISOString() };
          return updated;
        }
        return b;
      });
      return {
        babies: newBabies,
        selectedBaby: state.selectedBaby?.id === babyId ? updated : state.selectedBaby,
      };
    });

    if (updated) {
      await BabyRepository.insertOrUpdate(updated).catch(() => {});
    }

    return updated || (get().babies.find((b) => b.id === babyId) as Baby);
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
      postnatalAgeHours: bhutaniAssessment.binnedPostnatalAgeHours || bhutaniAssessment.postnatalAgeHours,
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

  addObservation: (babyId, site, bilirubinValue, observerName, timestamp) => {
    const now = timestamp || new Date().toISOString();
    const clientOpId = 'obs_op_' + Date.now();
    const newObservation: ClinicalObservation = {
      id: 'obs_' + Date.now(),
      clientOperationId: clientOpId,
      babyId,
      site,
      observerName,
      clinicalNotes: '',
      bilirubinValue,
      timestamp: now,
      syncStatus: 'pending',
    };

    // 1. Immediate in-memory update for fast UI response
    set((state) => ({ observations: [newObservation, ...state.observations] }));

    // 2. Persistent storage in SQLite + offline sync queue
    (async () => {
      try {
        await ObservationRepository.insertOrUpdate(newObservation);
        await SyncQueueRepository.enqueue({
          operationId: clientOpId,
          entityType: 'observation',
          action: 'create',
          payloadJson: JSON.stringify(newObservation),
          status: 'pending',
          retryCount: 0,
          createdAt: now,
        });
        SyncEngine.syncPending().catch(() => {});
      } catch (err) {
        console.warn('[Observation] SQLite save error:', err);
      }
    })();

    return newObservation;
  },

  updateObservation: (observationId, updates) => {
    const existing = get().observations.find((o) => o.id === observationId);
    if (!existing) return;
    const updatedObs = { ...existing, ...updates };

    // 1. Immediate in-memory update
    set((state) => ({
      observations: state.observations.map((o) =>
        o.id === observationId ? updatedObs : o
      ),
    }));

    // 2. Persistent storage in SQLite + offline sync queue
    (async () => {
      try {
        await ObservationRepository.insertOrUpdate(updatedObs);
        await SyncQueueRepository.enqueue({
          operationId: 'obs_upd_' + Date.now(),
          entityType: 'observation',
          action: 'update',
          payloadJson: JSON.stringify(updatedObs),
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
        SyncEngine.syncPending().catch(() => {});
      } catch (err) {
        console.warn('[Observation] SQLite update error:', err);
      }
    })();
  },
}));
