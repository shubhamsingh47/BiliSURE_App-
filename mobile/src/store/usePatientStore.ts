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
  ) => Promise<ClinicalObservation>;
  updateObservation: (observationId: string, updates: { site?: string; bilirubinValue?: number }) => void;
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
      if (onlineBabies && onlineBabies.length > 0) {
        const finalBabies = onlineBabies;
        const currentSelected = get().selectedBaby;
        const activeBaby = currentSelected
          ? finalBabies.find((b) => b.id === currentSelected.id || b.uhid === currentSelected.uhid)
          : null;
        const effectiveBaby = activeBaby || finalBabies[0] || null;

        if (effectiveBaby) {
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
          set({
            babies: finalBabies,
            selectedBaby: null,
            readings: [],
            observations: [],
          });
        }
      } else if (onlineBabies && onlineBabies.length === 0 && get().babies.length === 0) {
        // Legitimate empty state
        set({
          babies: [],
          selectedBaby: null,
          readings: [],
          observations: [],
        });
      }
    } catch (err) {
      console.error('Error loading babies from backend:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  selectBaby: async (baby) => {
    set({ selectedBaby: baby });
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

  addReading: async (readingData) => {
    const activeBaby = get().selectedBaby || get().babies[0];
    if (!activeBaby) {
      throw new Error('No patient selected to record reading');
    }

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

    const payload: Partial<BilirubinReading> = {
      clientOperationId: clientOpId,
      babyId: activeBaby.id || (activeBaby as any)._id,
      babyUhid: activeBaby.uhid,
      value,
      valueMgDl: unit === 'µmol/L' ? Number((value / 17.1).toFixed(1)) : value,
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
    };

    const savedReading = await PatientsApi.createReading(payload);
    const readingToStore: BilirubinReading = savedReading || ({
      ...payload,
      id: 'rdg_' + Date.now(),
      syncStatus: 'synced',
    } as BilirubinReading);

    const updatedSeverity: SeverityState =
      riskLevel === 'high' ? 'critical' : riskLevel === 'intermediate' ? 'moderate' : 'normal';

    set((state) => {
      const updatedBabies = state.babies.map((b) =>
        b.id === activeBaby.id || b.uhid === activeBaby.uhid ? { ...b, severityState: updatedSeverity } : b
      );
      return {
        readings: [readingToStore, ...state.readings],
        babies: updatedBabies,
        selectedBaby: { ...activeBaby, severityState: updatedSeverity },
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
}));
