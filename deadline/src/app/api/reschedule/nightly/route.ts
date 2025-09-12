import { NextResponse } from "next/server";
import { PrismaClient, BlockStatus, TaskStatus } from "@prisma/client";
import { ulid } from "ulid";

const prisma = new PrismaClient();
const USER_ID = "demo-user";

// --- time helpers (UTC) ---
const MS_30M = 30 * 60 * 1000;
const MS_1H = 2 * MS_30M;
const MS_2H = 4 * MS_30M;

// clamp a date into the [workStart, workEnd) window for *that same day*
function clampToWindowUTC(d: Date, workStart: number, workEnd: number) {
  const out = new Date(d);
  const h = out.getUTCHours();
  if (h < workStart) {
    out.setUTCHours(workStart, 0, 0, 0);
  } else if (h >= workEnd) {
    out.setUTCDate(out.getUTCDate() + 1);
    out.setUTCHours(workStart, 0, 0, 0);
  } else {
    out.setUTCMinutes( Math.floor(out.getUTCMinutes() / 30) * 30, 0, 0); // snap to :00 or :30
  }
  return out;
}

function* windowSlotsUTC(dayStart: Date, workStart: number, workEnd: number) {
  // yields 30-min slot starts for that day within [workStart, workEnd)
  const s = new Date(dayStart);
  s.setUTCHours(workStart, 0, 0, 0);
  const e = new Date(dayStart);
  e.setUTCHours(workEnd, 0, 0, 0);
  for (let t = s.getTime(); t + MS_30M <= e.getTime(); t += MS_30M) {
    yield t;
  }
}

// returns all 30-min slot starts between nowUTC and dueUTC, limited to work window
function collectCandidateSlots(nowUTC: Date, dueUTC: Date, workStart: number, workEnd: number) {
  const slots: number[] = [];
  let cursor = new Date(nowUTC);
  cursor = clampToWindowUTC(cursor, workStart, workEnd);
  while (cursor <= dueUTC) {
    // traverse per day
    const day = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()));
    for (const t of windowSlotsUTC(day, workStart, workEnd)) {
      // only include future slots >= cursor and strictly < dueUTC
      if (t >= cursor.getTime() && t + MS_30M <= dueUTC.getTime()) {
        slots.push(t);
      }
    }
    // next day
    day.setUTCDate(day.getUTCDate() + 1);
    cursor = day;
  }
  return slots.sort((a, b) => a - b);
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

// choose either 4 consecutive slots (2h) or two separate 1h chunks (2 consecutive each)
function planTwoHours(slots: number[], occupied: Set<number>) {
  // helper to check n consecutive free 30m slots starting at index i
  const hasRun = (i: number, n: number) => {
    for (let k = 0; k < n; k++) {
      const ts = slots[i + k];
      if (ts === undefined || occupied.has(ts)) return false;
      // ensure adjacency is consecutive 30m steps
      if (k > 0 && slots[i + k] - slots[i + k - 1] !== MS_30M) return false;
    }
    return true;
  };

  // try a single 2h contiguous (4 slots)
  for (let i = 0; i < slots.length; i++) {
    if (hasRun(i, 4)) {
      return [[slots[i], slots[i] + MS_2H]];
    }
  }

  // else try two 1h contiguous chunks (2+2), non-overlapping
  const oneHours: [number, number][] = [];
  for (let i = 0; i < slots.length; i++) {
    if (hasRun(i, 2)) {
      oneHours.push([slots[i], slots[i] + MS_1H]);
    }
  }
  if (oneHours.length >= 2) {
    // pick earliest two that don't overlap
    for (let i = 0; i < oneHours.length; i++) {
      for (let j = i + 1; j < oneHours.length; j++) {
        const a = oneHours[i];
        const b = oneHours[j];
        if (!overlaps(a[0], a[1], b[0], b[1])) {
          return [a, b];
        }
      }
    }
  }

  // fallback: try four separate 30m free singles
  const singles: [number, number][] = [];
  for (let i = 0; i < slots.length && singles.length < 4; i++) {
    const ts = slots[i];
    if (!occupied.has(ts)) singles.push([ts, ts + MS_30M]);
  }
  if (singles.length === 4) return singles;

  return null;
}

export async function POST() {
  const now = new Date();

  // prefs (defaults per M2 brief)
  const prefs = await prisma.preferences.findUnique({ where: { userId: USER_ID } }).catch(() => null);
  const workStart = prefs?.workStart ?? 16;
  const workEnd = prefs?.workEnd ?? 18;

  // mark overdue planned blocks MISSED (end < now)
  await prisma.block.updateMany({
    where: {
      task: { userId: USER_ID },
      status: "PLANNED",
      end: { lt: now },
    },
    data: { status: "MISSED" },
  });

  // gather all *future* non-missed blocks to avoid overlaps during planning
  const futureBlocks = await prisma.block.findMany({
    where: {
      task: { userId: USER_ID },
      end: { gt: now },
      NOT: { status: "MISSED" },
    },
    select: { start: true, end: true },
  });

  // Build occupied 30-min slot set for future time
  const occupied = new Set<number>();
  for (const b of futureBlocks) {
    const s = new Date(b.start).getTime();
    const e = new Date(b.end).getTime();
    // snap to 30-min grid
    for (let t = s; t < e; t += MS_30M) {
      occupied.add(t);
    }
  }

  // evaluate PENDING/MISSED/AT_RISK tasks; ignore DONE
  const tasks = await prisma.task.findMany({
    where: { userId: USER_ID, NOT: { status: "DONE" } },
    orderBy: { dueAt: "asc" },
  });

  const runAt = new Date().toISOString();
  let tasksEvaluated = 0;
  let tasksUpdated = 0;
  let blocksCreated = 0;
  let atRiskTasks = 0; 

  for (const t of tasks) {
    tasksEvaluated++;

    const due = new Date(t.dueAt);
    if (due <= now) {
      // can't plan in the past; mark at risk
      if (t.status !== "AT_RISK") {
        await prisma.task.update({ where: { id: t.id }, data: { status: "AT_RISK" } });
      }
      atRiskTasks++;
      continue;
    }

    // remove existing future PLANNED blocks for this task; we'll repack
    await prisma.block.deleteMany({
      where: { taskId: t.id, status: "PLANNED", end: { gt: now } },
    });

    // compute candidate 30m slots from now to due within work window
    const slots = collectCandidateSlots(now, due, workStart, workEnd);

    // remove slots already occupied
    const freeSlots = slots.filter((ts) => !occupied.has(ts));

    // plan 2h total as 2h contiguous, else two 1h chunks, else four 30m
    const plan = planTwoHours(freeSlots, occupied);

    if (!plan) {
      // no capacity → mark AT_RISK
      if (t.status !== "AT_RISK") {
        await prisma.task.update({ where: { id: t.id }, data: { status: "AT_RISK" } });
      }
      atRiskTasks++;
      continue;
    }

    // create blocks and mark those slots as occupied
    const newBlocksData = plan.map(([startMs, endMs]) => ({
      id: ulid(),
      taskId: t.id,
      start: new Date(startMs),
      end: new Date(endMs),
      status: "PLANNED" as BlockStatus,
    }));

    if (newBlocksData.length > 0) {
      await prisma.block.createMany({ data: newBlocksData });
      blocksCreated += newBlocksData.length;

      // reserve those slots so later tasks don't overlap
      for (const [s, e] of plan) {
        for (let ts = s; ts < e; ts += MS_30M) {
          occupied.add(ts);
        }
      }

      // if previously AT_RISK and we found capacity, set back to PENDING
      if (t.status === "AT_RISK") {
        await prisma.task.update({ where: { id: t.id }, data: { status: "PENDING" as TaskStatus } });
      }

      tasksUpdated++;
    } else {
      if (t.status !== "AT_RISK") {
        await prisma.task.update({ where: { id: t.id }, data: { status: "AT_RISK" } });
      }
    }
  }

  return NextResponse.json({
  ok: true,
  runAt,                            // legacy support
  tasksEvaluated,
  tasksUpdated,
  blocksCreated,
  movedBlocks: blocksCreated,       // legacy support
  affectedTasks: tasksUpdated,      // legacy support
  atRiskTasks                       // legacy support
});
}
