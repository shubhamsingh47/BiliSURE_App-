"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const sync_service_1 = require("./sync.service");
const response_1 = require("../../common/response");
class SyncController {
    static async batch(req, res, next) {
        try {
            const operations = req.body.operations || [];
            const results = await sync_service_1.SyncService.processBatch(operations, req.user?.userId);
            (0, response_1.sendSuccess)(res, results, 200, 'Sync operations processed successfully');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SyncController = SyncController;
