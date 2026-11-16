"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsController = void 0;
const recommendations_service_1 = require("./recommendations.service");
const response_1 = require("../../common/response");
class RecommendationsController {
    static async getByBaby(req, res, next) {
        try {
            const babyId = Array.isArray(req.params.babyId) ? req.params.babyId[0] : req.params.babyId;
            const bilirubinVal = req.query.bilirubin ? parseFloat(req.query.bilirubin) : 10.0;
            const recs = await recommendations_service_1.RecommendationsService.getForBaby(babyId, bilirubinVal);
            (0, response_1.sendSuccess)(res, recs, 200, 'Recommendations retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.RecommendationsController = RecommendationsController;
