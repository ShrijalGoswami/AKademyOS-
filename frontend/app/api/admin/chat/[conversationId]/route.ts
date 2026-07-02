import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatConversation, ChatMessage } from "@/types";

export const dynamic = "force-dynamic";

// GET: full message history for a single conversation (Admin only).
export async function GET(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { conversationId } = params;
  if (!conversationId) {
    return NextResponse.json({ error: "Conversation id is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: conversation, error: conversationError } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError) {
    console.error("Admin chat detail error:", conversationError);
    return NextResponse.json({ error: conversationError.message }, { status: 500 });
  }
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Admin chat messages error:", messagesError);
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  return NextResponse.json({
    conversation: conversation as ChatConversation,
    messages: (messages ?? []) as ChatMessage[],
  });
}
