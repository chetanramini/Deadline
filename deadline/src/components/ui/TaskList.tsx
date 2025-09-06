// src/ui/TaskList.tsx
"use client";

import { useEffect, useState } from "react";
import { listTasks } from "@/src/lib/api";
import type { Task } from "@/src/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function fmt(dt: string) {
  const d = new Date(dt);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const items = await listTasks();
        setTasks(items);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load tasks");
      }
    })();
  }, []);

  if (err) {
    return <div className="text-sm text-red-600">{err}</div>;
  }
  if (tasks === null) {
    return <div className="text-sm text-muted-foreground">Loading tasks…</div>;
  }
  if (tasks.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        No tasks yet. Add your first task to see your plan.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((t) => (
        <Card key={t.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{t.title}</div>
            <div className="text-xs text-muted-foreground">
              Due {fmt(t.dueAt)}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Est. {t.estHours}h · Weight {t.weight}
          </div>

          <div className="space-y-2">
            {t.blocks.length === 0 ? (
              <div className="text-xs text-muted-foreground">No blocks yet</div>
            ) : (
              t.blocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="text-sm">
                    {fmt(b.start)} – {fmt(b.end)}
                  </div>
                  <Badge variant="secondary">{b.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}