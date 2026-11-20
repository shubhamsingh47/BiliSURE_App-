import mongoose from 'mongoose';
import { ObservationModel } from '../../models/Observation';
import { BabyModel } from '../../models/Baby';

export class ObservationsService {
  static async listForBaby(babyId?: string, userFacility?: string) {
    if (!babyId) {
      const query: any = {};
      const facilityUpper = (userFacility || '').trim().toUpperCase();
      const isDistrict =
        !userFacility ||
        facilityUpper.includes('DISTRICT') ||
        facilityUpper.includes('ADMIN') ||
        facilityUpper === 'ALL';

      if (!isDistrict) {
        const facilityBabies = await BabyModel.find({
          $or: [
            { currentHospital: new RegExp(`^${userFacility}$`, 'i') },
            { facility: new RegExp(`^${userFacility}$`, 'i') },
          ],
        })
          .select('_id uhid name')
          .lean();
        const babyIds = facilityBabies.map((b: any) => b._id);
        query.babyId = { $in: babyIds };
      }

      const obs = await ObservationModel.find(query).sort({ timestamp: -1 }).limit(100).lean();
      return obs || [];
    }

    let resolvedBabyId: any = babyId;
    if (!mongoose.Types.ObjectId.isValid(babyId)) {
      const baby = await BabyModel.findOne({ uhid: babyId.toUpperCase().trim() }).lean();
      if (!baby) return [];
      resolvedBabyId = baby._id;
    }

    const obs = await ObservationModel.find({ babyId: resolvedBabyId }).sort({ timestamp: -1 }).lean();
    return obs || [];
  }

  static async create(data: any, observerName = 'Nurse A') {
    let resolvedBabyId: any = data.babyId;
    if (data.babyId && !mongoose.Types.ObjectId.isValid(data.babyId)) {
      const baby = await BabyModel.findOne({ uhid: data.babyId.toUpperCase().trim() }).lean();
      if (baby) {
        resolvedBabyId = baby._id;
      }
    }

    const created = await ObservationModel.create({
      ...data,
      babyId: resolvedBabyId,
      observerName: data.observerName || observerName,
    });
    return created.toObject();
  }
}
