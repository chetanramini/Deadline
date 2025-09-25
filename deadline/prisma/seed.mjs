// prisma/seed.mjs
import { PrismaClient, TaskStatus } from "@prisma/client";
import { ulid } from "ulid";

const prisma = new PrismaClient();
const DEMO_USER = "demo-user";

// helper: Date now + N hours
const hoursFromNow = (h) => new Date(Date.now() + h * 3600_000);

async function main() {
  // 1) Ensure demo user exists (idempotent)
  await prisma.user.upsert({
    where: { id: DEMO_USER },
    update: {},
    create: { id: DEMO_USER },
  });

  // 2) Ensure default preferences exist (idempotent)
  await prisma.preferences.upsert({
    where: { userId: DEMO_USER },
    update: {},
    create: { userId: DEMO_USER, workStart: 16, workEnd: 18 },
  });

  // 3) Clear demo tasks (so seed is deterministic)
  await prisma.task.deleteMany({ where: { userId: DEMO_USER } });

  // 4) Insert demo tasks
  const tasks = [
    {
      id: ulid(),
      userId: DEMO_USER,
      title: "Project report",
      course: "COP3530",
      description: "Intro + outline",
      dueAt: hoursFromNow(24 * 7 + 2),
      estHours: 4,
      weight: 1,
      status: TaskStatus.PENDING,
    },
    {
      id: ulid(),
      userId: DEMO_USER,
      title: "Homework Set 3",
      course: "STA2023",
      description: "Problems 1–5",
      dueAt: hoursFromNow(24 * 3 + 3),
      estHours: 2,
      weight: 2,
      status: TaskStatus.PENDING,
    },
    {
      id: ulid(),
      userId: DEMO_USER,
      title: "Lab write-up",
      course: null,
      description: null,
      dueAt: hoursFromNow(24 * 10 + 1),
      estHours: 3,
      weight: 1,
      status: TaskStatus.PENDING,
    },
  ];

  await prisma.task.createMany({ data: tasks, skipDuplicates: true });

  console.log(`✅ Seed ok: "${DEMO_USER}" with ${tasks.length} tasks and default preferences`);
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
