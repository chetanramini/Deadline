import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ulid } from "ulid";
import { CreateTaskInputSchema } from "@/src/lib/types";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateTaskInputSchema.parse(body);

    const dueAtDate = new Date(parsed.dueAt);
    const now = new Date();
    if (dueAtDate.getTime() < now.getTime() + 60 * 60 * 1000) {
      return NextResponse.json(
        { message: "dueAt must be at least 1h in the future" },
        { status: 400 }
      );
    }

    const taskId = ulid();
    const userId = "demo-user";

    // Create Task
    const task = await prisma.task.create({
      data: {
        id: taskId,
        userId,
        title: parsed.title,
        course: parsed.course,
        description: parsed.description,
        dueAt: dueAtDate,
        estHours: parsed.estHours,
        weight: parsed.weight,
        status: "PENDING",
      },
    });

    // Allocate 2h (4×30m blocks) ending at dueAt
    const blocks = [];
    const end = dueAtDate;
    for (let i = 4; i > 0; i--) {
      const start = new Date(end.getTime() - i * 30 * 60 * 1000);
      blocks.push({
        id: ulid(),
        taskId,
        start,
        end: new Date(start.getTime() + 30 * 60 * 1000),
        status: "PLANNED" as const,
      });
    }
    await prisma.block.createMany({ data: blocks });

    return NextResponse.json({ ...task, blocks });
  } catch (err: unknown) {
    console.error("POST /api/tasks error:", err);

    if (err instanceof z.ZodError) {
      const msg = err.issues[0]?.message ?? "Invalid request payload";
      return NextResponse.json({ message: msg }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: "demo-user" },
      include: { blocks: true },
      orderBy: { dueAt: "asc" },
    });
    return NextResponse.json({ items: tasks });
  } catch (err: unknown) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}