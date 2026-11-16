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
exports.UserModel = exports.ALL_HOSPITAL_PERMISSIONS = exports.MANAGEMENT_PERMISSIONS = exports.NURSING_PERMISSIONS = exports.CLINICAL_PERMISSIONS = void 0;
exports.resolvePermissions = resolvePermissions;
exports.normalizeToPrimaryRole = normalizeToPrimaryRole;
const mongoose_1 = __importStar(require("mongoose"));
exports.CLINICAL_PERMISSIONS = [
    'view_referrals',
    'manage_referrals',
    'confirm_arrival',
    'register_admissions',
    'view_baby_details',
    'view_nomogram',
    'enter_bilirubin',
    'record_observations',
    'allocate_stations',
    'manage_treatment',
    'record_duration',
    'update_patient_status',
    'record_discharge',
    'view_hospital_analytics',
];
exports.NURSING_PERMISSIONS = [
    'view_referrals',
    'confirm_arrival',
    'view_baby_details',
    'view_nomogram',
    'enter_bilirubin',
    'record_observations',
    'allocate_stations',
    'manage_treatment',
    'record_duration',
    'update_patient_status',
];
exports.MANAGEMENT_PERMISSIONS = [
    'view_referrals',
    'register_stations',
    'update_stations',
    'manage_station_status',
    'manage_staff',
    'view_hospital_analytics',
];
exports.ALL_HOSPITAL_PERMISSIONS = Array.from(new Set([...exports.CLINICAL_PERMISSIONS, ...exports.NURSING_PERMISSIONS, ...exports.MANAGEMENT_PERMISSIONS]));
function resolvePermissions(role, permissionProfile, explicitPermissions) {
    if (explicitPermissions && explicitPermissions.length > 0) {
        return explicitPermissions;
    }
    if (role === 'doctor_referring' || role === 'referring_doctor' || role === 'doctor') {
        return ['register_baby', 'enter_bilirubin', 'view_nomogram', 'create_referral', 'view_referrals', 'view_hospital_capacity'];
    }
    if (role === 'district_admin' || role === 'admin') {
        return ['view_district_overview', 'view_all_hospitals', 'view_district_referrals', 'view_reports', 'manage_facilities'];
    }
    if (role === 'receiving_hospital' || role.startsWith('hospital_') || role === 'nurse') {
        if (permissionProfile === 'nursing' || role === 'hospital_nurse' || role === 'nurse') {
            return exports.NURSING_PERMISSIONS;
        }
        if (permissionProfile === 'management' || role === 'hospital_admin') {
            return exports.MANAGEMENT_PERMISSIONS;
        }
        if (permissionProfile === 'all') {
            return exports.ALL_HOSPITAL_PERMISSIONS;
        }
        return exports.CLINICAL_PERMISSIONS;
    }
    return [];
}
function normalizeToPrimaryRole(role) {
    switch (role) {
        case 'referring_doctor':
        case 'doctor':
        case 'doctor_referring':
            return { primaryRole: 'doctor_referring' };
        case 'hospital_doctor':
            return { primaryRole: 'receiving_hospital', permissionProfile: 'clinical' };
        case 'hospital_nurse':
        case 'nurse':
            return { primaryRole: 'receiving_hospital', permissionProfile: 'nursing' };
        case 'hospital_admin':
            return { primaryRole: 'receiving_hospital', permissionProfile: 'management' };
        case 'receiving_hospital':
            return { primaryRole: 'receiving_hospital', permissionProfile: 'clinical' };
        case 'district_admin':
        case 'admin':
        default:
            return { primaryRole: 'district_admin' };
    }
}
const UserSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
        type: String,
        enum: [
            'doctor_referring',
            'receiving_hospital',
            'district_admin',
            'referring_doctor',
            'hospital_doctor',
            'hospital_nurse',
            'hospital_admin',
            'doctor',
            'nurse',
            'admin',
            'caregiver',
        ],
        default: 'doctor_referring',
        index: true,
    },
    primaryRole: {
        type: String,
        enum: ['doctor_referring', 'receiving_hospital', 'district_admin'],
        default: 'doctor_referring',
        index: true,
    },
    permissionProfile: {
        type: String,
        enum: ['clinical', 'nursing', 'management', 'all'],
    },
    permissions: [{ type: String }],
    authorizedRoles: [{ type: String }],
    department: { type: String, default: 'Pediatrics', index: true },
    facility: { type: String, default: 'North Community Health Centre' },
    facilityId: { type: String, index: true },
    districtId: { type: String, index: true },
    isActive: { type: Boolean, default: true },
    isActivated: { type: Boolean, default: true },
    activationOtp: { type: String },
    activationOtpExpiry: { type: Date },
    refreshToken: { type: String },
    lastLoginAt: { type: Date },
}, { timestamps: true });
// Pre-save hook to ensure primaryRole and permissions are always populated
UserSchema.pre('save', function (next) {
    if (!this.primaryRole || !this.permissions || this.permissions.length === 0) {
        const { primaryRole, permissionProfile } = normalizeToPrimaryRole(this.role);
        this.primaryRole = primaryRole;
        if (!this.permissionProfile && permissionProfile) {
            this.permissionProfile = permissionProfile;
        }
        this.permissions = resolvePermissions(this.primaryRole, this.permissionProfile, this.permissions);
    }
    next();
});
exports.UserModel = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
