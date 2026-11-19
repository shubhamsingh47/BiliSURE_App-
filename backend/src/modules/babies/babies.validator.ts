import { z } from 'zod';

export const CreateBabySchema = z.object({
  uhid: z.string().min(3),
  name: z.string().min(1),
  parentsName: z.string().min(1),
  dateOfBirth: z.string().datetime().or(z.string().min(4)),
  gestationalAgeWeeks: z.number().optional(),
  gestationalAgeDays: z.number().int().min(0).max(6).optional(),
  birthWeightGrams: z.number().optional(),
  currentWeightGrams: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  assignedDoctor: z.string().optional(),
  facility: z.string().optional(),
  department: z.string().optional(),
  severityState: z.enum(['normal', 'moderate', 'critical']).optional(),
  status: z.enum(['admitted', 'under_treatment', 'in_observation', 'discharged']).optional(),
  initialValue: z.number().optional(),
  dischargeValue: z.number().optional(),
  attachments: z.array(z.string()).optional(),
});

export const QueryBabySchema = z.object({
  department: z.string().optional(),
  severityState: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
