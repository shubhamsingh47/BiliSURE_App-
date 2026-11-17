import { apiClient } from './api.client';
import { Baby, BilirubinReading, ClinicalObservation } from '../types';

/**
 * Online REST API Client for Babies, Readings, and Observations.
 * Replaces legacy SQLite offline database with direct online backend communication.
 */
export const PatientsApi = {
  /**
   * Fetches the registered babies list from the backend.
   */
  async getBabies(department?: string): Promise<Baby[]> {
    try {
      const res = await apiClient.get('/babies', { params: { department } });
      return res.data?.data || [];
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
      return res.data?.data || null;
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
      return res.data?.data || null;
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
      return res.data?.data || null;
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
      return res.data?.data || [];
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
      return res.data?.data || null;
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
      return res.data?.data || [];
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
      return res.data?.data || null;
    } catch {
      return null;
    }
  },
};
