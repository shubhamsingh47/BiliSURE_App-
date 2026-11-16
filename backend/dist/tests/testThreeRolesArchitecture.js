"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const User_1 = require("../models/User");
const auth_service_1 = require("../modules/auth/auth.service");
async function runThreeRolesTest() {
    console.log('================================================================');
    console.log('>>> BILISURE: THREE PRIMARY USER ROLES & PERMISSIONS VERIFICATION <<<');
    console.log('================================================================\n');
    // 1. Role Normalization Tests
    console.log('[Test 1] Primary Role Normalization & Legacy Compatibility:');
    const refDocNorm = (0, User_1.normalizeToPrimaryRole)('referring_doctor');
    assert_1.default.strictEqual(refDocNorm.primaryRole, 'doctor_referring');
    console.log('  PASS: "referring_doctor" normalized to "doctor_referring"');
    const hospDocNorm = (0, User_1.normalizeToPrimaryRole)('hospital_doctor');
    assert_1.default.strictEqual(hospDocNorm.primaryRole, 'receiving_hospital');
    assert_1.default.strictEqual(hospDocNorm.permissionProfile, 'clinical');
    console.log('  PASS: "hospital_doctor" normalized to "receiving_hospital" (profile: clinical)');
    const hospNurseNorm = (0, User_1.normalizeToPrimaryRole)('hospital_nurse');
    assert_1.default.strictEqual(hospNurseNorm.primaryRole, 'receiving_hospital');
    assert_1.default.strictEqual(hospNurseNorm.permissionProfile, 'nursing');
    console.log('  PASS: "hospital_nurse" normalized to "receiving_hospital" (profile: nursing)');
    const hospAdminNorm = (0, User_1.normalizeToPrimaryRole)('hospital_admin');
    assert_1.default.strictEqual(hospAdminNorm.primaryRole, 'receiving_hospital');
    assert_1.default.strictEqual(hospAdminNorm.permissionProfile, 'management');
    console.log('  PASS: "hospital_admin" normalized to "receiving_hospital" (profile: management)');
    const distAdminNorm = (0, User_1.normalizeToPrimaryRole)('district_admin');
    assert_1.default.strictEqual(distAdminNorm.primaryRole, 'district_admin');
    console.log('  PASS: "district_admin" preserved as primary role');
    // 2. Permission Resolution Tests
    console.log('\n[Test 2] Configurable Permissions within Primary Roles:');
    const clinicalPerms = (0, User_1.resolvePermissions)('receiving_hospital', 'clinical');
    (0, assert_1.default)(clinicalPerms.includes('manage_referrals'));
    (0, assert_1.default)(clinicalPerms.includes('record_discharge'));
    (0, assert_1.default)(clinicalPerms.includes('allocate_stations'));
    console.log('  PASS: Receiving Hospital (Clinical Profile) granted all clinical + triage permissions');
    const nursingPerms = (0, User_1.resolvePermissions)('receiving_hospital', 'nursing');
    (0, assert_1.default)(nursingPerms.includes('confirm_arrival'));
    (0, assert_1.default)(nursingPerms.includes('enter_bilirubin'));
    (0, assert_1.default)(nursingPerms.includes('manage_treatment'));
    (0, assert_1.default)(!nursingPerms.includes('record_discharge'));
    (0, assert_1.default)(!nursingPerms.includes('manage_staff'));
    console.log('  PASS: Receiving Hospital (Nursing Profile) granted treatment permissions; discharge/staff restricted');
    const mgmtPerms = (0, User_1.resolvePermissions)('receiving_hospital', 'management');
    (0, assert_1.default)(mgmtPerms.includes('register_stations'));
    (0, assert_1.default)(mgmtPerms.includes('manage_station_status'));
    (0, assert_1.default)(mgmtPerms.includes('manage_staff'));
    (0, assert_1.default)(mgmtPerms.includes('view_hospital_analytics'));
    console.log('  PASS: Receiving Hospital (Management Profile) granted station fleet and staff management');
    // 3. User Registration with Primary Roles
    console.log('\n[Test 3] User Authentication & Token Generation for 3 Primary Roles:');
    // Doctor / Referring Centre
    const doctorReg = await auth_service_1.AuthService.register({
        email: `test_doc_${Date.now()}@chc.district.org`,
        password: 'Password123!',
        name: 'Dr. Priya Sharma',
        primaryRole: 'doctor_referring',
        facility: 'North Community Health Centre (CHC)',
    });
    assert_1.default.strictEqual(doctorReg.user.primaryRole, 'doctor_referring');
    (0, assert_1.default)(doctorReg.accessToken);
    console.log('  PASS: Doctor / Referring Centre registered successfully with JWT');
    // Receiving Hospital (Doctor / Clinical)
    const hospClinicalReg = await auth_service_1.AuthService.register({
        email: `test_hosp_doc_${Date.now()}@dch.district.org`,
        password: 'Password123!',
        name: 'Dr. Rajesh Verma',
        primaryRole: 'receiving_hospital',
        permissionProfile: 'clinical',
        facility: 'District Civil Hospital',
    });
    assert_1.default.strictEqual(hospClinicalReg.user.primaryRole, 'receiving_hospital');
    assert_1.default.strictEqual(hospClinicalReg.user.permissionProfile, 'clinical');
    (0, assert_1.default)(hospClinicalReg.user.permissions.includes('manage_referrals'));
    console.log('  PASS: Receiving Hospital (Doctor) registered under "receiving_hospital" primary role');
    // Receiving Hospital (Nurse / Treatment)
    const hospNurseReg = await auth_service_1.AuthService.register({
        email: `test_nurse_${Date.now()}@dch.district.org`,
        password: 'Password123!',
        name: 'Nurse Sunita',
        primaryRole: 'receiving_hospital',
        permissionProfile: 'nursing',
        facility: 'District Civil Hospital',
    });
    assert_1.default.strictEqual(hospNurseReg.user.primaryRole, 'receiving_hospital');
    assert_1.default.strictEqual(hospNurseReg.user.permissionProfile, 'nursing');
    (0, assert_1.default)(hospNurseReg.user.permissions.includes('manage_treatment'));
    console.log('  PASS: Receiving Hospital (Nurse) registered under "receiving_hospital" with nursing profile');
    // District Administrator
    const distAdminReg = await auth_service_1.AuthService.register({
        email: `test_cmo_${Date.now()}@health.gov.in`,
        password: 'Password123!',
        name: 'Dr. A.K. Kapoor (CMO)',
        primaryRole: 'district_admin',
        facility: 'Central District Health Authority',
    });
    assert_1.default.strictEqual(distAdminReg.user.primaryRole, 'district_admin');
    (0, assert_1.default)(distAdminReg.user.permissions.includes('view_district_overview'));
    console.log('  PASS: District Administrator registered under "district_admin" primary role');
    console.log('\n================================================================');
    console.log('>>> ALL THREE PRIMARY ROLES & PERMISSIONS VERIFIED 100%! <<<');
    console.log('================================================================\n');
}
runThreeRolesTest().catch((err) => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
