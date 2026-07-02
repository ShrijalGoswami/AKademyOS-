import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateConversation } from "@/lib/chat";
import type { ChatMessage } from "@/types";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 4000;

// POST: student sends a message to the Admin.
export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const raw = (body as { message?: unknown })?.message;
  const message = typeof raw === "string" ? raw.trim() : "";
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
    const conversation = await getOrCreateConversation(supabase, studentId, studentEmail);

    const { data: inserted, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversation.id,
        sender_role: "student",
        sender_email: studentEmail,
        message,
        is_read: false,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    const { error: updateError } = await supabase
      .from("chat_conversations")
      .update({
        last_message: message,
        last_message_at: inserted.created_at,
        unread_admin: conversation.unread_admin + 1,
      })
      .eq("id", conversation.id);

    if (updateError) throw updateError;

    return NextResponse.json({ message: inserted as ChatMessage }, { status: 201 });
  } catch (error: unknown) {
    console.error("Student chat send error:", error);
    const message = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
