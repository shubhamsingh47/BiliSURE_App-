"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BabiesService = void 0;
const Baby_1 = require("../../models/Baby");
const errors_1 = require("../../common/errors");
// Realistic mock patients matching video demo
const mockBabies = [
    {
        _id: '6afc02903259d997ea0159ce',
        uhid: 'BS-IN-972612',
        name: 'Sunita Devi',
        parentsName: 'Sunita Devi',
        dateOfBirth: new Date(Date.now() - 36 * 3600 * 1000),
        weight: 3.1,
        height: 48.0,
        assignedDoctor: 'Dr. Priya Sharma',
        facility: 'District Civil Hospital',
        department: 'Deppt',
        severityState: 'critical',
        status: 'under_treatment',
        initialValue: 10.0,
        dischargeValue: 5.0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '6afc02923259d997ea0159d9',
        uhid: 'BS-IN-656522',
        name: 'Pooja Sharma',
        parentsName: 'Pooja Sharma',
        dateOfBirth: new Date(Date.now() - 48 * 3600 * 1000),
        weight: 2.9,
        height: 47.5,
        assignedDoctor: 'Dr. Priya Sharma',
        facility: 'District Civil Hospital',
        department: 'Deppt',
        severityState: 'normal',
        status: 'in_observation',
        initialValue: 8.5,
        dischargeValue: 4.8,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '6afc02943259d997ea0159eb',
        uhid: 'BS-IN-508424',
        name: 'Geeta Verma',
        parentsName: 'Geeta Verma',
        dateOfBirth: new Date(Date.now() - 24 * 3600 * 1000),
        weight: 3.4,
        height: 50.0,
        assignedDoctor: 'Dr. Priya Sharma',
        facility: 'District Civil Hospital',
        department: 'Deppt',
        severityState: 'critical',
        status: 'under_treatment',
        initialValue: 12.5,
        dischargeValue: 5.2,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
class BabiesService {
    static async listBabies(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        try {
            const query = {};
            if (filters.department && filters.department !== 'Deppt' && filters.department !== 'All') {
                query.department = filters.department;
            }
            if (filters.severityState) {
                query.severityState = filters.severityState;
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.search) {
                query.$or = [
                    { name: { $regex: filters.search, $options: 'i' } },
                    { uhid: { $regex: filters.search, $options: 'i' } },
                ];
            }
            const total = await Baby_1.BabyModel.countDocuments(query);
            if (total > 0) {
                const items = await Baby_1.BabyModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean();
                return {
                    items,
                    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
                };
            }
        }
        catch {
            // Fallback to in-memory mock if db is unpopulated or offline
        }
        let filtered = [...mockBabies];
        if (filters.severityState) {
            filtered = filtered.filter(b => b.severityState === filters.severityState);
        }
        if (filters.search) {
            const s = filters.search.toLowerCase();
            filtered = filtered.filter(b => b.name.toLowerCase().includes(s) || b.uhid.toLowerCase().includes(s));
        }
        return {
            items: filtered,
            pagination: {
                total: filtered.length,
                page: 1,
                limit: 20,
                totalPages: 1,
            },
        };
    }
    static async getBabyById(id) {
        try {
            const baby = await Baby_1.BabyModel.findById(id).lean();
            if (baby)
                return baby;
        }
        catch { }
        const mock = mockBabies.find(b => b._id === id || b.uhid === id);
        if (mock)
            return mock;
        throw new errors_1.NotFoundError(`Baby with id or UHID ${id} not found`);
    }
    static async createBaby(data, userId) {
        const uhid = data.uhid.toUpperCase().trim();
        try {
            const existing = await Baby_1.BabyModel.findOne({ uhid });
            if (existing) {
                throw new errors_1.ConflictError(`Baby with UHID ${uhid} already exists`);
            }
            const baby = await Baby_1.BabyModel.create({
                ...data,
                uhid,
                registeredBy: userId,
            });
            return baby.toObject();
        }
        catch (err) {
            if (err instanceof errors_1.ConflictError)
                throw err;
            // Fallback create
            const created = {
                _id: 'baby_' + Date.now(),
                ...data,
                uhid,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockBabies.unshift(created);
            return created;
        }
    }
    static async updateBaby(id, updates) {
        try {
            const updated = await Baby_1.BabyModel.findByIdAndUpdate(id, updates, { new: true }).lean();
            if (updated)
                return updated;
        }
        catch { }
        const idx = mockBabies.findIndex(b => b._id === id || b.uhid === id);
        if (idx !== -1) {
            mockBabies[idx] = { ...mockBabies[idx], ...updates, updatedAt: new Date() };
            return mockBabies[idx];
        }
        throw new errors_1.NotFoundError(`Baby ${id} not found for update`);
    }
}
exports.BabiesService = BabiesService;
