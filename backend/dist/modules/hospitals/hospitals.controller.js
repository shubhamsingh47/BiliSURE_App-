"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalsController = void 0;
const hospitals_service_1 = require("./hospitals.service");
const response_1 = require("../../common/response");
class HospitalsController {
    static async list(req, res, next) {
        try {
            const type = req.query.type;
            const hospitals = await hospitals_service_1.HospitalsService.listHospitals(type);
            return (0, response_1.sendSuccess)(res, hospitals, 200, 'Hospitals retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const hospital = await hospitals_service_1.HospitalsService.getHospitalById(String(req.params.id));
            return (0, response_1.sendSuccess)(res, hospital, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getStations(req, res, next) {
        try {
            const stations = await hospitals_service_1.HospitalsService.getStations(String(req.params.id));
            return (0, response_1.sendSuccess)(res, stations, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async createStation(req, res, next) {
        try {
            const station = await hospitals_service_1.HospitalsService.createStation({
                hospitalId: String(req.params.id),
                ...req.body,
            });
            return (0, response_1.sendSuccess)(res, station, 201, 'Station registered successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateStationStatus(req, res, next) {
        try {
            const { status, babyId, babyName, babyUhid, notes } = req.body;
            const station = await hospitals_service_1.HospitalsService.updateStationStatus(String(req.params.stationId), status, {
                babyId,
                babyName,
                babyUhid,
                notes,
            });
            return (0, response_1.sendSuccess)(res, station, 200, `Station status updated to ${status}`);
        }
        catch (err) {
            next(err);
        }
    }
    static async togglePause(req, res, next) {
        try {
            const { isPaused = true, reason } = req.body;
            const hospital = await hospitals_service_1.HospitalsService.togglePauseReferrals(String(req.params.id), Boolean(isPaused), reason);
            return (0, response_1.sendSuccess)(res, hospital, 200, isPaused ? 'Incoming referrals paused for this facility' : 'Referral acceptance resumed');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.HospitalsController = HospitalsController;
