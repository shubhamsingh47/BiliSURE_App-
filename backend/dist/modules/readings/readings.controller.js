"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadingsController = void 0;
const readings_service_1 = require("./readings.service");
const response_1 = require("../../common/response");
class ReadingsController {
    static async getByBaby(req, res, next) {
        try {
            const babyId = Array.isArray(req.params.babyId) ? req.params.babyId[0] : req.params.babyId;
            const readings = await readings_service_1.ReadingsService.getReadingsForBaby(babyId, req.query.timeRange);
            (0, response_1.sendSuccess)(res, readings, 200, 'Readings retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async getLatest(req, res, next) {
        try {
            const babyId = Array.isArray(req.params.babyId) ? req.params.babyId[0] : req.params.babyId;
            const reading = await readings_service_1.ReadingsService.getLatestReadingForBaby(babyId);
            (0, response_1.sendSuccess)(res, reading, 200, 'Latest reading retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const operatorName = req.user?.email ? req.user.email.split('@')[0] : 'Nurse A';
            const reading = await readings_service_1.ReadingsService.createReading(req.body, req.user?.userId, operatorName);
            (0, response_1.sendSuccess)(res, reading, 201, 'Reading recorded successfully');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ReadingsController = ReadingsController;
