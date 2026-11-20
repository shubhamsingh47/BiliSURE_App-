import { Types } from 'mongoose';
import { BilirubinReadingModel, IBilirubinReading } from '../../models/BilirubinReading';
import { BabyModel } from '../../models/Baby';
import { evaluateBhutaniRisk, calculatePostnatalAgeHours, mgDlToUmolL, umolLToMgDl } from '../clinical/bhutani.engine';
import { NotificationsService } from '../notifications/notifications.service';
import { isMongoConnected } from '../../config/database';

const memoryReadings: any[] = [];

export class ReadingsService {
  static async listReadings(filters: {
    search?: string;
    facility?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    const facilityUpper = (filters.facility || '').trim().toUpperCase();
    const isDistrict =
      !filters.facility ||
      facilityUpper.includes('DISTRICT') ||
      facilityUpper.includes('ADMIN') ||
      facilityUpper === 'ALL';

    if (!isDistrict) {
      const facilityBabies = await BabyModel.find({
        $or: [
          { currentHospital: new RegExp(`^${filters.facility}$`, 'i') },
          { facility: new RegExp(`^${filters.facility}$`, 'i') },
        ],
      })
        .select('uhid')
        .lean();
      const uhids = facilityBabies.map((b: any) => b.uhid);
      query.babyUhid = { $in: uhids };
    }

    if (filters.search) {
      const babyMatches = await BabyModel.find({
        name: { $regex: filters.search, $options: 'i' },
      })
        .select('uhid')
        .lean();
      const matchedUhids = babyMatches.map((b: any) => b.uhid);

      query.$or = [
        { babyUhid: { $regex: filters.search, $options: 'i' } },
        { babyUhid: { $in: matchedUhids } },
        { operatorName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const total = await BilirubinReadingModel.countDocuments(query);
    const items = await BilirubinReadingModel.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich with baby details (name, gestational age, department)
    const babyUhids = Array.from(new Set(items.map((r: any) => r.babyUhid).filter(Boolean)));
    const babies = await BabyModel.find({ uhid: { $in: babyUhids } })
      .select('uhid name parentsName dateOfBirth gestationalAgeWeeks department severityState facility')
      .lean();
    const babyMap = new Map<string, any>();
    babies.forEach((b: any) => babyMap.set(b.uhid, b));

    const enrichedItems = items.map((r: any) => {
      const baby = babyMap.get(r.babyUhid);
      return {
        ...r,
        babyName: baby?.name || r.babyUhid,
        motherName: baby?.parentsName || '—',
        parentsName: baby?.parentsName || '—',
        department: baby?.department || 'NICU',
        gestationalAgeWeeks: baby?.gestationalAgeWeeks || 38,
        babyFacility: baby?.facility || 'Hospital',
      };
    });

    return {
      items: enrichedItems,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  static async getReadingsForBaby(babyId: string, timeRange?: string) {
    if (isMongoConnected) {
      try {
        const query: any = { $or: [{ babyId }, { babyUhid: babyId }] };
        const readings = await BilirubinReadingModel.find(query).sort({ timestamp: -1 }).lean();
        if (readings && readings.length > 0) {
          return this.filterByTimeRange(readings, timeRange);
        }
      } catch {}
    }
    const mem = memoryReadings.filter((r) => r.babyId === babyId || r.babyUhid === babyId);
    return this.filterByTimeRange(mem, timeRange);
  }

  static async getLatestReadingForBaby(babyId: string) {
    const readings = await this.getReadingsForBaby(babyId);
    return readings[0] || null;
  }

  static async createReading(data: any, operatorId?: string, operatorName = 'Nurse A') {
    const sampleTimestamp = data.sampleTimestamp ? new Date(data.sampleTimestamp) : new Date(data.timestamp || Date.now());
    const unit = (data.unit === 'µmol/L' ? 'µmol/L' : 'mg/dL') as 'mg/dL' | 'µmol/L';
    const method = (data.method === 'TcB' ? 'TcB' : 'TSB') as 'TSB' | 'TcB';
    const valueNum = Number(data.value);
    const valueMgDl = unit === 'µmol/L' ? umolLToMgDl(valueNum) : valueNum;

    // Fetch baby record to calculate exact postnatal age and gestational eligibility
    let baby: any = null;
    if (isMongoConnected) {
      try {
        const searchConditions: any[] = [{ uhid: data.babyId }, { uhid: data.babyUhid }];
        if (Types.ObjectId.isValid(data.babyId)) {
          searchConditions.unshift({ _id: data.babyId });
        }
        baby = await BabyModel.findOne({ $or: searchConditions });
      } catch {}
    }

    const dob = baby?.dateOfBirth || data.dateOfBirth || new Date(Date.now() - 3600000 * 24);
    const exactTime = baby?.exactTimeOfBirth || data.exactTimeOfBirth || '09:00';
    const gestWeeks = baby?.gestationalAgeWeeks || data.gestationalAgeWeeks || 38;

    const calculatedHours = calculatePostnatalAgeHours(dob, exactTime, sampleTimestamp);
    const postnatalAgeHours = data.postnatalAgeHours !== undefined ? Number(data.postnatalAgeHours) : calculatedHours;

    // Perform clinical Bhutani Risk Evaluation
    const bhutaniResult = evaluateBhutaniRisk({
      dateOfBirth: dob,
      exactTimeOfBirth: exactTime,
      sampleTimestamp,
      value: valueNum,
      unit,
      method,
      gestationalAgeWeeks: gestWeeks,
      riskFactors: data.riskFactors || baby?.riskFactors || [],
    });

    const bhutaniZone = bhutaniResult.zone;
    const bhutaniPercentileApprox = bhutaniResult.percentileApprox;

    // Mapping risk level
    let riskLevel: 'low' | 'intermediate' | 'high' = 'low';
    if (bhutaniZone === 'high') riskLevel = 'high';
    else if (bhutaniZone === 'high_intermediate' || bhutaniZone === 'low_intermediate') riskLevel = 'intermediate';

    const phototherapyPhase = data.phototherapyPhase || 'pre_phototherapy';

    // Normalize measurementSite
    let site = (data.measurementSite || 'forehead').toLowerCase().replace(/[\s-]+/g, '_');
    if (!['palms_and_soles', 'face', 'forehead', 'sternum', 'abdomen'].includes(site)) {
      site = 'forehead';
    }

    // Normalize source
    let source = data.source || 'manual_entry';
    if (!['manual_entry', 'device_transcutaneous', 'serum_lab', 'clinical_flowsheet'].includes(source)) {
      source = 'manual_entry';
    }

    const readingPayload: any = {
      ...data,
      clientOperationId: data.clientOperationId || 'op_rdg_' + Date.now(),
      babyId: data.babyId,
      babyUhid: data.babyUhid || baby?.uhid,
      value: valueNum,
      valueMgDl,
      unit,
      method,
      measurementSite: site,
      source,
      sampleTimestamp,
      postnatalAgeHours,
      bhutaniZone,
      bhutaniPercentileApprox,
      phototherapyPhase,
      riskLevel,
      operatorId,
      operatorName: data.operatorName || operatorName,
      timestamp: sampleTimestamp,
    };

    // If critical alert / high risk zone, trigger immediate notification
    if (bhutaniZone === 'high' || valueMgDl >= 15.0) {
      await NotificationsService.createNotification({
        recipientRole: 'hospital_doctor',
        title: `CRITICAL BILIRUBIN ALERT: ${valueMgDl} mg/dL`,
        message: `High risk zone detected at ${postnatalAgeHours}h postnatal age. Urgent clinical evaluation needed.`,
        type: 'critical_reading',
        relatedBabyUhid: baby?.uhid || data.babyUhid,
      }).catch(() => null);
    }

    if (isMongoConnected) {
      try {
        if (data.clientOperationId) {
          const existing = await BilirubinReadingModel.findOne({ clientOperationId: data.clientOperationId });
          if (existing) return existing.toObject();
        }

        const reading = await BilirubinReadingModel.create(readingPayload);

        const severityState = riskLevel === 'high' ? 'critical' : riskLevel === 'intermediate' ? 'moderate' : 'normal';
        if (Types.ObjectId.isValid(data.babyId)) {
          await BabyModel.findByIdAndUpdate(data.babyId, {
            severityState,
            ...(data.isInitial ? { initialValue: valueMgDl } : {}),
            ...(data.isDischarge ? { dischargeValue: valueMgDl } : {}),
          }).catch(() => {});
        } else if (data.babyUhid || data.babyId) {
          await BabyModel.findOneAndUpdate({ uhid: data.babyUhid || data.babyId }, {
            severityState,
            ...(data.isInitial ? { initialValue: valueMgDl } : {}),
            ...(data.isDischarge ? { dischargeValue: valueMgDl } : {}),
          }).catch(() => {});
        }

        return { ...reading.toObject(), bhutaniAssessment: bhutaniResult };
      } catch (err) {
        // Fall back to memory storage on Mongo failure
      }
    }

    // In-memory persistence fallback
    const existingIndex = memoryReadings.findIndex((r) => r.clientOperationId === readingPayload.clientOperationId);
    if (existingIndex >= 0) {
      return { ...memoryReadings[existingIndex], bhutaniAssessment: bhutaniResult };
    }
    const memRecord = {
      ...readingPayload,
      _id: 'rdg_' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryReadings.unshift(memRecord);
    return { ...memRecord, bhutaniAssessment: bhutaniResult };
  }

  private static filterByTimeRange(readings: any[], timeRange?: string) {
    if (!timeRange || timeRange === 'all') return readings;
    const now = Date.now();
    let hours = 24;
    if (timeRange === '1hr') hours = 1;
    else if (timeRange === '8hr') hours = 8;
    else if (timeRange === '16hr') hours = 16;
    else if (timeRange === '24hr') hours = 24;

    const cutoff = now - hours * 3600 * 1000;
    const filtered = readings.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : readings;
  }
}
