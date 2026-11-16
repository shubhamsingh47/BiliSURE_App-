import { create } from 'zustand';
import { Hospital, PTStation, Referral, Admission, InAppNotification, ReferralStatus, ReferralUrgency } from '../types';
import { apiClient } from '../services/api.client';

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
  startTreatmentSession: (admissionId: string, data: { phototherapyType?: string; irradianceMwCm2?: number; nurseName: string; notes?: string }) => Promise<void>;
  endTreatmentSession: (admissionId: string, sessionId: string, nurseName: string, notes?: string) => Promise<void>;
  approveDischarge: (admissionId: string, data: { doctorName: string; dischargeBilirubinValue: number; dischargeNotes?: string; followUpPlan?: string }) => Promise<void>;
  updateStationStatus: (stationId: string, status: any, meta?: any) => Promise<void>;
  registerStation: (stationData: any) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

// Initial realistic default state for seamless immediate mobile operation
const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp_001',
    _id: 'hosp_001',
    name: 'District Civil Hospital',
    code: 'DCH-01',
    type: 'receiving_hospital',
    district: 'Central District',
    address: 'Civil Lines, Main Medical Road',
    contactNumber: '+91-98765-11001',
    totalPTStations: 6,
    operationalPTStations: 5,
    occupiedPTStations: 2,
    availablePTStations: 3,
    lastAvailabilityUpdated: new Date().toISOString(),
  },
  {
    id: 'hosp_002',
    _id: 'hosp_002',
    name: 'Mother & Child Apex Hospital',
    code: 'MCAH-02',
    type: 'receiving_hospital',
    district: 'Central District',
    address: 'Sector 4, Healthcare Enclave',
    contactNumber: '+91-98765-11002',
    totalPTStations: 4,
    operationalPTStations: 4,
    occupiedPTStations: 1,
    availablePTStations: 3,
    lastAvailabilityUpdated: new Date().toISOString(),
  },
  {
    id: 'hosp_003',
    _id: 'hosp_003',
    name: 'St. Jude Neonatal Care Centre',
    code: 'SJNC-03',
    type: 'receiving_hospital',
    district: 'Central District',
    address: 'Near Old Bus Stand, North Wing',
    contactNumber: '+91-98765-11003',
    totalPTStations: 3,
    operationalPTStations: 2,
    occupiedPTStations: 1,
    availablePTStations: 1,
    lastAvailabilityUpdated: new Date().toISOString(),
  },
  {
    id: 'ref_001',
    _id: 'ref_001',
    name: 'North Community Health Centre (CHC)',
    code: 'NCHC-01',
    type: 'referring_centre',
    district: 'Central District',
    address: 'Village Rampur, North Block',
    contactNumber: '+91-98765-22001',
    totalPTStations: 0,
    operationalPTStations: 0,
    occupiedPTStations: 0,
    availablePTStations: 0,
    lastAvailabilityUpdated: new Date().toISOString(),
  },
  {
    id: 'ref_002',
    _id: 'ref_002',
    name: 'East Primary Health Centre (PHC)',
    code: 'EPHC-02',
    type: 'referring_centre',
    district: 'Central District',
    address: 'East Bypass Road',
    contactNumber: '+91-98765-22002',
    totalPTStations: 0,
    operationalPTStations: 0,
    occupiedPTStations: 0,
    availablePTStations: 0,
    lastAvailabilityUpdated: new Date().toISOString(),
  },
];

