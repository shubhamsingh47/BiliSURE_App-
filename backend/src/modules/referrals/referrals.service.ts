import { ReferralModel, IReferral, ReferralStatus, ReferralUrgency } from '../../models/Referral';
import { BabyModel } from '../../models/Baby';
import { HospitalsService } from '../hospitals/hospitals.service';
import { NotificationsService } from '../notifications/notifications.service';
import { isMongoConnected } from '../../config/database';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';

const memoryReferrals: IReferral[] = [];

// Seed an initial referral for immediate demo capability
const SEED_REFERRALS = [
  {
    _id: 'ref_seed_001',
    referralId: 'REF-2026-0081',
    babyId: '6afc02903259d997ea0159ce',
    babyName: 'Sunita Devi',
    babyUhid: 'BS-IN-972612',
    dateOfBirth: new Date(Date.now() - 3600000 * 48),
    gestationalAgeWeeks: 38,
    referringDoctorName: 'Dr. Priya Sharma',
    referringCentreName: 'North Community Health Centre (CHC)',
    receivingHospitalId: 'hosp_001',
    receivingHospitalName: 'District Civil Hospital',
    status: 'accepted' as ReferralStatus,
    urgency: 'urgent' as ReferralUrgency,
    clinicalSummary: 'Rapidly rising transcutaneous reading, icterus extending to abdomen and palms. Recommended for double surface phototherapy.',
    latestBilirubinValue: 14.8,
    latestBilirubinUnit: 'mg/dL',
    latestBhutaniRiskZone: 'high_intermediate',
    postnatalAgeHoursAtReferral: 48,
    phototherapyRecommended: true,
    reviewedByDoctorName: 'Dr. Hospital Paediatrician',
    reviewedAt: new Date(Date.now() - 3600000 * 2),
    createdAt: new Date(Date.now() - 3600000 * 3),
  },
  {
    _id: 'ref_seed_002',
    referralId: 'REF-2026-0082',
    babyId: '6afc02923259d997ea0159d9',
    babyName: 'Pooja Sharma',
    babyUhid: 'BS-IN-656522',
    dateOfBirth: new Date(Date.now() - 3600000 * 36),
    gestationalAgeWeeks: 37,
    referringDoctorName: 'Dr. Sarah Smith',
    referringCentreName: 'East Primary Health Centre (PHC)',
    receivingHospitalId: 'hosp_001',
    receivingHospitalName: 'District Civil Hospital',
    status: 'pending' as ReferralStatus,
    urgency: 'emergency' as ReferralUrgency,
    clinicalSummary: 'Serum bilirubin 17.5 mg/dL at 36 hours. Scleral icterus, poor feeding, lethargic.',
    latestBilirubinValue: 17.5,
    latestBilirubinUnit: 'mg/dL',
    latestBhutaniRiskZone: 'high',
    postnatalAgeHoursAtReferral: 36,
    phototherapyRecommended: true,
    createdAt: new Date(Date.now() - 3600000 * 1),
  },
];

if (memoryReferrals.length === 0) {
  memoryReferrals.push(...(SEED_REFERRALS as any));
}

