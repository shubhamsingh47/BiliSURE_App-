import { z } from 'zod';

export const CreateReadingSchema = z.object({
  clientOperationId: z.string().min(1),
  babyId: z.string().min(1),
  value: z.number().positive(),
  unit: z.string().default('mg/dL'),
  measurementSite: z.enum(['palms_and_soles', 'face', 'forehead', 'sternum', 'abdomen']).optional(),
  source: z.enum(['manual_entry', 'device_transcutaneous', 'serum_lab']).optional(),
  symptoms: z.string().optional(),
  riskLevel: z.enum(['low', 'intermediate', 'high']).optional(),
  timestamp: z.string().datetime().or(z.string().min(4)).optional(),
  isInitial: z.boolean().optional(),
  isDischarge: z.boolean().optional(),
});
