// app/tasks/new/page.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateTaskInputSchema } from "@/lib/types";
import { createTask } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { AlertTitle } from "@/components/ui/alert";


export default function NewTaskPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    dueAt: "",
    estHours: 1,
    description: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      setLoading(true);
      const payload = CreateTaskInputSchema.pick({
        title: true,
        dueAt: true,
        estHours: true,
        description: true,
      }).parse({
        title: form.title.trim(),
        dueAt: new Date(form.dueAt).toISOString(), // convert local input → ISO UTC
        estHours: Number(form.estHours),
        description: form.description?.trim() || undefined,
      });
      await createTask({ ...payload, weight: 1 });
      router.push("/");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create task.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">New Task</h1>
      {err && (
        <Alert>
          <AlertTitle>{err}</AlertTitle>
        </Alert>
      )}
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="e.g., Project report"
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Due at</label>
              <Input
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => setForm((s) => ({ ...s, dueAt: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated hours</label>
              <Input
                type="number"
                min={1}
                max={40}
                value={form.estHours}
                onChange={(e) => setForm((s) => ({ ...s, estHours: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Optional details"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Link href="/">
                <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
            </Button>
            </div>
        </form>
      </Card>
    </div>
  );
}