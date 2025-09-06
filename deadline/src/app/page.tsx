// app/page.tsx
import Link from "next/link";
import DevReschedulerButton from "@/components/ui/DevReschedulerButton";
import TaskList from "@/components/ui/TaskList";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Tasks</h1>
        <div className="flex items-center gap-2">
          <Link href="/tasks/new">
            <Button size="sm">New task</Button>
          </Link>
          {isDev && <DevReschedulerButton />}
        </div>
      </div>
      <TaskList />
    </div>
  );
}