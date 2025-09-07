// src/app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}

// Optional: support HEAD for load balancers
export async function HEAD() {
  return new Response(null, { status: 200 });
}
