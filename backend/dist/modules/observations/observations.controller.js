"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservationsController = void 0;
const observations_service_1 = require("./observations.service");
const response_1 = require("../../common/response");
class ObservationsController {
    static async list(req, res, next) {
        try {
            const babyId = req.query.babyId;
            const obs = await observations_service_1.ObservationsService.listForBaby(babyId);
            (0, response_1.sendSuccess)(res, obs, 200, 'Observations retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const observerName = req.user?.email ? req.user.email.split('@')[0] : 'Nurse A';
            const obs = await observations_service_1.ObservationsService.create(req.body, observerName);
            (0, response_1.sendSuccess)(res, obs, 201, 'Observation created successfully');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ObservationsController = ObservationsController;
