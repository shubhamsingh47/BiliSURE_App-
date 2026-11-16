import mongoose, { Schema, Document } from 'mongoose';

export type PrimaryUserRole =
  | 'doctor_referring'
  | 'receiving_hospital'
  | 'district_admin';

// Legacy roles supported for backward compatibility
export type LegacyUserRole =
  | 'referring_doctor'
  | 'hospital_doctor'
  | 'hospital_nurse'
  | 'hospital_admin'
  | 'doctor'
  | 'nurse'
  | 'admin'
  | 'caregiver';

export type UserRoleType = PrimaryUserRole | LegacyUserRole;

export type PermissionProfile = 'clinical' | 'nursing' | 'management' | 'all';

export type HospitalPermission =
  // Clinical
  | 'view_referrals'
  | 'manage_referrals'
  | 'confirm_arrival'
  | 'register_admissions'
  | 'view_baby_details'
  | 'view_nomogram'
  | 'enter_bilirubin'
  | 'record_observations'
  | 'allocate_stations'
  | 'manage_treatment'
  | 'record_duration'
  | 'update_patient_status'
  | 'record_discharge'
  // Hospital management
  | 'register_stations'
  | 'update_stations'
  | 'manage_station_status'
  | 'manage_staff'
  | 'view_hospital_analytics';

export const CLINICAL_PERMISSIONS: HospitalPermission[] = [
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

export const NURSING_PERMISSIONS: HospitalPermission[] = [
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

export const MANAGEMENT_PERMISSIONS: HospitalPermission[] = [
  'view_referrals',
  'register_stations',
  'update_stations',
  'manage_station_status',
  'manage_staff',
  'view_hospital_analytics',
];

export const ALL_HOSPITAL_PERMISSIONS: HospitalPermission[] = Array.from(
  new Set([...CLINICAL_PERMISSIONS, ...NURSING_PERMISSIONS, ...MANAGEMENT_PERMISSIONS])
);

export function resolvePermissions(
  role: string,
  permissionProfile?: PermissionProfile,
  explicitPermissions?: string[]
): string[] {
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
      return NURSING_PERMISSIONS;
    }
    if (permissionProfile === 'management' || role === 'hospital_admin') {
      return MANAGEMENT_PERMISSIONS;
    }
    if (permissionProfile === 'all') {
      return ALL_HOSPITAL_PERMISSIONS;
    }
    return CLINICAL_PERMISSIONS;
  }
  return [];
}

export function normalizeToPrimaryRole(role: string): {
  primaryRole: PrimaryUserRole;
  permissionProfile?: PermissionProfile;
} {
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

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: UserRoleType;
  primaryRole: PrimaryUserRole;
  permissionProfile?: PermissionProfile;
  permissions: string[];
  authorizedRoles: UserRoleType[];
  department: string;
  facility: string;
  facilityId?: string;
  districtId?: string;
  isActive: boolean;
  isActivated: boolean;
  activationOtp?: string;
  activationOtpExpiry?: Date;
  refreshToken?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
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
  },
  { timestamps: true }
);

// Pre-save hook to ensure primaryRole and permissions are always populated
UserSchema.pre<IUser>('save', function (next) {
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

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
