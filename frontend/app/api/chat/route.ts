import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateConversation } from "@/lib/chat";
import type { ChatMessage } from "@/types";

export const dynamic = "force-dynamic";

// GET: the logged-in student's single conversation with the Admin.
// Opening the conversation marks the admin's messages as read for the student.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const studentId = session.user.id;
  const studentEmail = session.user.email;
  if (!studentId || !studentEmail) {
    return NextResponse.json({ error: "Session missing identity" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    const conversation = await getOrCreateConversation(supabase, studentId, studentEmail);

    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    // Student is viewing → admin messages are now read; clear the student badge.
    if (conversation.unread_student > 0) {
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("conversation_id", conversation.id)
        .eq("sender_role", "admin")
        .eq("is_read", false);

      await supabase
        .from("chat_conversations")
        .update({ unread_student: 0 })
        .eq("id", conversation.id);
    }

    return NextResponse.json({
      conversation: { ...conversation, unread_student: 0 },
      messages: (messages ?? []) as ChatMessage[],
    });
  } catch (error: unknown) {
    console.error("Student chat GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to load chat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
