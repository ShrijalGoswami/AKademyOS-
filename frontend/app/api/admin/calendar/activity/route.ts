import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CalendarEntry, StudentCalendarActivity } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    
    // Fetch student calendar activity using the RPC function
    const { data: records, error } = await supabase.rpc("get_student_calendar_activity");

    if (error) {
      console.error("Fetch calendar activity error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const activity: StudentCalendarActivity[] = (records ?? []).map((r: {
      full_name: string;
      email: string;
      last_modified_at: string;
      calendar_data: CalendarEntry[];
    }) => {
      return {
        full_name: r.full_name,
        email: r.email,
        last_modified_at: r.last_modified_at,
        entry_count: r.calendar_data.length,
      };
    });

    return NextResponse.json({ activity });
  } catch (error: unknown) {
    console.error("GET admin calendar activity error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
