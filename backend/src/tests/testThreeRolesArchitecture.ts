import assert from 'assert';
import {
  normalizeToPrimaryRole,
  resolvePermissions,
  CLINICAL_PERMISSIONS,
  NURSING_PERMISSIONS,
  MANAGEMENT_PERMISSIONS,
  ALL_HOSPITAL_PERMISSIONS,
} from '../models/User';
import { AuthService } from '../modules/auth/auth.service';

async function runThreeRolesTest() {
  console.log('================================================================');
  console.log('>>> BILISURE: THREE PRIMARY USER ROLES & PERMISSIONS VERIFICATION <<<');
  console.log('================================================================\n');

  // 1. Role Normalization Tests
  console.log('[Test 1] Primary Role Normalization & Legacy Compatibility:');
  const refDocNorm = normalizeToPrimaryRole('referring_doctor');
  assert.strictEqual(refDocNorm.primaryRole, 'doctor_referring');
  console.log('  PASS: "referring_doctor" normalized to "doctor_referring"');

  const hospDocNorm = normalizeToPrimaryRole('hospital_doctor');
  assert.strictEqual(hospDocNorm.primaryRole, 'receiving_hospital');
  assert.strictEqual(hospDocNorm.permissionProfile, 'clinical');
  console.log('  PASS: "hospital_doctor" normalized to "receiving_hospital" (profile: clinical)');

  const hospNurseNorm = normalizeToPrimaryRole('hospital_nurse');
  assert.strictEqual(hospNurseNorm.primaryRole, 'receiving_hospital');
  assert.strictEqual(hospNurseNorm.permissionProfile, 'nursing');
  console.log('  PASS: "hospital_nurse" normalized to "receiving_hospital" (profile: nursing)');

  const hospAdminNorm = normalizeToPrimaryRole('hospital_admin');
  assert.strictEqual(hospAdminNorm.primaryRole, 'receiving_hospital');
  assert.strictEqual(hospAdminNorm.permissionProfile, 'management');
  console.log('  PASS: "hospital_admin" normalized to "receiving_hospital" (profile: management)');

  const distAdminNorm = normalizeToPrimaryRole('district_admin');
  assert.strictEqual(distAdminNorm.primaryRole, 'district_admin');
  console.log('  PASS: "district_admin" preserved as primary role');

  // 2. Permission Resolution Tests
  console.log('\n[Test 2] Configurable Permissions within Primary Roles:');
  const clinicalPerms = resolvePermissions('receiving_hospital', 'clinical');
  assert(clinicalPerms.includes('manage_referrals'));
  assert(clinicalPerms.includes('record_discharge'));
  assert(clinicalPerms.includes('allocate_stations'));
  console.log('  PASS: Receiving Hospital (Clinical Profile) granted all clinical + triage permissions');

  const nursingPerms = resolvePermissions('receiving_hospital', 'nursing');
  assert(nursingPerms.includes('confirm_arrival'));
  assert(nursingPerms.includes('enter_bilirubin'));
  assert(nursingPerms.includes('manage_treatment'));
  assert(!nursingPerms.includes('record_discharge'));
  assert(!nursingPerms.includes('manage_staff'));
  console.log('  PASS: Receiving Hospital (Nursing Profile) granted treatment permissions; discharge/staff restricted');

  const mgmtPerms = resolvePermissions('receiving_hospital', 'management');
  assert(mgmtPerms.includes('register_stations'));
  assert(mgmtPerms.includes('manage_station_status'));
  assert(mgmtPerms.includes('manage_staff'));
  assert(mgmtPerms.includes('view_hospital_analytics'));
  console.log('  PASS: Receiving Hospital (Management Profile) granted station fleet and staff management');

  // 3. User Registration with Primary Roles
  console.log('\n[Test 3] User Authentication & Token Generation for 3 Primary Roles:');
  
  // Doctor / Referring Centre
  const doctorReg = await AuthService.register({
    email: `test_doc_${Date.now()}@chc.district.org`,
    password: 'Password123!',
    name: 'Dr. Priya Sharma',
    primaryRole: 'doctor_referring',
    facility: 'North Community Health Centre (CHC)',
  });
  assert.strictEqual(doctorReg.user.primaryRole, 'doctor_referring');
  assert(doctorReg.accessToken);
  console.log('  PASS: Doctor / Referring Centre registered successfully with JWT');

  // Receiving Hospital (Doctor / Clinical)
  const hospClinicalReg = await AuthService.register({
    email: `test_hosp_doc_${Date.now()}@dch.district.org`,
    password: 'Password123!',
    name: 'Dr. Rajesh Verma',
    primaryRole: 'receiving_hospital',
    permissionProfile: 'clinical',
    facility: 'District Civil Hospital',
  });
  assert.strictEqual(hospClinicalReg.user.primaryRole, 'receiving_hospital');
  assert.strictEqual(hospClinicalReg.user.permissionProfile, 'clinical');
  assert(hospClinicalReg.user.permissions.includes('manage_referrals'));
  console.log('  PASS: Receiving Hospital (Doctor) registered under "receiving_hospital" primary role');

  // Receiving Hospital (Nurse / Treatment)
  const hospNurseReg = await AuthService.register({
    email: `test_nurse_${Date.now()}@dch.district.org`,
    password: 'Password123!',
    name: 'Nurse Sunita',
    primaryRole: 'receiving_hospital',
    permissionProfile: 'nursing',
    facility: 'District Civil Hospital',
  });
  assert.strictEqual(hospNurseReg.user.primaryRole, 'receiving_hospital');
  assert.strictEqual(hospNurseReg.user.permissionProfile, 'nursing');
  assert(hospNurseReg.user.permissions.includes('manage_treatment'));
  console.log('  PASS: Receiving Hospital (Nurse) registered under "receiving_hospital" with nursing profile');

  // District Administrator
  const distAdminReg = await AuthService.register({
    email: `test_cmo_${Date.now()}@health.gov.in`,
    password: 'Password123!',
    name: 'Dr. A.K. Kapoor (CMO)',
    primaryRole: 'district_admin',
    facility: 'Central Command',
  });
  assert.strictEqual(distAdminReg.user.primaryRole, 'district_admin');
  assert(distAdminReg.user.permissions.includes('view_district_overview'));
  console.log('  PASS: District Administrator registered under "district_admin" primary role');

  console.log('\n================================================================');
  console.log('>>> ALL THREE PRIMARY ROLES & PERMISSIONS VERIFIED 100%! <<<');
  console.log('================================================================\n');
}

runThreeRolesTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
