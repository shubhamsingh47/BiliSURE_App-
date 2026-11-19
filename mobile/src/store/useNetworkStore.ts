import { create } from 'zustand';
import { Hospital, PTStation, Referral, Admission, TreatmentSession, InAppNotification, ReferralStatus, ReferralUrgency, Baby } from '../types';
import { apiClient } from '../services/api.client';
import { usePatientStore } from './usePatientStore';

interface NetworkState {
  hospitals: Hospital[];
  stations: PTStation[];
  referrals: Referral[];
  admissions: Admission[];
  notifications: InAppNotification[];
  districtMetrics: any | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadNetworkData: () => Promise<void>;
  createReferral: (data: Partial<Referral>) => Promise<Referral>;
  acceptReferral: (referralId: string, doctorName: string) => Promise<Referral>;
  rejectReferral: (referralId: string, reason: string, doctorName: string) => Promise<Referral>;
  confirmArrival: (referralId: string, nurseName: string, hospitalId: string) => Promise<Admission>;
  allocateStation: (admissionId: string, stationId: string, nurseName: string) => Promise<void>;
  allocateBabyToStation: (baby: Baby, stationId: string, nurseName: string) => Promise<void>;
  startTreatmentSession: (admissionId: string, data: { phototherapyType?: string; irradianceMwCm2?: number; nurseName: string; notes?: string }) => Promise<void>;
  endTreatmentSession: (admissionId: string, sessionId: string, nurseName: string, notes?: string) => Promise<void>;
  logTreatmentSession: (admissionId: string, data: { startTime: string; endTime: string; durationMinutes: number; phototherapyType?: string; nurseName: string; notes?: string }) => Promise<void>;
  approveDischarge: (admissionId: string, data: { doctorName: string; dischargeBilirubinValue: number; dischargeNotes?: string; followUpPlan?: string }) => Promise<void>;
  updateAdmission: (admissionId: string, updates: Partial<Admission>) => Promise<void>;
  updateTreatmentSession: (admissionId: string, sessionId: string, updates: Partial<TreatmentSession>) => Promise<void>;
  updateStationStatus: (stationId: string, status: any, meta?: any) => Promise<void>;
  registerStation: (stationData: any) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

// Initial realistic default state for seamless immediate mobile operation
const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp_pgi',
    _id: 'hosp_pgi',
    name: 'PGI',
    code: 'PGI-01',
    type: 'receiving_hospital',
    district: 'Lucknow District',
    address: 'Raebareli Road, Lucknow',
    contactNumber: '+91-522-2668700',
    totalPTStations: 10,
    operationalPTStations: 8,
    occupiedPTStations: 4,
    availablePTStations: 4,
    lastAvailabilityUpdated: new Date().toISOString(),
  },
  {
    id: 'hosp_rml',
    _id: 'hosp_rml',
    name: 'RML',
    code: 'RML-02',
    type: 'receiving_hospital',
    district: 'Lucknow District',
    address: 'Vibhuti Khand, Gomti Nagar, Lucknow',
    contactNumber: '+91-522-6692000',
    totalPTStations: 8,
    operationalPTStations: 7,
    occupiedPTStations: 2,
    availablePTStations: 5,
    lastAvailabilityUpdated: new Date().toISOString(),
  },
  {
    id: 'hosp_kgmu',
    _id: 'hosp_kgmu',
    name: 'KGMU',
    code: 'KGMU-03',
    type: 'receiving_hospital',
    district: 'Lucknow District',
    address: 'Shah Mina Road, Chowk, Lucknow',
    contactNumber: '+91-522-2257450',
    totalPTStations: 12,
    operationalPTStations: 10,
    occupiedPTStations: 5,
    availablePTStations: 5,
    lastAvailabilityUpdated: new Date().toISOString(),
  },
];

