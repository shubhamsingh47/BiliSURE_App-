"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StationAvailabilityHistoryModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const StationAvailabilityHistorySchema = new mongoose_1.Schema({
    hospitalId: { type: String, required: true, index: true },
    hospitalName: { type: String, required: true },
    district: { type: String, required: true, index: true },
    totalStations: { type: Number, required: true },
    operationalStations: { type: Number, required: true },
    occupiedStations: { type: Number, required: true },
    reservedStations: { type: Number, default: 0 },
    availableStations: { type: Number, required: true },
    cleaningStations: { type: Number, default: 0 },
    maintenanceStations: { type: Number, default: 0 },
    outOfServiceStations: { type: Number, default: 0 },
    changeReason: {
        type: String,
        enum: [
            'allocation',
            'discharge',
            'maintenance_toggle',
            'cleaning_complete',
            'reservation_created',
            'reservation_expired',
        ],
        required: true,
    },
    stationId: { type: String },
    performedBy: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });
exports.StationAvailabilityHistoryModel = mongoose_1.default.models.StationAvailabilityHistory ||
    mongoose_1.default.model('StationAvailabilityHistory', StationAvailabilityHistorySchema);
