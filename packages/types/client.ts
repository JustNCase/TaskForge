import { z } from "zod";

export const ClientSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});
export type Client = z.infer<typeof ClientSchema>;

export const ClientCreateSchema = ClientSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
});
export type ClientCreate = z.infer<typeof ClientCreateSchema>;

export const ClientUpdateSchema = ClientSchema.partial().required({ id: true });
export type ClientUpdate = z.infer<typeof ClientUpdateSchema>;
