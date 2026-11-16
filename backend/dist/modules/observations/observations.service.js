"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservationsService = void 0;
const Observation_1 = require("../../models/Observation");
const mockObservations = [
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
class ObservationsService {
    static async listForBaby(babyId) {
        try {
            const query = babyId ? { babyId } : {};
            const obs = await Observation_1.ObservationModel.find(query).sort({ timestamp: -1 }).lean();
            if (obs.length > 0)
                return obs;
        }
        catch { }
        return mockObservations;
    }
    static async create(data, observerName = 'Nurse A') {
        try {
            const created = await Observation_1.ObservationModel.create({
                ...data,
                observerName: data.observerName || observerName,
            });
            return created.toObject();
        }
        catch {
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
exports.ObservationsService = ObservationsService;