export class ReferralsService {
  static async createReferral(
    data: {
      babyId: string;
      babyName: string;
      babyUhid: string;
      dateOfBirth: Date | string;
      gestationalAgeWeeks?: number;
      referringDoctorId?: string;
      referringDoctorName?: string;
      referringCentreName?: string;
      receivingHospitalId: string;
      receivingHospitalName?: string;
      urgency?: ReferralUrgency;
      clinicalSummary: string;
      latestBilirubinValue: number;
      latestBilirubinUnit?: string;
      latestBhutaniRiskZone?: string;
      postnatalAgeHoursAtReferral?: number;
    },
    user?: any
  ) {
    const userFacility = (user?.facility || data.referringCentreName || 'PGI').trim();
    const userFacilityUpper = userFacility.toUpperCase();

    let receivingHospitalName = (data.receivingHospitalName || '').trim();
    let receivingHospitalId = (data.receivingHospitalId || '').trim();

    // Reliably map hospital name & ID
    const nameUpper = receivingHospitalName.toUpperCase();
    if (nameUpper === 'KGMU') {
      receivingHospitalId = 'hosp_kgmu';
      receivingHospitalName = 'KGMU';
    } else if (nameUpper === 'RML') {
      receivingHospitalId = 'hosp_rml';
      receivingHospitalName = 'RML';
    } else if (nameUpper === 'PGI') {
      receivingHospitalId = 'hosp_pgi';
      receivingHospitalName = 'PGI';
    } else if (receivingHospitalId === 'hosp_kgmu') {
      receivingHospitalName = 'KGMU';
    } else if (receivingHospitalId === 'hosp_rml') {
      receivingHospitalName = 'RML';
    } else if (receivingHospitalId === 'hosp_pgi') {
      receivingHospitalName = 'PGI';
    }

    if (receivingHospitalName.toUpperCase() === userFacilityUpper) {
      throw new BadRequestError('Cannot refer patient to the same hospital');
    }

    // Hospital Isolation & Ownership verification: Only the current owning hospital can initiate a referral
    if (isMongoConnected) {
      const baby = await BabyModel.findOne({
        $or: [
          { uhid: data.babyUhid?.toUpperCase()?.trim() },
          { _id: data.babyId && data.babyId.match(/^[0-9a-fA-F]{24}$/) ? data.babyId : undefined },
        ],
      });

      if (baby) {
        const ownerHospital = (baby.currentHospital || baby.facility || '').trim().toUpperCase();
        if (ownerHospital && ownerHospital !== userFacilityUpper) {
          throw new ForbiddenError(
            `Only the current owning hospital (${ownerHospital}) can initiate a referral for this baby`
          );
        }
        if (baby.referralStatus === 'pending') {
          throw new BadRequestError(
            `Baby already has an active pending referral to ${baby.referredToHospitalName || 'another hospital'}. Cannot create another referral until resolved.`
          );
        }
      }
    }

    const sentTimestamp = new Date();
    const referralId = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRef: any = {
      referralId,
      babyId: data.babyId,
      babyName: data.babyName,
      babyUhid: data.babyUhid.toUpperCase().trim(),
      dateOfBirth: new Date(data.dateOfBirth),
      gestationalAgeWeeks: data.gestationalAgeWeeks || 38,
      referringDoctorId: user?.userId || data.referringDoctorId,
      referringDoctorName: user?.name || data.referringDoctorName || `${userFacility} Attending`,
      referringCentreName: userFacility,
      receivingHospitalId: receivingHospitalId || 'hosp_kgmu',
      receivingHospitalName: receivingHospitalName || 'KGMU',
      status: 'pending' as ReferralStatus,
      urgency: data.urgency || 'routine',
      clinicalSummary: data.clinicalSummary || '',
      latestBilirubinValue: data.latestBilirubinValue,
      latestBilirubinUnit: data.latestBilirubinUnit || 'mg/dL',
      latestBhutaniRiskZone: data.latestBhutaniRiskZone || 'high_intermediate',
      postnatalAgeHoursAtReferral: data.postnatalAgeHoursAtReferral || 40,
      phototherapyRecommended: true,
      timeline: [
        {
          status: 'pending',
          timestamp: sentTimestamp,
          performedBy: user?.name || `${userFacility} Attending`,
        },
      ],
      createdAt: sentTimestamp,
      updatedAt: sentTimestamp,
    };

    if (isMongoConnected) {
      try {
        const created = await ReferralModel.create(newRef);
        newRef._id = created._id;
        // Do NOT change currentHospital while referral is pending!
        // The baby still belongs to referring facility, but gains pending referral status & sent timestamp
        await BabyModel.findOneAndUpdate(
          { uhid: data.babyUhid.toUpperCase().trim() },
          { 
            $set: {
              referralStatus: 'pending',
              referredToHospitalName: receivingHospitalName,
              referredToHospitalId: receivingHospitalId,
              referralSentAt: sentTimestamp,
              activeReferralId: referralId,
              updatedAt: sentTimestamp,
            },
          }
        );
      } catch (err) {
        console.warn('[ReferralsService] MongoDB create referral failed, using memory:', err);
      }
    }

    if (!newRef._id) {
      newRef._id = 'ref_' + Date.now();
    }
    memoryReferrals.unshift(newRef);

    // Notify receiving hospital
    await NotificationsService.createNotification({
      recipientRole: 'hospital_doctor',
      hospitalId: data.receivingHospitalId,
      title: `New Referral: ${data.babyName} (${data.babyUhid})`,
      message: `Incoming referral from ${newRef.referringCentreName} for Baby ${data.babyName}. Bilirubin: ${data.latestBilirubinValue} ${newRef.latestBilirubinUnit}.`,
      type: 'referral_created',
      relatedBabyUhid: data.babyUhid,
      relatedReferralId: referralId,
    }).catch(() => {});

    return newRef;
  }

