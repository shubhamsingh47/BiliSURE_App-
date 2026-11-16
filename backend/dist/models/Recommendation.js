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
exports.RecommendationModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RecommendationSchema = new mongoose_1.Schema({
    babyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Baby', required: true, index: true },
    readingId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'BilirubinReading' },
    suggestedAction: {
        type: String,
        enum: ['phototherapy', 'exchange_transfusion', 'continue_monitoring', 'discharge_ready'],
        default: 'phototherapy',
    },
    frequency: { type: String, default: 'Continuous' },
    guidelineReference: { type: String, default: 'AAP 2022 Guidelines for Neonatal Hyperbilirubinemia' },
    source: {
        type: String,
        enum: ['bilisure_automated', 'healthcare_provider'],
        default: 'bilisure_automated',
    },
    providerNotes: { type: String, default: '' },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['suggested', 'accepted', 'overridden', 'completed'],
        default: 'suggested',
    },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });
exports.RecommendationModel = mongoose_1.default.model('Recommendation', RecommendationSchema);
