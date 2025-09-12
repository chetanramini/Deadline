import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/health
 * - /api/health?probe=liveness -> { ok: true } (no DB)
 * - /api/health                -> { ok: true, db: { connected: true, pingMs } } (with DB ping)
 */
export async function GET(req: NextRequest) {
  const probe = req.nextUrl.searchParams.get("probe");

  // Liveness: cheap check, never touches DB
  if (probe === "liveness") {
    return NextResponse.json({ ok: true });
  }

  // Readiness: verify DB connectivity and measure latency
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const pingMs = Date.now() - t0;
    return NextResponse.json({ ok: true, db: { connected: true, pingMs } });
  } catch {
    return NextResponse.json(
      { ok: false, db: { connected: false } },
      { status: 503 }
    );
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
