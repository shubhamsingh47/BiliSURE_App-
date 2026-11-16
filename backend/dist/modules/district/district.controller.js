"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistrictController = void 0;
const district_service_1 = require("./district.service");
const response_1 = require("../../common/response");
class DistrictController {
    static async getOverview(req, res, next) {
        try {
            const overview = await district_service_1.DistrictService.getOverview();
            return (0, response_1.sendSuccess)(res, overview, 200, 'District statistics retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DistrictController = DistrictController;
