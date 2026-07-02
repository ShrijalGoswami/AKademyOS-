import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CalendarEntry } from "@/types";

export const dynamic = "force-dynamic";

// Helper to filter entries to comply with the 90-day visibility constraint
function filterExpiredEntries(entries: CalendarEntry[]): CalendarEntry[] {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

  return entries.filter((entry) => entry.date >= ninetyDaysAgoStr);
}

// GET: Fetch calendar entries for the logged-in user or a selected student
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  const userEmail = session.user.email;

  if (role === "admin") {
    // Admin must provide target email
    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get("email");
    if (!targetEmail) {
      return NextResponse.json({ error: "Student email is required" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: entries, error } = await supabase.rpc("get_student_calendar", {
      p_email: targetEmail,
    });

    if (error) {
      console.error("Admin fetch calendar error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = (entries as CalendarEntry[]) || [];
    return NextResponse.json({ calendar_data: filterExpiredEntries(list) });
  }

  if (role === "student") {
    if (!userEmail) {
      return NextResponse.json({ error: "Session missing email" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: entries, error } = await supabase.rpc("get_student_calendar", {
      p_email: userEmail,
    });

    if (error) {
      console.error("Student fetch calendar error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = (entries as CalendarEntry[]) || [];
    return NextResponse.json({ calendar_data: filterExpiredEntries(list) });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: Add new calendar entry (Student only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "student") {
    return NextResponse.json({ error: "Forbidden. Only students can create entries" }, { status: 403 });
  }

  const userEmail = session.user.email;
  const userName = session.user.name || "Student";
  if (!userEmail) {
    return NextResponse.json({ error: "Session missing email" }, { status: 400 });
  }

  try {
    const { title, description, date } = await request.json();

    if (!title || !description || !date) {
      return NextResponse.json({ error: "Missing required fields (title, description, date)" }, { status: 400 });
    }

    // Validate that the date is today or in the future
    const todayStr = new Date().toISOString().split("T")[0];
    if (date < todayStr) {
      return NextResponse.json({ error: "Cannot create entries for past dates" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: entries, error: fetchError } = await supabase.rpc("get_student_calendar", {
      p_email: userEmail,
    });

    if (fetchError) {
      console.error("Fetch calendar error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingEntries = (entries as CalendarEntry[]) || [];

    const newEntry: CalendarEntry = {
      entry_id: crypto.randomUUID(),
      date,
      title,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_locked: false,
    };

    const updatedEntries = [...existingEntries, newEntry];

    const { error: updateError } = await supabase.rpc("update_student_calendar", {
      p_email: userEmail,
      p_full_name: userName,
      p_calendar_data: updatedEntries,
    });

    if (updateError) {
      console.error("Update student_calendar error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry: newEntry }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST calendar error:", error);
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Update existing calendar entry (Student only)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "student") {
    return NextResponse.json({ error: "Forbidden. Only students can update entries" }, { status: 403 });
  }

  const userEmail = session.user.email;
  if (!userEmail) {
    return NextResponse.json({ error: "Session missing email" }, { status: 400 });
  }

  try {
    const { entry_id, title, description, date } = await request.json();

    if (!entry_id || !title || !description || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (date < todayStr) {
      return NextResponse.json({ error: "Cannot reschedule to past dates" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: entries, error: fetchError } = await supabase.rpc("get_student_calendar", {
      p_email: userEmail,
    });

    if (fetchError) {
      console.error("Fetch calendar error during update:", fetchError);
      return NextResponse.json({ error: "Calendar record not found" }, { status: 404 });
    }

    const existingEntries = (entries as CalendarEntry[]) || [];
    const entryIndex = existingEntries.findIndex((e) => e.entry_id === entry_id);

    if (entryIndex === -1) {
      return NextResponse.json({ error: "Calendar entry not found" }, { status: 404 });
    }

    const targetEntry = existingEntries[entryIndex];

    // Check if the entry is locked (i.e. it belongs to a past date)
    if (targetEntry.date < todayStr) {
      return NextResponse.json({ error: "Cannot edit past entries" }, { status: 400 });
    }

    // Update fields
    const updatedEntry: CalendarEntry = {
      ...targetEntry,
      title,
      description,
      date,
      updated_at: new Date().toISOString(),
    };

    existingEntries[entryIndex] = updatedEntry;

    const { error: updateError } = await supabase.rpc("update_student_calendar", {
      p_email: userEmail,
      p_full_name: session.user.name || "Student",
      p_calendar_data: existingEntries,
    });

    if (updateError) {
      console.error("Update calendar error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry: updatedEntry });
  } catch (error: unknown) {
    console.error("PUT calendar error:", error);
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
