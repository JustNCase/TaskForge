import { z } from "zod";

export const JobStatus = z.enum([
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);
export type JobStatus = z.infer<typeof JobStatus>;

export const JobType = z.enum([
  "plumbing",
  "electrical",
  "hvac",
  "roofing",
  "painting",
  "general",
  "other",
]);
export type JobType = z.infer<typeof JobType>;

export const JobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  client_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  status: JobStatus.default("scheduled"),
  job_type: JobType.default("general"),
  scheduled_date: z.string().nullable().optional(),
  scheduled_time: z.string().nullable().optional(),
  estimated_hours: z.number().positive().nullable().optional(),
  actual_hours: z.number().positive().nullable().optional(),
  address: z.string().nullable().optional(),
  amount: z.number().min(0).default(0),
  created_at: z.string().optional(),
});
export type Job = z.infer<typeof JobSchema>;

export const JobCreateSchema = JobSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
});
export type JobCreate = z.infer<typeof JobCreateSchema>;

export const JobUpdateSchema = JobSchema.partial().required({ id: true });
export type JobUpdate = z.infer<typeof JobUpdateSchema>;