const INITIAL_STATIONS: PTStation[] = [
  {
    id: 'st_dch_01',
    stationId: 'PT-DCH-01',
    hospitalId: 'hosp_001',
    hospitalName: 'District Civil Hospital',
    name: 'Double LED Tunnel A1',
    type: 'led_tunnel',
    location: 'NICU Bed 1',
    operationalStatus: 'occupied',
    currentBabyId: 'baby_1',
    currentBabyName: 'Baby 1',
    currentBabyUhid: 'M1A2N3S4I5',
    lastCleanedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_dch_02',
    stationId: 'PT-DCH-02',
    hospitalId: 'hosp_001',
    hospitalName: 'District Civil Hospital',
    name: 'Double Surface LED A2',
    type: 'double_surface',
    location: 'NICU Bed 2',
    operationalStatus: 'occupied',
    currentBabyId: 'baby_2',
    currentBabyName: 'Baby 2',
    currentBabyUhid: 'B9C8D7E6F5',
    lastCleanedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_dch_03',
    stationId: 'PT-DCH-03',
    hospitalId: 'hosp_001',
    hospitalName: 'District Civil Hospital',
    name: 'Overhead Blue LED A3',
    type: 'single_surface',
    location: 'NICU Bed 3',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_dch_04',
    stationId: 'PT-DCH-04',
    hospitalId: 'hosp_001',
    hospitalName: 'District Civil Hospital',
    name: 'BiliBed Fiberoptic A4',
    type: 'fiberoptic_blanket',
    location: 'NICU Bed 4',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_dch_05',
    stationId: 'PT-DCH-05',
    hospitalId: 'hosp_001',
    hospitalName: 'District Civil Hospital',
    name: 'Double Surface LED A5',
    type: 'double_surface',
    location: 'SNCU Bed 1',
    operationalStatus: 'available',
    currentBabyId: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'st_dch_06',
    stationId: 'PT-DCH-06',
    hospitalId: 'hosp_001',
    hospitalName: 'District Civil Hospital',
    name: 'Overhead Blue LED A6',
    type: 'single_surface',
    location: 'SNCU Bed 2',
    operationalStatus: 'maintenance',
    currentBabyId: null,
    notes: 'Lamp sensor replacement scheduled',
    lastCleanedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
];

const INITIAL_REFERRALS: Referral[] = [
  {
    id: 'ref_001',
    referralId: 'REF-2026-0081',
    babyId: 'baby_1',
    babyName: 'Baby 1',
    babyUhid: 'M1A2N3S4I5',
    dateOfBirth: new Date(Date.now() - 3600000 * 48).toISOString(),
    gestationalAgeWeeks: 38,
    referringDoctorName: 'Dr. Priya Sharma',
    referringCentreName: 'North Community Health Centre (CHC)',
    receivingHospitalId: 'hosp_001',
    receivingHospitalName: 'District Civil Hospital',
    status: 'accepted',
    urgency: 'urgent',
    clinicalSummary: 'Rapidly rising TSB. Icterus to palms & soles. Recommended for double surface phototherapy.',
    latestBilirubinValue: 14.8,
    latestBilirubinUnit: 'mg/dL',
    latestBhutaniRiskZone: 'high_intermediate',
    postnatalAgeHoursAtReferral: 48,
    phototherapyRecommended: true,
    reviewedByDoctorName: 'Dr. Rajesh Verma (Neonatologist)',
    reviewedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'ref_002',
    referralId: 'REF-2026-0082',
    babyId: 'baby_2',
    babyName: 'Baby 2',
    babyUhid: 'B9C8D7E6F5',
    dateOfBirth: new Date(Date.now() - 3600000 * 36).toISOString(),
    gestationalAgeWeeks: 37,
    referringDoctorName: 'Dr. Priya Sharma',
    referringCentreName: 'East Primary Health Centre (PHC)',
    receivingHospitalId: 'hosp_001',
    receivingHospitalName: 'District Civil Hospital',
    status: 'pending',
    urgency: 'emergency',
    clinicalSummary: 'Serum bilirubin 17.5 mg/dL at 36h (High Risk Zone). Scleral icterus, poor feeding.',
    latestBilirubinValue: 17.5,
    latestBilirubinUnit: 'mg/dL',
    latestBhutaniRiskZone: 'high',
    postnatalAgeHoursAtReferral: 36,
    phototherapyRecommended: true,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

const INITIAL_ADMISSIONS: Admission[] = [
  {
    id: 'adm_001',
    admissionId: 'ADM-2026-0041',
    babyId: 'baby_1',
    babyUhid: 'M1A2N3S4I5',
    babyName: 'Baby 1',
    hospitalId: 'hosp_001',
    hospitalName: 'District Civil Hospital',
    referralId: 'ref_001',
    physicalArrivalConfirmed: true,
    arrivalConfirmedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    arrivalConfirmedBy: 'Nurse Sunita',
    ptStationId: 'st_dch_01',
    ptStationName: 'Double LED Tunnel A1 (PT-DCH-01)',
    admittedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    admissionStatus: 'under_treatment',
    assignedDoctor: 'Dr. Rajesh Verma',
    primaryNurse: 'Nurse Sunita',
    initialAdmissionBilirubin: 14.8,
    treatmentSessions: [
      {
        sessionId: 'sess_001',
        startTime: new Date(Date.now() - 3600000 * 18).toISOString(),
        endTime: new Date(Date.now() - 3600000 * 6).toISOString(),
        durationMinutes: 720,
        phototherapyType: 'Double Surface LED Tunnel',
        irradianceMwCm2: 35,
        nurseName: 'Nurse Sunita',
        notes: 'Session 1 completed. Eye shields placed.',
        status: 'completed',
      },
      {
        sessionId: 'sess_002',
        startTime: new Date(Date.now() - 3600000 * 4).toISOString(),
        phototherapyType: 'Double Surface LED Tunnel',
        irradianceMwCm2: 35,
        nurseName: 'Nurse Sunita',
        notes: 'Session 2 in progress.',
        status: 'active',
      },
    ],
    stationReleased: false,
  },
];

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif_1',
    title: 'Urgent Referral: Baby 2 (B9C8D7E6F5)',
    message: 'High Risk Zone (17.5 mg/dL at 36h) from East PHC. Immediate review requested.',
    type: 'referral_created',
    relatedBabyUhid: 'B9C8D7E6F5',
    relatedReferralId: 'REF-2026-0082',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'notif_2',
    title: 'Referral Accepted: Baby 1',
    message: 'District Civil Hospital accepted Baby 1 (M1A2N3S4I5). Neonatal transport confirmed.',
    type: 'referral_accepted',
    relatedBabyUhid: 'M1A2N3S4I5',
    relatedReferralId: 'REF-2026-0081',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const useNetworkStore = create<NetworkState>((set, get) => ({
  hospitals: INITIAL_HOSPITALS,
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
      urgency: data.urgency || 'urgent',
      clinicalSummary: data.clinicalSummary || 'Bilirubin elevated. Transferred for hospital phototherapy evaluation.',
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
      babyName: ref?.babyName || 'Baby',
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
    const targetStation = get().stations.find((s) => s.id === stationId || s.stationId === stationId);
    const admission = get().admissions.find((a) => a.id === admissionId || a.admissionId === admissionId);

    // Update station to occupied
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId || s.stationId === stationId
          ? {
              ...s,
              operationalStatus: 'occupied',
              currentBabyId: admission?.babyId,
              currentBabyName: admission?.babyName,
              currentBabyUhid: admission?.babyUhid,
              allocatedAt: new Date().toISOString(),
            }
          : s
      ),
      admissions: state.admissions.map((a) =>
        a.id === admissionId || a.admissionId === admissionId
          ? {
              ...a,
              ptStationId: stationId,
              ptStationName: `${targetStation?.name || 'PT Station'} (${targetStation?.stationId || stationId})`,
              admissionStatus: 'under_treatment',
            }
          : a
      ),
      hospitals: state.hospitals.map((h) =>
        h.id === targetStation?.hospitalId
          ? {
              ...h,
              occupiedPTStations: h.occupiedPTStations + 1,
              availablePTStations: Math.max(0, h.availablePTStations - 1),
            }
          : h
      ),
    }));

    apiClient.post(`/admissions/${admissionId}/allocate-station`, { stationId, nurseName }).catch(() => {});
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

  approveDischarge: async (admissionId, data) => {
    const admission = get().admissions.find((a) => a.id === admissionId || a.admissionId === admissionId);

    set((state) => ({
      admissions: state.admissions.map((a) =>
        a.id === admissionId || a.admissionId === admissionId
          ? {
              ...a,
              admissionStatus: 'discharged',
              dischargeApprovedByDoctor: data.doctorName,
              dischargeApprovedAt: new Date().toISOString(),
              dischargeBilirubinValue: data.dischargeBilirubinValue,
              dischargeNotes: data.dischargeNotes,
              followUpPlan: data.followUpPlan,
              dischargedAt: new Date().toISOString(),
              stationReleased: true,
            }
          : a
      ),
      // Release station to cleaning_prep
      stations: state.stations.map((s) =>
        s.id === admission?.ptStationId || s.stationId === admission?.ptStationId
          ? {
              ...s,
              operationalStatus: 'cleaning_prep',
              currentBabyId: null,
              currentBabyName: null,
              currentBabyUhid: null,
              notes: `Freed upon discharge of ${admission?.babyName}. Ready for sanitization.`,
            }
          : s
      ),
      hospitals: state.hospitals.map((h) =>
        h.id === admission?.hospitalId
          ? {
              ...h,
              occupiedPTStations: Math.max(0, h.occupiedPTStations - 1),
            }
          : h
      ),
    }));

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

      // Recalculate capacity
      const targetStation = state.stations.find((s) => s.id === stationId || s.stationId === stationId);
      const hospitalId = targetStation?.hospitalId;
      const hospitalStations = updatedStations.filter((s) => s.hospitalId === hospitalId);
      const operational = hospitalStations.filter((s) => s.operationalStatus !== 'maintenance' && s.operationalStatus !== 'out_of_service').length;
      const occupied = hospitalStations.filter((s) => s.operationalStatus === 'occupied').length;
      const available = Math.max(0, operational - occupied);

      return {
        stations: updatedStations,
        hospitals: state.hospitals.map((h) =>
          h.id === hospitalId
            ? { ...h, operationalPTStations: operational, occupiedPTStations: occupied, availablePTStations: available }
            : h
        ),
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

    set((state) => ({
      stations: [...state.stations, newStation],
      hospitals: state.hospitals.map((h) =>
        h.id === stationData.hospitalId
          ? {
              ...h,
              totalPTStations: h.totalPTStations + 1,
              operationalPTStations: h.operationalPTStations + 1,
              availablePTStations: h.availablePTStations + 1,
            }
          : h
      ),
    }));

    apiClient.post(`/hospitals/${stationData.hospitalId}/stations`, stationData).catch(() => {});
  },

  markNotificationRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id || n._id === id ? { ...n, isRead: true } : n)),
    }));
    apiClient.patch(`/notifications/${id}/read`).catch(() => {});
  },
}));
