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

  describe('5. Referral Patient Retention Across Hospitals', () => {
    it('keeps referred patient visible at referring hospital during pending state', async () => {
      useAuthStore.getState().setUser(HOSPITAL_USERS.PGI, 'mock_jwt_token_pgi');

      const pgiBabyPendingRef: Baby = {
        id: 'baby_pgi_ref_1',
        uhid: 'PGI-100201',
        name: 'Baby Aarti',
        dateOfBirth: new Date().toISOString(),
        currentHospital: 'PGI',
        facility: 'PGI',
        referralStatus: 'pending',
        referredToHospitalName: 'RML',
        referralSentAt: new Date().toISOString(),
        severityState: 'normal',
        status: 'admitted',
      };

      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce([pgiBabyPendingRef]);
      jest.spyOn(PatientsApi, 'getReadings').mockResolvedValue([]);
      jest.spyOn(PatientsApi, 'getObservations').mockResolvedValue([]);

      await usePatientStore.getState().loadBabies();
      expect(usePatientStore.getState().babies).toHaveLength(1);
      expect(usePatientStore.getState().babies[0].uhid).toBe('PGI-100201');
      expect(usePatientStore.getState().babies[0].referralStatus).toBe('pending');
      expect(usePatientStore.getState().babies[0].referredToHospitalName).toBe('RML');
    });

    it('keeps referred patient visible at referring hospital after acceptance (transferred out)', async () => {
      useAuthStore.getState().setUser(HOSPITAL_USERS.PGI, 'mock_jwt_token_pgi');

      const pgiBabyAcceptedAtRml: Baby = {
        id: 'baby_pgi_ref_1',
        uhid: 'PGI-100201',
        name: 'Baby Aarti',
        dateOfBirth: new Date().toISOString(),
        currentHospital: 'RML', // Ownership is at RML
        facility: 'PGI',
        isTransferredOut: true,
        isHistoricalOnly: true,
        referralStatus: 'accepted',
        referredToHospitalName: 'RML',
        referralSentAt: new Date().toISOString(),
        severityState: 'normal',
        status: 'admitted',
      };

      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce([pgiBabyAcceptedAtRml]);
      jest.spyOn(PatientsApi, 'getReadings').mockResolvedValue([]);
      jest.spyOn(PatientsApi, 'getObservations').mockResolvedValue([]);

      await usePatientStore.getState().loadBabies();
      expect(usePatientStore.getState().babies).toHaveLength(1);
      expect(usePatientStore.getState().babies[0].uhid).toBe('PGI-100201');
      expect(usePatientStore.getState().babies[0].isTransferredOut).toBe(true);
      expect(usePatientStore.getState().babies[0].isHistoricalOnly).toBe(true);
      expect(usePatientStore.getState().babies[0].referredToHospitalName).toBe('RML');
    });

    it('supports multi-hop referral chains (PGI -> RML -> KGMU) without disappearing from intermediate referring hospital (RML)', async () => {
      // User is logged into RML
      useAuthStore.getState().setUser(HOSPITAL_USERS.RML, 'mock_jwt_token_rml');

      // Baby was originally born at PGI, transferred to RML, and now RML transferred it to KGMU
      const multiHopBaby: Baby = {
        id: 'baby_chain_1',
        uhid: 'PGI-889900',
        name: 'Baby Chain',
        dateOfBirth: new Date().toISOString(),
        currentHospital: 'KGMU', // Accepted by KGMU
        facility: 'PGI', // Born at PGI
        isTransferredOut: true, // Tagged by backend as transferred out from RML
        isHistoricalOnly: true,
        referralStatus: 'accepted',
        referredToHospitalName: 'KGMU',
        referralSentAt: new Date().toISOString(),
        severityState: 'normal',
        status: 'admitted',
      };

      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce([multiHopBaby]);
      jest.spyOn(PatientsApi, 'getReadings').mockResolvedValue([]);
      jest.spyOn(PatientsApi, 'getObservations').mockResolvedValue([]);

      await usePatientStore.getState().loadBabies();
      // Must NOT be dropped even though facility is PGI and currentHospital is KGMU!
      expect(usePatientStore.getState().babies).toHaveLength(1);
      expect(usePatientStore.getState().babies[0].uhid).toBe('PGI-889900');
      expect(usePatientStore.getState().babies[0].referredToHospitalName).toBe('KGMU');
    });
  });

  describe('6. Gestational Age Weeks and Optional Days Validation', () => {
    const validateGestation = (weeksStr: string, daysStr: string) => {
      if (!weeksStr.trim()) {
        return { valid: false, error: 'Weeks required' };
      }
      const parsedWeeks = parseInt(weeksStr.trim(), 10);
      if (isNaN(parsedWeeks) || parsedWeeks < 20 || parsedWeeks > 46) {
        return { valid: false, error: 'Weeks must be between 20 and 46' };
      }

      let parsedDays: number | undefined = undefined;
      if (daysStr.trim()) {
        const trimmed = daysStr.trim();
        // Reject negative numbers, decimals, and values > 6
        if (!/^[0-6]$/.test(trimmed)) {
          return { valid: false, error: 'Days must be a whole number between 0 and 6' };
        }
        parsedDays = parseInt(trimmed, 10);
      }

      return { valid: true, weeks: parsedWeeks, days: parsedDays };
    };

    it('accepts 36 weeks and 4 days', () => {
      const result = validateGestation('36', '4');
      expect(result.valid).toBe(true);
      expect(result.weeks).toBe(36);
      expect(result.days).toBe(4);
    });

    it('accepts 37 weeks and empty days', () => {
      const result = validateGestation('37', '');
      expect(result.valid).toBe(true);
      expect(result.weeks).toBe(37);
      expect(result.days).toBeUndefined();
    });

    it('accepts 35 weeks and 0 days', () => {
      const result = validateGestation('35', '0');
      expect(result.valid).toBe(true);
      expect(result.weeks).toBe(35);
      expect(result.days).toBe(0);
    });

    it('rejects invalid day values (decimals, negative, > 6, non-numeric)', () => {
      expect(validateGestation('36', '7').valid).toBe(false);
      expect(validateGestation('36', '-1').valid).toBe(false);
      expect(validateGestation('36', '4.5').valid).toBe(false);
      expect(validateGestation('36', 'abc').valid).toBe(false);
    });
  });

  describe('7. Hospital-Specific UHID Prefix Generation & Compatibility', () => {
    const generateUhidForHospital = (facilityName: string) => {
      const raw = facilityName.toUpperCase();
      const prefix = raw.includes('KGMU') ? 'KGMU' : raw.includes('RML') ? 'RML' : 'PGI';
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      return `${prefix}-${randomSuffix}`;
    };

    it('generates PGI prefix for PGI session', () => {
      const uhid = generateUhidForHospital('Postgraduate Institute (PGI)');
      expect(uhid.startsWith('PGI-')).toBe(true);
      expect(uhid).toMatch(/^PGI-\d{6}$/);
    });

    it('generates KGMU prefix for KGMU session', () => {
      const uhid = generateUhidForHospital('King George Medical University (KGMU)');
      expect(uhid.startsWith('KGMU-')).toBe(true);
      expect(uhid).toMatch(/^KGMU-\d{6}$/);
    });

    it('generates RML prefix for RML session', () => {
      const uhid = generateUhidForHospital('Dr. Ram Manohar Lohia Institute (RML)');
      expect(uhid.startsWith('RML-')).toBe(true);
      expect(uhid).toMatch(/^RML-\d{6}$/);
    });

    it('preserves compatibility with legacy BS- prefixed patient records', async () => {
      useAuthStore.getState().setUser(HOSPITAL_USERS.PGI, 'mock_jwt_token_pgi');

      const legacyBaby: Baby = {
        id: 'legacy_baby_1',
        uhid: 'BS-IN-972612',
        name: 'Legacy Baby',
        dateOfBirth: new Date().toISOString(),
        currentHospital: 'PGI',
        facility: 'PGI',
        severityState: 'normal',
        status: 'admitted',
      };

      jest.spyOn(PatientsApi, 'getBabies').mockResolvedValueOnce([legacyBaby]);
      jest.spyOn(PatientsApi, 'getReadings').mockResolvedValue([]);
      jest.spyOn(PatientsApi, 'getObservations').mockResolvedValue([]);

      await usePatientStore.getState().loadBabies();
      expect(usePatientStore.getState().babies).toHaveLength(1);
      expect(usePatientStore.getState().babies[0].uhid).toBe('BS-IN-972612');
    });
  });
});
