"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionsController = void 0;
const admissions_service_1 = require("./admissions.service");
const response_1 = require("../../common/response");
class AdmissionsController {
    static async list(req, res, next) {
        try {
            const { hospitalId, status } = req.query;
            const admissions = await admissions_service_1.AdmissionsService.listAdmissions({
                hospitalId: hospitalId ? String(hospitalId) : undefined,
                status: status ? String(status) : undefined,
            });
            return (0, response_1.sendSuccess)(res, admissions, 200, 'Admissions retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const admission = await admissions_service_1.AdmissionsService.getById(String(req.params.id));
            return (0, response_1.sendSuccess)(res, admission, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getByBabyId(req, res, next) {
        try {
            const admission = await admissions_service_1.AdmissionsService.getByBabyId(String(req.params.babyId));
            return (0, response_1.sendSuccess)(res, admission, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async confirmArrival(req, res, next) {
        try {
            const nurseName = req.user?.name || req.body.nurseName || 'Nurse Staff';
            const result = await admissions_service_1.AdmissionsService.confirmArrival({
                referralId: String(req.body.referralId),
                nurseName,
                hospitalId: String(req.body.hospitalId),
            });
            return (0, response_1.sendSuccess)(res, result, 201, 'Physical arrival confirmed & admission created');
        }
        catch (err) {
            next(err);
        }
    }
    static async allocateStation(req, res, next) {
        try {
            const nurseName = req.user?.name || req.body.nurseName || 'Nurse Staff';
            const result = await admissions_service_1.AdmissionsService.allocateStation({
                admissionId: String(req.params.id),
                stationId: String(req.body.stationId),
                nurseName,
            });
            return (0, response_1.sendSuccess)(res, result, 200, 'PT Station allocated successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async startSession(req, res, next) {
        try {
            const nurseName = req.user?.name || req.body.nurseName || 'Nurse Staff';
            const result = await admissions_service_1.AdmissionsService.startTreatmentSession(String(req.params.id), {
                phototherapyType: req.body.phototherapyType,
                irradianceMwCm2: req.body.irradianceMwCm2,
                nurseName,
                notes: req.body.notes,
            });
            return (0, response_1.sendSuccess)(res, result, 200, 'Phototherapy treatment session started');
        }
        catch (err) {
            next(err);
        }
    }
    static async endSession(req, res, next) {
        try {
            const nurseName = req.user?.name || req.body.nurseName || 'Nurse Staff';
            const result = await admissions_service_1.AdmissionsService.endTreatmentSession(String(req.params.id), String(req.params.sessionId), {
                nurseName,
                notes: req.body.notes,
            });
            return (0, response_1.sendSuccess)(res, result, 200, 'Treatment session concluded and duration recorded');
        }
        catch (err) {
            next(err);
        }
    }
    static async completeDischarge(req, res, next) {
        try {
            const doctorName = req.user?.name || req.body.doctorName || 'Dr. Hospital Paediatrician';
            const result = await admissions_service_1.AdmissionsService.completeDischarge(String(req.params.id), {
                doctorName,
                dischargeBilirubinValue: Number(req.body.dischargeBilirubinValue),
                dischargeNotes: req.body.dischargeNotes,
                followUpPlan: req.body.followUpPlan,
            });
            return (0, response_1.sendSuccess)(res, result, 200, 'Discharge finalized and station released to cleaning/prep');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdmissionsController = AdmissionsController;
