// prisma/seed.ts
import { PrismaClient, TaskStatus } from "@prisma/client";
import { ulid } from "ulid";

const prisma = new PrismaClient();
const DEMO_USER = "demo-user";

// helper: now + N hours (ISO)
function isoIn(hoursFromNow: number) {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + hoursFromNow);
  return d.toISOString();
}

async function main() {
  // 1) Ensure demo user exists (idempotent)
  await prisma.user.upsert({
    where: { id: DEMO_USER },
    update: {},
    create: { id: DEMO_USER },
  });

  // 2) Make seed idempotent for local dev by clearing existing demo tasks
  await prisma.task.deleteMany({ where: { userId: DEMO_USER } });

  // 3) Insert a few valid tasks (all future dueAt; PENDING)
  const tasks = [
    {
      id: ulid(),
      userId: DEMO_USER,
      title: "Project report",
      course: "COP3530",
      description: "Intro + outline",
      dueAt: new Date(isoIn(24 * 7 + 2)), // ~1 week + 2h
      estHours: 4,
      weight: 1,
      status: "PENDING" as TaskStatus,
    },
    {
      id: ulid(),
      userId: DEMO_USER,
      title: "Homework Set 3",
      course: "STA2023",
      description: "Problems 1–5",
      dueAt: new Date(isoIn(24 * 3 + 3)),
      estHours: 2,
      weight: 2,
      status: "PENDING" as TaskStatus,
    },
    {
      id: ulid(),
      userId: DEMO_USER,
      title: "Lab write-up",
      course: null,
      description: null,
      dueAt: new Date(isoIn(24 * 10 + 1)),
      estHours: 3,
      weight: 1,
      status: "PENDING" as TaskStatus,
    },
  ];

  await prisma.task.createMany({ data: tasks, skipDuplicates: true });

  console.log(`✅ Seeded "${DEMO_USER}" with ${tasks.length} tasks`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
