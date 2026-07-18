import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable().optional(),
  display_name: z.string().nullable().optional(),
  full_name: z.string().nullable().optional(),
  business_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  plan_id: z.string().default("starter"),
  created_at: z.string().optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileUpdateSchema = ProfileSchema.partial().required({ id: true });
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
