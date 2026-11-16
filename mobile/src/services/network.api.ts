import { apiClient } from './api.client';
import { Hospital, PTStation, Referral, Admission, InAppNotification } from '../types';

export const NetworkApi = {
  // --- Hospitals & PT Capacity ---
  async getHospitals(type?: 'referring_centre' | 'receiving_hospital'): Promise<Hospital[]> {
    try {
      const res = await apiClient.get('/hospitals', { params: { type } });
      return res.data.data;
    } catch {
      return [];
    }
  },

  async getHospitalById(id: string): Promise<Hospital | null> {
    try {
      const res = await apiClient.get(`/hospitals/${id}`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  async getStations(hospitalId: string): Promise<PTStation[]> {
    try {
      const res = await apiClient.get(`/hospitals/${hospitalId}/stations`);
      return res.data.data;
    } catch {
      return [];
    }
  },

  async updateStationStatus(
    hospitalId: string,
    stationId: string,
    status: string,
    meta?: { babyId?: string; babyName?: string; babyUhid?: string; notes?: string }
  ): Promise<PTStation | null> {
    try {
      const res = await apiClient.patch(`/hospitals/${hospitalId}/stations/${stationId}/status`, {
        status,
        ...meta,
      });
      return res.data.data;
    } catch {
      return null;
    }
  },

  async togglePauseReferrals(
    hospitalId: string,
    isPaused: boolean,
    reason?: string
  ): Promise<Hospital | null> {
    try {
      const res = await apiClient.patch(`/hospitals/${hospitalId}/pause-referrals`, {
        isPaused,
        reason,
      });
      return res.data.data;
    } catch {
      return null;
    }
  },

  // --- Capacity Reservations ---
  async createReservation(data: {
    referralId: string;
    hospitalId: string;
    durationMinutes?: number;
    stationId?: string;
    stationName?: string;
    reservedBy?: string;
  }) {
    try {
      const res = await apiClient.post('/reservations', data);
      return res.data.data;
    } catch {
      return null;
    }
  },

  async getHospitalReservations(hospitalId: string) {
    try {
      const res = await apiClient.get(`/reservations/hospital/${hospitalId}`);
      return res.data.data;
    } catch {
      return [];
    }
  },

  async cancelReservation(reservationId: string, reason?: string) {
    try {
      const res = await apiClient.post(`/reservations/${reservationId}/cancel`, { cancellationReason: reason });
      return res.data.data;
    } catch {
      return null;
    }
  },

  // --- Referrals ---
  async getReferrals(params?: { hospitalId?: string; status?: string }): Promise<Referral[]> {
    try {
      const res = await apiClient.get('/referrals', { params });
      return res.data.data;
    } catch {
      return [];
    }
  },

  async createReferral(data: Partial<Referral>): Promise<Referral | null> {
    try {
      const res = await apiClient.post('/referrals', data);
      return res.data.data;
    } catch {
      return null;
    }
  },

  async acceptReferral(referralId: string, doctorName?: string): Promise<Referral | null> {
    try {
      const res = await apiClient.patch(`/referrals/${referralId}/accept`, { doctorName });
      return res.data.data;
    } catch {
      return null;
    }
  },

  async rejectReferral(referralId: string, reason: string, doctorName?: string): Promise<Referral | null> {
    try {
      const res = await apiClient.patch(`/referrals/${referralId}/reject`, { reason, doctorName });
      return res.data.data;
    } catch {
      return null;
    }
  },

  async requestClarification(referralId: string, question: string): Promise<Referral | null> {
    try {
      const res = await apiClient.patch(`/referrals/${referralId}/clarify`, { question });
      return res.data.data;
    } catch {
      return null;
    }
  },

  async cancelReferral(referralId: string, reason: string): Promise<Referral | null> {
    try {
      const res = await apiClient.patch(`/referrals/${referralId}/cancel`, { reason });
      return res.data.data;
    } catch {
      return null;
    }
  },

  async reRefer(referralId: string, newHospitalId: string): Promise<Referral | null> {
    try {
      const res = await apiClient.post(`/referrals/${referralId}/rerefer`, { newHospitalId });
      return res.data.data;
    } catch {
      return null;
    }
  },

  // --- Admissions & Phototherapy ---
  async getAdmissions(params?: { hospitalId?: string; status?: string }): Promise<Admission[]> {
    try {
      const res = await apiClient.get('/admissions', { params });
      return res.data.data;
    } catch {
      return [];
    }
  },

  async confirmArrival(referralId: string, nurseName: string, hospitalId: string): Promise<Admission | null> {
    try {
      const res = await apiClient.post('/admissions/confirm-arrival', {
        referralId,
        nurseName,
        hospitalId,
      });
      return res.data.data;
    } catch {
      return null;
    }
  },

  async allocateStation(admissionId: string, stationId: string, nurseName: string) {
    try {
      const res = await apiClient.post(`/admissions/${admissionId}/allocate-station`, {
        stationId,
        nurseName,
      });
      return res.data.data;
    } catch {
      return null;
    }
  },

  async startTreatment(admissionId: string, data: { phototherapyType?: string; irradianceMwCm2?: number; nurseName: string }) {
    try {
      const res = await apiClient.post(`/admissions/${admissionId}/sessions/start`, data);
      return res.data.data;
    } catch {
      return null;
    }
  },

  async endTreatment(admissionId: string, sessionId: string, nurseName: string, notes?: string) {
    try {
      const res = await apiClient.post(`/admissions/${admissionId}/sessions/${sessionId}/end`, {
        nurseName,
        notes,
      });
      return res.data.data;
    } catch {
      return null;
    }
  },

  async dischargePatient(admissionId: string, data: { doctorName: string; dischargeBilirubinValue: number; dischargeNotes?: string; followUpPlan?: string }) {
    try {
      const res = await apiClient.post(`/admissions/${admissionId}/discharge`, data);
      return res.data.data;
    } catch {
      return null;
    }
  },

  // --- District Analytics ---
  async getDistrictOverview() {
    try {
      const res = await apiClient.get('/district/overview');
      return res.data.data;
    } catch {
      return null;
    }
  },

  // --- In-App Notifications ---
  async getNotifications(role?: string, hospitalId?: string): Promise<InAppNotification[]> {
    try {
      const res = await apiClient.get('/notifications', { params: { role, hospitalId } });
      return res.data.data;
    } catch {
      return [];
    }
  },

  async markNotificationRead(id: string): Promise<boolean> {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      return true;
    } catch {
      return false;
    }
  },
};