  static async listReferrals(
    query: {
      hospitalId?: string;
      centreName?: string;
      type?: 'sended' | 'sent' | 'incoming';
      status?: ReferralStatus;
    },
    userFacility?: string
  ) {
    const facility = userFacility || query.centreName || query.hospitalId;

    if (isMongoConnected) {
      try {
        const mongoQuery: any = {};

        if (query.type === 'sended' || query.type === 'sent') {
          if (facility) {
            mongoQuery.referringCentreName = new RegExp(`^${facility}$`, 'i');
          }
        } else if (query.type === 'incoming') {
          if (facility) {
            mongoQuery.$or = [
              { receivingHospitalName: new RegExp(`^${facility}$`, 'i') },
              { receivingHospitalId: facility },
              { receivingHospitalId: `hosp_${facility.toLowerCase()}` },
            ];
          }
        } else if (facility) {
          mongoQuery.$or = [
            { referringCentreName: new RegExp(`^${facility}$`, 'i') },
            { receivingHospitalName: new RegExp(`^${facility}$`, 'i') },
            { receivingHospitalId: facility },
            { receivingHospitalId: `hosp_${facility.toLowerCase()}` },
          ];
        }

        if (query.status) {
          mongoQuery.status = query.status;
        }

        const items = await ReferralModel.find(mongoQuery).sort({ createdAt: -1 }).lean();
        if (items && items.length >= 0) return items;
      } catch (err) {
        console.warn('[ReferralsService] MongoDB listReferrals failed:', err);
      }
    }

    let list = memoryReferrals;
    if (query.type === 'sended' || query.type === 'sent') {
      if (facility) {
        list = list.filter((r) => r.referringCentreName?.toUpperCase() === facility.toUpperCase());
      }
    } else if (query.type === 'incoming') {
      if (facility) {
        list = list.filter(
          (r) =>
            r.receivingHospitalName?.toUpperCase() === facility.toUpperCase() ||
            String(r.receivingHospitalId) === String(facility) ||
            String(r.receivingHospitalId) === `hosp_${facility.toLowerCase()}`
        );
      }
    } else if (facility) {
      list = list.filter(
        (r) =>
          r.referringCentreName?.toUpperCase() === facility.toUpperCase() ||
          r.receivingHospitalName?.toUpperCase() === facility.toUpperCase() ||
          String(r.receivingHospitalId) === String(facility)
      );
    }

    if (query.status) {
      list = list.filter((r) => r.status === query.status);
    }
    return list;
  }

  static async getById(id: string): Promise<any> {
    if (isMongoConnected) {
      try {
        const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { referralId: id };
        const found = await ReferralModel.findOne(query).lean();
        if (found) return found;
      } catch {}
    }

    const found = memoryReferrals.find(
      (r) => (r as any)._id === id || r.referralId === id || r.id === id
    );
    if (!found) throw new NotFoundError('Referral not found');
    return found;
  }

