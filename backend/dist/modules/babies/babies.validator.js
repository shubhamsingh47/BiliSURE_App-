"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBabySchema = exports.CreateBabySchema = void 0;
const zod_1 = require("zod");
exports.CreateBabySchema = zod_1.z.object({
    uhid: zod_1.z.string().min(3),
    name: zod_1.z.string().min(1),
    parentsName: zod_1.z.string().min(1),
    dateOfBirth: zod_1.z.string().datetime().or(zod_1.z.string().min(4)),
    gestationalAgeWeeks: zod_1.z.number().optional(),
    birthWeightGrams: zod_1.z.number().optional(),
    currentWeightGrams: zod_1.z.number().optional(),
    weight: zod_1.z.number().optional(),
    height: zod_1.z.number().optional(),
    assignedDoctor: zod_1.z.string().optional(),
    facility: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    severityState: zod_1.z.enum(['normal', 'moderate', 'critical']).optional(),
    status: zod_1.z.enum(['admitted', 'under_treatment', 'in_observation', 'discharged']).optional(),
    initialValue: zod_1.z.number().optional(),
    dischargeValue: zod_1.z.number().optional(),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.QueryBabySchema = zod_1.z.object({
    department: zod_1.z.string().optional(),
    severityState: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
