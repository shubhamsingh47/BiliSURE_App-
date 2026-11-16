import { ObservationModel } from '../../models/Observation';

const mockObservations: any[] = [
  {
    _id: 'obs_001',
    clientOperationId: 'obs_op_1',
    babyId: '651a00010000000000000001',
    site: 'Face',
    observerName: 'Nurse A',
    clinicalNotes: 'Yellow discoloration extending to chest',
    bilirubinValue: 18.0,
    timestamp: new Date(Date.now() - 4 * 3600 * 1000),
  },
  {
    _id: 'obs_002',
    clientOperationId: 'obs_op_2',
    babyId: '651a00010000000000000001',
    site: 'Palms and soles',
    observerName: 'Nurse A',
    clinicalNotes: 'Zone 5 Kramer scale involvement',
    bilirubinValue: 10.0,
    timestamp: new Date(Date.now() - 8 * 3600 * 1000),
  },
];

export class ObservationsService {
  static async listForBaby(babyId?: string) {
    try {
      const query = babyId ? { babyId } : {};
      const obs = await ObservationModel.find(query).sort({ timestamp: -1 }).lean();
      if (obs.length > 0) return obs;
    } catch {}

    return mockObservations;
  }

  static async create(data: any, observerName = 'Nurse A') {
    try {
      const created = await ObservationModel.create({
        ...data,
        observerName: data.observerName || observerName,
      });
      return created.toObject();
    } catch {
      const created = {
        _id: 'obs_' + Date.now(),
        ...data,
        observerName: data.observerName || observerName,
        timestamp: new Date(),
      };
      mockObservations.unshift(created);
      return created;
    }
  }
}
