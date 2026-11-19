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

    // Collect uhids of babies previously referred out from this facility (pending or accepted)
    let transferredOutRefsMap = new Map<string, any>();
    let transferredOutUhids: string[] = [];

    if (userFacility) {
      try {
        const outgoingRefs = await ReferralModel.find({
          referringCentreName: new RegExp(`^${userFacility}$`, 'i'),
        }).sort({ createdAt: -1 }).lean();

        if (outgoingRefs && outgoingRefs.length > 0) {
          for (const r of outgoingRefs) {
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
            // Case 2: Facility is NOT active owner, but previously referred this baby out
            const transferredRef = transferredOutRefsMap.get((baby as any).uhid);
            if (transferredRef) {
              (baby as any).isTransferredOut = true;
              (baby as any).isHistoricalOnly = true;
              (baby as any).referralStatus = transferredRef.status;
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
      const originFac = (baby.facility || '').trim().toUpperCase();
      if (owner && owner !== uFac) {
        // Allow access if requesting facility is original birth hospital OR was referring/receiving hospital in any referral
        const referralAccess: any = await ReferralModel.findOne({
          babyUhid: baby.uhid,
          $or: [
            { referringCentreName: new RegExp(`^${userFacility}$`, 'i') },
            { receivingHospitalName: new RegExp(`^${userFacility}$`, 'i') },
          ],
        }).sort({ createdAt: -1 }).lean();

        if (!referralAccess && originFac !== uFac) {
          throw new ForbiddenError(
            'Access denied: Patient is not currently admitted or active under your hospital'
          );
        }

        if (referralAccess && (referralAccess.referringCentreName || '').trim().toUpperCase() === uFac) {
          (baby as any).isTransferredOut = true;
          (baby as any).isHistoricalOnly = true;
          (baby as any).referralStatus = referralAccess.status;
          (baby as any).referredToHospitalName = referralAccess.receivingHospitalName;
          (baby as any).referredToHospitalId = referralAccess.receivingHospitalId;
          (baby as any).referralSentAt = referralAccess.createdAt;
          (baby as any).activeReferralId = referralAccess.referralId;
        }
      }
    }

    return baby;
  }

  static async createBaby(data: any, user?: any) {
    const facility = user?.facility || data.facility || 'PGI';
    const facilityUpper = facility.trim().toUpperCase();
    const hospitalPrefix = facilityUpper.includes('KGMU') ? 'KGMU' : facilityUpper.includes('RML') ? 'RML' : 'PGI';

    let uhid = data.uhid ? data.uhid.toUpperCase().trim() : '';
    // Enforce the authenticated hospital's prefix for new registrations
    if (!uhid) {
      uhid = `${hospitalPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (uhid.startsWith('BS-') || !uhid.startsWith(`${hospitalPrefix}-`)) {
      const suffix = uhid.includes('-') ? uhid.split('-').slice(1).join('-') : uhid;
      uhid = `${hospitalPrefix}-${suffix}`;
    }

    const existing = await BabyModel.findOne({ uhid });
    if (existing) {
      throw new ConflictError(`Baby with UHID ${uhid} already exists`);
    }

    const facilityId = user?.facilityId || data.facilityId || (hospitalPrefix === 'KGMU' ? 'hosp_kgmu' : hospitalPrefix === 'RML' ? 'hosp_rml' : 'hosp_pgi');

    const baby = await BabyModel.create({
      ...data,
      facility,
      facilityId,
      currentHospital: facility,
      uhid,
      gestationalAgeWeeks: data.gestationalAgeWeeks || 38,
      gestationalAgeDays: data.gestationalAgeDays !== undefined ? data.gestationalAgeDays : 0,
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
