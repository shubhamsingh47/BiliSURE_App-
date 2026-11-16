"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesController = void 0;
const devices_service_1 = require("./devices.service");
const response_1 = require("../../common/response");
class DevicesController {
    static async getProfile(req, res, next) {
        try {
            const profile = await devices_service_1.DevicesService.getDeviceProfile();
            (0, response_1.sendSuccess)(res, profile, 200, 'Device profile retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateSettings(req, res, next) {
        try {
            const updated = await devices_service_1.DevicesService.updateCalibrationSettings(req.body);
            (0, response_1.sendSuccess)(res, updated, 200, 'Device settings updated successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async calibrate(req, res, next) {
        try {
            const result = await devices_service_1.DevicesService.triggerCalibration();
            (0, response_1.sendSuccess)(res, result, 200, 'Device calibrated successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async diagnostics(req, res, next) {
        try {
            const diag = await devices_service_1.DevicesService.getDiagnostics();
            (0, response_1.sendSuccess)(res, diag, 200, 'Diagnostics retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DevicesController = DevicesController;
