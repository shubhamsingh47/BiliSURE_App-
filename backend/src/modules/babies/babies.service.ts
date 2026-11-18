import { BabyModel, IBaby } from '../../models/Baby';
import { BilirubinReadingModel } from '../../models/BilirubinReading';
import { ReferralModel } from '../../models/Referral';
import { ConflictError, NotFoundError } from '../../common/errors';

export class BabiesService {
  static async listBabies(
    filters: {
      department?: string;
      severityState?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    userFacility?: string
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const query: any = {};
    const andClauses: any[] = [];

    if (userFacility) {
      andClauses.push({
        $or: [
          { facility: userFacility },
          { currentHospital: userFacility, referralStatus: 'accepted' },
        ],
      });
    }

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
      andClauses.push({
        $or: [
          { name: { $regex: filters.search, $options: 'i' } },
          { uhid: { $regex: filters.search, $options: 'i' } },
        ],
      });
    }

    if (andClauses.length > 0) {
      query.$and = andClauses;
    }

    const total = await BabyModel.countDocuments(query);
    const items = total > 0 ? await BabyModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean() : [];

    // Strictly attach verified outgoing referral destination for the authenticated facility's babies
    if (items.length > 0 && userFacility) {
      try {
        const uhids = items.map((b: any) => b.uhid);
        const outgoingReferrals = await ReferralModel.find({
          referringCentreName: userFacility,
          babyUhid: { $in: uhids },
          status: { $in: ['pending', 'accepted'] },
        }).sort({ createdAt: -1 }).lean();

        if (outgoingReferrals && outgoingReferrals.length > 0) {
          const refMap = new Map<string, any>();
          for (const ref of outgoingReferrals) {
            if (!refMap.has(ref.babyUhid)) {
              refMap.set(ref.babyUhid, ref);
            }
          }
          for (const baby of items) {
            const ref = refMap.get((baby as any).uhid);
            if (ref) {
              (baby as any).referralStatus = ref.status;
              (baby as any).referredToHospitalName = ref.receivingHospitalName;
              (baby as any).referredToHospitalId = ref.receivingHospitalId;
            }
          }
        }
      } catch (err) {
        // Safe fallback
      }
    }

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

  static async createBaby(data: any, user?: any) {
    const uhid = data.uhid ? data.uhid.toUpperCase().trim() : ('BS-IN-' + Math.floor(100000 + Math.random() * 900000));
    const existing = await BabyModel.findOne({ uhid });
    if (existing) {
      throw new ConflictError(`Baby with UHID ${uhid} already exists`);
    }

    const facility = user?.facility || data.facility || 'PGI';
    const facilityId = user?.facilityId || data.facilityId || 'hosp_pgi';

    const baby = await BabyModel.create({
      ...data,
      facility,
      facilityId,
      currentHospital: facility,
      uhid,
      registeredBy: user?.userId,
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
