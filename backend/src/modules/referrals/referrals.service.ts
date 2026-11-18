import { ReferralModel, IReferral, ReferralStatus, ReferralUrgency } from '../../models/Referral';
import { BabyModel } from '../../models/Baby';
import { HospitalsService } from '../hospitals/hospitals.service';
import { NotificationsService } from '../notifications/notifications.service';
import { isMongoConnected } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../common/errors';

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
  static async createReferral(data: {
    babyId: string;
    babyName: string;
    babyUhid: string;
    dateOfBirth: Date | string;
    gestationalAgeWeeks?: number;
    referringDoctorId?: string;
    referringDoctorName?: string;
    referringCentreName?: string;
    receivingHospitalId: string;
    urgency?: ReferralUrgency;
    clinicalSummary: string;
    latestBilirubinValue: number;
    latestBilirubinUnit?: string;
    latestBhutaniRiskZone?: string;
    postnatalAgeHoursAtReferral?: number;
  }) {
    const hospital = await HospitalsService.getHospitalById(data.receivingHospitalId);

    if ((hospital as any).isReferralPaused) {
      throw new BadRequestError(
        `Referrals to ${hospital.name} are temporarily paused: ${(hospital as any).pauseReason || 'Department at maximum intake capacity'}`
      );
    }

    const referralId = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRef: any = {
      _id: 'ref_' + Date.now(),
      referralId,
      babyId: data.babyId,
      babyName: data.babyName,
      babyUhid: data.babyUhid,
      dateOfBirth: new Date(data.dateOfBirth),
      gestationalAgeWeeks: data.gestationalAgeWeeks || 38,
      referringDoctorId: data.referringDoctorId,
      referringDoctorName: data.referringDoctorName || 'Dr. Referring Doctor',
      referringCentreName: data.referringCentreName || 'Community Health Centre',
      receivingHospitalId: data.receivingHospitalId,
      receivingHospitalName: hospital.name,
      status: 'pending' as ReferralStatus,
      urgency: data.urgency || 'urgent',
      clinicalSummary: data.clinicalSummary || 'Bilirubin elevated. Transferred for hospital phototherapy evaluation.',
      latestBilirubinValue: data.latestBilirubinValue,
      latestBilirubinUnit: data.latestBilirubinUnit || 'mg/dL',
      latestBhutaniRiskZone: data.latestBhutaniRiskZone || 'high_intermediate',
      postnatalAgeHoursAtReferral: data.postnatalAgeHoursAtReferral || 40,
      phototherapyRecommended: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongoConnected) {
      try {
        await ReferralModel.create(newRef);
        await BabyModel.findOneAndUpdate(
          { uhid: data.babyUhid },
          { referralStatus: 'pending', currentHospital: hospital.name }
        );
      } catch {}
    }

    memoryReferrals.unshift(newRef);

    // Notify receiving hospital doctors and admin
    await NotificationsService.createNotification({
      recipientRole: 'hospital_doctor',
      hospitalId: data.receivingHospitalId,
      title: `New Referral: ${data.babyName} (${data.babyUhid})`,
      message: `Incoming from ${newRef.referringCentreName}. Bilirubin: ${data.latestBilirubinValue} ${newRef.latestBilirubinUnit} (${data.latestBhutaniRiskZone?.replace('_', ' ').toUpperCase()}). Urgency: ${newRef.urgency.toUpperCase()}.`,
      type: 'referral_created',
      relatedBabyUhid: data.babyUhid,
      relatedReferralId: referralId,
    });

    return newRef;
  }

  static async listReferrals(query: {
    hospitalId?: string;
    centreName?: string;
    status?: ReferralStatus;
  }) {
    let list = memoryReferrals;
    if (query.hospitalId) {
      list = list.filter((r) => String(r.receivingHospitalId) === String(query.hospitalId));
    }
    if (query.centreName) {
      list = list.filter((r) => r.referringCentreName === query.centreName);
    }
    if (query.status) {
      list = list.filter((r) => r.status === query.status);
    }
    return list;
  }

  static async getById(id: string) {
    const found = memoryReferrals.find(
      (r) => (r as any)._id === id || r.referralId === id || r.id === id
    );
    if (!found) throw new NotFoundError('Referral not found');
    return found;
  }

  static async acceptReferral(id: string, doctorName: string = 'Dr. Hospital Paediatrician') {
    const ref = await this.getById(id);
    if (ref.status !== 'pending') {
      throw new BadRequestError(`Cannot accept referral in '${ref.status}' status`);
    }

    ref.status = 'accepted';
    ref.reviewedByDoctorName = doctorName;
    ref.reviewedAt = new Date();
    (ref as any).updatedAt = new Date();

    if (isMongoConnected) {
      try {
        await ReferralModel.findOneAndUpdate({ referralId: ref.referralId }, ref);
        await BabyModel.findOneAndUpdate({ uhid: ref.babyUhid }, { referralStatus: 'accepted' });
      } catch {}
    }

    // Notify Referring Doctor that referral was accepted!
    await NotificationsService.createNotification({
      recipientRole: 'referring_doctor',
      centreName: ref.referringCentreName,
      title: `Referral Accepted: ${ref.babyName}`,
      message: `${ref.receivingHospitalName} accepted Baby ${ref.babyName} (${ref.babyUhid}). Ready for transfer.`,
      type: 'referral_accepted',
      relatedBabyUhid: ref.babyUhid,
      relatedReferralId: ref.referralId,
    });

    // Notify Hospital Nurses to prepare arrival & station
    await NotificationsService.createNotification({
      recipientRole: 'hospital_nurse',
      hospitalId: String(ref.receivingHospitalId),
      title: `Prepare Admission: ${ref.babyName}`,
      message: `Referral accepted by ${doctorName}. Prepare incoming arrival bed.`,
      type: 'referral_accepted',
      relatedBabyUhid: ref.babyUhid,
      relatedReferralId: ref.referralId,
    });

    return ref;
  }

  static async rejectReferral(
    id: string,
    reason: string,
    doctorName: string = 'Dr. Hospital Paediatrician'
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('A clinical or operational rejection reason is required');
    }

    const ref = await this.getById(id);
    if (ref.status !== 'pending') {
      throw new BadRequestError(`Cannot reject referral in '${ref.status}' status`);
    }

    ref.status = 'rejected';
    ref.rejectionReason = reason;
    ref.reviewedByDoctorName = doctorName;
    ref.reviewedAt = new Date();
    (ref as any).updatedAt = new Date();

    if (isMongoConnected) {
      try {
        await ReferralModel.findOneAndUpdate({ referralId: ref.referralId }, ref);
        await BabyModel.findOneAndUpdate({ uhid: ref.babyUhid }, { referralStatus: 'rejected' });
      } catch {}
    }

    // Notify referring doctor
    await NotificationsService.createNotification({
      recipientRole: 'referring_doctor',
      centreName: ref.referringCentreName,
      title: `Referral Declined: ${ref.babyName}`,
      message: `${ref.receivingHospitalName} declined referral. Reason: ${reason}. Please select an alternative facility in the directory.`,
      type: 'referral_rejected',
      relatedBabyUhid: ref.babyUhid,
      relatedReferralId: ref.referralId,
    });

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
