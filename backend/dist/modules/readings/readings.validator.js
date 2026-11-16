"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReadingSchema = void 0;
const zod_1 = require("zod");
exports.CreateReadingSchema = zod_1.z.object({
    clientOperationId: zod_1.z.string().min(1),
    babyId: zod_1.z.string().min(1),
    value: zod_1.z.number().positive(),
    unit: zod_1.z.string().default('mg/dL'),
    measurementSite: zod_1.z.enum(['palms_and_soles', 'face', 'forehead', 'sternum', 'abdomen']).optional(),
    source: zod_1.z.enum(['manual_entry', 'device_transcutaneous', 'serum_lab']).optional(),
    symptoms: zod_1.z.string().optional(),
    riskLevel: zod_1.z.enum(['low', 'intermediate', 'high']).optional(),
    timestamp: zod_1.z.string().datetime().or(zod_1.z.string().min(4)).optional(),
    isInitial: zod_1.z.boolean().optional(),
    isDischarge: zod_1.z.boolean().optional(),
});
