"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2),
    role: zod_1.z
        .enum([
        'doctor_referring',
        'receiving_hospital',
        'district_admin',
        'referring_doctor',
        'hospital_doctor',
        'hospital_nurse',
        'hospital_admin',
        'admin',
        'doctor',
        'nurse',
        'caregiver',
    ])
        .optional(),
    primaryRole: zod_1.z.enum(['doctor_referring', 'receiving_hospital', 'district_admin']).optional(),
    permissionProfile: zod_1.z.enum(['clinical', 'nursing', 'management', 'all']).optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
    department: zod_1.z.string().optional(),
    facility: zod_1.z.string().optional(),
    facilityId: zod_1.z.string().optional(),
    districtId: zod_1.z.string().optional(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
