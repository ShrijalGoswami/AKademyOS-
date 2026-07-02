import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function handleDeleteExpired(request: NextRequest) {
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
    const supabase = createSupabaseAdminClient();
    
    // Calculate 90 days ago date
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffTimestamp = ninetyDaysAgo.toISOString();

    // Delete calendar rows whose last_modified_at is older than 90 days via RPC
    const { data: count, error } = await supabase.rpc("delete_expired_student_calendars", {
      p_cutoff_timestamp: cutoffTimestamp,
    });

    if (error) {
      console.error("Cron delete-expired query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Expired calendar entries deleted successfully. Cutoff: ${cutoffTimestamp}`,
      deletedCount: (count as number) ?? 0,
    });
  } catch (error: unknown) {
    console.error("Cron delete-expired failed:", error);
    const message = error instanceof Error ? error.message : "An error occurred during deletion of expired entries.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleDeleteExpired(request);
}

export async function POST(request: NextRequest) {
  return handleDeleteExpired(request);
}
