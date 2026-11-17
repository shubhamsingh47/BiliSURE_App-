"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsService = void 0;
const Referral_1 = require("../../models/Referral");
const Baby_1 = require("../../models/Baby");
const hospitals_service_1 = require("../hospitals/hospitals.service");
const notifications_service_1 = require("../notifications/notifications.service");
const database_1 = require("../../config/database");
const errors_1 = require("../../common/errors");
const memoryReferrals = [];
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
        status: 'accepted',
        urgency: 'urgent',
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
        status: 'pending',
        urgency: 'emergency',
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
    memoryReferrals.push(...SEED_REFERRALS);
}
class ReferralsService {
    static async createReferral(data) {
        const hospital = await hospitals_service_1.HospitalsService.getHospitalById(data.receivingHospitalId);
        if (hospital.isReferralPaused) {
            throw new errors_1.BadRequestError(`Referrals to ${hospital.name} are temporarily paused: ${hospital.pauseReason || 'Department at maximum intake capacity'}`);
        }
        const referralId = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newRef = {
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
            status: 'pending',
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
        if (database_1.isMongoConnected) {
            try {
                await Referral_1.ReferralModel.create(newRef);
                await Baby_1.BabyModel.findOneAndUpdate({ uhid: data.babyUhid }, { referralStatus: 'pending', currentHospital: hospital.name });
            }
            catch { }
        }
        memoryReferrals.unshift(newRef);
        // Notify receiving hospital doctors and admin
        await notifications_service_1.NotificationsService.createNotification({
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
    static async listReferrals(query) {
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
    static async getById(id) {
        const found = memoryReferrals.find((r) => r._id === id || r.referralId === id || r.id === id);
        if (!found)
            throw new errors_1.NotFoundError('Referral not found');
        return found;
    }
    static async acceptReferral(id, doctorName = 'Dr. Hospital Paediatrician') {
        const ref = await this.getById(id);
        if (ref.status !== 'pending') {
            throw new errors_1.BadRequestError(`Cannot accept referral in '${ref.status}' status`);
        }
        ref.status = 'accepted';
        ref.reviewedByDoctorName = doctorName;
        ref.reviewedAt = new Date();
        ref.updatedAt = new Date();
        if (database_1.isMongoConnected) {
            try {
                await Referral_1.ReferralModel.findOneAndUpdate({ referralId: ref.referralId }, ref);
                await Baby_1.BabyModel.findOneAndUpdate({ uhid: ref.babyUhid }, { referralStatus: 'accepted' });
            }
            catch { }
        }
        // Notify Referring Doctor that referral was accepted!
        await notifications_service_1.NotificationsService.createNotification({
            recipientRole: 'referring_doctor',
            centreName: ref.referringCentreName,
            title: `Referral Accepted: ${ref.babyName}`,
            message: `${ref.receivingHospitalName} accepted Baby ${ref.babyName} (${ref.babyUhid}). Ready for transfer.`,
            type: 'referral_accepted',
            relatedBabyUhid: ref.babyUhid,
            relatedReferralId: ref.referralId,
        });
        // Notify Hospital Nurses to prepare arrival & station
        await notifications_service_1.NotificationsService.createNotification({
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
    static async rejectReferral(id, reason, doctorName = 'Dr. Hospital Paediatrician') {
        if (!reason || reason.trim().length === 0) {
            throw new errors_1.BadRequestError('A clinical or operational rejection reason is required');
        }
        const ref = await this.getById(id);
        if (ref.status !== 'pending') {
            throw new errors_1.BadRequestError(`Cannot reject referral in '${ref.status}' status`);
        }
        ref.status = 'rejected';
        ref.rejectionReason = reason;
        ref.reviewedByDoctorName = doctorName;
        ref.reviewedAt = new Date();
        ref.updatedAt = new Date();
        if (database_1.isMongoConnected) {
            try {
                await Referral_1.ReferralModel.findOneAndUpdate({ referralId: ref.referralId }, ref);
                await Baby_1.BabyModel.findOneAndUpdate({ uhid: ref.babyUhid }, { referralStatus: 'rejected' });
            }
            catch { }
        }
        // Notify referring doctor
        await notifications_service_1.NotificationsService.createNotification({
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
    static async requestClarification(id, question, doctorName = 'Dr. Hospital Paediatrician') {
        if (!question || question.trim().length === 0) {
            throw new errors_1.BadRequestError('Clarification question text is required');
        }
        const ref = await this.getById(id);
        ref.status = 'clarification_requested';
        ref.clarificationNotes = question;
        ref.reviewedByDoctorName = doctorName;
        ref.reviewedAt = new Date();
        ref.updatedAt = new Date();
        if (database_1.isMongoConnected) {
            try {
                await Referral_1.ReferralModel.findOneAndUpdate({ referralId: ref.referralId }, ref);
            }
            catch { }
        }
        await notifications_service_1.NotificationsService.createNotification({
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
    static async cancelReferral(id, reason, cancelledBy = 'Referring Doctor') {
        const ref = await this.getById(id);
        ref.status = 'cancelled';
        ref.rejectionReason = reason;
        ref.updatedAt = new Date();
        if (database_1.isMongoConnected) {
            try {
                await Referral_1.ReferralModel.findOneAndUpdate({ referralId: ref.referralId }, ref);
                await Baby_1.BabyModel.findOneAndUpdate({ uhid: ref.babyUhid }, { referralStatus: 'none' });
            }
            catch { }
        }
        await notifications_service_1.NotificationsService.createNotification({
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
    static async reRefer(id, newHospitalId, doctorName = 'Dr. Referring Doctor') {
        const oldRef = await this.getById(id);
        oldRef.status = 'transferred';
        oldRef.updatedAt = new Date();
        const hospital = await hospitals_service_1.HospitalsService.getHospitalById(newHospitalId);
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
        newReferral.originalReferralId = oldRef.referralId;
        return newReferral;
    }
}
exports.ReferralsService = ReferralsService;
