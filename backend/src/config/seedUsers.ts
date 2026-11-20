import bcrypt from 'bcryptjs';
import { UserModel, resolvePermissions } from '../models/User';
import { isMongoConnected } from './database';

export async function seedDefaultUsers() {
  if (!isMongoConnected) {
    console.log('[Database] Skipping user seeding: MongoDB is not connected.');
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const defaultUsers = [
      {
        email: 'pgi@hospital.org',
        passwordHash,
        name: 'PGI Hospital',
        role: 'receiving_hospital',
        primaryRole: 'receiving_hospital',
        permissionProfile: 'all',
        permissions: resolvePermissions('receiving_hospital', 'all'),
        department: 'Neonatology & Pediatrics',
        facility: 'PGI',
        facilityId: 'hosp_pgi',
        districtId: 'dist_lucknow',
        isActive: true,
        isActivated: true,
      },
      {
        email: 'rml@hospital.org',
        passwordHash,
        name: 'RML Hospital',
        role: 'receiving_hospital',
        primaryRole: 'receiving_hospital',
        permissionProfile: 'all',
        permissions: resolvePermissions('receiving_hospital', 'all'),
        department: 'Pediatrics & NICU',
        facility: 'RML',
        facilityId: 'hosp_rml',
        districtId: 'dist_lucknow',
        isActive: true,
        isActivated: true,
      },
      {
        email: 'kgmu@hospital.org',
        passwordHash,
        name: 'KGMU Hospital',
        role: 'receiving_hospital',
        primaryRole: 'receiving_hospital',
        permissionProfile: 'all',
        permissions: resolvePermissions('receiving_hospital', 'all'),
        department: 'Pediatric Care & NICU',
        facility: 'KGMU',
        facilityId: 'hosp_kgmu',
        districtId: 'dist_lucknow',
        isActive: true,
        isActivated: true,
      },
      {
        email: 'admin@bilisure.org',
        passwordHash,
        name: 'Super Administrator',
        role: 'district_admin',
        primaryRole: 'district_admin',
        permissionProfile: 'all',
        permissions: resolvePermissions('district_admin', 'all'),
        department: 'Central Neonatal Command',
        facility: 'District Command',
        districtId: 'dist_lucknow',
        isActive: true,
        isActivated: true,
      },
    ];

    for (const u of defaultUsers) {
      const exists = await UserModel.findOne({ email: u.email });
      if (!exists) {
        await UserModel.create(u);
      }
    }
    console.log('[Database] Default application users verified.');
  } catch (err: any) {
    console.warn('[Database] Seed default users check failed:', err?.message || err);
  }
}
