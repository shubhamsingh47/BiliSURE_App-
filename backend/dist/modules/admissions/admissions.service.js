"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionsService = void 0;
const Baby_1 = require("../../models/Baby");
const referrals_service_1 = require("../referrals/referrals.service");
const hospitals_service_1 = require("../hospitals/hospitals.service");
const notifications_service_1 = require("../notifications/notifications.service");
const database_1 = require("../../config/database");
const errors_1 = require("../../common/errors");
const memoryAdmissions = [];
// Seed initial admission for active hospital patient
const SEED_ADMISSIONS = [
    {
        _id: 'adm_seed_001',
        admissionId: 'ADM-2026-0041',
        babyId: '651a00010000000000000001',
        babyUhid: 'M1A2N3S4I5',
        babyName: 'Baby 1',
        hospitalId: 'hosp_001',
        hospitalName: 'District Civil Hospital',
        referralId: 'ref_seed_001',
        physicalArrivalConfirmed: true,
        arrivalConfirmedAt: new Date(Date.now() - 3600000 * 20),
        arrivalConfirmedBy: 'Nurse Sarah',
        ptStationId: 'st_dch_01',
        ptStationName: 'Double LED Tunnel A1',
        admittedAt: new Date(Date.now() - 3600000 * 20),
        admissionStatus: 'under_treatment',
        assignedDoctor: 'Dr. XYZ',
        primaryNurse: 'Nurse Sarah',
        initialAdmissionBilirubin: 14.8,
        treatmentSessions: [
            {
                sessionId: 'sess_001',
                startTime: new Date(Date.now() - 3600000 * 18),
                endTime: new Date(Date.now() - 3600000 * 6),
                durationMinutes: 720,
                phototherapyType: 'Double Surface LED Tunnel',
                irradianceMwCm2: 35,
                nurseName: 'Nurse Sarah',
                notes: 'Baby tolerated session well under continuous eye protection.',
                status: 'completed',
            },
            {
                sessionId: 'sess_002',
                startTime: new Date(Date.now() - 3600000 * 4),
                phototherapyType: 'Double Surface LED Tunnel',
                irradianceMwCm2: 35,
                nurseName: 'Nurse Sarah',
                notes: 'Session in progress. Bilirubin downward trend observed.',
                status: 'active',
            },
        ],
        stationReleased: false,
        createdAt: new Date(Date.now() - 3600000 * 20),
        updatedAt: new Date(),
    },
];
if (memoryAdmissions.length === 0) {
    memoryAdmissions.push(...SEED_ADMISSIONS);
}
class AdmissionsService {
    static async listAdmissions(query) {
        let list = memoryAdmissions;
        if (query.hospitalId) {
            list = list.filter((a) => String(a.hospitalId) === String(query.hospitalId));
        }
        if (query.status) {
            list = list.filter((a) => a.admissionStatus === query.status);
        }
        return list;
    }
    static async getById(id) {
        const found = memoryAdmissions.find((a) => a._id === id || a.admissionId === id || a.id === id);
        if (!found)
            throw new errors_1.NotFoundError('Admission record not found');
        return found;
    }
    static async getByBabyId(babyId) {
        const found = memoryAdmissions.find((a) => String(a.babyId) === String(babyId) || a.babyUhid === babyId);
        return found || null;
    }
    /**
     * Step 17: Confirm physical arrival of baby at hospital
     */
    static async confirmArrival(data) {
        const ref = await referrals_service_1.ReferralsService.getById(data.referralId);
        ref.status = 'arrived';
        ref.arrivedAt = new Date();
        ref.arrivalConfirmedBy = data.nurseName;
        const admissionId = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newAdmission = {
            _id: 'adm_' + Date.now(),
            admissionId,
            babyId: String(ref.babyId),
            babyUhid: ref.babyUhid,
            babyName: ref.babyName,
            hospitalId: String(data.hospitalId || ref.receivingHospitalId),
            hospitalName: ref.receivingHospitalName,
            referralId: String(ref._id || ref.referralId),
            physicalArrivalConfirmed: true,
            arrivalConfirmedAt: new Date(),
            arrivalConfirmedBy: data.nurseName,
            admittedAt: new Date(),
            admissionStatus: 'admitted',
            assignedDoctor: 'Dr. Hospital Paediatrician',
            primaryNurse: data.nurseName,
            initialAdmissionBilirubin: ref.latestBilirubinValue,
            treatmentSessions: [],
            stationReleased: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        memoryAdmissions.unshift(newAdmission);
        // Fulfill any active capacity reservation
        try {
            const { CapacityReservationModel } = require('../../models/CapacityReservation');
            const { HospitalModel } = require('../../models/Hospital');
            await CapacityReservationModel.findOneAndUpdate({ referralId: data.referralId, status: 'active' }, { status: 'fulfilled', fulfilledAt: new Date(), admissionId });
            await HospitalModel.findByIdAndUpdate(newAdmission.hospitalId, {
                $inc: { reservedPTStations: -1 },
            });
        }
        catch (e) { }
        // Notify referring doctor and hospital team
        await notifications_service_1.NotificationsService.createNotification({
            recipientRole: 'referring_doctor',
            centreName: ref.referringCentreName,
            title: `Baby Arrived at Hospital: ${ref.babyName}`,
            message: `Nurse ${data.nurseName} at ${ref.receivingHospitalName} confirmed physical arrival of ${ref.babyName} (${ref.babyUhid}). Admission opened.`,
            type: 'baby_arrived',
            relatedBabyUhid: ref.babyUhid,
            relatedReferralId: ref.referralId,
        });
        return { referral: ref, admission: newAdmission };
    }
    /**
     * Step 19: Allocate PT Station to an admitted baby
     */
    static async allocateStation(data) {
        const admission = await this.getById(data.admissionId);
        if (!admission)
            throw new errors_1.NotFoundError('Admission not found');
        if (admission.ptStationId) {
            throw new errors_1.BadRequestError(`Admission ${data.admissionId} already has an allocated station (${admission.ptStationName})`);
        }
        const hospitalStations = await hospitals_service_1.HospitalsService.getStations(String(admission.hospitalId));
        const alreadyAllocated = hospitalStations.find((s) => s.operationalStatus === 'occupied' && s.currentBabyUhid === admission.babyUhid);
        if (alreadyAllocated) {
            throw new errors_1.BadRequestError(`Patient with UHID ${admission.babyUhid} is already allocated to station ${alreadyAllocated.stationId}`);
        }
        // Update station status to occupied with baby info
        const station = await hospitals_service_1.HospitalsService.updateStationStatus(data.stationId, 'occupied', {
            babyId: String(admission.babyId),
            babyName: admission.babyName,
            babyUhid: admission.babyUhid,
            notes: `Allocated to ${admission.babyName} by ${data.nurseName}`,
        });
        admission.ptStationId = String(station._id || station.stationId);
        admission.ptStationName = `${station.name} (${station.stationId})`;
        admission.admissionStatus = 'under_treatment';
        admission.primaryNurse = data.nurseName;
        admission.updatedAt = new Date();
        // Also update Baby model status
        try {
            if (database_1.isMongoConnected) {
                await Baby_1.BabyModel.findOneAndUpdate({ uhid: admission.babyUhid }, { status: 'under_treatment', currentStationId: station.stationId });
            }
        }
        catch { }
        // Notify care team
        await notifications_service_1.NotificationsService.createNotification({
            recipientRole: 'hospital_doctor',
            hospitalId: String(admission.hospitalId),
            title: `PT Station Allocated: ${admission.babyName}`,
            message: `${admission.babyName} allocated to ${station.name} (${station.stationId}) by ${data.nurseName}. Ready for phototherapy initiation.`,
            type: 'pt_allocated',
            relatedBabyUhid: admission.babyUhid,
        });
        return { admission, station };
    }
    /**
     * Step 20: Start Phototherapy Treatment Session
     */
    static async startTreatmentSession(admissionId, data) {
        const admission = await this.getById(admissionId);
        // If an existing session is active, mark it completed
        admission.treatmentSessions.forEach((s) => {
            if (s.status === 'active') {
                s.status = 'completed';
                s.endTime = new Date();
                s.durationMinutes = Math.max(1, Math.round((s.endTime.getTime() - new Date(s.startTime).getTime()) / 60000));
            }
        });
        const newSession = {
            sessionId: 'sess_' + Date.now(),
            startTime: new Date(),
            phototherapyType: data.phototherapyType || 'Double Surface LED',
            irradianceMwCm2: data.irradianceMwCm2 || 35,
            nurseName: data.nurseName,
            notes: data.notes || 'Phototherapy initiated under continuous monitoring.',
            status: 'active',
        };
        admission.treatmentSessions.push(newSession);
        admission.admissionStatus = 'under_treatment';
        admission.updatedAt = new Date();
        return { admission, session: newSession };
    }
    /**
     * Step 22: Record Session Completion
     */
    static async endTreatmentSession(admissionId, sessionId, data) {
        const admission = await this.getById(admissionId);
        const session = admission.treatmentSessions.find((s) => s.sessionId === sessionId);
        if (!session)
            throw new errors_1.NotFoundError('Treatment session not found');
        session.endTime = new Date();
        session.durationMinutes = Math.max(1, Math.round((session.endTime.getTime() - new Date(session.startTime).getTime()) / 60000));
        session.status = 'completed';
        if (data.notes)
            session.notes = (session.notes ? session.notes + ' | ' : '') + data.notes;
        admission.updatedAt = new Date();
        return { admission, session };
    }
    /**
     * Step 23 & 24: Discharge Approval & Hospital Episode Completion
     */
    static async completeDischarge(admissionId, data) {
        const admission = await this.getById(admissionId);
        admission.dischargeApprovedByDoctor = data.doctorName;
        admission.dischargeApprovedAt = new Date();
        admission.dischargeBilirubinValue = data.dischargeBilirubinValue;
        admission.dischargeNotes = data.dischargeNotes || 'Bilirubin successfully reduced below safe phototherapy threshold.';
        admission.followUpPlan = data.followUpPlan || 'Routine pediatric follow-up in 48 hours for rebound jaundice check.';
        admission.admissionStatus = 'discharged';
        admission.dischargedAt = new Date();
        admission.stationReleased = true;
        // Calculate cumulative delivered treatment duration from actual recorded sessions
        admission.cumulativeTreatmentMinutes = admission.treatmentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        admission.updatedAt = new Date();
        // Step 25: Release the PT station to 'cleaning_prep'
        if (admission.ptStationId) {
            await hospitals_service_1.HospitalsService.updateStationStatus(admission.ptStationId, 'cleaning_prep', {
                notes: `Station freed following discharge of ${admission.babyName}. Ready for sanitization & cleaning.`,
            });
        }
        // Update Baby record
        try {
            if (database_1.isMongoConnected) {
                await Baby_1.BabyModel.findOneAndUpdate({ uhid: admission.babyUhid }, {
                    status: 'discharged',
                    dischargeValue: data.dischargeBilirubinValue,
                    currentStationId: undefined,
                });
            }
        }
        catch { }
        // Notify referring doctor and care team
        await notifications_service_1.NotificationsService.createNotification({
            recipientRole: 'referring_doctor',
            title: `Patient Discharged: ${admission.babyName}`,
            message: `${admission.babyName} (${admission.babyUhid}) discharged by ${data.doctorName}. Discharge bilirubin: ${data.dischargeBilirubinValue} mg/dL. Follow-up: ${admission.followUpPlan}`,
            type: 'discharge_approved',
            relatedBabyUhid: admission.babyUhid,
        });
        return admission;
    }
}
exports.AdmissionsService = AdmissionsService;
