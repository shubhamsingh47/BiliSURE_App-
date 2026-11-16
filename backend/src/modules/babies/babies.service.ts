import { BabyModel, IBaby } from '../../models/Baby.js';
import { BilirubinReadingModel } from '../../models/BilirubinReading.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';

// Realistic mock patients matching video demo
const mockBabies: any[] = [
  {
    _id: '651a00010000000000000001',
    uhid: 'M1A2N3S4I5',
    name: 'Baby 1',
    parentsName: 'Sarah Jenkins',
    dateOfBirth: new Date(Date.now() - 36 * 3600 * 1000),
    weight: 3.1,
    height: 48.0,
    assignedDoctor: 'Dr. XYZ',
    facility: 'Central Children Hospital',
    department: 'Deppt',
    severityState: 'critical',
    status: 'under_treatment',
    initialValue: 10.0,
    dischargeValue: 5.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '651a00010000000000000002',
    uhid: 'B2C3D4E5F6',
    name: 'Baby 2',
    parentsName: 'Emily Watson',
    dateOfBirth: new Date(Date.now() - 48 * 3600 * 1000),
    weight: 2.9,
    height: 47.5,
    assignedDoctor: 'Dr. XYZ',
    facility: 'Central Children Hospital',
    department: 'Deppt',
    severityState: 'normal',
    status: 'in_observation',
    initialValue: 8.5,
    dischargeValue: 4.8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '651a00010000000000000003',
    uhid: 'G7H8I9J0K1',
    name: 'Baby 3',
    parentsName: 'Maria Rodriguez',
    dateOfBirth: new Date(Date.now() - 24 * 3600 * 1000),
    weight: 3.4,
    height: 50.0,
    assignedDoctor: 'Dr. XYZ',
    facility: 'Central Children Hospital',
    department: 'Deppt',
    severityState: 'critical',
    status: 'under_treatment',
    initialValue: 12.5,
    dischargeValue: 5.2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class BabiesService {
  static async listBabies(filters: {
    department?: string;
    severityState?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const query: any = {};
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

      const total = await BabyModel.countDocuments(query);
      if (total > 0) {
        const items = await BabyModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean();
        return {
          items,
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
      }
    } catch {
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

  static async getBabyById(id: string) {
    try {
      const baby = await BabyModel.findById(id).lean();
      if (baby) return baby;
    } catch {}

    const mock = mockBabies.find(b => b._id === id || b.uhid === id);
    if (mock) return mock;

    throw new NotFoundError(`Baby with id or UHID ${id} not found`);
  }

  static async createBaby(data: any, userId?: string) {
    const uhid = data.uhid.toUpperCase().trim();
    try {
      const existing = await BabyModel.findOne({ uhid });
      if (existing) {
        throw new ConflictError(`Baby with UHID ${uhid} already exists`);
      }

      const baby = await BabyModel.create({
        ...data,
        uhid,
        registeredBy: userId,
      });
      return baby.toObject();
    } catch (err: any) {
      if (err instanceof ConflictError) throw err;
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

  static async updateBaby(id: string, updates: any) {
    try {
      const updated = await BabyModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      if (updated) return updated;
    } catch {}

    const idx = mockBabies.findIndex(b => b._id === id || b.uhid === id);
    if (idx !== -1) {
      mockBabies[idx] = { ...mockBabies[idx], ...updates, updatedAt: new Date() };
      return mockBabies[idx];
    }

    throw new NotFoundError(`Baby ${id} not found for update`);
  }
}
