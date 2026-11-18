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

export type HospitalCode = 'PGI' | 'RML' | 'KGMU';

export const HOSPITAL_USERS: Record<HospitalCode, User> = {
  PGI: {
    id: 'usr_pgi',
    email: 'pgi@hospital.org',
    name: 'PGI Hospital',
    role: 'receiving_hospital',
    primaryRole: 'receiving_hospital',
    permissionProfile: 'all',
    permissions: ALL_HOSPITAL_PERMISSIONS,
    department: 'Neonatology & Pediatrics',
    facility: 'PGI',
    facilityId: 'hosp_pgi',
    districtId: 'dist_lucknow',
  },
  RML: {
    id: 'usr_rml',
    email: 'rml@hospital.org',
    name: 'RML Hospital',
    role: 'receiving_hospital',
    primaryRole: 'receiving_hospital',
    permissionProfile: 'all',
    permissions: ALL_HOSPITAL_PERMISSIONS,
    department: 'Pediatrics & NICU',
    facility: 'RML',
    facilityId: 'hosp_rml',
    districtId: 'dist_lucknow',
  },
  KGMU: {
    id: 'usr_kgmu',
    email: 'kgmu@hospital.org',
    name: 'KGMU Hospital',
    role: 'receiving_hospital',
    primaryRole: 'receiving_hospital',
    permissionProfile: 'all',
    permissions: ALL_HOSPITAL_PERMISSIONS,
    department: 'Pediatric Care & NICU',
    facility: 'KGMU',
    facilityId: 'hosp_kgmu',
    districtId: 'dist_lucknow',
  },
};

// Preset users for the 3 primary roles
export const PRIMARY_PRESET_USERS: Record<PrimaryUserRole, User> = {
  doctor_referring: HOSPITAL_USERS.PGI,
  receiving_hospital: HOSPITAL_USERS.RML,
  district_admin: HOSPITAL_USERS.KGMU,
};

// Full lookup including backward-compatible legacy keys
export const PRESET_USERS: Record<UserRole, User> = {
  doctor_referring: HOSPITAL_USERS.PGI,
  receiving_hospital: HOSPITAL_USERS.PGI,
  district_admin: HOSPITAL_USERS.KGMU,

  // Legacy mappings for seamless compatibility
  referring_doctor: HOSPITAL_USERS.PGI,
  hospital_doctor: HOSPITAL_USERS.PGI,
  hospital_nurse: HOSPITAL_USERS.RML,
  hospital_admin: HOSPITAL_USERS.KGMU,
};

interface AuthState {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  primaryRole: PrimaryUserRole;
  activeHospitalProfile: PermissionProfile;
  activeHospital: HospitalCode;
  setUser: (user: User | null, token: string | null) => void;
  switchHospital: (code: HospitalCode) => void;
  switchRole: (role: UserRole) => void;
  setHospitalPermissionProfile: (profile: PermissionProfile) => void;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: HOSPITAL_USERS.PGI,
  token: 'mock_jwt_token_pgi',
  isAuthenticated: true,
  isLoading: false,
  activeRole: 'receiving_hospital',
  primaryRole: 'receiving_hospital',
  activeHospitalProfile: 'all',
  activeHospital: 'PGI',

  setUser: (user, token) => {
    if (user) {
      const hospitalCode: HospitalCode =
        user.facility === 'RML'
          ? 'RML'
          : user.facility === 'KGMU'
          ? 'KGMU'
          : 'PGI';

      set({
        user,
        token,
        isAuthenticated: !!token,
        activeRole: user.role,
        primaryRole: 'receiving_hospital',
        activeHospitalProfile: user.permissionProfile || 'all',
        activeHospital: hospitalCode,
      });

      if (token) {
        AsyncStorage.setItem('@bilisure_access_token', token);
      }
      AsyncStorage.setItem('@bilisure_user_facility', hospitalCode);
    } else {
      set({
        user: HOSPITAL_USERS.PGI,
        token: null,
        isAuthenticated: false,
        activeRole: 'receiving_hospital',
        primaryRole: 'receiving_hospital',
        activeHospital: 'PGI',
      });
      AsyncStorage.removeItem('@bilisure_access_token');
    }
  },

  switchHospital: (code: HospitalCode) => {
    const newUser = HOSPITAL_USERS[code] || HOSPITAL_USERS.PGI;
    set({
      user: newUser,
      activeRole: 'receiving_hospital',
      primaryRole: 'receiving_hospital',
      activeHospital: code,
      token: `mock_jwt_token_${code.toLowerCase()}`,
    });
    AsyncStorage.setItem('@bilisure_user_facility', code);
    AsyncStorage.setItem('@bilisure_access_token', `mock_jwt_token_${code.toLowerCase()}`);
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
