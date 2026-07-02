import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// POST: Admin marks a conversation's student messages as read (opens the chat).
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const conversationId = (body as { conversationId?: unknown })?.conversationId;
  if (typeof conversationId !== "string" || !conversationId) {
    return NextResponse.json({ error: "Conversation id is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    const { error: messagesError } = await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("sender_role", "student")
      .eq("is_read", false);

    if (messagesError) throw messagesError;

    const { error: conversationError } = await supabase
      .from("chat_conversations")
      .update({ unread_admin: 0 })
      .eq("id", conversationId);

    if (conversationError) throw conversationError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Admin chat read error:", error);
    const message = error instanceof Error ? error.message : "Failed to mark as read";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
