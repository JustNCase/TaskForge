import { z } from "zod";

export const EstimateStatus = z.enum([
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
]);
export type EstimateStatus = z.infer<typeof EstimateStatus>;

export const EstimateItemSchema = z.object({
  id: z.string().uuid().optional(),
  estimate_id: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit_price: z.number().min(0).default(0),
  amount: z.number().min(0).default(0),
});
export type EstimateItem = z.infer<typeof EstimateItemSchema>;

export const EstimateSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  client_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  estimate_number: z.string().nullable().optional(),
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  status: EstimateStatus.default("draft"),
  subtotal: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_amount: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  sent_at: z.string().nullable().optional(),
  responded_at: z.string().nullable().optional(),
  items: z.array(EstimateItemSchema).optional(),
  created_at: z.string().optional(),
});
export type Estimate = z.infer<typeof EstimateSchema>;

export const EstimateCreateSchema = EstimateSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
});
export type EstimateCreate = z.infer<typeof EstimateCreateSchema>;

export const EstimateUpdateSchema = EstimateSchema.partial().required({
  id: true,
});
export type EstimateUpdate = z.infer<typeof EstimateUpdateSchema>;
