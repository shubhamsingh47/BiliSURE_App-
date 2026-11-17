import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, PrimaryUserRole, PermissionProfile, HospitalPermission } from '../types';

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

// Preset users for the 3 primary roles
export const PRIMARY_PRESET_USERS: Record<PrimaryUserRole, User> = {
  doctor_referring: {
    id: 'usr_ref_doc',
    email: 'priya.sharma@chc.district.org',
    name: 'Dr. Priya Sharma',
    role: 'doctor_referring',
    primaryRole: 'doctor_referring',
    permissions: ['register_baby', 'enter_bilirubin', 'view_nomogram', 'create_referral', 'view_referrals', 'view_hospital_capacity'],
    department: 'Pediatrics & Neonatal Care',
    facility: 'North Community Health Centre (CHC)',
    facilityId: 'centre_001',
    districtId: 'dist_001',
  },
  receiving_hospital: {
    id: 'usr_hosp_doc',
    email: 'hospital@dch.district.org',
    name: 'District Civil Hospital (NICU / Pediatrics)',
    role: 'receiving_hospital',
    primaryRole: 'receiving_hospital',
    permissionProfile: 'clinical',
    permissions: ALL_HOSPITAL_PERMISSIONS,
    department: 'NICU / Pediatrics',
    facility: 'District Civil Hospital',
    facilityId: 'hosp_001',
    districtId: 'dist_001',
  },
  district_admin: {
    id: 'usr_district_admin',
    email: 'cmo.district@health.gov.in',
    name: 'Dr. A.K. Kapoor (CMO)',
    role: 'district_admin',
    primaryRole: 'district_admin',
    permissions: ['view_district_overview', 'view_all_hospitals', 'view_district_referrals', 'view_reports', 'manage_facilities'],
    department: 'District Health Administration',
    facility: 'Central District Health Network',
    districtId: 'dist_001',
  },
};

// Full lookup including backward-compatible legacy keys
export const PRESET_USERS: Record<UserRole, User> = {
  doctor_referring: PRIMARY_PRESET_USERS.doctor_referring,
  receiving_hospital: PRIMARY_PRESET_USERS.receiving_hospital,
  district_admin: PRIMARY_PRESET_USERS.district_admin,

  // Legacy mappings for seamless compatibility
  referring_doctor: PRIMARY_PRESET_USERS.doctor_referring,
  hospital_doctor: PRIMARY_PRESET_USERS.receiving_hospital,
  hospital_nurse: {
    id: 'usr_nurse_staff',
    email: 'hospital@dch.district.org',
    name: 'District Civil Hospital (NICU / Pediatrics)',
    role: 'receiving_hospital',
    primaryRole: 'receiving_hospital',
    permissionProfile: 'nursing',
    permissions: ALL_HOSPITAL_PERMISSIONS,
    department: 'NICU Phototherapy Unit',
    facility: 'District Civil Hospital',
    facilityId: 'hosp_001',
    districtId: 'dist_001',
  },
  hospital_admin: {
    id: 'usr_hosp_admin',
    email: 'hospital@dch.district.org',
    name: 'District Civil Hospital (NICU / Pediatrics)',
    role: 'receiving_hospital',
    primaryRole: 'receiving_hospital',
    permissionProfile: 'management',
    permissions: ALL_HOSPITAL_PERMISSIONS,
    department: 'Operations & Facilities',
    facility: 'District Civil Hospital',
    facilityId: 'hosp_001',
    districtId: 'dist_001',
  },
};

interface AuthState {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  primaryRole: PrimaryUserRole;
  activeHospitalProfile: PermissionProfile;
  setUser: (user: User | null, token: string | null) => void;
  switchRole: (role: UserRole) => void;
  setHospitalPermissionProfile: (profile: PermissionProfile) => void;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: PRIMARY_PRESET_USERS.doctor_referring,
  token: 'mock_jwt_token',
  isAuthenticated: true,
  isLoading: false,
  activeRole: 'doctor_referring',
  primaryRole: 'doctor_referring',
  activeHospitalProfile: 'clinical',

  setUser: (user, token) => {
    if (user) {
      const primary = user.primaryRole || (
        user.role === 'receiving_hospital' || user.role.startsWith('hospital_')
          ? 'receiving_hospital'
          : user.role === 'district_admin'
          ? 'district_admin'
          : 'doctor_referring'
      );
      set({
        user,
        token,
        isAuthenticated: !!token,
        activeRole: user.role,
        primaryRole: primary,
        activeHospitalProfile: user.permissionProfile || 'clinical',
      });
      AsyncStorage.setItem('@bilisure_user_role', user.role);
    } else {
      set({
        user: PRIMARY_PRESET_USERS.doctor_referring,
        token: null,
        isAuthenticated: false,
        activeRole: 'doctor_referring',
        primaryRole: 'doctor_referring',
      });
    }
  },

  switchRole: (role: UserRole) => {
    const newUser = PRESET_USERS[role] || PRIMARY_PRESET_USERS.doctor_referring;
    const primary = newUser.primaryRole || (
      role === 'receiving_hospital' || role.startsWith('hospital_')
        ? 'receiving_hospital'
        : role === 'district_admin'
        ? 'district_admin'
        : 'doctor_referring'
    );
    set({
      user: newUser,
      activeRole: role,
      primaryRole: primary,
      activeHospitalProfile: newUser.permissionProfile || 'clinical',
    });
    AsyncStorage.setItem('@bilisure_user_role', role);
  },

  setHospitalPermissionProfile: (profile: PermissionProfile) => {
    const current = get().user;
    let permissions = ALL_HOSPITAL_PERMISSIONS;
    let name = 'District Civil Hospital (NICU / Pediatrics)';
    let department = 'NICU / Pediatrics';

    if (profile === 'nursing') {
      department = 'NICU Phototherapy Unit';
    } else if (profile === 'management') {
      department = 'Operations & Facilities';
    }

    const updatedUser: User = {
      ...current,
      role: 'receiving_hospital',
      primaryRole: 'receiving_hospital',
      name,
      department,
      permissionProfile: profile,
      permissions,
    };

    set({
      user: updatedUser,
      activeRole: 'receiving_hospital',
      primaryRole: 'receiving_hospital',
      activeHospitalProfile: profile,
    });
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  },

  logout: async () => {
    await AsyncStorage.removeItem('@bilisure_access_token');
    await AsyncStorage.removeItem('@bilisure_refresh_token');
    await AsyncStorage.removeItem('@bilisure_user_role');
    set({
      user: PRIMARY_PRESET_USERS.doctor_referring,
      token: null,
      isAuthenticated: false,
      activeRole: 'doctor_referring',
      primaryRole: 'doctor_referring',
    });
  },

  initializeAuth: async () => {
    try {
      const storedRole = (await AsyncStorage.getItem('@bilisure_user_role')) as UserRole | null;
      if (storedRole && PRESET_USERS[storedRole]) {
        const u = PRESET_USERS[storedRole];
        set({
          user: u,
          activeRole: storedRole,
          primaryRole: u.primaryRole,
          activeHospitalProfile: u.permissionProfile || 'clinical',
        });
      }
    } catch {}
  },
}));
