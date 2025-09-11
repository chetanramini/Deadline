import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PreferencesSchema } from "@/src/lib/types";

const prisma = new PrismaClient();
const USER_ID = "demo-user";

// Default prefs per M2 spec
const DEFAULT_PREFS = { workStart: 16, workEnd: 18 };

export async function GET() {
  const prefs = await prisma.preferences.findUnique({ where: { userId: USER_ID } });
  // Return stored prefs or defaults
  return NextResponse.json(prefs ?? DEFAULT_PREFS);
}

export async function PUT(req: NextRequest) {
  try {
    const json = await req.json();
    const data = PreferencesSchema.parse(json);

    // Upsert 1–1 with user
    const saved = await prisma.preferences.upsert({
      where: { userId: USER_ID },
      update: data,
      create: { userId: USER_ID, ...data },
    });

    return NextResponse.json(saved);
  } catch (err: unknown) {
    // Try to surface Zod message if present
    const message =
      (err as any)?.issues?.[0]?.message ??
      (err as Error)?.message ??
      "Invalid payload";
    return NextResponse.json({ message }, { status: 400 });
  }
}
