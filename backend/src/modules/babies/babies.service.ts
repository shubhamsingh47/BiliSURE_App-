import { BabyModel, IBaby } from '../../models/Baby';
import { BilirubinReadingModel } from '../../models/BilirubinReading';
import { ConflictError, NotFoundError } from '../../common/errors';

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
    const items = total > 0 ? await BabyModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean() : [];

    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  static async getBabyById(id: string) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { uhid: id.toUpperCase().trim() };
    const baby = await BabyModel.findOne(query).lean();
    if (baby) return baby;

    throw new NotFoundError(`Baby with id or UHID ${id} not found`);
  }

  static async createBaby(data: any, userId?: string) {
    const uhid = data.uhid ? data.uhid.toUpperCase().trim() : ('BS-IN-' + Math.floor(100000 + Math.random() * 900000));
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
  }

  static async updateBaby(id: string, updates: any) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { uhid: id.toUpperCase().trim() };
    const updated = await BabyModel.findOneAndUpdate(query, updates, { new: true }).lean();
    if (updated) return updated;

    throw new NotFoundError(`Baby ${id} not found for update`);
  }
}
