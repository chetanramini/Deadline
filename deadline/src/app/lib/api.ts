// src/lib/api.ts
import { z } from "zod";
import {
  TaskSchema,
  CreateTaskInputSchema,
  type Task,
  type CreateTaskInput,
} from "./types";

const ListTasksResponseSchema = z.object({
  items: z.array(TaskSchema),
  nextCursor: z.string().optional(),
});

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {}
    throw new Error(`API ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }

  const json = await res.json();
  return schema ? schema.parse(json) : (json as T);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  // validate on FE before sending
  const payload = CreateTaskInputSchema.parse(input);
  return apiFetch<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  }, TaskSchema);
}

export async function listTasks(): Promise<Task[]> {
  const data = await apiFetch("/api/tasks?limit=50&sort=dueAt&dir=asc", undefined, ListTasksResponseSchema);
  return data.items;
}
