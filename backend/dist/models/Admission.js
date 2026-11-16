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
exports.AdmissionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TreatmentSessionSchema = new mongoose_1.Schema({
    sessionId: { type: String, required: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    phototherapyType: { type: String, default: 'Double Surface LED' },
    irradianceMwCm2: { type: Number, default: 35 },
    nurseName: { type: String, default: 'Nurse' },
    notes: { type: String, default: '' },
    status: {
        type: String,
        enum: ['active', 'completed', 'interrupted'],
        default: 'active',
    },
}, { _id: false });
const AdmissionSchema = new mongoose_1.Schema({
    admissionId: { type: String, required: true, unique: true, uppercase: true, index: true },
    babyId: { type: mongoose_1.Schema.Types.Mixed, required: true, index: true },
    babyUhid: { type: String, required: true, index: true },
    babyName: { type: String, required: true },
    hospitalId: { type: mongoose_1.Schema.Types.Mixed, required: true, index: true },
    hospitalName: { type: String, required: true },
    referralId: { type: mongoose_1.Schema.Types.Mixed },
    physicalArrivalConfirmed: { type: Boolean, default: false },
    arrivalConfirmedAt: { type: Date },
    arrivalConfirmedBy: { type: String },
    ptStationId: { type: String },
    ptStationName: { type: String },
    admittedAt: { type: Date, default: Date.now },
    admissionStatus: {
        type: String,
        enum: ['admitted', 'under_treatment', 'in_observation', 'discharged'],
        default: 'admitted',
        index: true,
    },
    assignedDoctor: { type: String, default: 'Dr. Hospital Paediatrician' },
    primaryNurse: { type: String, default: 'Nurse' },
    initialAdmissionBilirubin: { type: Number, default: 0 },
    cumulativeTreatmentMinutes: { type: Number, default: 0 },
    treatmentSessions: [TreatmentSessionSchema],
    dischargeApprovedByDoctor: { type: String },
    dischargeApprovedAt: { type: Date },
    dischargeBilirubinValue: { type: Number },
    dischargeNotes: { type: String },
    followUpPlan: { type: String },
    dischargedAt: { type: Date },
    stationReleased: { type: Boolean, default: false },
}, { timestamps: true });
AdmissionSchema.index({ hospitalId: 1, admissionStatus: 1 });
exports.AdmissionModel = mongoose_1.default.model('Admission', AdmissionSchema);
