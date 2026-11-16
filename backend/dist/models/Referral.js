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
exports.ReferralModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ReferralSchema = new mongoose_1.Schema({
    referralId: { type: String, required: true, unique: true, uppercase: true, index: true },
    babyId: { type: mongoose_1.Schema.Types.Mixed, required: true, index: true },
    babyName: { type: String, required: true },
    babyUhid: { type: String, required: true, index: true },
    dateOfBirth: { type: Date, required: true },
    gestationalAgeWeeks: { type: Number, default: 38 },
    referringDoctorId: { type: mongoose_1.Schema.Types.Mixed },
    referringDoctorName: { type: String, required: true, default: 'Dr. Referring' },
    referringCentreName: { type: String, required: true, default: 'Community Health Centre' },
    receivingHospitalId: { type: mongoose_1.Schema.Types.Mixed, required: true, index: true },
    receivingHospitalName: { type: String, required: true },
    status: {
        type: String,
        enum: [
            'created',
            'sent',
            'pending',
            'accepted',
            'rejected',
            'arrived',
            'admitted',
            'under_treatment',
            'treatment_completed',
            'discharged',
            'cancelled',
            'not_arrived',
            'transferred',
            'clarification_requested',
            'completed',
        ],
        default: 'pending',
        index: true,
    },
    urgency: {
        type: String,
        enum: ['routine', 'urgent', 'emergency'],
        default: 'routine',
    },
    clinicalSummary: { type: String, default: '' },
    latestBilirubinValue: { type: Number, default: 0 },
    latestBilirubinUnit: { type: String, default: 'mg/dL' },
    latestBhutaniRiskZone: { type: String, default: 'low' },
    postnatalAgeHoursAtReferral: { type: Number, default: 24 },
    phototherapyRecommended: { type: Boolean, default: false },
    rejectionReason: { type: String },
    clarificationNotes: { type: String },
    transferredToHospitalName: { type: String },
    transferredToHospitalId: { type: String },
    originalReferralId: { type: String },
    reviewedByDoctorName: { type: String },
    reviewedAt: { type: Date },
    arrivedAt: { type: Date },
    arrivalConfirmedBy: { type: String },
    allocatedStationId: { type: String },
    reservationId: { type: String },
    hasCapacityReservation: { type: Boolean, default: false },
    timeline: [
        {
            status: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            performedBy: { type: String, required: true },
            notes: { type: String },
        },
    ],
}, { timestamps: true });
ReferralSchema.index({ receivingHospitalId: 1, status: 1 });
ReferralSchema.index({ babyUhid: 1, createdAt: -1 });
exports.ReferralModel = mongoose_1.default.models.Referral || mongoose_1.default.model('Referral', ReferralSchema);
