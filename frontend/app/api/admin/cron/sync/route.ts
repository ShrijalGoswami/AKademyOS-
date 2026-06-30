import { NextRequest, NextResponse } from "next/server";
import { syncScoreType } from "@/lib/sync";
import { ScoreType } from "@/types";

export const dynamic = "force-dynamic";

async function handleSync(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results: Record<string, any> = {};
    const scoreTypes: ScoreType[] = ["homework", "offline_test", "quiz"];

    for (const type of scoreTypes) {
      results[type] = await syncScoreType(type, true, "system-cron@akademy.os");
    }

    return NextResponse.json({
      success: true,
      message: "All score sheets synchronized and published successfully.",
      results,
    });
  } catch (error: any) {
    console.error("Cron sync failed:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during synchronization." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
