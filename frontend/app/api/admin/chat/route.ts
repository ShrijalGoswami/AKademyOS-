import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatConversation, ChatConversationSummary } from "@/types";

export const dynamic = "force-dynamic";

// GET: list every student conversation for the Admin inbox, most recently
// active first. Search is performed client-side (see the admin chat page).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: conversations, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin chat list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (conversations ?? []) as ChatConversation[];

  // Resolve student display names in a single query.
  const studentIds = rows.map((c) => c.student_id);
  const nameById: Record<string, string | null> = {};
  if (studentIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", studentIds);
    for (const p of profiles ?? []) {
      nameById[p.id] = p.full_name;
    }
  }

  const summaries: ChatConversationSummary[] = rows.map((c) => ({
    ...c,
    student_name: nameById[c.student_id] ?? null,
  }));

  return NextResponse.json({ conversations: summaries });
}
