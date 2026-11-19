jest.mock('expo-constants', () => ({
  expoConfig: { extra: {} },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import { useNetworkStore } from '../useNetworkStore';
import { usePatientStore } from '../usePatientStore';
import { Baby, TreatmentSession, BilirubinReading } from '../../types';

describe('Clinical Flowsheet & Baseline TSB Store Operations', () => {
  beforeEach(() => {
    useNetworkStore.setState({
      admissions: [
        {
          id: 'adm_test_1',
          admissionId: 'ADM-001',
          babyId: 'baby_001',
          babyUhid: 'UHID-001',
          babyName: 'Baby of Kavita',
          hospitalId: 'hosp_001',
          admissionStatus: 'under_treatment',
          admittedAt: new Date().toISOString(),
          physicalArrivalConfirmed: true,
          stationReleased: false,
          assignedDoctor: 'Dr. Mehta',
          primaryNurse: 'Nurse Staff',
          initialAdmissionBilirubin: 14.2,
          treatmentSessions: [
            {
              sessionId: 'sess_1',
              startTime: new Date().toISOString(),
              durationMinutes: 180,
              nurseName: 'Nurse Staff',
            },
          ],
        },
      ],
      stations: [
        {
          id: 'stn_1',
          stationId: 'PT-01',
          name: 'PT Unit 01',
          operationalStatus: 'available',
          phototherapyType: 'LED Overhead',
          hospitalId: 'hosp_001',
        },
      ],
    });
  });

  it('updates baseline admission TSB via updateAdmission', async () => {
    const { admissions, updateAdmission } = useNetworkStore.getState();
    const targetAdm = admissions[0];
    expect(targetAdm).toBeDefined();

    await updateAdmission(targetAdm.id || targetAdm.admissionId, {
      initialAdmissionBilirubin: 16.2,
    });

    const updated = useNetworkStore
      .getState()
      .admissions.find((a) => a.id === targetAdm.id || a.admissionId === targetAdm.admissionId);
    expect(updated?.initialAdmissionBilirubin).toBe(16.2);
  });

  it('updates an existing treatment session via updateTreatmentSession', async () => {
    const { admissions, updateTreatmentSession } = useNetworkStore.getState();
    const admWithSessions = admissions.find((a) => (a.treatmentSessions || []).length > 0);
    expect(admWithSessions).toBeDefined();

    const targetSession = admWithSessions!.treatmentSessions[0];
    expect(targetSession).toBeDefined();

    await updateTreatmentSession(
      admWithSessions!.id || admWithSessions!.admissionId,
      targetSession.sessionId,
      { durationMinutes: 300 }
    );

    const refreshedAdm = useNetworkStore
      .getState()
      .admissions.find((a) => a.id === admWithSessions!.id || a.admissionId === admWithSessions!.admissionId);
    const updatedSess = refreshedAdm?.treatmentSessions.find((s) => s.sessionId === targetSession.sessionId);
    expect(updatedSess?.durationMinutes).toBe(300);
  });

  it('updates an existing bilirubin reading via updateReading in usePatientStore', () => {
    const { updateReading } = usePatientStore.getState();
    const testReading: BilirubinReading = {
      id: 'test_rdg_99',
      babyId: 'baby_001',
      babyUhid: 'UHID-001',
      value: 12.4,
      method: 'TSB',
      timestamp: new Date().toISOString(),
      sampleTimestamp: new Date().toISOString(),
      site: 'Forehead',
      status: 'verified',
    };

    usePatientStore.setState({
      readings: [testReading, ...usePatientStore.getState().readings],
    });

    updateReading('test_rdg_99', {
      value: 13.1,
      method: 'TcB',
    });

    const refreshed = usePatientStore.getState().readings.find((r) => r.id === 'test_rdg_99');
    expect(refreshed?.value).toBe(13.1);
    expect(refreshed?.method).toBe('TcB');
  });

  it('allocates baby to station using baby.initialValue without hardcoding 14.5', async () => {
    const { stations, allocateBabyToStation } = useNetworkStore.getState();
    const availableStation = stations.find((s) => s.operationalStatus === 'available');
    expect(availableStation).toBeDefined();

    const babyWithCustomInitial: Baby = {
      id: 'baby_dynamic_test',
      uhid: 'UHID-DYN-01',
      name: 'Baby of Maya',
      parentsName: 'Maya Devi',
      dateOfBirth: new Date().toISOString(),
      gender: 'female',
      birthWeightGrams: 2800,
      gestationalAgeWeeks: 38,
      initialValue: 17.6,
      status: 'admitted',
      riskCategory: 'high',
    };

    await allocateBabyToStation(babyWithCustomInitial, availableStation!.id, 'Staff Nurse Priya');

    const createdAdm = useNetworkStore
      .getState()
      .admissions.find((a) => a.babyUhid === 'UHID-DYN-01' || a.babyId === 'baby_dynamic_test');

    expect(createdAdm).toBeDefined();
    expect(createdAdm?.initialAdmissionBilirubin).toBe(17.6);
  });

  it('correctly formats local date keys for Today and Yesterday avoiding UTC offset issues', () => {
    const getLocalDateKey = (dateInput: Date | string): string => {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const now = new Date();
    const todayStr = getLocalDateKey(now);
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = getLocalDateKey(yesterdayDate);

    // Session recorded today
    const sessionToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30);
    expect(getLocalDateKey(sessionToday)).toBe(todayStr);

    // Session recorded yesterday
    const sessionYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0);
    expect(getLocalDateKey(sessionYesterday)).toBe(yesterdayStr);
    expect(getLocalDateKey(sessionYesterday)).not.toBe(todayStr);
  });
});
