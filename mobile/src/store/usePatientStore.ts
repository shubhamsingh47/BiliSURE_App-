import { create } from 'zustand';
import { Baby, BilirubinReading, ClinicalObservation, SeverityState } from '../types';
import { PatientsApi } from '../services/patients.api';
import { evaluateBhutaniRisk } from '../services/bhutani.service';

interface PatientState {
  babies: Baby[];
  selectedBaby: Baby | null;
  readings: BilirubinReading[];
  observations: ClinicalObservation[];
  selectedDepartment: string;
  isLoading: boolean;
  loadBabies: () => Promise<void>;
  selectBaby: (baby: Baby | null) => void;
  deselectBaby: () => void;
  setSelectedDepartment: (dept: string) => void;
  registerBaby: (babyData: Partial<Baby>) => Promise<Baby>;
  updateBaby: (babyId: string, updates: Partial<Baby>) => Promise<Baby>;
  markBabyAsReferred: (uhid: string, receivingHospitalName: string, referralSentAt?: string) => void;
  addReading: (readingData: Partial<BilirubinReading>) => Promise<BilirubinReading>;
  addObservation: (
    babyId: string,
    site: string,
    bilirubinValue: number,
    observerName: string,
    timestamp?: string
  ) => Promise<ClinicalObservation>;
  updateObservation: (observationId: string, updates: { site?: string; bilirubinValue?: number }) => void;
  updateReading: (readingId: string, updates: Partial<BilirubinReading>) => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  babies: [],
  selectedBaby: null,
  readings: [],
  observations: [],
  selectedDepartment: 'Deppt',
  isLoading: false,

