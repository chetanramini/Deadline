// src/lib/types.ts
import { z } from "zod";

export const TaskStatus = z.enum(["PENDING", "DONE", "MISSED", "AT_RISK"]);
export const BlockStatus = z.enum(["PLANNED", "DONE", "MISSED", "RESCHEDULED"]);

export const BlockSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  status: BlockStatus, // defaulting handled by BE; FE accepts any valid value
});
export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1).max(120),
  course: z.string().max(40).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  dueAt: z.string().datetime(), // ISO UTC
  estHours: z.number().int().min(1).max(40),
  weight: z.number().int().min(1).max(5),
  status: TaskStatus, // defaulting handled by BE
  blocks: z.array(BlockSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateTaskInputSchema = z.object({
  title: z.string().min(1).max(120),
  course: z.string().max(40).optional(),
  description: z.string().max(500).optional(),
  dueAt: z.string().datetime(), // must be >= now+1h (enforced on BE)
  estHours: z.number().int().min(1).max(40),
  weight: z.number().int().min(1).max(5).default(1),
});

export const PreferencesSchema = z.object({
  workStart: z.number().int().min(0).max(23),
  workEnd: z.number().int().min(0).max(23),
});

export type Task = z.infer<typeof TaskSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;