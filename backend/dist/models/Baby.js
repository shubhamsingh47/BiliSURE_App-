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
exports.BabyModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BabySchema = new mongoose_1.Schema({
    uhid: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    bilisureId: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    parentsName: { type: String, required: true, trim: true },
    guardianPhone: { type: String, trim: true },
    guardianAddress: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    rhesusFactor: { type: String, enum: ['positive', 'negative', 'unknown'], default: 'unknown' },
    directCoombsTest: { type: String, enum: ['positive', 'negative', 'not_tested'], default: 'not_tested' },
    dateOfBirth: { type: Date, required: true },
    exactTimeOfBirth: { type: String, default: '09:00' },
    gestationalAgeWeeks: { type: Number, default: 38 },
    gestationalAgeDays: { type: Number, default: 0 },
    birthWeightGrams: { type: Number },
    currentWeightGrams: { type: Number },
    weight: { type: Number, default: 3.1 },
    height: { type: Number, default: 49.0 },
    assignedDoctor: { type: String, default: 'Dr. XYZ' },
    facility: { type: String, default: 'Central Children Hospital' },
    department: { type: String, default: 'NICU', index: true },
    referringDoctor: { type: String },
    referringCentre: { type: String },
    currentHospital: { type: String },
    currentStationId: { type: String },
    severityState: {
        type: String,
        enum: ['normal', 'moderate', 'critical'],
        default: 'normal',
        index: true,
    },
    status: {
        type: String,
        enum: ['admitted', 'under_treatment', 'in_observation', 'discharged'],
        default: 'admitted',
        index: true,
    },
    referralStatus: {
        type: String,
        enum: ['none', 'pending', 'accepted', 'rejected', 'admitted'],
        default: 'none',
    },
    initialValue: { type: Number, default: 0 },
    dischargeValue: { type: Number, default: 0 },
    riskFactors: [{ type: String }],
    attachments: [{ type: String }],
    registeredBy: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
BabySchema.index({ department: 1, severityState: 1 });
BabySchema.index({ createdAt: -1 });
exports.BabyModel = mongoose_1.default.model('Baby', BabySchema);
