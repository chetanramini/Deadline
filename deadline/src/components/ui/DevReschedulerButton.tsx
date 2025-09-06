// src/ui/DevReschedulerButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Summary = {
  runAt: string;
  movedBlocks: number;
  affectedTasks: number;
  atRiskTasks: number;
  notes?: string;
};

export default function DevReschedulerButton() {
  const [toast, setToast] = useState<string | null>(null);

  async function run() {
    setToast(null);
    try {
      const res = await fetch("/api/reschedule/nightly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as Summary;
      const msg = `Rescheduled @ ${new Date(data.runAt).toLocaleString()}: moved ${data.movedBlocks} blocks, affected ${data.affectedTasks} tasks, at-risk ${data.atRiskTasks}${data.notes ? ` — ${data.notes}` : ""}.`;
      setToast(msg);
      setTimeout(() => setToast(null), 4000);
    } catch (e: any) {
      setToast(`Rescheduler failed: ${e?.message ?? "unknown error"}`);
      setTimeout(() => setToast(null), 5000);
    }
  }

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" onClick={run}>
        Run rescheduler
      </Button>
      {toast && (
        <div className="fixed right-4 top-16 z-50 rounded-md border bg-background px-3 py-2 text-sm shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
