import { BabyModel, IBaby } from '../../models/Baby';
import { BilirubinReadingModel } from '../../models/BilirubinReading';
import { ReferralModel } from '../../models/Referral';
import { ConflictError, NotFoundError, ForbiddenError } from '../../common/errors';

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

    // Collect uhids of babies previously referred out and accepted from this facility
    let transferredOutRefsMap = new Map<string, any>();
    let transferredOutUhids: string[] = [];

    if (userFacility) {
      try {
        const acceptedOutgoing = await ReferralModel.find({
          referringCentreName: new RegExp(`^${userFacility}$`, 'i'),
          status: 'accepted',
        }).sort({ createdAt: -1 }).lean();

        if (acceptedOutgoing && acceptedOutgoing.length > 0) {
          for (const r of acceptedOutgoing) {
            if (!transferredOutRefsMap.has(r.babyUhid)) {
              transferredOutRefsMap.set(r.babyUhid, r);
            }
          }
          transferredOutUhids = Array.from(transferredOutRefsMap.keys());
        }
      } catch (err) {
        // Safe fallback
      }

      const facilityClauses: any[] = [
        { currentHospital: new RegExp(`^${userFacility}$`, 'i') },
        {
          facility: new RegExp(`^${userFacility}$`, 'i'),
          $or: [
            { currentHospital: { $exists: false } },
            { currentHospital: null },
            { currentHospital: '' },
          ],
        },
      ];

      // Keep transferred-out babies visible in sender's directory as read-only historical cards
      if (transferredOutUhids.length > 0) {
        facilityClauses.push({ uhid: { $in: transferredOutUhids } });
      }

      andClauses.push({ $or: facilityClauses });
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

    // Attach pending outgoing referral and historical transferred-out states for authenticated facility
    if (items.length > 0 && userFacility) {
      try {
        const uhids = items.map((b: any) => b.uhid);
        const pendingOutgoingRefs = await ReferralModel.find({
          referringCentreName: new RegExp(`^${userFacility}$`, 'i'),
          babyUhid: { $in: uhids },
          status: 'pending',
        }).sort({ createdAt: -1 }).lean();

        const pendingRefMap = new Map<string, any>();
        if (pendingOutgoingRefs && pendingOutgoingRefs.length > 0) {
          for (const ref of pendingOutgoingRefs) {
            if (!pendingRefMap.has(ref.babyUhid)) {
              pendingRefMap.set(ref.babyUhid, ref);
            }
          }
        }

        const userFacUpper = userFacility.trim().toUpperCase();

        for (const baby of items) {
          const babyOwner = (baby.currentHospital || baby.facility || '').trim().toUpperCase();
          const isCurrentOwner = babyOwner === userFacUpper;

          if (isCurrentOwner) {
            // Case 1: Facility is active owner. Check if there is an active pending outgoing referral
            const pendingRef = pendingRefMap.get((baby as any).uhid);
            if (pendingRef) {
              (baby as any).referralStatus = 'pending';
              (baby as any).referredToHospitalName = pendingRef.receivingHospitalName;
              (baby as any).referredToHospitalId = pendingRef.receivingHospitalId;
              (baby as any).referralSentAt = pendingRef.createdAt;
              (baby as any).activeReferralId = pendingRef.referralId;
              (baby as any).isTransferredOut = false;
              (baby as any).isHistoricalOnly = false;
            } else {
              (baby as any).isTransferredOut = false;
              (baby as any).isHistoricalOnly = false;
            }
          } else {
            // Case 2: Facility is NOT active owner, but previously transferred this baby out (accepted)
            const transferredRef = transferredOutRefsMap.get((baby as any).uhid);
            if (transferredRef) {
              (baby as any).isTransferredOut = true;
              (baby as any).isHistoricalOnly = true;
              (baby as any).referralStatus = 'accepted';
              (baby as any).referredToHospitalName = transferredRef.receivingHospitalName;
              (baby as any).referredToHospitalId = transferredRef.receivingHospitalId;
              (baby as any).referralSentAt = transferredRef.createdAt;
              (baby as any).activeReferralId = transferredRef.referralId;
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

  static async getBabyById(id: string, userFacility?: string) {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { uhid: id.toUpperCase().trim() };
    const baby = await BabyModel.findOne(query).lean();
    if (!baby) {
      throw new NotFoundError(`Baby with id or UHID ${id} not found`);
    }

    if (userFacility) {
      const uFac = userFacility.trim().toUpperCase();
      const owner = (baby.currentHospital || baby.facility || '').trim().toUpperCase();
      if (owner && owner !== uFac) {
        // Allow access only if the requesting facility currently has an active pending referral for this baby
        const hasPendingRef = await ReferralModel.findOne({
          babyUhid: baby.uhid,
          referringCentreName: new RegExp(`^${userFacility}$`, 'i'),
          status: 'pending',
        }).lean();

        if (!hasPendingRef) {
          throw new ForbiddenError(
            'Access denied: Patient is not currently admitted or active under your hospital'
          );
        }
      }
    }

    return baby;
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
