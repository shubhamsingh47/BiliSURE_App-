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
exports.BilirubinReadingModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BilirubinReadingSchema = new mongoose_1.Schema({
    clientOperationId: { type: String, required: true, unique: true, index: true },
    babyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Baby', required: true, index: true },
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    measurementSite: {
        type: String,
        enum: ['palms_and_soles', 'face', 'forehead', 'sternum', 'abdomen'],
        default: 'palms_and_soles',
    },
    source: {
        type: String,
        enum: ['manual_entry', 'device_transcutaneous', 'serum_lab'],
        default: 'manual_entry',
    },
    deviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Device' },
    operatorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    operatorName: { type: String, default: 'Nurse A' },
    symptoms: { type: String, default: '' },
    riskLevel: {
        type: String,
        enum: ['low', 'intermediate', 'high'],
        default: 'low',
    },
    timestamp: { type: Date, default: Date.now, index: true },
    isInitial: { type: Boolean, default: false },
    isDischarge: { type: Boolean, default: false },
}, { timestamps: true });
BilirubinReadingSchema.index({ babyId: 1, timestamp: -1 });
exports.BilirubinReadingModel = mongoose_1.default.model('BilirubinReading', BilirubinReadingSchema);
