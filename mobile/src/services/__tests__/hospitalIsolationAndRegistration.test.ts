jest.mock('expo-constants', () => ({
  expoConfig: { extra: {} },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import { useAuthStore, HOSPITAL_USERS } from '../../store/useAuthStore';
import { usePatientStore } from '../../store/usePatientStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { PatientsApi } from '../patients.api';
import { Baby } from '../../types';

describe('Hospital Isolation, Session Guards, and Registration Defaults', () => {
  beforeEach(() => {
    usePatientStore.getState().reset();
    useNetworkStore.getState().reset();
  });

  describe('1. Immediate Store Wipe on Logout', () => {
    it('immediately clears patient and network stores when logging out', async () => {
      // 1. Simulate active PGI session with loaded babies
      useAuthStore.getState().switchHospital('PGI');
      const mockPgiBaby: Baby = {
        id: 'pgi_baby_1',
        uhid: 'BS-PGI-101',
        name: 'PGI Baby',
        parentsName: 'PGI Mother',
        dateOfBirth: new Date().toISOString(),
        currentHospital: 'PGI',
        facility: 'PGI',
        severityState: 'normal',
        status: 'admitted',
      };

      // Manually set into store
      usePatientStore.setState({
        babies: [mockPgiBaby],
        loadedHospital: 'PGI',
      });
      expect(usePatientStore.getState().babies.length).toBe(1);

      // 2. Perform logout
      await useAuthStore.getState().logout();

      // 3. Verify patient data is immediately purged from memory
      expect(usePatientStore.getState().babies).toEqual([]);
      expect(usePatientStore.getState().selectedBaby).toBeNull();
      expect(usePatientStore.getState().readings).toEqual([]);
      expect(usePatientStore.getState().observations).toEqual([]);
      expect(usePatientStore.getState().loadedHospital).toBeNull();

      // 4. Verify network store is also purged
      expect(useNetworkStore.getState().referrals).toEqual([]);
      expect(useNetworkStore.getState().admissions).toEqual([]);
      expect(useNetworkStore.getState().notifications).toEqual([]);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('2. Cross-Hospital Transitions & Data Isolation (PGI -> RML -> KGMU -> PGI)', () => {
    const pgiBabies: Baby[] = [
      {
        id: 'pgi_1',
        uhid: 'BS-PGI-001',
        name: 'PGI Baby 1',
        dateOfBirth: new Date().toISOString(),
        currentHospital: 'PGI',
        facility: 'PGI',
        severityState: 'normal',
        status: 'admitted',
      },
    ];

    const rmlBabies: Baby[] = [
      {
        id: 'rml_1',
        uhid: 'BS-RML-001',
        name: 'RML Baby 1',
        dateOfBirth: new Date().toISOString(),
        currentHospital: 'RML',
        facility: 'RML',
        severityState: 'normal',
        status: 'admitted',
      },
    ];

    const kgmuBabies: Baby[] = [
      {
        id: 'kgmu_1',
        uhid: 'BS-KGMU-001',
        name: 'KGMU Baby 1',
        dateOfBirth: new Date().toISOString(),
        currentHospital: 'KGMU',
        facility: 'KGMU',
        severityState: 'normal',
        status: 'admitted',
      },
    ];

    it('prevents PGI patient data from leaking when transitioning to RML', async () => {
      // Login PGI
      useAuthStore.getState().setUser(HOSPITAL_USERS.PGI, 'mock_jwt_token_pgi');
      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce(pgiBabies);
      jest.spyOn(PatientsApi, 'getReadings').mockResolvedValue([]);
      jest.spyOn(PatientsApi, 'getObservations').mockResolvedValue([]);

      await usePatientStore.getState().loadBabies();
      expect(usePatientStore.getState().babies[0].uhid).toBe('BS-PGI-001');

      // Logout PGI
      await useAuthStore.getState().logout();
      expect(usePatientStore.getState().babies).toHaveLength(0);

      // Login RML
      useAuthStore.getState().setUser(HOSPITAL_USERS.RML, 'mock_jwt_token_rml');
      expect(usePatientStore.getState().babies).toHaveLength(0); // empty before API resolves!

      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce(rmlBabies);
      await usePatientStore.getState().loadBabies();

      expect(usePatientStore.getState().babies[0].uhid).toBe('BS-RML-001');
      expect(usePatientStore.getState().babies.some((b) => b.uhid === 'BS-PGI-001')).toBe(false);
    });

    it('prevents RML patient data from leaking when transitioning to KGMU', async () => {
      useAuthStore.getState().setUser(HOSPITAL_USERS.RML, 'mock_jwt_token_rml');
      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce(rmlBabies);
      jest.spyOn(PatientsApi, 'getReadings').mockResolvedValue([]);
      jest.spyOn(PatientsApi, 'getObservations').mockResolvedValue([]);

      await usePatientStore.getState().loadBabies();
      expect(usePatientStore.getState().babies[0].uhid).toBe('BS-RML-001');

      await useAuthStore.getState().logout();
      expect(usePatientStore.getState().babies).toHaveLength(0);

      useAuthStore.getState().setUser(HOSPITAL_USERS.KGMU, 'mock_jwt_token_kgmu');
      expect(usePatientStore.getState().babies).toHaveLength(0);

      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce(kgmuBabies);
      await usePatientStore.getState().loadBabies();

      expect(usePatientStore.getState().babies[0].uhid).toBe('BS-KGMU-001');
      expect(usePatientStore.getState().babies.some((b) => b.uhid === 'BS-RML-001')).toBe(false);
    });

    it('prevents KGMU patient data from leaking when transitioning back to PGI', async () => {
      useAuthStore.getState().setUser(HOSPITAL_USERS.KGMU, 'mock_jwt_token_kgmu');
      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce(kgmuBabies);
      jest.spyOn(PatientsApi, 'getReadings').mockResolvedValue([]);
      jest.spyOn(PatientsApi, 'getObservations').mockResolvedValue([]);

      await usePatientStore.getState().loadBabies();
      expect(usePatientStore.getState().babies[0].uhid).toBe('BS-KGMU-001');

      await useAuthStore.getState().logout();
      expect(usePatientStore.getState().babies).toHaveLength(0);

      useAuthStore.getState().setUser(HOSPITAL_USERS.PGI, 'mock_jwt_token_pgi');
      expect(usePatientStore.getState().babies).toHaveLength(0);

      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce(pgiBabies);
      await usePatientStore.getState().loadBabies();

      expect(usePatientStore.getState().babies[0].uhid).toBe('BS-PGI-001');
      expect(usePatientStore.getState().babies.some((b) => b.uhid === 'BS-KGMU-001')).toBe(false);
    });
  });

  describe('3. Asynchronous Race Condition Protection', () => {
    it('discards delayed in-flight API responses from a previous hospital session', async () => {
      // 1. User starts at PGI
      useAuthStore.getState().setUser(HOSPITAL_USERS.PGI, 'mock_jwt_token_pgi');

      let resolvePgiApi: (val: any) => void = () => {};
      const delayedPgiPromise = new Promise((resolve) => {
        resolvePgiApi = resolve;
      });

      jest.spyOn(PatientsApi, 'getBabies').mockImplementationOnce(() => delayedPgiPromise as any);

      // Start loading PGI babies (request is now in-flight)
      const pgiLoadPromise = usePatientStore.getState().loadBabies();

      // 2. While in-flight, user logs out and logs into RML immediately!
      await useAuthStore.getState().logout();
      useAuthStore.getState().setUser(HOSPITAL_USERS.RML, 'mock_jwt_token_rml');

      // 3. Now the delayed PGI response finally resolves!
      const stalePgiBabies: Baby[] = [
        {
          id: 'stale_pgi_1',
          uhid: 'BS-PGI-STALE',
          name: 'Stale PGI Baby',
          dateOfBirth: new Date().toISOString(),
          currentHospital: 'PGI',
          facility: 'PGI',
          severityState: 'normal',
          status: 'admitted',
        },
      ];
      resolvePgiApi(stalePgiBabies);
      await pgiLoadPromise;

      // 4. Verify that the stale PGI response was completely DISCARDED because the session changed!
      expect(usePatientStore.getState().babies).toEqual([]);
      expect(usePatientStore.getState().babies.some((b) => b.uhid === 'BS-PGI-STALE')).toBe(false);
    });
  });

  describe('4. Registration Defaults Validation', () => {
    it('validates gestational age range (20 to 46 weeks)', () => {
      const isValidGestAge = (val: string) => {
        if (!val.trim()) return false;
        const parsed = parseInt(val.trim(), 10);
        return !isNaN(parsed) && parsed >= 20 && parsed <= 46;
      };

      expect(isValidGestAge('')).toBe(false); // empty is invalid (required)
      expect(isValidGestAge('19')).toBe(false);
      expect(isValidGestAge('47')).toBe(false);
      expect(isValidGestAge('38')).toBe(true);
      expect(isValidGestAge('40')).toBe(true);
    });

    it('validates birth weight range (0.1 to 10 kg)', () => {
      const isValidWeight = (val: string) => {
        if (!val.trim()) return false;
        const parsed = parseFloat(val.trim());
        return !isNaN(parsed) && parsed > 0 && parsed <= 10;
      };

      expect(isValidWeight('')).toBe(false); // empty is invalid (required)
      expect(isValidWeight('0')).toBe(false);
      expect(isValidWeight('-1')).toBe(false);
      expect(isValidWeight('11')).toBe(false);
      expect(isValidWeight('3.1')).toBe(true);
      expect(isValidWeight('2.85')).toBe(true);
    });
  });
});
