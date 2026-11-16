"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
const response_1 = require("../../common/response");
class AnalyticsController {
    static async getSummary(req, res, next) {
        try {
            const period = req.query.period || 'Day';
            const summary = await analytics_service_1.AnalyticsService.getSummaryTotal(period);
            (0, response_1.sendSuccess)(res, summary, 200, 'Summary analytics retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async getStories(req, res, next) {
        try {
            const stories = await analytics_service_1.AnalyticsService.getStoryInsights();
            (0, response_1.sendSuccess)(res, stories, 200, 'Stories retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async exportData(req, res, next) {
        try {
            const { dataType, dateRange, format } = req.query;
            const csv = await analytics_service_1.AnalyticsService.generateExportCsv(dataType, dateRange);
            if (format === 'json') {
                (0, response_1.sendSuccess)(res, { csvContent: csv }, 200);
                return;
            }
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=bilisure_export_${Date.now()}.csv`);
            res.status(200).send(csv);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
