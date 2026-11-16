"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const readings_service_1 = require("../readings/readings.service");
const babies_service_1 = require("../babies/babies.service");
const observations_service_1 = require("../observations/observations.service");
class SyncService {
    static async processBatch(operations, userId) {
        const results = [];
        for (const op of operations) {
            try {
                let serverId;
                if (op.entityType === 'reading') {
                    const res = await readings_service_1.ReadingsService.createReading({
                        ...op.payload,
                        clientOperationId: op.operationId,
                    }, userId);
                    serverId = res._id?.toString() || res.id;
                }
                else if (op.entityType === 'baby') {
                    const res = await babies_service_1.BabiesService.createBaby(op.payload, userId);
                    serverId = res._id?.toString() || res.id;
                }
                else if (op.entityType === 'observation') {
                    const res = await observations_service_1.ObservationsService.create({
                        ...op.payload,
                        clientOperationId: op.operationId,
                    });
                    serverId = res._id?.toString() || res.id;
                }
                results.push({
                    operationId: op.operationId,
                    entityType: op.entityType,
                    status: 'synced',
                    serverId,
                    confirmedAt: new Date().toISOString(),
                });
            }
            catch (err) {
                results.push({
                    operationId: op.operationId,
                    entityType: op.entityType,
                    status: 'failed',
                    error: err.message,
                    confirmedAt: new Date().toISOString(),
                });
            }
        }
        return results;
    }
}
exports.SyncService = SyncService;