  static async acceptReferral(
    id: string,
    doctorName: string = 'Attending Physician',
    user?: any
  ) {
    const ref = await this.getById(id);
    if (ref.status !== 'pending') {
      throw new BadRequestError(`Cannot accept referral in '${ref.status}' status`);
    }

    const userFacility = (user?.facility || '').trim().toUpperCase();
    const targetHospital = (ref.receivingHospitalName || '').trim().toUpperCase();
    if (userFacility && targetHospital && userFacility !== targetHospital) {
      throw new ForbiddenError(
        `Only the designated receiving hospital (${ref.receivingHospitalName}) can accept this referral`
      );
    }

    const acceptanceTime = new Date();
    ref.status = 'accepted';
    ref.reviewedByDoctorName = doctorName;
    ref.reviewedAt = acceptanceTime;
    (ref as any).updatedAt = acceptanceTime;

    if (isMongoConnected) {
      try {
        await ReferralModel.findOneAndUpdate(
          { referralId: ref.referralId },
          {
            $set: {
              status: 'accepted',
              reviewedByDoctorName: doctorName,
              reviewedAt: acceptanceTime,
              updatedAt: acceptanceTime,
            },
            $push: {
              timeline: {
                status: 'accepted',
                timestamp: acceptanceTime,
                performedBy: doctorName,
              },
            },
          }
        );

        // Atomic ownership transfer to receiving hospital:
        // Clear pending outgoing referral fields and establish receiver as active owner
        await BabyModel.findOneAndUpdate(
          { uhid: ref.babyUhid },
          {
            $set: {
              currentHospital: ref.receivingHospitalName,
              currentHospitalId: ref.receivingHospitalId,
              referralStatus: 'accepted',
              referralAcceptedAt: acceptanceTime,
              acceptedAt: acceptanceTime,
              updatedAt: acceptanceTime,
            },
            $unset: {
              referredToHospitalName: 1,
              referredToHospitalId: 1,
              referralSentAt: 1,
              activeReferralId: 1,
            },
          }
        );
      } catch (err) {
        console.warn('[ReferralsService] MongoDB acceptReferral failed:', err);
      }
    }

    // Keep memory cache updated
    const memIdx = memoryReferrals.findIndex((r) => r.referralId === ref.referralId);
    if (memIdx >= 0) {
      memoryReferrals[memIdx] = { ...memoryReferrals[memIdx], ...ref };
    }

    return ref;
  }

  static async rejectReferral(
    id: string,
    reason: string,
    doctorName: string = 'Attending Physician',
    user?: any
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('A clinical or operational rejection reason is required');
    }

    const ref = await this.getById(id);
    if (ref.status !== 'pending') {
      throw new BadRequestError(`Cannot reject referral in '${ref.status}' status`);
    }

    const userFacility = (user?.facility || '').trim().toUpperCase();
    const targetHospital = (ref.receivingHospitalName || '').trim().toUpperCase();
    if (userFacility && targetHospital && userFacility !== targetHospital) {
      throw new ForbiddenError(
        `Only the designated receiving hospital (${ref.receivingHospitalName}) can reject this referral`
      );
    }

    const rejectionTime = new Date();
    ref.status = 'rejected';
    ref.rejectionReason = reason;
    ref.reviewedByDoctorName = doctorName;
    ref.reviewedAt = rejectionTime;
    (ref as any).updatedAt = rejectionTime;

    if (isMongoConnected) {
      try {
        await ReferralModel.findOneAndUpdate(
          { referralId: ref.referralId },
          {
            $set: {
              status: 'rejected',
              rejectionReason: reason,
              reviewedByDoctorName: doctorName,
              reviewedAt: rejectionTime,
              updatedAt: rejectionTime,
            },
            $push: {
              timeline: {
                status: 'rejected',
                timestamp: rejectionTime,
                performedBy: doctorName,
                notes: reason,
              },
            },
          }
        );

        // Sender retains ownership; clear pending referral state on baby so card returns to active normal state
        await BabyModel.findOneAndUpdate(
          { uhid: ref.babyUhid },
          {
            $set: {
              referralStatus: 'rejected',
              updatedAt: rejectionTime,
            },
            $unset: {
              referredToHospitalName: 1,
              referredToHospitalId: 1,
              referralSentAt: 1,
              activeReferralId: 1,
            },
          }
        );
      } catch (err) {
        console.warn('[ReferralsService] MongoDB rejectReferral failed:', err);
      }
    }