  loadBabies: async () => {
    set({ isLoading: true });
    try {
      const dept = get().selectedDepartment;
      const onlineBabies = await PatientsApi.getBabies(
        dept !== 'Deppt' && dept !== 'All' ? dept : undefined
      );

      // If online babies were fetched, update state
      if (Array.isArray(onlineBabies)) {
        if (onlineBabies.length > 0) {
          const finalBabies = onlineBabies;
          const currentSelected = get().selectedBaby;
          const activeBaby = currentSelected
            ? finalBabies.find((b) => b.id === currentSelected.id || b.uhid === currentSelected.uhid)
            : null;
          const effectiveBaby = activeBaby || null;

          // Load readings for every baby (so each list card can show its own latest sample)
          const [readingsPerBaby, allObservations] = await Promise.all([
            Promise.all(finalBabies.map((b) => PatientsApi.getReadings(b.id || b.uhid))),
            PatientsApi.getObservations(),
          ]);

          set({
            babies: finalBabies,
            readings: readingsPerBaby.flat(),
            observations: allObservations || [],
            selectedBaby: effectiveBaby,
          });
        } else {
          // Legitimate empty state for hospitals with no patients (e.g. RML, KGMU initially)
          set({
            babies: [],
            selectedBaby: null,
            readings: [],
            observations: [],
          });
        }
      }
    } catch (err) {
      console.error('Error loading babies from backend:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  selectBaby: async (baby) => {
    set({ selectedBaby: baby });
    if (!baby) return;
    try {
      const babyIdentifier = baby.id || baby.uhid;
      const [readings, observations] = await Promise.all([
        PatientsApi.getReadings(babyIdentifier),
        PatientsApi.getObservations(babyIdentifier),
      ]);
      // Refresh only this baby's entries; keep other babies' data for the list view
      set((state) => ({
        readings: [
          ...(readings || []),
          ...state.readings.filter((r) => r.babyId !== baby.id && r.babyId !== baby.uhid),
        ],
        observations: [
          ...(observations || []),
          ...state.observations.filter((o) => o.babyId !== baby.id && o.babyId !== baby.uhid),
        ],
      }));
    } catch (err) {
      console.error('Error fetching baby readings/observations:', err);
    }
  },

  deselectBaby: () => {
    set({ selectedBaby: null });
  },

  setSelectedDepartment: (dept) => {
    set({ selectedDepartment: dept });
  },

  registerBaby: async (babyData) => {
    const payload: Partial<Baby> = {
      uhid: babyData.uhid || `UHID_${Date.now().toString().slice(-6)}`,
      bilisureId: babyData.bilisureId || `BS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: babyData.name || 'New Patient',
      parentsName: babyData.parentsName || '',
      dateOfBirth: babyData.dateOfBirth || new Date().toISOString(),
      exactTimeOfBirth: babyData.exactTimeOfBirth || '09:00',
      gestationalAgeWeeks: babyData.gestationalAgeWeeks || 38,
      weight: babyData.weight || 3.0,
      height: babyData.height || 48.0,
      assignedDoctor: babyData.assignedDoctor || 'Dr. Priya Sharma',
      facility: babyData.facility || 'North Community Health Centre (CHC)',
      department: get().selectedDepartment !== 'Deppt' ? get().selectedDepartment : 'NICU',
      severityState: babyData.severityState || 'normal',
      status: babyData.status || 'admitted',
      referralStatus: 'none',
      initialValue: babyData.initialValue || 0,
      dischargeValue: babyData.dischargeValue || 0,
      registeredAt: babyData.registeredAt || new Date().toISOString(),
      createdAt: babyData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Send to backend Express -> MongoDB
    const saved = await PatientsApi.registerBaby(payload);
    const persistedBaby = saved || ({ ...payload, id: 'baby_' + Date.now() } as Baby);

    // 2. Update Zustand store with the backend response
    set((state) => ({
      babies: [persistedBaby, ...state.babies],
      selectedBaby: persistedBaby,
    }));

    return persistedBaby;
  },

  updateBaby: async (babyId: string, updates: Partial<Baby>) => {
    const updated = await PatientsApi.updateBaby(babyId, updates);
    if (updated) {
      set((state) => ({
        babies: state.babies.map((b) => (b.id === babyId || b.uhid === babyId ? updated : b)),
        selectedBaby:
          state.selectedBaby && (state.selectedBaby.id === babyId || state.selectedBaby.uhid === babyId)
            ? updated
            : state.selectedBaby,
      }));
      return updated;
    }

    // In-memory fallback if network temporary issue
    let fallbackUpdated: Baby | null = null;
    set((state) => {
      const newBabies = state.babies.map((b) => {
        if (b.id === babyId || b.uhid === babyId) {
          fallbackUpdated = { ...b, ...updates, updatedAt: new Date().toISOString() };
          return fallbackUpdated;
        }
        return b;
      });
      return {
        babies: newBabies,
        selectedBaby:
          state.selectedBaby && (state.selectedBaby.id === babyId || state.selectedBaby.uhid === babyId)
            ? fallbackUpdated
            : state.selectedBaby,
      };
    });

    return fallbackUpdated || (get().babies.find((b) => b.id === babyId || b.uhid === babyId) as Baby);
  },

  markBabyAsReferred: (uhid: string, receivingHospitalName: string, referralSentAt?: string) => {
    set((state) => ({
      babies: state.babies.map((b) =>
        b.uhid === uhid || b.id === uhid
          ? {
              ...b,
              referralStatus: 'pending',
              referredToHospitalName: receivingHospitalName,
              referralSentAt: referralSentAt || new Date().toISOString(),
            }
          : b
      ),
    }));
  },

  addReading: async (readingData) => {
    const activeBaby = get().selectedBaby || get().babies[0];
    const babyId = readingData.babyId || activeBaby?.id || (activeBaby as any)?._id || 'baby_unknown';
    const babyUhid = readingData.babyUhid || activeBaby?.uhid || 'UHID-0000';
    const targetBaby = get().babies.find((b) => b.id === babyId || b.uhid === babyUhid) || activeBaby;

    if (!targetBaby && !readingData.babyId) {
      throw new Error('No patient selected to record reading');
    }

    const clientOpId = 'op_rdg_' + Date.now();
    const value = readingData.value || 10.0;
    const unit = readingData.unit || 'mg/dL';
    const method = readingData.method || 'TcB';

    // Clinical Bhutani stratification
    const bhutaniAssessment = evaluateBhutaniRisk({
      dateOfBirth: targetBaby?.dateOfBirth || new Date(Date.now() - 3600000 * 24).toISOString(),
      exactTimeOfBirth: targetBaby?.exactTimeOfBirth || '08:00',
      sampleTimestamp: readingData.sampleTimestamp || new Date().toISOString(),
      value,
      unit,
      method,
      gestationalAgeWeeks: targetBaby?.gestationalAgeWeeks || 38,
    });

    const bhutaniZone = bhutaniAssessment.zone;
    let riskLevel: 'low' | 'intermediate' | 'high' = 'low';
    if (bhutaniZone === 'high') riskLevel = 'high';
    else if (bhutaniZone === 'high_intermediate' || bhutaniZone === 'low_intermediate') riskLevel = 'intermediate';

    const rawSite = readingData.measurementSite || 'forehead';
    const normalizedSite = rawSite.toLowerCase().replace(/[\s-]+/g, '_');

    const payload: Partial<BilirubinReading> = {
      clientOperationId: clientOpId,
      babyId,
      babyUhid,
      value,
      valueMgDl: unit === 'µmol/L' ? Number((value / 17.1).toFixed(1)) : value,
      unit,
      method,
      sampleTimestamp: readingData.sampleTimestamp || new Date().toISOString(),
      postnatalAgeHours: bhutaniAssessment.binnedPostnatalAgeHours || bhutaniAssessment.postnatalAgeHours,
      bhutaniZone,
      bhutaniPercentileApprox: bhutaniAssessment.percentileApprox,
      phototherapyPhase: readingData.phototherapyPhase || 'pre_phototherapy',
      measurementSite: normalizedSite,
      source: readingData.source || 'manual_entry',
      operatorName: readingData.operatorName || 'Nurse Staff',
      symptoms: readingData.symptoms || '',
      riskLevel,
      timestamp: new Date().toISOString(),
      isInitial: readingData.isInitial,
      isDischarge: readingData.isDischarge,
    };

    const savedReading = await PatientsApi.createReading(payload);
    const readingToStore: BilirubinReading = savedReading || ({
      ...payload,
      id: 'rdg_' + Date.now(),
      syncStatus: 'synced',
    } as BilirubinReading);

    const updatedSeverity: SeverityState =
      riskLevel === 'high' ? 'critical' : riskLevel === 'intermediate' ? 'moderate' : 'normal';

    const matchingObs: ClinicalObservation = {
      id: 'obs_' + Date.now(),
      clientOperationId: clientOpId,
      babyId: targetBaby?.id || babyId,
      site: (readingData.measurementSite || 'Forehead').charAt(0).toUpperCase() + (readingData.measurementSite || 'Forehead').slice(1),
      bilirubinValue: value,
      timestamp: readingData.sampleTimestamp || new Date().toISOString(),
      observerName: readingData.operatorName || 'Nurse Staff',
      clinicalNotes: `${method}${readingData.phototherapyPhase ? ' • ' + readingData.phototherapyPhase.replace(/_/g, ' ') : ''}`,
      syncStatus: 'synced',
    };

    set((state) => {
      const updatedBabies = state.babies.map((b) =>
        b.id === babyId || b.uhid === babyUhid ? { ...b, severityState: updatedSeverity } : b
      );
      return {
        readings: [readingToStore, ...state.readings],
        observations: [matchingObs, ...state.observations],
        babies: updatedBabies,
        selectedBaby: targetBaby && (targetBaby.id === babyId || targetBaby.uhid === babyUhid)
          ? { ...targetBaby, severityState: updatedSeverity }
          : state.selectedBaby,
      };
    });

    return readingToStore;
  },

  addObservation: async (babyId, site, bilirubinValue, observerName, timestamp) => {
    const now = timestamp || new Date().toISOString();
    const clientOpId = 'obs_op_' + Date.now();
    const payload: Partial<ClinicalObservation> = {
      clientOperationId: clientOpId,
      babyId,
      site,
      observerName,
      clinicalNotes: '',
      bilirubinValue,
      timestamp: now,
    };

    const savedObs = await PatientsApi.createObservation(payload);
    const obsToStore: ClinicalObservation = savedObs || ({
      ...payload,
      id: 'obs_' + Date.now(),
      clinicalNotes: '',
      syncStatus: 'synced',
    } as ClinicalObservation);

    set((state) => ({ observations: [obsToStore, ...state.observations] }));
    return obsToStore;
  },

  updateObservation: (observationId, updates) => {
    set((state) => ({
      observations: state.observations.map((o) =>
        o.id === observationId ? { ...o, ...updates } : o
      ),
    }));
  },

  updateReading: (readingId, updates) => {
    set((state) => ({
      readings: state.readings.map((r) =>
        r.id === readingId ? { ...r, ...updates } : r
      ),
    }));
  },
}));
