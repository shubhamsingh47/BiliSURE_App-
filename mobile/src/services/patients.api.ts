import { apiClient } from './api.client';
import { Baby, BilirubinReading, ClinicalObservation } from '../types';

/**
 * Online REST API Client for Babies, Readings, and Observations.
 * Replaces legacy SQLite offline database with direct online Express/MongoDB communication.
 */
export const PatientsApi = {
  /**
   * Fetches the registered babies list from the backend.
   */
  async getBabies(department?: string): Promise<Baby[]> {
    try {
      const res = await apiClient.get('/babies', { params: { department } });
      const items = res.data?.data || [];
      return items.map((b: any) => ({
        ...b,
        id: b.id || b._id?.toString() || b._id,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fetches a specific baby's clinical profile by ID.
   */
  async getBabyById(id: string): Promise<Baby | null> {
    try {
      const res = await apiClient.get(`/babies/${id}`);
      const b = res.data?.data;
      if (!b) return null;
      return {
        ...b,
        id: b.id || b._id?.toString() || b._id,
      };
    } catch {
      return null;
    }
  },

  /**
   * Directly registers a new baby on the backend server.
   */
  async registerBaby(data: Partial<Baby>): Promise<Baby | null> {
    try {
      const res = await apiClient.post('/babies', data);
      const b = res.data?.data;
      if (!b) return null;
      return {
        ...b,
        id: b.id || b._id?.toString() || b._id,
      };
    } catch {
      return null;
    }
  },

  /**
   * Updates patient details directly on the backend server.
   */
  async updateBaby(id: string, updates: Partial<Baby>): Promise<Baby | null> {
    try {
      const res = await apiClient.patch(`/babies/${id}`, updates);
      const b = res.data?.data;
      if (!b) return null;
      return {
        ...b,
        id: b.id || b._id?.toString() || b._id,
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetches bilirubin readings for a baby directly from the backend.
   */
  async getReadings(babyId: string): Promise<BilirubinReading[]> {
    try {
      const res = await apiClient.get(`/readings/baby/${babyId}`);
      const items = res.data?.data || [];
      return items.map((r: any) => ({
        ...r,
        id: r.id || r._id?.toString() || r._id,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Records a new bilirubin reading directly on the backend server.
   */
  async createReading(data: Partial<BilirubinReading>): Promise<BilirubinReading | null> {
    try {
      const res = await apiClient.post('/readings', data);
      const r = res.data?.data;
      if (!r) return null;
      return {
        ...r,
        id: r.id || r._id?.toString() || r._id,
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetches clinical observations for a baby directly from the backend.
   */
  async getObservations(babyId?: string): Promise<ClinicalObservation[]> {
    try {
      const res = await apiClient.get('/observations', { params: { babyId } });
      const items = res.data?.data || [];
      return items.map((o: any) => ({
        ...o,
        id: o.id || o._id?.toString() || o._id,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Records a clinical observation directly on the backend server.
   */
  async createObservation(data: Partial<ClinicalObservation>): Promise<ClinicalObservation | null> {
    try {
      const res = await apiClient.post('/observations', data);
      const o = res.data?.data;
      if (!o) return null;
      return {
        ...o,
        id: o.id || o._id?.toString() || o._id,
      };
    } catch {
      return null;
    }
  },
};