    const memIdx = memoryReferrals.findIndex((r) => r.referralId === ref.referralId);
    if (memIdx >= 0) {
      memoryReferrals[memIdx] = { ...memoryReferrals[memIdx], ...ref };
    }

    return ref;
  }

  static async requestClarification(id: string, question: string, doctorName: string = 'Dr. Hospital Paediatrician') {
    if (!question || question.trim().length === 0) {
      throw new BadRequestError('Clarification question text is required');
    }
    const ref = await this.getById(id);
    ref.status = 'clarification_requested' as ReferralStatus;
    (ref as any).clarificationNotes = question;
    ref.reviewedByDoctorName = doctorName;
    ref.reviewedAt = new Date();
    (ref as any).updatedAt = new Date();

    if (isMongoConnected) {
      try {
        await ReferralModel.findOneAndUpdate({ referralId: ref.referralId }, ref);
      } catch {}
    }

    await NotificationsService.createNotification({
      recipientRole: 'referring_doctor',
      centreName: ref.referringCentreName,
      title: `Clarification Requested: ${ref.babyName}`,
      message: `${ref.receivingHospitalName} requested additional details: "${question}"`,
      type: 'referral_created',
      relatedBabyUhid: ref.babyUhid,
      relatedReferralId: ref.referralId,
    });

    return ref;
  }

  static async cancelReferral(id: string, reason: string, cancelledBy: string = 'Referring Doctor') {
    const ref = await this.getById(id);
    ref.status = 'cancelled' as ReferralStatus;
    (ref as any).rejectionReason = reason;
    (ref as any).updatedAt = new Date();

    if (isMongoConnected) {
      try {
        await ReferralModel.findOneAndUpdate({ referralId: ref.referralId }, ref);
        await BabyModel.findOneAndUpdate({ uhid: ref.babyUhid }, { referralStatus: 'none' });
      } catch {}
    }

    await NotificationsService.createNotification({
      recipientRole: 'hospital_doctor',
      hospitalId: String(ref.receivingHospitalId),
      title: `Referral Cancelled: ${ref.babyName}`,
      message: `Referral for ${ref.babyName} (${ref.babyUhid}) was cancelled by ${cancelledBy}. Reason: ${reason}`,
      type: 'referral_rejected',
      relatedBabyUhid: ref.babyUhid,
      relatedReferralId: ref.referralId,
    });

    return ref;
  }

  static async reRefer(id: string, newHospitalId: string, doctorName: string = 'Dr. Referring Doctor') {
    const oldRef = await this.getById(id);
    oldRef.status = 'transferred' as ReferralStatus;
    (oldRef as any).updatedAt = new Date();

    const hospital = await HospitalsService.getHospitalById(newHospitalId);

    const newReferral = await this.createReferral({
      babyId: String(oldRef.babyId),
      babyName: oldRef.babyName,
      babyUhid: oldRef.babyUhid,
      dateOfBirth: oldRef.dateOfBirth,
      gestationalAgeWeeks: oldRef.gestationalAgeWeeks,
      referringDoctorName: doctorName,
      referringCentreName: oldRef.referringCentreName,
      receivingHospitalId: newHospitalId,
      urgency: oldRef.urgency,
      clinicalSummary: `Re-referral from ${oldRef.receivingHospitalName}: ${oldRef.clinicalSummary}`,
      latestBilirubinValue: oldRef.latestBilirubinValue,
      latestBilirubinUnit: oldRef.latestBilirubinUnit,
      latestBhutaniRiskZone: oldRef.latestBhutaniRiskZone,
      postnatalAgeHoursAtReferral: oldRef.postnatalAgeHoursAtReferral,
    });

    (newReferral as any).originalReferralId = oldRef.referralId;
    return newReferral;
  }
}
