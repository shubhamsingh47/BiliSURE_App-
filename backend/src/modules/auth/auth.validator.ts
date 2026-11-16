import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z
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
  primaryRole: z.enum(['doctor_referring', 'receiving_hospital', 'district_admin']).optional(),
  permissionProfile: z.enum(['clinical', 'nursing', 'management', 'all']).optional(),
  permissions: z.array(z.string()).optional(),
  department: z.string().optional(),
  facility: z.string().optional(),
  facilityId: z.string().optional(),
  districtId: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
