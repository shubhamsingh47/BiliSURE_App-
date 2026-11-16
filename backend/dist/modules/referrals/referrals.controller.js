"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsController = void 0;
const referrals_service_1 = require("./referrals.service");
const response_1 = require("../../common/response");
class ReferralsController {
    static async create(req, res, next) {
        try {
            const referral = await referrals_service_1.ReferralsService.createReferral(req.body);
            return (0, response_1.sendSuccess)(res, referral, 201, 'Referral created and hospital notified');
        }
        catch (err) {
            next(err);
        }
    }
    static async list(req, res, next) {
        try {
            const { hospitalId, centreName, status } = req.query;
            const referrals = await referrals_service_1.ReferralsService.listReferrals({
                hospitalId: hospitalId ? String(hospitalId) : undefined,
                centreName: centreName ? String(centreName) : undefined,
                status,
            });
            return (0, response_1.sendSuccess)(res, referrals, 200, 'Referrals retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const referral = await referrals_service_1.ReferralsService.getById(String(req.params.id));
            return (0, response_1.sendSuccess)(res, referral, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async accept(req, res, next) {
        try {
            const doctorName = req.user?.name || req.body.doctorName || 'Dr. Hospital Paediatrician';
            const referral = await referrals_service_1.ReferralsService.acceptReferral(String(req.params.id), doctorName);
            return (0, response_1.sendSuccess)(res, referral, 200, 'Referral accepted successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async reject(req, res, next) {
        try {
            const { reason, doctorName } = req.body;
            const referral = await referrals_service_1.ReferralsService.rejectReferral(String(req.params.id), String(reason), doctorName || req.user?.name || 'Dr. Hospital Paediatrician');
            return (0, response_1.sendSuccess)(res, referral, 200, 'Referral declined with reason recorded');
        }
        catch (err) {
            next(err);
        }
    }
    static async clarify(req, res, next) {
        try {
            const { question, doctorName } = req.body;
            const referral = await referrals_service_1.ReferralsService.requestClarification(String(req.params.id), String(question), doctorName || 'Dr. Hospital Paediatrician');
            return (0, response_1.sendSuccess)(res, referral, 200, 'Clarification requested from referring centre');
        }
        catch (err) {
            next(err);
        }
    }
    static async cancel(req, res, next) {
        try {
            const { reason, cancelledBy } = req.body;
            const referral = await referrals_service_1.ReferralsService.cancelReferral(String(req.params.id), String(reason || 'Patient transferred locally'), cancelledBy || 'Referring Doctor');
            return (0, response_1.sendSuccess)(res, referral, 200, 'Referral cancelled');
        }
        catch (err) {
            next(err);
        }
    }
    static async reRefer(req, res, next) {
        try {
            const { newHospitalId, doctorName } = req.body;
            const referral = await referrals_service_1.ReferralsService.reRefer(String(req.params.id), String(newHospitalId), doctorName || 'Dr. Referring Doctor');
            return (0, response_1.sendSuccess)(res, referral, 201, 'Re-referral dispatched to new receiving facility');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ReferralsController = ReferralsController;
