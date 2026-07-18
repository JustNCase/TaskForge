import { z } from "zod";

export const TaskStatus = z.enum(["pending", "in_progress", "completed"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  status: TaskStatus.default("pending"),
  difficulty: z.number().int().min(1).max(10).default(1),
  reward: z.number().int().min(0).default(10),
  completed: z.boolean().default(false),
  category: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).nullable().optional(),
  created_at: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const TaskCreateSchema = TaskSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
});
export type TaskCreate = z.infer<typeof TaskCreateSchema>;

export const TaskUpdateSchema = TaskSchema.partial().required({ id: true });
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;

export const SubtaskSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  completed: z.boolean().default(false),
  sort_order: z.number().int().min(0).nullable().optional(),
  created_at: z.string().optional(),
});
export type Subtask = z.infer<typeof SubtaskSchema>;

export const SubtaskCreateSchema = SubtaskSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
});
export type SubtaskCreate = z.infer<typeof SubtaskCreateSchema>;
