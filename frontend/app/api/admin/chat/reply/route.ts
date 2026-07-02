import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatConversation, ChatMessage } from "@/types";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 4000;

// POST: Admin replies to a student's conversation.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminEmail = session.user.email;
  if (!adminEmail) {
    return NextResponse.json({ error: "Session missing identity" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const conversationId = (body as { conversationId?: unknown })?.conversationId;
  const raw = (body as { message?: unknown })?.message;
  const message = typeof raw === "string" ? raw.trim() : "";

  if (typeof conversationId !== "string" || !conversationId) {
    return NextResponse.json({ error: "Conversation id is required" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  try {
    const { data: conversation, error: conversationError } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const current = conversation as ChatConversation;

    const { data: inserted, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: current.id,
        sender_role: "admin",
        sender_email: adminEmail,
        message,
        is_read: false,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    // Admin has read the student's messages by replying → clear admin badge and
    // bump the student's unread counter.
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", current.id)
      .eq("sender_role", "student")
      .eq("is_read", false);

    const { error: updateError } = await supabase
      .from("chat_conversations")
      .update({
        last_message: message,
        last_message_at: inserted.created_at,
        unread_admin: 0,
        unread_student: current.unread_student + 1,
      })
      .eq("id", current.id);

    if (updateError) throw updateError;

    return NextResponse.json({ message: inserted as ChatMessage }, { status: 201 });
  } catch (error: unknown) {
    console.error("Admin chat reply error:", error);
    const message = error instanceof Error ? error.message : "Failed to send reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
