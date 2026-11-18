import mongoose from 'mongoose';
import { ObservationModel } from '../../models/Observation';
import { BabyModel } from '../../models/Baby';

export class ObservationsService {
  static async listForBaby(babyId?: string) {
    if (!babyId) {
      const obs = await ObservationModel.find({}).sort({ timestamp: -1 }).lean();
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