const INITIAL_STATIONS: PTStation[] = [
  {
    id: 'st_pgi_01',
    stationId: 'PT-PGI-01',
    hospitalId: 'hosp_pgi',
    hospitalName: 'PGI',
    name: 'BED 1',
    type: 'led_tunnel',
    location: 'NICU Bed 1',
    operationalStatus: 'available',
    currentBabyId: null,
    currentBabyName: null,
    currentBabyUhid: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_pgi_02',
    stationId: 'PT-PGI-02',
    hospitalId: 'hosp_pgi',
    hospitalName: 'PGI',
    name: 'BED 2',
    type: 'double_surface',
    location: 'NICU Bed 2',
    operationalStatus: 'available',
    currentBabyId: null,
    currentBabyName: null,
    currentBabyUhid: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_pgi_03',
    stationId: 'PT-PGI-03',
    hospitalId: 'hosp_pgi',
    hospitalName: 'PGI',
    name: 'BED 3',
    type: 'single_surface',
    location: 'NICU Bed 3',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_pgi_04',
    stationId: 'PT-PGI-04',
    hospitalId: 'hosp_pgi',
    hospitalName: 'PGI',
    name: 'BED 4',
    type: 'fiberoptic_blanket',
    location: 'NICU Bed 4',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_pgi_05',
    stationId: 'PT-PGI-05',
    hospitalId: 'hosp_pgi',
    hospitalName: 'PGI',
    name: 'BED 5',
    type: 'double_surface',
    location: 'SNCU Bed 1',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_pgi_06',
    stationId: 'PT-PGI-06',
    hospitalId: 'hosp_pgi',
    hospitalName: 'PGI',
    name: 'BED 6',
    type: 'single_surface',
    location: 'SNCU Bed 2',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  // RML (hosp_rml) Stations
  {
    id: 'st_rml_01',
    stationId: 'PT-RML-01',
    hospitalId: 'hosp_rml',
    hospitalName: 'RML',
    name: 'BED 7',
    type: 'double_surface',
    location: 'NICU Pod 1',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_rml_02',
    stationId: 'PT-RML-02',
    hospitalId: 'hosp_rml',
    hospitalName: 'RML',
    name: 'BED 8',
    type: 'led_tunnel',
    location: 'NICU Pod 2',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_rml_03',
    stationId: 'PT-RML-03',
    hospitalId: 'hosp_rml',
    hospitalName: 'RML',
    name: 'BED 9',
    type: 'single_surface',
    location: 'NICU Pod 3',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_rml_04',
    stationId: 'PT-RML-04',
    hospitalId: 'hosp_rml',
    hospitalName: 'RML',
    name: 'BED 10',
    type: 'fiberoptic_blanket',
    location: 'NICU Pod 4',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  // KGMU (hosp_kgmu) Stations
  {
    id: 'st_kgmu_01',
    stationId: 'PT-KGMU-01',
    hospitalId: 'hosp_kgmu',
    hospitalName: 'KGMU',
    name: 'BED 11',
    type: 'double_surface',
    location: 'Care Unit 1',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_kgmu_02',
    stationId: 'PT-KGMU-02',
    hospitalId: 'hosp_kgmu',
    hospitalName: 'KGMU',
    name: 'BED 12',
    type: 'single_surface',
    location: 'Care Unit 2',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_kgmu_03',
    stationId: 'PT-KGMU-03',
    hospitalId: 'hosp_kgmu',
    hospitalName: 'KGMU',
    name: 'BED 13',
    type: 'fiberoptic_blanket',
    location: 'Care Unit 3',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
];

/**
 * Derives true real-time hospital capacity metrics from physical station ground truth.
 * Available = operational stations that are currently marked 'available'
 */
export const recalculateHospitalCapacity = (hospitals: Hospital[], stations: PTStation[]): Hospital[] => {
  return hospitals.map((h) => {
    const hospStations = stations.filter((s) => s.hospitalId === h.id || s.hospitalId === h._id);
    if (hospStations.length === 0) return h;
    const total = hospStations.length;
    const operational = hospStations.filter((s) => s.operationalStatus !== 'maintenance' && s.operationalStatus !== 'out_of_service').length;
    const occupied = hospStations.filter((s) => s.operationalStatus === 'occupied').length;
    const available = hospStations.filter((s) => s.operationalStatus === 'available').length;
    return {
      ...h,
      totalPTStations: total,
      operationalPTStations: operational,
      occupiedPTStations: occupied,
      availablePTStations: available,
      lastAvailabilityUpdated: new Date().toISOString(),
    };
  });
};

const INITIAL_REFERRALS: Referral[] = [];

const INITIAL_ADMISSIONS: Admission[] = [];

const INITIAL_NOTIFICATIONS: InAppNotification[] = [];

export const useNetworkStore = create<NetworkState>((set, get) => ({
  hospitals: recalculateHospitalCapacity(INITIAL_HOSPITALS, INITIAL_STATIONS),
  stations: INITIAL_STATIONS,
  referrals: INITIAL_REFERRALS,
  admissions: INITIAL_ADMISSIONS,
  notifications: INITIAL_NOTIFICATIONS,
  districtMetrics: null,
  isLoading: false,
  error: null,

  loadNetworkData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [hospRes, refRes, admRes, notifRes, distRes] = await Promise.allSettled([
        apiClient.get('/hospitals'),
        apiClient.get('/referrals'),
        apiClient.get('/admissions'),
        apiClient.get('/notifications'),
        apiClient.get('/district/overview'),
      ]);

      if (hospRes.status === 'fulfilled' && hospRes.value.data.data) {
        set({ hospitals: hospRes.value.data.data });
      }
      if (refRes.status === 'fulfilled' && refRes.value.data.data) {
        set({ referrals: refRes.value.data.data });
      }
      if (admRes.status === 'fulfilled' && admRes.value.data.data) {
        set({ admissions: admRes.value.data.data });
      }
      if (notifRes.status === 'fulfilled' && notifRes.value.data.data) {
        set({ notifications: notifRes.value.data.data });
      }
      if (distRes.status === 'fulfilled' && distRes.value.data.data) {
        set({ districtMetrics: distRes.value.data.data });
      }
    } catch (err: any) {
      set({ error: err?.message || 'Error loading network data' });
    } finally {
      set({ isLoading: false });
    }
  },

  createReferral: async (data) => {
    const newRef: Referral = {
      id: 'ref_' + Date.now(),
      referralId: `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      babyId: data.babyId || 'baby_unknown',
      babyName: data.babyName || 'Newborn Patient',
      babyUhid: data.babyUhid || 'UHID-0000',
      dateOfBirth: data.dateOfBirth || new Date().toISOString(),
      gestationalAgeWeeks: data.gestationalAgeWeeks || 38,
      referringDoctorName: data.referringDoctorName || 'Dr. Referring Doctor',
      referringCentreName: data.referringCentreName || 'Community Health Centre',
      receivingHospitalId: data.receivingHospitalId || 'hosp_001',
      receivingHospitalName: data.receivingHospitalName || 'District Civil Hospital',
      status: 'pending',
      urgency: data.urgency || 'routine',
      clinicalSummary: data.clinicalSummary || '',
      latestBilirubinValue: data.latestBilirubinValue || 15.0,
      latestBilirubinUnit: data.latestBilirubinUnit || 'mg/dL',
      latestBhutaniRiskZone: data.latestBhutaniRiskZone || 'high_intermediate',
      postnatalAgeHoursAtReferral: data.postnatalAgeHoursAtReferral || 40,
      phototherapyRecommended: true,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      referrals: [newRef, ...state.referrals],
      notifications: [
        {
          id: 'notif_' + Date.now(),
          title: `Referral Sent: ${newRef.babyName}`,
          message: `Referral sent to ${newRef.receivingHospitalName}. Status: Pending review.`,
          type: 'referral_created',
          relatedBabyUhid: newRef.babyUhid,
          relatedReferralId: newRef.referralId,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    }));

    // Update baby in patient store so Babies page card immediately greys out and shows "Referred to [Hospital]"
    if (newRef.babyUhid && newRef.receivingHospitalName) {
      usePatientStore.getState().markBabyAsReferred(newRef.babyUhid, newRef.receivingHospitalName);
    }

    apiClient.post('/referrals', newRef).catch(() => {});
    return newRef;
  },

  acceptReferral: async (referralId, doctorName) => {
    set((state) => ({
      referrals: state.referrals.map((r) =>
        r.referralId === referralId || r.id === referralId
          ? { ...r, status: 'accepted', reviewedByDoctorName: doctorName, reviewedAt: new Date().toISOString() }
          : r
      ),
    }));

    apiClient.patch(`/referrals/${referralId}/accept`, { doctorName }).catch(() => {});
    const updated = get().referrals.find((r) => r.referralId === referralId || r.id === referralId)!;
    return updated;
  },

  rejectReferral: async (referralId, reason, doctorName) => {
    set((state) => ({
      referrals: state.referrals.map((r) =>
        r.referralId === referralId || r.id === referralId
          ? { ...r, status: 'rejected', rejectionReason: reason, reviewedByDoctorName: doctorName, reviewedAt: new Date().toISOString() }
          : r
      ),
    }));

    apiClient.patch(`/referrals/${referralId}/reject`, { reason, doctorName }).catch(() => {});
    const updated = get().referrals.find((r) => r.referralId === referralId || r.id === referralId)!;
    return updated;
  },

  confirmArrival: async (referralId, nurseName, hospitalId) => {
    const ref = get().referrals.find((r) => r.referralId === referralId || r.id === referralId);
    const admissionId = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAdm: Admission = {
      id: 'adm_' + Date.now(),
      admissionId,
      babyId: ref?.babyId || 'baby_unknown',
      babyUhid: ref?.babyUhid || 'UHID-0000',
      babyName: ref?.babyName || 'Newborn Patient',
      hospitalId,
      hospitalName: ref?.receivingHospitalName || 'District Civil Hospital',
      referralId: ref?.referralId,
      physicalArrivalConfirmed: true,
      arrivalConfirmedAt: new Date().toISOString(),
      arrivalConfirmedBy: nurseName,
      admittedAt: new Date().toISOString(),
      admissionStatus: 'admitted',
      assignedDoctor: 'Dr. Rajesh Verma',
      primaryNurse: nurseName,
      initialAdmissionBilirubin: ref?.latestBilirubinValue || 15.0,
      treatmentSessions: [],
      stationReleased: false,
    };

    set((state) => ({
      admissions: [newAdm, ...state.admissions],
      referrals: state.referrals.map((r) =>
        r.referralId === referralId ? { ...r, status: 'arrived', arrivedAt: new Date().toISOString() } : r
      ),
    }));

    apiClient.post('/admissions/confirm-arrival', { referralId, nurseName, hospitalId }).catch(() => {});
    return newAdm;
  },

  allocateStation: async (admissionId, stationId, nurseName) => {
    const state = get();
    const targetStation = state.stations.find((s) => s.id === stationId || s.stationId === stationId);
    const admission = state.admissions.find((a) => a.id === admissionId || a.admissionId === admissionId);

    if (!targetStation) {
      throw new Error('Station not found');
    }
    if (!admission) {
      throw new Error('Admission record not found');
    }

    if (targetStation.operationalStatus === 'occupied') {
      throw new Error(`Station ${targetStation.stationId} is already occupied by ${targetStation.currentBabyName || 'another patient'}`);
    }

    // STRICT DEFENSE: One UHID patient once allotted to a station cannot get another!
    const alreadyAllocated = state.stations.find(
      (s) =>
        s.operationalStatus === 'occupied' &&
        ((admission.babyUhid && s.currentBabyUhid === admission.babyUhid) ||
         (admission.babyId && s.currentBabyId === admission.babyId))
    );
    if (alreadyAllocated) {
      throw new Error(`Patient ${admission.babyName} (${admission.babyUhid}) is already allocated to station ${alreadyAllocated.stationId}`);
    }

    if (admission.ptStationId) {
      throw new Error(`Admission ${admission.admissionId} already has an active PT station assigned.`);
    }

    const updatedStations = state.stations.map((s) =>
      s.id === stationId || s.stationId === stationId
        ? {
            ...s,
            operationalStatus: 'occupied' as const,
            currentBabyId: admission.babyId,
            currentBabyName: admission.babyName,
            currentBabyUhid: admission.babyUhid,
            allocatedAt: new Date().toISOString(),
          }
        : s
    );

    const updatedAdmissions = state.admissions.map((a) =>
      a.id === admissionId || a.admissionId === admissionId
        ? {
            ...a,
            hospitalId: targetStation.hospitalId,
            hospitalName: targetStation.hospitalName,
            ptStationId: stationId,
            ptStationName: `${targetStation.name} (${targetStation.stationId})`,
            admissionStatus: 'under_treatment' as const,
          }
        : a
    );

    set({
      stations: updatedStations,
      admissions: updatedAdmissions,
      hospitals: recalculateHospitalCapacity(state.hospitals, updatedStations),
    });

    apiClient.post(`/admissions/${admissionId}/allocate-station`, { stationId, nurseName }).catch(() => {});
  },

  allocateBabyToStation: async (baby, stationId, nurseName) => {
    const state = get();
    const targetStation = state.stations.find((s) => s.id === stationId || s.stationId === stationId);
    if (!targetStation) throw new Error('Station not found');
    if (targetStation.operationalStatus === 'occupied') {
      throw new Error(`Station ${targetStation.stationId} is already occupied by ${targetStation.currentBabyName || 'another patient'}`);
    }

    const babyName = baby.parentsName?.trim() || baby.name;
    const babyUhid = baby.uhid;

    // Check if baby is already allocated to any active station
    const alreadyAllocated = state.stations.find(
      (s) =>
        s.operationalStatus === 'occupied' &&
        ((babyUhid && s.currentBabyUhid === babyUhid) || (baby.id && s.currentBabyId === baby.id))
    );
    if (alreadyAllocated) {
      throw new Error(`Patient ${babyName} (${babyUhid}) is already allocated to station ${alreadyAllocated.stationId}`);
    }

    // Check if there is an existing admission or create one
    let admission = state.admissions.find(
      (a) => (babyUhid && a.babyUhid === babyUhid) || (baby.id && a.babyId === baby.id)
    );

    if (admission) {
      await state.allocateStation(admission.id || admission.admissionId, stationId, nurseName);
    } else {
      const newAdmId = 'adm_' + Date.now();
      const newAdmCode = 'ADM-' + Math.floor(10000 + Math.random() * 90000);
      // Dynamic baseline TSB from baby card / first reading (never hardcoded 14.5)
      let resolvedInitialBili: number | undefined = undefined;
      if (baby.initialValue && baby.initialValue > 0) {
        resolvedInitialBili = baby.initialValue;
      }

      const newAdmission: Admission = {
        id: newAdmId,
        admissionId: newAdmCode,
        babyId: baby.id,
        babyUhid: baby.uhid,
        babyName,
        hospitalId: targetStation.hospitalId,
        hospitalName: targetStation.hospitalName,
        admissionStatus: 'under_treatment',
        admittedAt: new Date().toISOString(),
        physicalArrivalConfirmed: true,
        stationReleased: false,
        assignedDoctor: 'Attending Pediatrician',
        primaryNurse: nurseName,
        ptStationId: stationId,
        ptStationName: `${targetStation.name} (${targetStation.stationId})`,
        initialAdmissionBilirubin: resolvedInitialBili,
        treatmentSessions: [],
      };

      const updatedStations = state.stations.map((s) =>
        s.id === stationId || s.stationId === stationId
          ? {
              ...s,
              operationalStatus: 'occupied' as const,
              currentBabyId: baby.id,
              currentBabyName: babyName,
              currentBabyUhid: baby.uhid,
              allocatedAt: new Date().toISOString(),
            }
          : s
      );

      set({
        admissions: [newAdmission, ...state.admissions],
        stations: updatedStations,
        hospitals: recalculateHospitalCapacity(state.hospitals, updatedStations),
      });
    }
  },

  startTreatmentSession: async (admissionId, data) => {
    const newSession = {
      sessionId: 'sess_' + Date.now(),
      startTime: new Date().toISOString(),
      phototherapyType: data.phototherapyType || 'Double Surface High-Intensity LED',
      irradianceMwCm2: data.irradianceMwCm2 || 35,
      nurseName: data.nurseName,
      notes: data.notes || 'Phototherapy initiated under continuous monitoring.',
      status: 'active' as const,
    };

    set((state) => ({
      admissions: state.admissions.map((a) =>
        a.id === admissionId || a.admissionId === admissionId
          ? {
              ...a,
              admissionStatus: 'under_treatment',
              treatmentSessions: [
                ...a.treatmentSessions.map((s) => (s.status === 'active' ? { ...s, status: 'completed' as const, endTime: new Date().toISOString() } : s)),
                newSession,
              ],
            }
          : a
      ),
    }));

    apiClient.post(`/admissions/${admissionId}/sessions/start`, data).catch(() => {});
  },

  endTreatmentSession: async (admissionId, sessionId, nurseName, notes) => {
    set((state) => ({
      admissions: state.admissions.map((a) => {
        if (a.id !== admissionId && a.admissionId !== admissionId) return a;
        return {
          ...a,
          treatmentSessions: a.treatmentSessions.map((s) => {
            if (s.sessionId !== sessionId) return s;
            const end = new Date();
            const start = new Date(s.startTime);
            const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
            return {
              ...s,
              status: 'completed',
              endTime: end.toISOString(),
              durationMinutes: duration,
              notes: (s.notes ? s.notes + ' | ' : '') + (notes || 'Completed cycle'),
            };
          }),
        };
      }),
    }));

    apiClient.post(`/admissions/${admissionId}/sessions/${sessionId}/end`, { nurseName, notes }).catch(() => {});
  },

  logTreatmentSession: async (admissionId, data) => {
    const targetAdmission = get().admissions.find((a) => a.id === admissionId || a.admissionId === admissionId);
    const newSession = {
      sessionId: 'sess_' + Date.now(),
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      phototherapyType: data.phototherapyType || 'Double Surface High-Intensity LED',
      nurseName: data.nurseName,
      notes: data.notes || '',
      status: 'completed' as const,
    };

    set((state) => ({
      admissions: state.admissions.map((a) =>
        a.id === admissionId || a.admissionId === admissionId
          ? {
              ...a,
              admissionStatus: 'under_treatment' as const,
              treatmentSessions: [...a.treatmentSessions, newSession],
            }
          : a
      ),
    }));

    apiClient
      .post(`/admissions/${admissionId}/sessions/log`, {
        ...data,
        babyId: targetAdmission?.babyId,
        babyUhid: targetAdmission?.babyUhid,
        babyName: targetAdmission?.babyName,
      })
      .catch(() => {});
  },

  updateAdmission: async (admissionId, updates) => {
    set((state) => ({
      admissions: state.admissions.map((a) =>
        a.id === admissionId || a.admissionId === admissionId ? { ...a, ...updates } : a
      ),
    }));
  },

  updateTreatmentSession: async (admissionId, sessionId, updates) => {
    set((state) => ({
      admissions: state.admissions.map((a) =>
        a.id === admissionId || a.admissionId === admissionId
          ? {
              ...a,
              treatmentSessions: a.treatmentSessions.map((s) =>
                s.sessionId === sessionId ? { ...s, ...updates } : s
              ),
            }
          : a
      ),
    }));

    apiClient.patch(`/admissions/${admissionId}/sessions/${sessionId}`, updates).catch(() => {});
  },

  approveDischarge: async (admissionId, data) => {
    const admission = get().admissions.find((a) => a.id === admissionId || a.admissionId === admissionId);

    set((state) => {
      const updatedAdmissions = state.admissions.map((a) =>
        a.id === admissionId || a.admissionId === admissionId
          ? {
              ...a,
              admissionStatus: 'discharged' as const,
              dischargeApprovedByDoctor: data.doctorName,
              dischargeApprovedAt: new Date().toISOString(),
              dischargeBilirubinValue: data.dischargeBilirubinValue,
              dischargeNotes: data.dischargeNotes,
              followUpPlan: data.followUpPlan,
              dischargedAt: new Date().toISOString(),
              stationReleased: true,
            }
          : a
      );

      // Release station to cleaning_prep
      const updatedStations = state.stations.map((s) =>
        s.id === admission?.ptStationId || s.stationId === admission?.ptStationId
          ? {
              ...s,
              operationalStatus: 'cleaning_prep' as const,
              currentBabyId: null,
              currentBabyName: null,
              currentBabyUhid: null,
              notes: `Freed upon discharge of ${admission?.babyName}. Ready for sanitization.`,
            }
          : s
      );

      // Update matching referral for this baby to completed
      const updatedReferrals = state.referrals.map((r) =>
        r.referralId === admission?.referralId ||
        r.id === admission?.referralId ||
        (admission?.babyUhid && r.babyUhid === admission.babyUhid) ||
        (admission?.babyId && r.babyId === admission.babyId)
          ? { ...r, status: 'completed' as const }
          : r
      );

      return {
        admissions: updatedAdmissions,
        stations: updatedStations,
        referrals: updatedReferrals,
        hospitals: recalculateHospitalCapacity(state.hospitals, updatedStations),
      };
    });

    apiClient.post(`/admissions/${admissionId}/discharge`, data).catch(() => {});
  },

  updateStationStatus: async (stationId, status, meta) => {
    set((state) => {
      const updatedStations = state.stations.map((s) => {
        if (s.id !== stationId && s.stationId !== stationId) return s;
        return {
          ...s,
          operationalStatus: status,
          currentBabyId: status === 'occupied' ? meta?.babyId : null,
          currentBabyName: status === 'occupied' ? meta?.babyName : null,
          currentBabyUhid: status === 'occupied' ? meta?.babyUhid : null,
          lastCleanedAt: status === 'available' ? new Date().toISOString() : s.lastCleanedAt,
          notes: meta?.notes !== undefined ? meta.notes : s.notes,
          lastUpdated: new Date().toISOString(),
        };
      });

      return {
        stations: updatedStations,
        hospitals: recalculateHospitalCapacity(state.hospitals, updatedStations),
      };
    });

    apiClient.patch(`/hospitals/hosp_001/stations/${stationId}/status`, { status, ...meta }).catch(() => {});
  },

  registerStation: async (stationData) => {
    const newStation: PTStation = {
      id: 'st_' + Date.now(),
      stationId: stationData.stationId.toUpperCase(),
      hospitalId: stationData.hospitalId,
      hospitalName: stationData.hospitalName || 'District Civil Hospital',
      name: stationData.name,
      type: stationData.type || 'double_surface',
      location: stationData.location || 'NICU Ward',
      operationalStatus: 'available',
      lastCleanedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    set((state) => {
      const updatedStations = [...state.stations, newStation];
      return {
        stations: updatedStations,
        hospitals: recalculateHospitalCapacity(state.hospitals, updatedStations),
      };
    });

    apiClient.post(`/hospitals/${stationData.hospitalId}/stations`, stationData).catch(() => {});
  },

  markNotificationRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id || n._id === id ? { ...n, isRead: true } : n)),
    }));
    apiClient.patch(`/notifications/${id}/read`).catch(() => {});
  },
}));
