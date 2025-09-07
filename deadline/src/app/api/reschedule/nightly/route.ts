import { NextResponse } from "next/server";

export async function POST() {
  const runAt = new Date().toISOString();

  return NextResponse.json({
    runAt,
    movedBlocks: 0,
    affectedTasks: 0,
    atRiskTasks: 0,
  });
}
