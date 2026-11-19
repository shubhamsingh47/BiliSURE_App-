import { z } from 'zod';

export const CreateReadingSchema = z
  .object({
    clientOperationId: z.string().min(1).optional().default(() => 'op_rdg_' + Date.now()),
    babyId: z.string().min(1),
    babyUhid: z.string().optional(),
    value: z.coerce.number().positive(),
    unit: z.string().default('mg/dL'),
    method: z.enum(['TSB', 'TcB']).or(z.string()).optional().default('TSB'),
    measurementSite: z
      .string()
      .optional()
      .transform((val) => (val ? val.toLowerCase().replace(/[\s-]+/g, '_') : undefined)),
    source: z.string().optional().default('manual_entry'),
    phototherapyPhase: z.string().optional(),
    operatorName: z.string().optional(),
    symptoms: z.string().optional(),
    riskLevel: z.enum(['low', 'intermediate', 'high']).optional(),
    sampleTimestamp: z.string().datetime().or(z.string().min(4)).optional(),
    timestamp: z.string().datetime().or(z.string().min(4)).optional(),
    isInitial: z.boolean().optional(),
    isDischarge: z.boolean().optional(),
    postnatalAgeHours: z.coerce.number().optional(),
    bhutaniZone: z.string().optional(),
    bhutaniPercentileApprox: z.number().optional(),
  })
  .passthrough();
