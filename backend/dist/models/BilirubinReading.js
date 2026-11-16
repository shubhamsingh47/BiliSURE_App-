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
    babyId: { type: mongoose_1.Schema.Types.Mixed, required: true, index: true },
    babyUhid: { type: String, index: true },
    value: { type: Number, required: true },
    valueMgDl: { type: Number, required: true, default: 0 },
    unit: { type: String, enum: ['mg/dL', 'µmol/L'], default: 'mg/dL' },
    method: { type: String, enum: ['TSB', 'TcB'], default: 'TSB' },
    sampleTimestamp: { type: Date, default: Date.now },
    postnatalAgeHours: { type: Number, default: 24 },
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
    bhutaniZone: {
        type: String,
        enum: ['low', 'low_intermediate', 'high_intermediate', 'high', 'ineligible'],
        default: 'low',
    },
    bhutaniPercentileApprox: { type: Number },
    phototherapyPhase: {
        type: String,
        enum: ['pre_phototherapy', 'during_phototherapy', 'post_phototherapy', 'none'],
        default: 'pre_phototherapy',
    },
    guidelineUsed: { type: String, default: 'AAP 2004 / Bhutani Nomogram' },
    isEligibleForBhutani: { type: Boolean, default: true },
    ineligibilityReason: { type: String },
    deviceId: { type: mongoose_1.Schema.Types.Mixed },
    operatorId: { type: mongoose_1.Schema.Types.Mixed },
    operatorName: { type: String, default: 'Dr. / Nurse' },
    symptoms: { type: String, default: '' },
    riskFactors: [{ type: String }],
    timestamp: { type: Date, default: Date.now, index: true },
    isInitial: { type: Boolean, default: false },
    isDischarge: { type: Boolean, default: false },
    correctionHistory: [
        {
            previousValue: { type: Number, required: true },
            correctedBy: { type: String, required: true },
            reason: { type: String, required: true },
            correctedAt: { type: Date, default: Date.now },
        },
    ],
}, { timestamps: true });
BilirubinReadingSchema.index({ babyId: 1, timestamp: -1 });
exports.BilirubinReadingModel = mongoose_1.default.model('BilirubinReading', BilirubinReadingSchema);
