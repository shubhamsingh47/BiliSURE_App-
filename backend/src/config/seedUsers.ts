import bcrypt from 'bcryptjs';
import { UserModel, resolvePermissions } from '../models/User';

export async function seedDefaultUsers() {
  try {
    const existing = await UserModel.findOne({ email: 'priya.sharma@chc.district.org' });
    if (existing) return;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const defaultUsers = [
      {
        email: 'priya.sharma@chc.district.org',
        passwordHash,
        name: 'Dr. Priya Sharma',
        role: 'doctor_referring',
        primaryRole: 'doctor_referring',
        permissionProfile: 'clinical',
        permissions: resolvePermissions('doctor_referring', 'clinical'),
        department: 'Pediatrics',
        facility: 'North Community Health Centre (CHC)',
        isActive: true,
      },
      {
        email: 'hospital@dch.district.org',
        passwordHash,
        name: 'District Civil Hospital Staff',
        role: 'receiving_hospital',
        primaryRole: 'receiving_hospital',
        permissionProfile: 'all',
        permissions: resolvePermissions('receiving_hospital', 'all'),
        department: 'NICU',
        facility: 'District Civil Hospital',
        isActive: true,
      },
      {
        email: 'cmo.district@health.gov.in',
        passwordHash,
        name: 'Dr. Arvind Saxena (CMO)',
        role: 'district_admin',
        primaryRole: 'district_admin',
        permissionProfile: 'all',
        permissions: resolvePermissions('district_admin', 'all'),
        department: 'District Health Authority',
        facility: 'Central District Health Authority',
        isActive: true,
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
